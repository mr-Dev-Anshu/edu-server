import { TeacherSubjectAssignmentRepository } from "../repositories/TeacherSubjectAssignment.repository.js";
import { AppError } from "../utils/AppError.js";
import sequelize from "../config/db.js";
import { Staff, Subject, Section, AcademicYear } from "../models/index.js";

const repo = new TeacherSubjectAssignmentRepository();

export class TeacherSubjectAssignmentService {
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
    const { staffId, subjectId, sectionId, academicYearId, isPrimaryTeacher = false } = payload;

    // ensure related records exist and belong to the tenant
    const staff = await Staff.findOne({ where: { id: staffId, tenantId } });
    if (!staff) throw new AppError("Staff not found for this tenant", 404);

    const subject = await Subject.findOne({ where: { id: subjectId, tenantId } });
    if (!subject) throw new AppError("Subject not found for this tenant", 404);

    const section = await Section.findOne({ where: { id: sectionId, tenantId } });
    if (!section) throw new AppError("Section not found for this tenant", 404);

    const year = await AcademicYear.findOne({ where: { id: academicYearId, tenantId } });
    if (!year) throw new AppError("Academic year not found for this tenant", 404);

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

    // If any reference fields are being changed, validate new targets
    if (staffId && staffId !== existing.staffId) {
      const staff = await Staff.findOne({ where: { id: staffId, tenantId } });
      if (!staff) throw new AppError("Staff not found for this tenant", 404);
    }
    if (subjectId && subjectId !== existing.subjectId) {
      const subject = await Subject.findOne({ where: { id: subjectId, tenantId } });
      if (!subject) throw new AppError("Subject not found for this tenant", 404);
    }
    if (sectionId && sectionId !== existing.sectionId) {
      const section = await Section.findOne({ where: { id: sectionId, tenantId } });
      if (!section) throw new AppError("Section not found for this tenant", 404);
    }
    if (academicYearId && academicYearId !== existing.academicYearId) {
      const year = await AcademicYear.findOne({ where: { id: academicYearId, tenantId } });
      if (!year) throw new AppError("Academic year not found for this tenant", 404);
    }

    const transaction = await sequelize.transaction();
    try {
      // If payload marks as primary, demote existing primary(s) for that composite
      const targetSubjectId = subjectId || existing.subjectId;
      const targetSectionId = sectionId || existing.sectionId;
      const targetAcademicYearId = academicYearId || existing.academicYearId;

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
    await repo.softDelete(id, tenantId);
    return { success: true };
  }

  async searchAssignments(tenantId, query = {}) {
    const page = Math.max(1, parseInt(query.page, 10) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(query.limit, 10) || 10));
    const filters = {};
    for (const key of ["staffId", "subjectId", "sectionId", "academicYearId"]) {
      if (query[key]) filters[key] = query[key];
    }

    return await repo.findWithFilters(tenantId, filters, page, limit);
  }
}

export const teacherSubjectAssignmentService = new TeacherSubjectAssignmentService();
