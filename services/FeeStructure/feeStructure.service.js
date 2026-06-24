import { FeeStructureRepository } from "../../repositories/FeeStructure/feeStructure.repository.js";
import { FeeStructureItemRepository } from "../../repositories/FeeStructure/feeStructureItem.repository.js";
import { AppError } from "../../utils/AppError.js";
import sequelize from "../../config/db.js";

const feeStructureRepo = new FeeStructureRepository();
const feeStructureItemRepo = new FeeStructureItemRepository();

export class FeeStructureService {
  normalizeRecord(record) {
    return record?.get ? record.get({ plain: true }) : record;
  }

  /**
   * CREATE: Add a new FeeStructure with optional items
   */
  async createFeeStructure(tenantId, payload) {
    const { name, academicYearId, classId, items } = payload;

    // Check if FeeStructure with same name exists
    const existingFeeStructure = await feeStructureRepo.findByName(name, tenantId);
    if (existingFeeStructure) {
      throw new AppError("A fee structure with this name already exists. Please use a different name.", 400);
    }

    // Check if class already has a FeeStructure for this academic year
    if (classId && academicYearId) {
      const existingStructureForClassYear = await feeStructureRepo.findByClassAndAcademicYear( classId, academicYearId, tenantId );
      if (existingStructureForClassYear) {
        throw new AppError("This class already has a fee structure for this academic year. Please select a different class or academic year.", 400);
      }
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

      // Fetch structure with items
      const feeStructureWithItems = await feeStructureRepo.findWithItems(
        feeStructure.id,
        tenantId
      );
      return this.formatFeeStructureResponse(feeStructureWithItems);
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
    if (query.search) filters.search = query.search.trim();

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
        throw new AppError("A fee structure with this name already exists. Please use a different name.", 400);
      }
    }

    // Check if updating classId or academicYearId and if combination already exists
    const newClassId = updateData.classId || feeStructure.classId;
    const newAcademicYearId = updateData.academicYearId || feeStructure.academicYearId;
    
    if ((updateData.classId || updateData.academicYearId) && 
        (newClassId !== feeStructure.classId || newAcademicYearId !== feeStructure.academicYearId)) {
      const existingStructureForNewCombo = await feeStructureRepo.findByClassAndAcademicYearExcluding( newClassId, newAcademicYearId, tenantId, id );
      if (existingStructureForNewCombo) {
        throw new AppError("This class already has a fee structure for this academic year. Please select a different class or academic year.", 400);
      }
    }

