import { Op } from "sequelize";
import { ExamSchedule, ExamGroup, SubjectMaster, ClassSubject, Section, Class, AcademicYear } from "../../models/index.js";
import { BaseRepository } from "../base.repository.js";

// Reusable include for fully populated schedule responses
const scheduleIncludes = [
  {
    model: ExamGroup,
    as: "examGroup",
    attributes: ["id", "name", "examType", "startDate", "endDate", "isResultPublished"],
  },
  {
    model: ClassSubject,
    as: "subject",
    attributes: ["id", "code", "isElective", "passingMarks"],
    include: [
      {
        model: SubjectMaster,
        as: "subject",
        attributes: ["id", "name", "type"],
      },
    ],
  },
  {
    model: Section,
    as: "section",
    attributes: ["id", "name"],
    include: [
      {
        model: Class,
        as: "class",
        attributes: ["id", "name"],
      },
      {
        model: AcademicYear,
        as: "academicYear",
        attributes: ["id", "name", "startDate", "endDate"],
      },
    ],
  },
];

export class ExamScheduleRepository extends BaseRepository {
  constructor() {
    super(ExamSchedule);
  }

  async findByExamGroup(examGroupId, tenantId) {
    return await this.model.findAll({
      where: { examGroupId, tenantId },
      order: [["examDate", "ASC"]],
      include: scheduleIncludes,
    });
  }

  async findConflict(sectionId, subjectId, examDate, tenantId, excludeId = null) {
    const where = { sectionId, subjectId, examDate, tenantId };
    if (excludeId) where.id = { [Op.ne]: excludeId };
    return await this.model.findOne({ where });
  }

  async findByIdPopulated(id, tenantId) {
    return await this.model.findOne({
      where: { id, tenantId },
      include: scheduleIncludes,
    });
  }

  async findWithPagination(tenantId, filters = {}, page = 1, limit = 10) {
    const offset = (page - 1) * limit;
    const where = { tenantId, ...filters };

    const { count, rows } = await this.model.findAndCountAll({
      where,
      offset,
      limit,
      order: [["examDate", "ASC"]],
      include: scheduleIncludes,
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

  /**
   * Find exam schedule for marks entry (minimal data)
   * Used by marks entry endpoint to validate schedule exists
   * and fetch required metadata (maxMarks, passingMarks, etc.)
   */
  async findScheduleForMarksEntry(examGroupId, sectionId, subjectId, tenantId) {
    return await this.model.findOne({
      where: {
        examGroupId,
        sectionId,
        subjectId,
        tenantId,
      },
      attributes: ["id", "examDate", "maxMarks", "passingMarks"],
      raw: true,
    });
  }
}