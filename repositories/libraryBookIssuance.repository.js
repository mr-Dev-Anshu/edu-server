import { LibraryBookIssuance } from "../models/index.js";
import { BaseRepository } from "./base.repository.js";

export class LibraryBookIssuanceRepository extends BaseRepository {
  constructor() {
    super(LibraryBookIssuance);
  }

  async findByIsbn(isbn, tenantId) {
    return await this.model.findAll({ where: { isbn, tenantId } });
  }

  async findByIssuedTo(issuedToId, tenantId) {
    return await this.model.findAll({
      where: { issuedToId, tenantId },
      order: [["createdAt", "DESC"]],
    });
  }

  async findByStatus(status, tenantId) {
    return await this.model.findAll({
      where: { status, tenantId },
      order: [["createdAt", "DESC"]],
    });
  }

  async findWithPagination(tenantId, filters = {}, page = 1, limit = 10, options = {}) {
    const offset = (page - 1) * limit;
    const where = options.where || { tenantId, ...filters };
    const { where: _where, distinct, order, ...queryOptions } = options;

    const include = options.include || [
      { association: "issuedTo", attributes: ["id", "firstName", "lastName", "email"] },
      { association: "issuedBy", attributes: ["id", "firstName", "lastName", "email"] },
      { association: "organization", attributes: ["id", "name", "organizationType", "subdomain"] },
    ];

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
}
