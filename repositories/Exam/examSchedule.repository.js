import { Op } from "sequelize";
import { ExamSchedule } from "../../models/index.js";
import { BaseRepository } from "../base.repository.js";

export class ExamScheduleRepository extends BaseRepository {
  constructor() {
    super(ExamSchedule);
  }

  async findByExamGroup(examGroupId, tenantId) {
    return await this.model.findAll({
      where: { examGroupId, tenantId },
      order: [["examDate", "ASC"]],
    });
  }

  async findConflict(sectionId, subjectId, examDate, tenantId, excludeId = null) {
    const where = { sectionId, subjectId, examDate, tenantId };
    if (excludeId) where.id = { [Op.ne]: excludeId };
    return await this.model.findOne({ where });
  }

  async findWithPagination(tenantId, filters = {}, page = 1, limit = 10) {
    const offset = (page - 1) * limit;
    const where = { tenantId, ...filters };

    const { count, rows } = await this.model.findAndCountAll({
      where,
      offset,
      limit,
      order: [["examDate", "ASC"]],
    });

    return {
      total: count,
      page,
      limit,
      pages: Math.ceil(count / limit),
      data: rows,
    };
  }
}