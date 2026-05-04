import { ExamGroup } from "../../models/index.js";
import { BaseRepository } from "../base.repository.js";

export class ExamGroupRepository extends BaseRepository {
  constructor() {
    super(ExamGroup);
  }

  async findByName(name, tenantId) {
    return await this.model.findOne({ where: { name, tenantId } });
  }

  async findByAcademicYear(academicYearId, tenantId) {
    return await this.model.findAll({
      where: { academicYearId, tenantId },
      order: [["startDate", "ASC"]],
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

  async setResultPublished(id, tenantId, value) {
    return await this.model.update(
      { isResultPublished: value },
      { where: { id, tenantId } }
    );
  }
}