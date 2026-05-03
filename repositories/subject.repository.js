import { Subject } from "../models/index.js";
import { BaseRepository } from "./base.repository.js";
import { Op } from "sequelize";

/**
 * Subject Repository
 * Data access layer for Subject model
 * Implements custom query methods for Subject-specific operations
 */
export class SubjectRepository extends BaseRepository {
  constructor() {
    super(Subject);
  }

  /**
   * Find subject by code for a specific class and tenant
   * Used for uniqueness validation
   */
  async findByCode(code, classId, tenantId) {
    return await this.model.findOne({
      where: { code, classId, tenantId },
    });
  }

  /**
   * Find all subjects for a specific class
   */
  async findByClassId(classId, tenantId, options = {}) {
    return await this.model.findAll({
      where: { classId, tenantId },
      order: options.order || [["name", "ASC"], ["createdAt", "ASC"]],
      ...options,
    });
  }

  /**
   * Find subjects by subject type
   */
  async findBySubjectType(subjectType, tenantId, options = {}) {
    return await this.model.findAll({
      where: { subjectType, tenantId },
      order: [["createdAt", "DESC"]],
      ...options,
    });
  }

  /**
   * Find subjects with pagination and filtering
   * Main method for list endpoints
   */
  async findWithPagination(tenantId, filters = {}, page = 1, limit = 10, options = {}) {
    const offset = (page - 1) * limit;
    const where = { tenantId, ...filters };
    const { where: _where, distinct, order, ...queryOptions } = options;

    // Default includes for class and tenant details
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
      order: order || [["name", "ASC"], ["createdAt", "ASC"]],
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

  /**
   * Search subjects by name and code
   * Supports filtering by multiple criteria
   */
  async searchSubjects(tenantId, searchTerm, page = 1, limit = 10, filters = {}) {
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
        { association: "organization", attributes: ["id", "name", "subdomain"] },
      ],
      order: [["name", "ASC"], ["createdAt", "ASC"]],
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
   * Get subjects count for a class
   */
  async countByClass(classId, tenantId) {
    return await this.model.count({
      where: { classId, tenantId },
    });
  }

  /**
   * Check if a subject code exists
   */
  async codeExists(code, tenantId) {
    const count = await this.model.count({
      where: { code, tenantId },
    });
    return count > 0;
  }

  /**
   * Soft delete a subject
   */
  async softDelete(id, tenantId) {
    const subject = await this.model.findOne({
      where: { id, tenantId },
    });

    if (!subject) return null;
    return await subject.destroy();
  }
}
