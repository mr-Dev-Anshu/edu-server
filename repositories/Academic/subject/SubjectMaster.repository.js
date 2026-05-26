import { SubjectMaster } from "../../../models/index.js";
import { BaseRepository } from "../../base.repository.js";
import { Op } from "sequelize";

export class SubjectMasterRepository extends BaseRepository {
  constructor() {
    super(SubjectMaster);
  }

  async findByName(name, tenantId) {
    return await this.model.findOne({ 
      where: { name, tenantId } 
    });
  }

  async findByIds(ids, tenantId) {
    return await this.model.findAll({
      where: {
        id: { [Op.in]: ids },
        tenantId,
      },
      attributes: ["id"],
    });
  }

  async findByType(type, tenantId) {
    return await this.model.findAll({
      where: { type, tenantId },
      order: [["createdAt", "DESC"]],
    });
  }

  async findWithPagination(tenantId, filters = {}, page = 1, limit = 10, options = {}) {
    const offset = (page - 1) * limit;
    const where = { tenantId, ...filters };
    const { where: _where, distinct, order, ...queryOptions } = options;
    
    const include = options.include || [];
    
    const { count, rows } = await this.model.findAndCountAll({
      where,
      offset,
      limit,
      include,
      distinct: distinct ?? Boolean(include),
      order: order || [["createdAt", "DESC"]],
      ...queryOptions,
    });

    return {
      total: count,
      page,
      limit,
      pages: Math.ceil(count / limit),
      data: rows,
    };
  }

  async searchSubject(tenantId, searchTerm, filters = {}, page = 1, limit = 10) {
    return await this.search(tenantId, searchTerm, [
      "name",
    ], {
      filters,
      page,
      limit,
      order: [["createdAt", "DESC"]],
    });
  }

  async findWithClassSubjects(id, tenantId, options = {}) {
    const queryOptions = Array.isArray(options) ? { include: options } : options;
    
    return await this.model.findOne({
      where: { id, tenantId },
      include: [
        {
          association: "classSubjects",
          attributes: ["id", "classId", "code", "isElective", "weeklyPeriods", "passingMarks"],
          include: [
            {
              association: "class",
              attributes: ["id", "name", "numericLevel"]
            }
          ]
        }
      ],
      ...queryOptions,
    });
  }
}