    const transaction = await sequelize.transaction();
    try {
      const updatedFeeStructure = await feeStructureRepo.update(
        id,
        tenantId,
        {
          name: updateData.name?.trim() || feeStructure.name,
          academicYearId: updateData.academicYearId || feeStructure.academicYearId,
          classId: updateData.classId || feeStructure.classId,
        },
        { transaction }
      );

      if (Array.isArray(updateData.items)) {
        // Fetch current items from the database
        const currentItems = await feeStructureItemRepo.findByFeeStructureId(id, tenantId);

        // Map current items by feeHeadId for O(1) lookup
        const currentItemsMap = new Map(
          currentItems.map((item) => [item.feeHeadId, item])
        );

        const incomingItems = updateData.items;
        const incomingFeeHeadIds = new Set(incomingItems.map((item) => item.feeHeadId));

        const itemsToCreate = [];
        const itemsToUpdate = [];

        // Identify items to create or update
        for (const incomingItem of incomingItems) {
          const existingItem = currentItemsMap.get(incomingItem.feeHeadId);
          if (existingItem) {
            // Check if amountRaw or isOptional changed
            const amountChanged = Number(incomingItem.amountRaw) !== Number(existingItem.amountRaw);
            const optionalChanged = (incomingItem.isOptional || false) !== (existingItem.isOptional || false);

            if (amountChanged || optionalChanged) {
              itemsToUpdate.push({
                id: existingItem.id,
                amountRaw: incomingItem.amountRaw,
                isOptional: incomingItem.isOptional || false,
              });
            }
          } else {
            itemsToCreate.push({
              tenantId,
              feeStructureId: updatedFeeStructure.id,
              feeHeadId: incomingItem.feeHeadId,
              amountRaw: incomingItem.amountRaw,
              isOptional: incomingItem.isOptional || false,
            });
          }
        }

        // Identify items to delete (present in DB but not in incoming payload)
        const itemsToDeleteIds = [];
        for (const currentItem of currentItems) {
          if (!incomingFeeHeadIds.has(currentItem.feeHeadId)) {
            itemsToDeleteIds.push(currentItem.id);
          }
        }

        // Execute DB operations
        if (itemsToDeleteIds.length > 0) {
          // Hard delete the removed items to avoid unique key conflicts if added back later
          await feeStructureItemRepo.model.destroy({
            where: { id: itemsToDeleteIds, tenantId },
            force: true,
            transaction,
          });
        }

        if (itemsToCreate.length > 0) {
          // Hard-delete any existing records (active or soft-deleted) for these fee heads to prevent unique index conflicts
          const feeHeadIdsToCreate = itemsToCreate.map((item) => item.feeHeadId);
          await feeStructureItemRepo.model.destroy({
            where: {
              feeStructureId: updatedFeeStructure.id,
              feeHeadId: feeHeadIdsToCreate,
              tenantId,
            },
            force: true,
            paranoid: false,
            transaction,
          });

          await feeStructureItemRepo.bulkCreate(itemsToCreate, { transaction });
        }

        if (itemsToUpdate.length > 0) {
          for (const item of itemsToUpdate) {
            await feeStructureItemRepo.update(
              item.id,
              tenantId,
              { amountRaw: item.amountRaw, isOptional: item.isOptional },
              { transaction }
            );
          }
        }
      }

      await transaction.commit();

      const feeStructureWithItems = await feeStructureRepo.findWithItems(
        updatedFeeStructure.id,
        tenantId
      );
      return this.formatFeeStructureResponse(feeStructureWithItems);
    } catch (error) {
      if (!transaction.finished) await transaction.rollback();
      throw error;
    }
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
      return { message: "Fee structure has been deleted successfully" };
    } catch (error) {
      if (!transaction.finished) await transaction.rollback();
      throw error;
    }
  }

  /**
   * Helper: Format FeeStructure response
   */
  formatFeeStructureResponse(feeStructure) {
    const data = this.normalizeRecord(feeStructure);
    const items = Array.isArray(data.items) ? data.items : [];

    return {
      id: data.id,
      name: data.name,
      tenant: data.organization
        ? {
            id: data.organization.id,
            name: data.organization.name,
            organizationType: data.organization.organizationType,
            officialEmail: data.organization.officialEmail,
            subdomain: data.organization.subdomain,
          }
        : undefined,
      academicYear: data.academicYear
        ? {
            id: data.academicYear.id,
            name: data.academicYear.name,
            isCurrent: data.academicYear.isCurrent,
            startDate: data.academicYear.startDate,
            endDate: data.academicYear.endDate,
          }
        : undefined,
      class: data.class
        ? {
            id: data.class.id,
            name: data.class.name,
            numericLevel: data.class.numericLevel,
          }
        : undefined,
      items: items.map((item) => {
        const itemData = this.normalizeRecord(item);

        return {
          id: itemData.id,
          amountRaw: itemData.amountRaw,
          isOptional: itemData.isOptional,
          feeHead: itemData.feeHead
            ? {
                id: itemData.feeHead.id,
                name: itemData.feeHead.name,
                description: itemData.feeHead.description,
                createdAt: itemData.feeHead.createdAt,
                updatedAt: itemData.feeHead.updatedAt,
              }
            : undefined,
          createdAt: itemData.createdAt,
          updatedAt: itemData.updatedAt,
        };
      }),
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  }
}
