import { FeeStructureRepository } from "../../repositories/FeeStructure/feeStructure.repository.js";
import { FeeStructureItemRepository } from "../../repositories/FeeStructure/feeStructureItem.repository.js";
import { AppError } from "../../utils/AppError.js";
import sequelize from "../../config/db.js";

const feeStructureRepo = new FeeStructureRepository();
const feeStructureItemRepo = new FeeStructureItemRepository();

export class FeeStructureService {
  /**
   * CREATE: Add a new FeeStructure with optional items
   */
  async createFeeStructure(tenantId, payload) {
    const { name, academicYearId, classId, items } = payload;

    // Check if FeeStructure with same name exists
    const existingFeeStructure = await feeStructureRepo.findByName(name, tenantId);
    if (existingFeeStructure) {
      throw new AppError("FeeStructure with this name already exists for this tenant", 400);
    }

    const transaction = await sequelize.transaction();

    try {
      // 1. Create FeeStructure
      const feeStructure = await feeStructureRepo.create(
        {
          tenantId,
          name: name.trim(),
          academicYearId,
          classId: classId || null,
        },
        { transaction }
      );

      // 2. Create FeeStructureItems if provided
      if (items && Array.isArray(items) && items.length > 0) {
        const itemPayload = items.map((item) => ({
          tenantId,
          feeStructureId: feeStructure.id,
          feeHeadId: item.feeHeadId,
          amountRaw: item.amountRaw,
          isOptional: item.isOptional || false,
        }));

        await feeStructureItemRepo.bulkCreate(itemPayload, { transaction });
      }

      await transaction.commit();

      // Fetch complete structure with items
      const completeStructure = await feeStructureRepo.findWithItems(
        feeStructure.id,
        tenantId
      );
      return this.formatFeeStructureResponse(completeStructure);
    } catch (error) {
      if (!transaction.finished) await transaction.rollback();
      throw error;
    }
  }

  /**
   * GET ALL: Retrieve all FeeStructures with pagination
   */
  async getAllFeeStructures(tenantId, query) {
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 10;

    const filters = {};
    if (query.academicYearId) filters.academicYearId = query.academicYearId;
    if (query.classId) filters.classId = query.classId;

    if (query.search) {
      const results = await feeStructureRepo.search(tenantId, query.search);
      return {
        total: results.length,
        page: 1,
        limit: results.length,
        totalPages: 1,
        data: results.map((fs) => this.formatFeeStructureResponse(fs)),
      };
    }

    const result = await feeStructureRepo.findWithPagination(tenantId, filters, page, limit);
    return {
      ...result,
      data: result.data.map((fs) => this.formatFeeStructureResponse(fs)),
    };
  }

  /**
   * GET ONE: Retrieve a specific FeeStructure by ID with all items
   */
  async getFeeStructureById(id, tenantId) {
    const feeStructure = await feeStructureRepo.findWithItems(id, tenantId);
    if (!feeStructure) {
      throw new AppError("FeeStructure not found", 404);
    }
    return this.formatFeeStructureResponse(feeStructure);
  }

  /**
   * UPDATE: Update FeeStructure details
   */
  async updateFeeStructure(id, tenantId, updateData) {
    const feeStructure = await feeStructureRepo.findById(id, tenantId);

    // Check if updating name and if it already exists
    if (updateData.name && updateData.name.trim() !== feeStructure.name) {
      const existingFeeStructure = await feeStructureRepo.findByName(
        updateData.name,
        tenantId
      );
      if (existingFeeStructure) {
        throw new AppError("FeeStructure with this name already exists for this tenant", 400);
      }
    }

    const updatedFeeStructure = await feeStructureRepo.update(id, tenantId, {
      name: updateData.name?.trim() || feeStructure.name,
      academicYearId: updateData.academicYearId || feeStructure.academicYearId,
      classId: updateData.classId || feeStructure.classId,
    });

    return this.formatFeeStructureResponse(updatedFeeStructure);
  }

  /**
   * DELETE: Delete a FeeStructure and its items
   */
  async deleteFeeStructure(id, tenantId) {
    const transaction = await sequelize.transaction();

    try {
      await feeStructureRepo.findById(id, tenantId); // Verify it exists first
      
      // Delete all associated items first
      await feeStructureItemRepo.deleteByFeeStructure(id, tenantId, { transaction });

      // Delete the FeeStructure
      await feeStructureRepo.delete(id, tenantId, { transaction });

      await transaction.commit();
      return { message: "FeeStructure deleted successfully" };
    } catch (error) {
      if (!transaction.finished) await transaction.rollback();
      throw error;
    }
  }

  /**
   * Helper: Format FeeStructure response
   */
  formatFeeStructureResponse(feeStructure) {
    return {
      id: feeStructure.id,
      name: feeStructure.name,
      academicYearId: feeStructure.academicYearId,
      classId: feeStructure.classId,
      tenantId: feeStructure.tenantId,
      items: feeStructure.items?.map((item) => ({
        id: item.id,
        feeStructureId: item.feeStructureId,
        feeHeadId: item.feeHeadId,
        feeHeadName: item.feeHead?.name,
        amountRaw: item.amountRaw,
        isOptional: item.isOptional,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      })) || [],
      createdAt: feeStructure.createdAt,
      updatedAt: feeStructure.updatedAt,
    };
  }
}
