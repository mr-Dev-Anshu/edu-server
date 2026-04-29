import { Op } from "sequelize";
import { AppError } from "../utils/AppError.js";

const toPositiveInteger = (value, fallback) => {
  const number = Number.parseInt(value, 10);
  return Number.isInteger(number) && number > 0 ? number : fallback;
};

export class BaseRepository {
  constructor(model) {
    this.model = model;
  }

  async findById(id, tenantId, include = []) {
    const record = await this.model.findOne({ where: { id, tenantId }, include });
    if (!record) throw new AppError(`${this.model.name} not found`, 404);
    return record;
  }

  async findAll(tenantId, filter = {}, include = []) {
    return await this.model.findAll({ 
      where: { ...filter, tenantId }, 
      include 
    });
  }

  async search(tenantId, searchTerm, searchableFields = [], options = {}) {
    const {
      filters = {},
      page = 1,
      limit = 10,
      order = [["createdAt", "DESC"]],
      include,
      distinct,
      ...queryOptions
    } = options;

    const normalizedTerm = String(searchTerm ?? "").trim();
    const fields = Array.isArray(searchableFields)
      ? searchableFields.filter(Boolean)
      : [];
    const safePage = toPositiveInteger(page, 1);
    const safeLimit = toPositiveInteger(limit, 10);
    const offset = (safePage - 1) * safeLimit;

    if (!fields.length) {
      throw new AppError("Search fields are required", 400);
    }

    const whereClauses = [];

    if (tenantId !== undefined && tenantId !== null) {
      whereClauses.push({ tenantId });
    }

    if (filters && Reflect.ownKeys(filters).length) {
      whereClauses.push(filters);
    }

    if (normalizedTerm && fields.length) {
      whereClauses.push({
        [Op.or]: fields.map((field) => ({
          [field]: { [Op.iLike]: `%${normalizedTerm}%` },
        })),
      });
    }

    const where = whereClauses.length ? { [Op.and]: whereClauses } : {};

    const { count, rows } = await this.model.findAndCountAll({
      where,
      offset,
      limit: safeLimit,
      order,
      include,
      distinct: distinct ?? Boolean(include),
      ...queryOptions,
    });

    const total = Array.isArray(count) ? count.length : count;

    return {
      total,
      page: safePage,
      limit: safeLimit,
      pages: Math.ceil(total / safeLimit),
      data: rows,
    };
  }

  async create(data, options = {}) {
    return await this.model.create(data, options);
  }

  async update(id, tenantId, data) {
    const record = await this.findById(id, tenantId);
    return await record.update(data);
  }

  async delete(id, tenantId) {
    const record = await this.findById(id, tenantId);
    return await record.destroy();
  }
}
