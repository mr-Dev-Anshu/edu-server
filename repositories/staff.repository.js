import { Staff } from "../models/index.js";
import { BaseRepository } from "./base.repository.js";

export class StaffRepository extends BaseRepository {
  constructor() {
    super(Staff);
  }

  async findByEmployeeCode(employeeCode, tenantId) {
    return await this.model.findOne({ where: { employeeCode, tenantId } });
  }

  async findByUserId(userId, tenantId) {
    return await this.model.findOne({ where: { userId, tenantId } });
  }

  async findByStaffType(staffType, tenantId) {
    return await this.model.findAll({
      where: { staffType, tenantId },
      order: [["createdAt", "DESC"]],
    });
  }

  async findByEmploymentStatus(employmentStatus, tenantId) {
    return await this.model.findAll({
      where: { employmentStatus, tenantId },
      order: [["createdAt", "DESC"]],
    });
  }

  async findByDepartment(department, tenantId) {
    return await this.model.findAll({
      where: { department, tenantId },
      order: [["createdAt", "DESC"]],
    });
  }

  async findWithPagination(tenantId, filters = {}, page = 1, limit = 10, options = {}) {
    const offset = (page - 1) * limit;
    const where = options.where || { tenantId, ...filters };
    const { where: _where, include, distinct, order, ...queryOptions } = options;
    
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

  async searchStaff(tenantId, searchTerm, page = 1, limit = 10) {
    return await this.search(tenantId, searchTerm, [
      "employeeCode",
      "designation",
      "department",
    ], {
      page,
      limit,
      order: [["createdAt", "DESC"]],
    });
  }
}
