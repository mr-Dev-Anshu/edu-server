import { TeacherSubjectAssignmentRepository } from "../repositories/TeacherSubjectAssignment.repository.js";
import { AppError } from "../utils/AppError.js";
import sequelize from "../config/db.js";
import { Staff, Subject, Section, AcademicYear } from "../models/index.js";

const repo = new TeacherSubjectAssignmentRepository();

export class TeacherSubjectAssignmentService {
  async loadAssignmentContext(tenantId, { staffId, subjectId, sectionId, academicYearId }) {
    const [staff, subject, section, academicYear] = await Promise.all([
      Staff.findOne({ where: { id: staffId, tenantId } }),
      Subject.findOne({ where: { id: subjectId, tenantId } }),
      Section.findOne({ where: { id: sectionId, tenantId } }),
      AcademicYear.findOne({ where: { id: academicYearId, tenantId } }),
    ]);

    if (!staff) throw new AppError("Staff not found for this tenant", 404);
    if (!subject) throw new AppError("Subject not found for this tenant", 404);
    if (!section) throw new AppError("Section not found for this tenant", 404);
    if (!academicYear) throw new AppError("Academic year not found for this tenant", 404);

    if (subject.classId !== section.classId) {
      throw new AppError("Subject and section must belong to the same class", 400);
    }

    if (section.academicYearId !== academicYearId) {
      throw new AppError("Section must belong to the selected academic year", 400);
    }

    return { staff, subject, section, academicYear };
  }

  async getAllAssignments(tenantId, query = {}) {
    const page = Math.max(1, parseInt(query.page, 10) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(query.limit, 10) || 10));
    const filters = {};
    for (const key of ["staffId", "subjectId", "sectionId", "academicYearId"]) {
      if (query[key]) filters[key] = query[key];
    }

    return await repo.findWithFilters(tenantId, filters, page, limit);
  }

  async getAssignmentById(id, tenantId) {
    return await repo.findById(id, tenantId, {
      include: [
        { association: "staff", include: [{ association: "user" }] },
        { association: "subject" },
        { association: "section" },
        { association: "academicYear" },
      ],
    });
  }

  async createAssignment(tenantId, payload) {
    const { staffId, subjectId, sectionId, academicYearId, isPrimaryTeacher = true } = payload;

    await this.loadAssignmentContext(tenantId, { staffId, subjectId, sectionId, academicYearId });

    const transaction = await sequelize.transaction();
    try {
      if (isPrimaryTeacher) {
        // demote existing primary(s)
        await repo.demotePrimaryByComposite(tenantId, subjectId, sectionId, academicYearId, transaction);
      }

      const created = await repo.create({ tenantId, staffId, subjectId, sectionId, academicYearId, isPrimaryTeacher }, { transaction });

      await transaction.commit();

      return await this.getAssignmentById(created.id, tenantId);
    } catch (err) {
      await transaction.rollback();
      // handle uniqueness conflicts or DB level errors gracefully
      throw err;
    }
  }

  async updateAssignment(id, tenantId, payload) {
    // validate ownership
    const existing = await repo.findById(id, tenantId);

    const { staffId, subjectId, sectionId, academicYearId, isPrimaryTeacher } = payload;
    const nextStaffId = staffId || existing.staffId;
    const nextSubjectId = subjectId || existing.subjectId;
    const nextSectionId = sectionId || existing.sectionId;
    const nextAcademicYearId = academicYearId || existing.academicYearId;

    await this.loadAssignmentContext(tenantId, {
      staffId: nextStaffId,
      subjectId: nextSubjectId,
      sectionId: nextSectionId,
      academicYearId: nextAcademicYearId,
    });

    const transaction = await sequelize.transaction();
    try {
      // If payload marks as primary, demote existing primary(s) for that composite
      const targetSubjectId = nextSubjectId;
      const targetSectionId = nextSectionId;
      const targetAcademicYearId = nextAcademicYearId;

      if (isPrimaryTeacher) {
        await repo.demotePrimaryByComposite(tenantId, targetSubjectId, targetSectionId, targetAcademicYearId, transaction);
      }

      await repo.update(id, tenantId, payload, { transaction });

      await transaction.commit();

      return await this.getAssignmentById(id, tenantId);
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  }

  async deleteAssignment(id, tenantId) {
    // soft delete using repo
    const deletedCount = await repo.softDelete(id, tenantId);
    if (!deletedCount) {
      throw new AppError("Teacher subject assignment not found", 404);
    }
    return { success: true };
  }

  async searchAssignments(tenantId, query = {}) {
    const page = Math.max(1, parseInt(query.page, 10) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(query.limit, 10) || 10));
    const searchTerm = (query.q || query.search || query.keyword || "").trim();
    const filters = {};
    for (const key of ["staffId", "subjectId", "sectionId", "academicYearId"]) {
      if (query[key]) filters[key] = query[key];
    }

    if (!searchTerm) {
      return await repo.findWithFilters(tenantId, filters, page, limit);
    }

    return await repo.searchAssignments(tenantId, searchTerm, filters, page, limit);
  }
}

export const teacherSubjectAssignmentService = new TeacherSubjectAssignmentService();
