import { FeeHeadRepository } from "../../repositories/FeeStructure/feeHead.repository.js";
import { FeeStructureItem } from "../../models/index.js";
import { AppError } from "../../utils/AppError.js";

const feeHeadRepo = new FeeHeadRepository();

export class FeeHeadService {
  normalizeRecord(record) {
    return record?.get ? record.get({ plain: true }) : record;
  }

  /**
   * CREATE: Add a new FeeHead
   */
  async createFeeHead(tenantId, payload) {
    const { name, description } = payload;

    // Check if FeeHead with same name already exists
    const existingFeeHead = await feeHeadRepo.findByName(name, tenantId);
    if (existingFeeHead) {
      throw new AppError("FeeHead with this name already exists for this tenant", 400);
    }

    const feeHead = await feeHeadRepo.create({
      tenantId,
      name: name.trim(),
      description: description?.trim() || null,
    });

    const feeHeadWithDetails = await feeHeadRepo.findWithItems(feeHead.id, tenantId);
    return this.formatFeeHeadResponse(feeHeadWithDetails);
  }

  /**
   * GET ALL: Retrieve all FeeHeads with pagination
   */
  async getAllFeeHeads(tenantId, query) {
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 10;

    const filters = {};
    if (query.search) {
      const results = await feeHeadRepo.search(tenantId, query.search);
      return {
        total: results.length,
        page: 1,
        limit: results.length,
        totalPages: 1,
        data: results.map((fh) => this.formatFeeHeadResponse(fh)),
      };
    }

    const result = await feeHeadRepo.findWithPagination(tenantId, filters, page, limit);
    return {
      ...result,
      data: result.data.map((fh) => this.formatFeeHeadResponse(fh)),
    };
  }

  /**
   * GET ONE: Retrieve a specific FeeHead by ID
   */
  async getFeeHeadById(id, tenantId) {
    const feeHead = await feeHeadRepo.findWithItems(id, tenantId);
    if (!feeHead) {
      throw new AppError("FeeHead not found", 404);
    }
    return this.formatFeeHeadResponse(feeHead);
  }

  /**
   * UPDATE: Update FeeHead details
   */
  async updateFeeHead(id, tenantId, updateData) {
    const feeHead = await feeHeadRepo.findById(id, tenantId);

    // Check if updating name and if it already exists
    if (updateData.name && updateData.name.trim() !== feeHead.name) {
      const existingFeeHead = await feeHeadRepo.findByName(updateData.name, tenantId);
      if (existingFeeHead) {
        throw new AppError("FeeHead with this name already exists for this tenant", 400);
      }
    }

    const updatedFeeHead = await feeHeadRepo.update(id, tenantId, {
      name: updateData.name?.trim() || feeHead.name,
      description: updateData.description?.trim() || feeHead.description,
    });

    const feeHeadWithDetails = await feeHeadRepo.findWithItems(updatedFeeHead.id, tenantId);
    return this.formatFeeHeadResponse(feeHeadWithDetails);
  }

  /**
   * DELETE: Delete a FeeHead (checks if mapped to any structure first)
   */
  async deleteFeeHead(id, tenantId) {
    await feeHeadRepo.findById(id, tenantId); // Verify it exists first

    // Check if FeeHead is mapped to any FeeStructure
    const itemCount = await FeeStructureItem.count({
      where: { feeHeadId: id, tenantId },
    });

    if (itemCount > 0) {
      throw new AppError(
        `Cannot delete FeeHead - ${itemCount} active mapping(s) exist. Remove mappings first.`,
        409
      );
    }

    await feeHeadRepo.delete(id, tenantId);
    return { message: "FeeHead deleted successfully" };
  }

  /**
   * Helper: Format FeeHead response
   */
  formatFeeHeadResponse(feeHead) {
    const data = this.normalizeRecord(feeHead);

    return {
      id: data.id,
      name: data.name,
      description: data.description,
      tenant: data.organization
        ? {
            id: data.organization.id,
            name: data.organization.name,
            organizationType: data.organization.organizationType,
            officialEmail: data.organization.officialEmail,
            subdomain: data.organization.subdomain,
          }
        : undefined,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  }
}
