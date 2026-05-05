import { MarkRepository } from "../../repositories/Exam/mark.repository.js";
import { ExamScheduleRepository } from "../../repositories/Exam/examSchedule.repository.js";
import { AppError } from "../../utils/AppError.js";

const markRepo = new MarkRepository();
const examScheduleRepo = new ExamScheduleRepository();

export class MarkService {
  async createMark(tenantId, payload, enteredById) {
    const { studentId, examScheduleId, marksObtainedRaw, isAbsent } = payload;

    const schedule = await examScheduleRepo.findById(examScheduleId, tenantId);
    if (!schedule) throw new AppError("Exam schedule not found", 404);

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

  async bulkCreateMarks(tenantId, marks, enteredById) {
    const records = marks.map((mark) => ({
      tenantId,
      studentId: mark.studentId,
      examScheduleId: mark.examScheduleId,
      marksObtainedRaw: mark.isAbsent ? null : (mark.marksObtainedRaw !== undefined ? parseInt(mark.marksObtainedRaw) : null),
      isAbsent: mark.isAbsent || false,
      enteredById: enteredById || null,
    }));

    const created = await markRepo.bulkUpsert(records);

    if (!created || created.length === 0) {
      throw new AppError("Bulk mark creation failed", 500);
    }

    return created.map((m) => this.formatResponse(m));
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