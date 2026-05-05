import { Subject } from "../../models/index.js";
import { BaseRepository } from "../base.repository.js";
import { Op } from "sequelize";

export class SubjectRepository extends BaseRepository {
  constructor() {
    super(Subject);
  }

  normalizeCode(code) {
    return typeof code === "string" ? code.trim() : code;
  }

  async findByCode(code, classId, tenantId) {
    return await this.model.findOne({
      where: { code: this.normalizeCode(code), classId, tenantId },
    });
  }

  async findByClassId(classId, tenantId, options = {}) {
    return await this.model.findAll({
      where: { classId, tenantId },
      order: options.order || [
        ["name", "ASC"],
        ["createdAt", "ASC"],
      ],
      ...options,
    });
  }

  async findBySubjectType(subjectType, tenantId, options = {}) {
    return await this.model.findAll({
      where: { subjectType, tenantId },
      order: [["createdAt", "DESC"]],
      ...options,
    });
  }

  async findWithPagination(
    tenantId,
    filters = {},
    page = 1,
    limit = 10,
    options = {},
  ) {
    const offset = (page - 1) * limit;
    const where = { tenantId, ...filters };
    const { where: _where, distinct, order, ...queryOptions } = options;

    const include = options.include || [
      { association: "class", attributes: ["id", "name", "numericLevel"] },
      { association: "organization", attributes: ["id", "name", "subdomain"] },
    ];

    const { count, rows } = await this.model.findAndCountAll({
      where,
      offset,
      limit,
      include,
      distinct: distinct ?? Boolean(include),
      order: order || [
        ["name", "ASC"],
        ["createdAt", "ASC"],
      ],
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

  async searchSubjects(
    tenantId,
    searchTerm,
    page = 1,
    limit = 10,
    filters = {},
  ) {
    const offset = (page - 1) * limit;

    const where = {
      tenantId,
      ...filters,
      [Op.or]: [
        { name: { [Op.iLike]: `%${searchTerm}%` } },
        { code: { [Op.iLike]: `%${searchTerm}%` } },
      ],
    };

    const { count, rows } = await this.model.findAndCountAll({
      where,
      offset,
      limit,
      include: [
        { association: "class", attributes: ["id", "name", "numericLevel"] },
        {
          association: "organization",
          attributes: ["id", "name", "subdomain"],
        },
      ],
      order: [
        ["name", "ASC"],
        ["createdAt", "ASC"],
      ],
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

  async countByClass(classId, tenantId) {
    return await this.model.count({
      where: { classId, tenantId },
    });
  }

  async codeExists(code, tenantId) {
    const count = await this.model.count({
      where: { code, tenantId },
    });
    return count > 0;
  }

  async softDelete(id, tenantId) {
    const subject = await this.model.findOne({
      where: { id, tenantId },
    });

    if (!subject) return null;
    return await subject.destroy();
  }
}
