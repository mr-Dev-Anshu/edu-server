import { MarkRepository } from "../../repositories/Exam/mark.repository.js";
import { ExamScheduleRepository } from "../../repositories/Exam/examSchedule.repository.js";
import { StudentRepository } from "../../repositories/student.repository.js";
import { StudentSectionEnrollmentRepository } from "../../repositories/studentSectionEnrollment.repository.js";
import { ExamGroupRepository } from "../../repositories/Exam/examGroup.repository.js";
import { AcademicYearRepository } from "../../repositories/Academic/academicYear.repository.js";
import { ClassRepository } from "../../repositories/Academic/class.repository.js";
import { SectionRepository } from "../../repositories/Academic/section.repository.js";
import { ClassSubjectRepository } from "../../repositories/Academic/subject/ClassSubject.repository.js";
import { AppError } from "../../utils/AppError.js";
import sequelize from "../../config/db.js";

const markRepo = new MarkRepository();
const examScheduleRepo = new ExamScheduleRepository();
const studentRepo = new StudentRepository();
const enrollmentRepo = new StudentSectionEnrollmentRepository();
const examGroupRepo = new ExamGroupRepository();
const academicYearRepo = new AcademicYearRepository();
const classRepo = new ClassRepository();
const sectionRepo = new SectionRepository();
const classSubjectRepo = new ClassSubjectRepository();

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

  /**
   * Get marks entry data with students and existing marks.
   * 
   * Query parameters:
   * - academicYearId (required)
   * - examGroupId (required)
   * - classId (required)
   * - sectionId (required)
   * - subjectId (required)
   * 
   * Returns:
   * {
   *   examSchedule: { id, examDate, maxMarks, passingMarks },
   *   students: [
   *     {
   *       studentId, admissionNumber, rollNumber, studentName,
   *       markId, marksObtainedRaw, isAbsent,
   *       status: "entered|not_entered|absent"
   *     }
   *   ]
   * }
   */
  async getMarksEntryData(tenantId, filters) {
    const { academicYearId, examGroupId, classId, sectionId, subjectId } = filters;

    // Validate all required parameters
    if (!academicYearId) throw new AppError("academicYearId is required", 400);
    if (!examGroupId) throw new AppError("examGroupId is required", 400);
    if (!classId) throw new AppError("classId is required", 400);
    if (!sectionId) throw new AppError("sectionId is required", 400);
    if (!subjectId) throw new AppError("subjectId is required", 400);

    // FIX 1: Validate Academic Year exists
    const academicYear = await academicYearRepo.findById(academicYearId, tenantId);
    if (!academicYear) {
      throw new AppError("Academic year not found", 404);
    }

    // FIX 1: Validate Exam Group exists and belongs to Academic Year
    const examGroup = await examGroupRepo.findById(examGroupId, tenantId);
    if (!examGroup) {
      throw new AppError("Exam group not found", 404);
    }
    if (examGroup.academicYearId !== academicYearId) {
      throw new AppError("Exam group does not belong to the selected academic year", 400);
    }

    // FIX 2: Validate Class exists
    const cls = await classRepo.findById(classId, tenantId);
    if (!cls) {
      throw new AppError("Class not found", 404);
    }

    // FIX 2: Validate Section exists and belongs to Class
    const section = await sectionRepo.findById(sectionId, tenantId);
    if (!section) {
      throw new AppError("Section not found", 404);
    }
    if (section.classId !== classId) {
      throw new AppError("Section does not belong to the selected class", 400);
    }

    // Validate ClassSubject exists and belongs to Class
    const classSubject = await classSubjectRepo.findById(subjectId, tenantId);
    if (!classSubject) {
      throw new AppError("Subject not found", 404);
    }
    if (classSubject.classId !== classId) {
      throw new AppError("Subject is not assigned to the selected class", 400);
    }

    // FIX 3: Use repository method instead of direct model access
    const schedule = await examScheduleRepo.findScheduleForMarksEntry(
      examGroupId,
      sectionId,
      subjectId,
      tenantId
    );

    if (!schedule) {
      throw new AppError(
        "Exam schedule not found for the selected exam group, section, and subject",
        404
      );
    }

    // Step 2: Fetch all students in the section
    const enrollments = await enrollmentRepo.findStudentsBySection(sectionId, tenantId);

    if (enrollments.length === 0) {
      // No students in section, but this is valid - return empty marks entry
      return {
        examSchedule: {
          id: schedule.id,
          examDate: schedule.examDate,
          maxMarks: schedule.maxMarks,
          passingMarks: schedule.passingMarks,
        },
        students: [],
      };
    }

    // Step 3: Fetch existing marks for this exam schedule
    const marks = await markRepo.findByExamScheduleLight(schedule.id, tenantId);

    // Create a map for O(1) mark lookup
    const markMap = new Map();
    marks.forEach((mark) => {
      markMap.set(mark.studentId, mark);
    });

    // Step 4: Merge students and marks
    const students = enrollments.map((enrollment) => {
      const student = enrollment.student;
      const mark = markMap.get(student.id);

      let status = "not_entered";
      if (mark) {
        status = mark.isAbsent ? "absent" : "entered";
      }

      return {
        studentId: student.id,
        admissionNumber: student.admissionNumber,
        rollNumber: enrollment.rollNumber,
        studentName: `${student.firstName} ${student.middleName ? student.middleName + " " : ""}${student.lastName}`.trim(),
        markId: mark?.id || null,
        marksObtainedRaw: mark?.marksObtainedRaw || null,
        isAbsent: mark?.isAbsent || false,
        status,
      };
    });

    return {
      examSchedule: {
        id: schedule.id,
        examDate: schedule.examDate,
        maxMarks: schedule.maxMarks,
        passingMarks: schedule.passingMarks,
      },
      students,
    };
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

    // FIX 4: Pass transaction options through repository methods
    const transaction = await sequelize.transaction();
    try {
      await markRepo.update(
        id,
        tenantId,
        {
          ...(isAbsent !== undefined ? { isAbsent } : {}),
          ...(marksObtainedRaw !== undefined ? { marksObtainedRaw } : {}),
          ...(enteredById ? { enteredById } : {}),
        },
        { transaction }
      );

      const updated = await markRepo.findByIdPopulated(id, tenantId, { transaction });
      await transaction.commit();
      return this.formatResponse(updated);
    } catch (error) {
      if (transaction && !transaction.finished) await transaction.rollback();
      throw error;
    }
  }

  async deleteMark(id, tenantId) {
    // FIX 4: Pass transaction options through repository methods
    const transaction = await sequelize.transaction();
    try {
      const mark = await markRepo.findByIdPopulated(id, tenantId, { transaction });
      if (!mark) throw new AppError("Mark not found", 404);

      await markRepo.delete(id, tenantId, { transaction });
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
            subject: mark.examSchedule.subject
              ? (mark.examSchedule.subject.subject
                ? {
                    id: mark.examSchedule.subject.subject.id,
                    name: mark.examSchedule.subject.subject.name,
                    type: mark.examSchedule.subject.subject.type,
                    code: mark.examSchedule.subject.code || null,
                    classSubjectId: mark.examSchedule.subject.id,
                  }
                : mark.examSchedule.subject)
              : null,
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