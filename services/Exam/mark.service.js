import { MarkRepository } from "../../repositories/Exam/mark.repository.js";
import { ExamScheduleRepository } from "../../repositories/Exam/examSchedule.repository.js";
import { StudentRepository } from "../../repositories/student.repository.js";
import { AppError } from "../../utils/AppError.js";
import sequelize from "../../config/db.js";

const markRepo = new MarkRepository();
const examScheduleRepo = new ExamScheduleRepository();
const studentRepo = new StudentRepository();

export class MarkService {
  async createMark(tenantId, payload, enteredById) {
    const { studentId, examScheduleId, marksObtainedRaw, isAbsent } = payload;

    const schedule = await examScheduleRepo.findById(examScheduleId, tenantId);
    if (!schedule) throw new AppError("Exam schedule not found", 404);

    // FIX — Warning #1: Validate student exists and belongs to tenant
    const student = await studentRepo.findById(studentId, tenantId);
    if (!student) throw new AppError("Student not found", 404);

    // FIX — Warning #2: Cannot set marks if student is marked absent
    if (isAbsent === true && marksObtainedRaw !== undefined) {
      throw new AppError("Cannot set marks if student is marked absent", 400);
    }

    // FIX — Warning #3: Marks cannot exceed maxMarks
    if (!isAbsent && marksObtainedRaw !== undefined) {
      if (parseInt(marksObtainedRaw) > schedule.maxMarks) {
        throw new AppError("Marks cannot exceed maximum marks for this exam", 400);
      }
    }

    const existing = await markRepo.findByStudentAndSchedule(studentId, examScheduleId, tenantId);
    if (existing) {
      throw new AppError("Mark entry already exists for this student and exam schedule", 400);
    }

    const marksToSave = isAbsent ? null : (marksObtainedRaw !== undefined ? parseInt(marksObtainedRaw) : null);

    const mark = await markRepo.create({
      tenantId,
      studentId,
      examScheduleId,
      marksObtainedRaw: marksToSave,
      isAbsent: isAbsent || false,
      enteredById: enteredById || null,
    });

    return this.formatResponse(mark);
  }

  // FIX — Warning #6: Wrapped bulk creation in a transaction to prevent partial data on failure
  // FIX — Blocker #4: Added tenantId scoping + overwrite protection
  async bulkCreateMarks(tenantId, marks, enteredById) {
    const transaction = await sequelize.transaction();

    try {
      const records = marks.map((mark) => ({
        tenantId,
        studentId: mark.studentId,
        examScheduleId: mark.examScheduleId,
        marksObtainedRaw: mark.isAbsent ? null : (mark.marksObtainedRaw !== undefined ? parseInt(mark.marksObtainedRaw) : null),
        isAbsent: mark.isAbsent || false,
        enteredById: enteredById || null,
      }));

      // FIX — Blocker #4: Scoped to tenantId, no silent cross-tenant overwrites
      const created = await markRepo.bulkUpsert(records, { transaction, tenantId });

      if (!created || created.length === 0) {
        throw new AppError("Bulk mark creation failed", 500);
      }

      await transaction.commit();
      return created.map((m) => this.formatResponse(m));
    } catch (error) {
      if (!transaction.finished) await transaction.rollback();
      throw error;
    }
  }

  async getAllMarks(tenantId, query) {
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 10;

    const filters = {};
    if (query.studentId) filters.studentId = query.studentId;
    if (query.examScheduleId) filters.examScheduleId = query.examScheduleId;
    if (query.isAbsent === "true") filters.isAbsent = true;
    if (query.isAbsent === "false") filters.isAbsent = false;

    return await markRepo.findWithPagination(tenantId, filters, page, limit);
  }

  async getMarkById(id, tenantId) {
    const mark = await markRepo.findById(id, tenantId);

    if (!mark) {
      throw new AppError("Mark not found", 404);
    }

    return this.formatResponse(mark);
  }

  async updateMark(id, tenantId, updateData, enteredById) {
    const mark = await markRepo.findById(id, tenantId);

    if (!mark) {
      throw new AppError("Mark not found", 404);
    }

    // FIX — Warning #2: Cannot set marks if student is marked absent
    if (updateData.isAbsent === true && updateData.marksObtainedRaw !== undefined) {
      throw new AppError("Cannot set marks if student is marked absent", 400);
    }

    // FIX — Warning #3: Marks cannot exceed maxMarks on update
    if (!updateData.isAbsent && updateData.marksObtainedRaw !== undefined) {
      const schedule = await examScheduleRepo.findById(mark.examScheduleId, tenantId);
      if (schedule && parseInt(updateData.marksObtainedRaw) > schedule.maxMarks) {
        throw new AppError("Marks cannot exceed maximum marks for this exam", 400);
      }
    }

    const isAbsent = updateData.isAbsent;
    const marksObtainedRaw = isAbsent
      ? null
      : updateData.marksObtainedRaw !== undefined
        ? parseInt(updateData.marksObtainedRaw)
        : undefined;

    const updated = await markRepo.update(id, tenantId, {
      ...(isAbsent !== undefined ? { isAbsent } : {}),
      ...(marksObtainedRaw !== undefined ? { marksObtainedRaw } : {}),
      ...(enteredById ? { enteredById } : {}),
    });

    return this.formatResponse(updated);
  }

  async deleteMark(id, tenantId) {
    const mark = await markRepo.findById(id, tenantId);

    if (!mark) {
      throw new AppError("Mark not found", 404);
    }

    await markRepo.delete(id, tenantId);

    return {
      message: "Mark deleted successfully",
      data: this.formatResponse(mark),
    };
  }

  formatResponse(mark) {
    return {
      id: mark.id,
      tenantId: mark.tenantId,
      studentId: mark.studentId,
      examScheduleId: mark.examScheduleId,
      marksObtainedRaw: mark.marksObtainedRaw,
      isAbsent: mark.isAbsent,
      enteredById: mark.enteredById,
      createdAt: mark.createdAt,
      updatedAt: mark.updatedAt,
    };
  }
}