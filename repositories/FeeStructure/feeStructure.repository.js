import { FeeStructure, FeeStructureItem } from "../../models/index.js";
import { BaseRepository } from "../base.repository.js";
import { Op } from "sequelize";

const ORGANIZATION_INCLUDE = {
  association: "organization",
  attributes: ["id", "name", "organizationType", "officialEmail", "subdomain"],
};

const ACADEMIC_YEAR_INCLUDE = {
  association: "academicYear",
  attributes: ["id", "name", "isCurrent", "startDate", "endDate"],
};

const CLASS_INCLUDE = {
  association: "class",
  attributes: ["id", "name", "numericLevel"],
};

const FEE_HEAD_INCLUDE = {
  association: "feeHead",
  include: [{ association: "organization", attributes: ["id", "name", "organizationType", "officialEmail", "subdomain"] }],
};

const FEE_STRUCTURE_ITEM_INCLUDE = {
  association: "items",
  include: [FEE_HEAD_INCLUDE],
};

export class FeeStructureRepository extends BaseRepository {
  constructor() {
    super(FeeStructure);
  }

  async findByName(name, tenantId) {
    return await this.model.findOne({ where: { name: name.trim(), tenantId } });
  }

  async findWithItems(id, tenantId) {
    return await this.model.findOne({
      where: { id, tenantId },
      include: [
        ORGANIZATION_INCLUDE,
        ACADEMIC_YEAR_INCLUDE,
        CLASS_INCLUDE,
        FEE_STRUCTURE_ITEM_INCLUDE,
      ],
    });
  }

  async findWithPagination(tenantId, filters = {}, page = 1, limit = 10) {
    const offset = (page - 1) * limit;
    const { search, ...restFilters } = filters;
    const keyword = String(search ?? "").trim();
    const where = { tenantId, ...restFilters };
    if (keyword) {
      where.name = { [Op.iLike]: `%${keyword}%` };
    }
    const { count, rows } = await this.model.findAndCountAll({
      where,
      offset,
      limit,
      include: [
        ORGANIZATION_INCLUDE,
        ACADEMIC_YEAR_INCLUDE,
        CLASS_INCLUDE,
        FEE_STRUCTURE_ITEM_INCLUDE,
      ],
      order: [["createdAt", "DESC"]],
    });

    return {
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit),
      data: rows,
    };
  }

  async findByAcademicYear(academicYearId, tenantId) {
    return await this.model.findAll({
      where: { academicYearId, tenantId },
      include: [
        ORGANIZATION_INCLUDE,
        ACADEMIC_YEAR_INCLUDE,
        CLASS_INCLUDE,
        FEE_STRUCTURE_ITEM_INCLUDE,
      ],
    });
  }

  async findByClass(classId, tenantId) {
    return await this.model.findAll({
      where: { classId, tenantId },
      include: [
        ORGANIZATION_INCLUDE,
        ACADEMIC_YEAR_INCLUDE,
        CLASS_INCLUDE,
        FEE_STRUCTURE_ITEM_INCLUDE,
      ],
    });
  }

  async findByClassAndAcademicYear(classId, academicYearId, tenantId) {
    return await this.model.findOne({
      where: { classId, academicYearId, tenantId },
    });
  }

  async findByClassAndAcademicYearExcluding(classId, academicYearId, tenantId, excludeId) {
    return await this.model.findOne({
      where: {
        classId,
        academicYearId,
        tenantId,
        id: { [Op.ne]: excludeId },
      },
    });
  }
}
