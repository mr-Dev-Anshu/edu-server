import { FeeStructure, FeeStructureItem } from "../../models/index.js";
import { BaseRepository } from "../base.repository.js";
import { Op } from "sequelize";

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
        {
          association: "items",
          include: [{ association: "feeHead" }],
        },
      ],
    });
  }

  async findWithPagination(tenantId, filters = {}, page = 1, limit = 10) {
    const offset = (page - 1) * limit;
    const where = { tenantId, ...filters };

    const { count, rows } = await this.model.findAndCountAll({
      where,
      offset,
      limit,
      include: [
        {
          association: "items",
          include: [{ association: "feeHead" }],
        },
        { association: "academicYear" },
        { association: "class" },
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

  async search(tenantId, searchTerm) {
    return await this.model.findAll({
      where: {
        tenantId,
        name: { [Op.iLike]: `%${searchTerm}%` },
      },
      include: [
        {
          association: "items",
          include: [{ association: "feeHead" }],
        },
      ],
      order: [["createdAt", "DESC"]],
    });
  }

  async findByAcademicYear(academicYearId, tenantId) {
    return await this.model.findAll({
      where: { academicYearId, tenantId },
      include: [
        {
          association: "items",
          include: [{ association: "feeHead" }],
        },
      ],
    });
  }

  async findByClass(classId, tenantId) {
    return await this.model.findAll({
      where: { classId, tenantId },
      include: [
        {
          association: "items",
          include: [{ association: "feeHead" }],
        },
      ],
    });
  }
}
