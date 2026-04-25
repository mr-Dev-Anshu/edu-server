import { FeeStructureItem } from "../../models/index.js";
import { BaseRepository } from "../base.repository.js";

export class FeeStructureItemRepository extends BaseRepository {
  constructor() {
    super(FeeStructureItem);
  }

  async bulkCreate(items, options = {}) {
    return await this.model.bulkCreate(items, options);
  }

  async findByFeeStructureId(feeStructureId, tenantId) {
    return await this.model.findAll({
      where: { feeStructureId, tenantId },
      include: [{ association: "feeHead" }],
      order: [["createdAt", "DESC"]],
    });
  }

  async findByFeeHeadId(feeHeadId, tenantId) {
    return await this.model.findAll({
      where: { feeHeadId, tenantId },
      include: [{ association: "feeStructure" }],
      order: [["createdAt", "DESC"]],
    });
  }

  async findItemById(id, tenantId) {
    return await this.model.findOne({
      where: { id, tenantId },
      include: [
        { association: "feeHead" },
        { association: "feeStructure" },
      ],
    });
  }

  async deleteByFeeStructure(feeStructureId, tenantId, options = {}) {
    return await this.model.destroy({
      where: { feeStructureId, tenantId },
      ...options,
    });
  }

  async deleteByFeeHead(feeHeadId, tenantId, options = {}) {
    return await this.model.destroy({
      where: { feeHeadId, tenantId },
      ...options,
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
        { association: "feeHead" },
        { association: "feeStructure" },
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
}
