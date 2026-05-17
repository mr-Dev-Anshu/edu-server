import { FeeStructureItemRepository } from "../../repositories/FeeStructure/feeStructureItem.repository.js";
import { FeeHeadRepository } from "../../repositories/FeeStructure/feeHead.repository.js";
import { FeeStructureRepository } from "../../repositories/FeeStructure/feeStructure.repository.js";
import { AppError } from "../../utils/AppError.js";

const feeStructureItemRepo = new FeeStructureItemRepository();
const feeHeadRepo = new FeeHeadRepository();
const feeStructureRepo = new FeeStructureRepository();

export class FeeStructureItemService {
  normalizeRecord(record) {
    return record?.get ? record.get({ plain: true }) : record;
  }

  /**
   * CREATE: Add a new item/mapping to FeeStructure
   */
  async createFeeStructureItem(tenantId, payload) {
    const { feeStructureId, feeHeadId, amountRaw, isOptional } = payload;

    // Verify FeeStructure exists
    const feeStructure = await feeStructureRepo.findById(feeStructureId, tenantId);
    if (!feeStructure) {
      throw new AppError("FeeStructure not found", 404);
    }

    // Verify FeeHead exists
    const feeHead = await feeHeadRepo.findById(feeHeadId, tenantId);
    if (!feeHead) {
      throw new AppError("FeeHead not found", 404);
    }

    // Check for duplicate mapping
    const existingItem = await feeStructureItemRepo.model.findOne({
      where: { feeStructureId, feeHeadId, tenantId },
    });

    if (existingItem) {
      throw new AppError("This FeeHead is already mapped to this FeeStructure", 400);
    }

    const item = await feeStructureItemRepo.create({
      tenantId,
      feeStructureId,
      feeHeadId,
      amountRaw,
      isOptional: isOptional || false,
    });

    // Fetch with relations
    const itemWithRelations = await feeStructureItemRepo.findItemById(item.id, tenantId);
    return this.formatFeeStructureItemResponse(itemWithRelations);
  }

  /**
   * GET ALL: Retrieve all FeeStructureItems with pagination
   */
  async getAllFeeStructureItems(tenantId, query) {
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 10;

    const filters = {};
    if (query.feeStructureId) filters.feeStructureId = query.feeStructureId;
    if (query.feeHeadId) filters.feeHeadId = query.feeHeadId;

    const result = await feeStructureItemRepo.findWithPagination(
      tenantId,
      filters,
      page,
      limit
    );

    return {
      ...result,
      data: result.data.map((item) => this.formatFeeStructureItemResponse(item)),
    };
  }

  /**
   * GET ONE: Retrieve a specific FeeStructureItem by ID
   */
  async getFeeStructureItemById(id, tenantId) {
    const item = await feeStructureItemRepo.findItemById(id, tenantId);
    if (!item) {
      throw new AppError("FeeStructureItem not found", 404);
    }
    return this.formatFeeStructureItemResponse(item);
  }

  /**
   * GET BY FeeStructure: Get all items mapped to a specific FeeStructure
   */
  async getFeeStructureItems(feeStructureId, tenantId) {
    // Verify FeeStructure exists
    const feeStructure = await feeStructureRepo.findById(feeStructureId, tenantId);
    if (!feeStructure) {
      throw new AppError("FeeStructure not found", 404);
    }

    const items = await feeStructureItemRepo.findByFeeStructureId(feeStructureId, tenantId);
    return items.map((item) => this.formatFeeStructureItemResponse(item));
  }

  /**
   * UPDATE: Update FeeStructureItem (amount and isOptional)
   */
  async updateFeeStructureItem(id, tenantId, updateData) {
    const item = await feeStructureItemRepo.findItemById(id, tenantId);
    if (!item) {
      throw new AppError("FeeStructureItem not found", 404);
    }

    const updatedItem = await feeStructureItemRepo.update(id, tenantId, {
      amountRaw: updateData.amountRaw !== undefined ? updateData.amountRaw : item.amountRaw,
      isOptional:
        updateData.isOptional !== undefined ? updateData.isOptional : item.isOptional,
    });

    const itemWithRelations = await feeStructureItemRepo.findItemById(
      updatedItem.id,
      tenantId
    );
    return this.formatFeeStructureItemResponse(itemWithRelations);
  }

  /**
   * DELETE: Remove a FeeHead mapping from FeeStructure
   */
  async deleteFeeStructureItem(id, tenantId) {
    await feeStructureItemRepo.findItemById(id, tenantId); // Verify exists
    await feeStructureItemRepo.delete(id, tenantId);
    return { message: "FeeStructureItem deleted successfully" };
  }

  /**
   * DELETE BY FeeStructure: Remove all items from a FeeStructure
   */
  async deleteFeeStructureItems(feeStructureId, tenantId) {
    // Verify FeeStructure exists
    const feeStructure = await feeStructureRepo.findById(feeStructureId, tenantId);
    if (!feeStructure) {
      throw new AppError("FeeStructure not found", 404);
    }

    await feeStructureItemRepo.deleteByFeeStructure(feeStructureId, tenantId);
    return { message: "All FeeStructure items deleted successfully" };
  }

  /**
   * Helper: Format FeeStructureItem response
   */
  formatFeeStructureItemResponse(item) {
    const data = this.normalizeRecord(item);
    const tenantSource = data.feeStructure?.organization || data.feeHead?.organization;

    return {
      id: data.id,
      amountRaw: data.amountRaw,
      isOptional: data.isOptional,
      tenant: tenantSource
        ? {
            id: tenantSource.id,
            name: tenantSource.name,
            organizationType: tenantSource.organizationType,
            officialEmail: tenantSource.officialEmail,
            subdomain: tenantSource.subdomain,
          }
        : undefined,
      feeHead: data.feeHead
        ? {
            id: data.feeHead.id,
            name: data.feeHead.name,
            description: data.feeHead.description,
            createdAt: data.feeHead.createdAt,
            updatedAt: data.feeHead.updatedAt,
          }
        : undefined,
      feeStructure: data.feeStructure
        ? {
            id: data.feeStructure.id,
            name: data.feeStructure.name,
            academicYear: data.feeStructure.academicYear
              ? {
                  id: data.feeStructure.academicYear.id,
                  name: data.feeStructure.academicYear.name,
                  isCurrent: data.feeStructure.academicYear.isCurrent,
                  startDate: data.feeStructure.academicYear.startDate,
                  endDate: data.feeStructure.academicYear.endDate,
                }
              : undefined,
            class: data.feeStructure.class
              ? {
                  id: data.feeStructure.class.id,
                  name: data.feeStructure.class.name,
                  numericLevel: data.feeStructure.class.numericLevel,
                }
              : undefined,
            createdAt: data.feeStructure.createdAt,
            updatedAt: data.feeStructure.updatedAt,
          }
        : undefined,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  }
}
