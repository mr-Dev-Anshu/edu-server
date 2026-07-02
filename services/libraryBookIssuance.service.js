import { LibraryBookIssuanceRepository } from "../repositories/libraryBookIssuance.repository.js";
import { BaseService } from "./base.service.js";
import { AppError } from "../utils/AppError.js";
import { Op } from "sequelize";
import sequelize from "../config/db.js";

const repo = new LibraryBookIssuanceRepository();

export class LibraryBookIssuanceService extends BaseService {
  constructor() {
    super(repo);
  }

  async createIssuance(tenantId, payload) {
    const {
      bookTitle, bookAuthor, isbn,
      issuedToId, issuedById,
      issueDate, dueDate, remarks,
    } = payload;

    const data = await repo.create({
      tenantId,
      bookTitle: bookTitle.trim(),
      bookAuthor: bookAuthor.trim(),
      isbn: isbn?.trim() || null,
      issuedToId,
      issuedById,
      issueDate,
      dueDate,
      remarks: remarks?.trim() || null,
      status: "issued",
    });

    const issuance = await repo.findById(data.id, tenantId, {
      include: [
        { association: "issuedTo", attributes: ["id", "firstName", "lastName", "email"] },
        { association: "issuedBy", attributes: ["id", "firstName", "lastName", "email"] },
        { association: "organization", attributes: ["id", "name", "organizationType", "subdomain"] },
      ],
    });

    return this.formatIssuanceResponse(issuance);
  }

  async getAllIssuances(tenantId, query) {
    const page = Number.parseInt(query.page, 10) > 0 ? Number.parseInt(query.page, 10) : 1;
    const limit = Number.parseInt(query.limit, 10) > 0 ? Number.parseInt(query.limit, 10) : 10;

    const where = { tenantId };
    const andClauses = [];

    if (query.status) {
      where.status = query.status;
    }

    const searchTerm = String(query.search || "").trim();
    if (searchTerm) {
      andClauses.push({
        [Op.or]: [
          { bookTitle: { [Op.iLike]: `%${searchTerm}%` } },
          { bookAuthor: { [Op.iLike]: `%${searchTerm}%` } },
          { isbn: { [Op.iLike]: `%${searchTerm}%` } },
          sequelize.where(sequelize.col("issuedTo.first_name"), {
            [Op.iLike]: `%${searchTerm}%`,
          }),
          sequelize.where(sequelize.col("issuedTo.last_name"), {
            [Op.iLike]: `%${searchTerm}%`,
          }),
        ],
      });
    }

    if (andClauses.length) {
      where[Op.and] = andClauses;
    }

    const sortableColumns = {
      createdAt: sequelize.col("LibraryBookIssuance.created_at"),
      issueDate: sequelize.col("LibraryBookIssuance.issue_date"),
      dueDate: sequelize.col("LibraryBookIssuance.due_date"),
      bookTitle: sequelize.fn("LOWER", sequelize.col("LibraryBookIssuance.book_title")),
      status: sequelize.fn("LOWER", sequelize.col("LibraryBookIssuance.status")),
    };

    const rawSortKey = String(query.sort || "createdAt").trim();
    const sortCol = sortableColumns[rawSortKey] || sortableColumns.createdAt;
    const orderDirection = String(query.order || "desc").toUpperCase() === "ASC" ? "ASC" : "DESC";

    const result = await repo.findWithPagination(tenantId, {}, page, limit, {
      where,
      include: [
        { association: "issuedTo", attributes: ["id", "firstName", "lastName", "email"], required: false },
        { association: "issuedBy", attributes: ["id", "firstName", "lastName", "email"], required: false },
      ],
      subQuery: false,
      order: [[sortCol, orderDirection]],
    });

    return {
      ...result,
      data: result.data.map((i) => this.formatIssuanceResponse(i)),
    };
  }

  async getIssuanceById(id, tenantId) {
    const issuance = await repo.findById(id, tenantId, {
      include: [
        { association: "issuedTo", attributes: ["id", "firstName", "lastName", "email"] },
        { association: "issuedBy", attributes: ["id", "firstName", "lastName", "email"] },
        { association: "organization", attributes: ["id", "name", "organizationType", "subdomain"] },
      ],
    });
    return this.formatIssuanceResponse(issuance);
  }

  async updateIssuance(id, tenantId, updateData) {
    const issuance = await repo.findById(id, tenantId);

    const allowedFields = {};

    if (updateData.bookTitle) allowedFields.bookTitle = updateData.bookTitle.trim();
    if (updateData.bookAuthor) allowedFields.bookAuthor = updateData.bookAuthor.trim();
    if (updateData.isbn !== undefined) allowedFields.isbn = updateData.isbn?.trim() || null;
    if (updateData.dueDate) allowedFields.dueDate = updateData.dueDate;
    if (updateData.returnDate) allowedFields.returnDate = updateData.returnDate;
    if (updateData.status) allowedFields.status = updateData.status;
    if (updateData.remarks !== undefined) allowedFields.remarks = updateData.remarks?.trim() || null;

    if (updateData.status === "returned" && !updateData.returnDate) {
      allowedFields.returnDate = new Date().toISOString().split("T")[0];
    }

    await repo.update(id, tenantId, allowedFields);

    const updated = await repo.findById(id, tenantId, {
      include: [
        { association: "issuedTo", attributes: ["id", "firstName", "lastName", "email"] },
        { association: "issuedBy", attributes: ["id", "firstName", "lastName", "email"] },
        { association: "organization", attributes: ["id", "name", "organizationType", "subdomain"] },
      ],
    });

    return this.formatIssuanceResponse(updated);
  }

  async deleteIssuance(id, tenantId) {
    await repo.findById(id, tenantId);
    await repo.delete(id, tenantId);
    return { message: "Library book issuance record deleted successfully" };
  }

  async searchIssuances(tenantId, query) {
    return await this.search(tenantId, query, [
      "bookTitle",
      "bookAuthor",
      "isbn",
    ], {
      filterableFields: ["status"],
      include: [
        { association: "issuedTo", attributes: ["id", "firstName", "lastName", "email"] },
        { association: "issuedBy", attributes: ["id", "firstName", "lastName", "email"] },
      ],
      formatter: (issuance) => this.formatIssuanceResponse(issuance),
      order: [["createdAt", "DESC"]],
    });
  }

  formatIssuanceResponse(issuance) {
    return {
      id: issuance.id,
      tenant: issuance.organization ? {
        id: issuance.organization.id,
        name: issuance.organization.name,
        organizationType: issuance.organization.organizationType,
        subdomain: issuance.organization.subdomain,
      } : null,
      bookTitle: issuance.bookTitle,
      bookAuthor: issuance.bookAuthor,
      isbn: issuance.isbn,
      issuedTo: issuance.issuedTo ? {
        id: issuance.issuedTo.id,
        firstName: issuance.issuedTo.firstName,
        lastName: issuance.issuedTo.lastName,
        email: issuance.issuedTo.email,
      } : null,
      issuedBy: issuance.issuedBy ? {
        id: issuance.issuedBy.id,
        firstName: issuance.issuedBy.firstName,
        lastName: issuance.issuedBy.lastName,
        email: issuance.issuedBy.email,
      } : null,
      issueDate: issuance.issueDate,
      dueDate: issuance.dueDate,
      returnDate: issuance.returnDate,
      status: issuance.status,
      remarks: issuance.remarks,
      createdAt: issuance.createdAt,
      updatedAt: issuance.updatedAt,
    };
  }
}
