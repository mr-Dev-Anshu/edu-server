import { Op } from "sequelize";
import { Mark, Student, User, ExamSchedule, Subject, Section } from "../../models/index.js";
import { BaseRepository } from "../base.repository.js";

// Reusable include for populated mark responses
const markIncludes = [
  {
    model: Student,
    as: "student",
    attributes: ["id", "firstName", "middleName", "lastName", "admissionNumber", "rollNumber"],
    include: [
      {
        model: User,
        as: "user",
        attributes: ["id", "email"],
      },
    ],
  },
  {
    model: ExamSchedule,
    as: "examSchedule",
    attributes: ["id", "examDate", "startTime", "endTime", "maxMarks", "passingMarks"],
    include: [
      {
        model: Subject,
        as: "subject",
        attributes: ["id", "name", "code"],
      },
      {
        model: Section,
        as: "section",
        attributes: ["id", "name"],
      },
    ],
  },
  {
    model: User,
    as: "enteredBy",
    attributes: ["id", "firstName", "lastName", "email"],
  },
];

export class MarkRepository extends BaseRepository {
  constructor() {
    super(Mark);
  }

  async findByStudentAndSchedule(studentId, examScheduleId, tenantId) {
    return await this.model.findOne({
      where: { studentId, examScheduleId, tenantId },
    });
  }

  async findByExamSchedule(examScheduleId, tenantId) {
    return await this.model.findAll({
      where: { examScheduleId, tenantId },
      include: markIncludes,
    });
  }

  async findByStudent(studentId, tenantId) {
    return await this.model.findAll({
      where: { studentId, tenantId },
      include: markIncludes,
    });
  }

  /**
   * Bulk upsert marks.
   * @param {Array} records  - The mark records to upsert
   * @param {object} options - Sequelize options (transaction, etc.)
   * @param {boolean} allowOverwrite - If false, throw error when existing record found
   */
  async bulkUpsert(records, options = {}, allowOverwrite = false) {
    const { transaction, tenantId } = options;

    if (!allowOverwrite) {
      // Check for any existing marks that would be silently overwritten
      const keys = records.map((r) => ({
        studentId: r.studentId,
        examScheduleId: r.examScheduleId,
      }));

      const existing = await this.model.findAll({
        where: {
          tenantId,
          [Op.or]: keys.map((k) => ({
            studentId: k.studentId,
            examScheduleId: k.examScheduleId,
          })),
        },
        transaction,
        attributes: ["studentId", "examScheduleId"],
      });

      if (existing.length > 0) {
        const conflicts = existing.map(
          (e) => `studentId=${e.studentId} / scheduleId=${e.examScheduleId}`
        );
        throw Object.assign(
          new Error(
            `${existing.length} mark(s) already exist and overwrite is disabled: ${conflicts.join("; ")}`
          ),
          { statusCode: 409, isOperational: true }
        );
      }

      // No conflicts — plain bulk insert
      return await this.model.bulkCreate(records, { transaction });
    }

    // allowOverwrite=true — upsert existing records
    return await this.model.bulkCreate(records, {
      updateOnDuplicate: ["marksObtainedRaw", "isAbsent", "enteredById", "updatedAt"],
      transaction,
    });
  }

  async findWithPagination(tenantId, filters = {}, page = 1, limit = 10) {
    const offset = (page - 1) * limit;
    const where = { tenantId, ...filters };

    const { count, rows } = await this.model.findAndCountAll({
      where,
      offset,
      limit,
      order: [["createdAt", "DESC"]],
      include: markIncludes,
      distinct: true,
    });

    return {
      total: count,
      page,
      limit,
      pages: Math.ceil(count / limit),
      data: rows,
    };
  }

  async findByIdPopulated(id, tenantId) {
    return await this.model.findOne({
      where: { id, tenantId },
      include: markIncludes,
    });
  }
}