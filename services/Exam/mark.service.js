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

    const student = await studentRepo.findById(studentId, tenantId);
    if (!student) throw new AppError("Student not found", 404);

    if (isAbsent === true && marksObtainedRaw !== undefined) {
      throw new AppError("Cannot set marks if student is marked absent", 400);
    }

    if (!isAbsent && marksObtainedRaw !== undefined) {
      if (parseInt(marksObtainedRaw) > schedule.maxMarks) {
        throw new AppError("Marks cannot exceed maximum marks for this exam", 400);
      }
    }

    const existing = await markRepo.findByStudentAndSchedule(studentId, examScheduleId, tenantId);
    if (existing) {
      throw new AppError("Mark entry already exists for this student and exam schedule", 409);
    }

    const marksToSave = isAbsent
      ? null
      : marksObtainedRaw !== undefined
      ? parseInt(marksObtainedRaw)
      : null;

    const created = await markRepo.create({
      tenantId,
      studentId,
      examScheduleId,
      marksObtainedRaw: marksToSave,
      isAbsent: isAbsent || false,
      enteredById: enteredById || null,
    });

    // Use detail endpoint include strategy for single record
    const populated = await markRepo.findByIdPopulated(created.id, tenantId);
    return this.formatResponse(populated);
  }

  /**
   * Bulk create/upsert marks inside a transaction.
   * ARCHITECTURE: Fetch all data BEFORE commit to ensure transaction safety
   * - If any fetch fails, entire transaction is rolled back
   * - No risk of marks saved but fetch error returned to client
   * @param {string}  tenantId
   * @param {Array}   marks
   * @param {string}  enteredById
   * @param {boolean} allowOverwrite - default false; pass true to update existing records
   */
  async bulkCreateMarks(tenantId, marks, enteredById, allowOverwrite = false) {
    const transaction = await sequelize.transaction();

    try {
      const records = marks.map((mark) => ({
        tenantId,
        studentId: mark.studentId,
        examScheduleId: mark.examScheduleId,
        marksObtainedRaw: mark.isAbsent
          ? null
          : mark.marksObtainedRaw !== undefined
          ? parseInt(mark.marksObtainedRaw)
          : null,
        isAbsent: mark.isAbsent || false,
        enteredById: enteredById || null,
      }));

      // Step 1: Bulk insert/upsert within transaction
      const created = await markRepo.bulkUpsert(
        records,
        { transaction, tenantId },
        allowOverwrite
      );

      if (!created || created.length === 0) {
        throw new AppError("Bulk mark creation failed", 500);
      }

      // Step 2: Fetch populated records BEFORE commit (batch fetch = 2-3 queries, not 500!)
      const ids = created.map((m) => m.id);
      const populated = await markRepo.findByIdsBatch(ids, tenantId);

      // Step 3: Validate fetch succeeded
      if (!populated || populated.length !== ids.length) {
        throw new AppError(
          `Expected ${ids.length} marks but found ${populated.length}`,
          500
        );
      }

      // Step 4: Commit only after all data is safely fetched and validated
      await transaction.commit();

      return populated.map((m) => this.formatResponse(m));
    } catch (error) {
      if (transaction && !transaction.finished) await transaction.rollback();
      throw error;
    }
  }

  async getAllMarks(tenantId, query) {
    const page = parseInt(query.page) || 1;
    const limit = Math.min(parseInt(query.limit) || 25, 100); // Default 25, max 100 to prevent memory issues

    const filters = {};
    if (query.studentId) filters.studentId = query.studentId;
    if (query.examScheduleId) filters.examScheduleId = query.examScheduleId;
    if (query.isAbsent === "true") filters.isAbsent = true;
    if (query.isAbsent === "false") filters.isAbsent = false;

    return await markRepo.findWithPagination(tenantId, filters, page, limit);
  }

  async getMarkById(id, tenantId) {
    const mark = await markRepo.findByIdPopulated(id, tenantId);
    if (!mark) throw new AppError("Mark not found", 404);
    return this.formatResponse(mark);
  }

  async updateMark(id, tenantId, updateData, enteredById) {
    const mark = await markRepo.findById(id, tenantId);
    if (!mark) throw new AppError("Mark not found", 404);

    if (updateData.isAbsent === true && updateData.marksObtainedRaw !== undefined) {
      throw new AppError("Cannot set marks if student is marked absent", 400);
    }

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

    // TRANSACTION SAFETY: Ensure consistency between update and fetch
    const transaction = await sequelize.transaction();
    try {
      await markRepo.update(id, tenantId, {
        ...(isAbsent !== undefined ? { isAbsent } : {}),
        ...(marksObtainedRaw !== undefined ? { marksObtainedRaw } : {}),
        ...(enteredById ? { enteredById } : {}),
      });

      const updated = await markRepo.findByIdPopulated(id, tenantId);
      await transaction.commit();
      return this.formatResponse(updated);
    } catch (error) {
      if (transaction && !transaction.finished) await transaction.rollback();
      throw error;
    }
  }

  async deleteMark(id, tenantId) {
    // TRANSACTION SAFETY: Fetch and delete within same transaction
    const transaction = await sequelize.transaction();
    try {
      const mark = await markRepo.findByIdPopulated(id, tenantId);
      if (!mark) throw new AppError("Mark not found", 404);

      await markRepo.delete(id, tenantId);
      await transaction.commit();
      
      return {
        message: "Mark deleted successfully",
        data: this.formatResponse(mark),
      };
    } catch (error) {
      if (transaction && !transaction.finished) await transaction.rollback();
      throw error;
    }
  }

  formatResponse(mark) {
    return {
      id: mark.id,
      tenantId: mark.tenantId,
      student: mark.student
        ? {
            id: mark.student.id,
            firstName: mark.student.firstName,
            middleName: mark.student.middleName,
            lastName: mark.student.lastName,
            admissionNumber: mark.student.admissionNumber,
            rollNumber: mark.student.rollNumber,
            email: mark.student.user?.email || null,
          }
        : { id: mark.studentId },
      examSchedule: mark.examSchedule
        ? {
            id: mark.examSchedule.id,
            examDate: mark.examSchedule.examDate,
            startTime: mark.examSchedule.startTime,
            endTime: mark.examSchedule.endTime,
            maxMarks: mark.examSchedule.maxMarks,
            passingMarks: mark.examSchedule.passingMarks,
            subject: mark.examSchedule.subject || null,
            section: mark.examSchedule.section || null,
          }
        : { id: mark.examScheduleId },
      marksObtainedRaw: mark.marksObtainedRaw,
      isAbsent: mark.isAbsent,
      enteredBy: mark.enteredBy
        ? {
            id: mark.enteredBy.id,
            firstName: mark.enteredBy.firstName,
            lastName: mark.enteredBy.lastName,
            email: mark.enteredBy.email,
          }
        : mark.enteredById
        ? { id: mark.enteredById }
        : null,
      createdAt: mark.createdAt,
      updatedAt: mark.updatedAt,
    };
  }
}