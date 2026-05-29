import { Op } from "sequelize";
import { StudentFeesLedger } from "../../models/FeeStructure/StudentFeesLedger.js";
import { BaseRepository } from "../base.repository.js";

// ─── Reusable include fragments ───────────────────────────────────────────────

const FEE_HEAD_INCLUDE = {
  association: "feeHead",
  attributes: ["id", "name", "description"],
};

const FEE_STRUCTURE_ITEM_INCLUDE = {
  association: "feeStructureItem",
  attributes: ["id", "amountRaw", "isOptional"],
};

const ACADEMIC_YEAR_INCLUDE = {
  association: "academicYear",
  attributes: ["id", "name", "isCurrent", "startDate", "endDate"],
};

// ─── Repository ───────────────────────────────────────────────────────────────

export class StudentFeesLedgerRepository extends BaseRepository {
  constructor() {
    super(StudentFeesLedger);
  }

  /**
   * Bulk-insert ledger rows.
   * ignoreDuplicates = true silently skips rows that violate the unique partial index,
   * so re-running bulk allocation after adding a new student is safe.
   */
  async bulkCreateLedger(payloads, options = {}) {
    return await this.model.bulkCreate(payloads, {
      ignoreDuplicates: true,
      ...options,
    });
  }

  /**
   * Return all ledger lines for a student, optionally filtered by academic year.
   */
  async findByStudent(studentId, tenantId, filters = {}) {
    const where = { studentId, tenantId };
    if (filters.academicYearId) where.academicYearId = filters.academicYearId;

    return await this.model.findAll({
      where,
      include: [FEE_HEAD_INCLUDE, FEE_STRUCTURE_ITEM_INCLUDE, ACADEMIC_YEAR_INCLUDE],
      order: [["createdAt", "ASC"]],
    });
  }

  /**
   * Check whether specific fee-structure items have already been allocated
   * to a student (used for duplicate detection before bulkCreate when needed).
   */
  async findExistingAllocations(feeStructureItemIds, studentId, tenantId) {
    if (!feeStructureItemIds?.length) return [];
    return await this.model.findAll({
      where: {
        studentId,
        tenantId,
        feeStructureItemId: { [Op.in]: feeStructureItemIds },
      },
      attributes: ["feeStructureItemId"],
    });
  }
}
