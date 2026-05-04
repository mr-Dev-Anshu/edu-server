import { Mark } from "../../models/index.js";
import { BaseRepository } from "../base.repository.js";

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
    });
  }

  async findByStudent(studentId, tenantId) {
    return await this.model.findAll({
      where: { studentId, tenantId },
    });
  }

  async bulkUpsert(records) {
    // Sequelize bulkCreate with updateOnDuplicate for upsert behavior
    return await this.model.bulkCreate(records, {
      updateOnDuplicate: ["marksObtainedRaw", "isAbsent", "enteredById", "updatedAt"],
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