import sequelize from "../../config/db.js";
import { StudentFeesLedgerRepository } from "../../repositories/FeeStructure/studentFeesLedger.repository.js";
import { FeeStructureRepository } from "../../repositories/FeeStructure/feeStructure.repository.js";
import { AppError } from "../../utils/AppError.js";
import { StudentSectionEnrollment, Section } from "../../models/index.js";

const ledgerRepo = new StudentFeesLedgerRepository();
const feeStructureRepo = new FeeStructureRepository();

export class StudentFeesLedgerService {
  // ─────────────────────────────────────────────────────────────────────────
  // Helpers
  // ─────────────────────────────────────────────────────────────────────────

  normalizeRecord(record) {
    return record?.get ? record.get({ plain: true }) : record;
  }

  /**
   * Shape a single ledger line for API responses.
   */
  formatLedgerLine(line) {
    const d = this.normalizeRecord(line);
    return {
      id: d.id,
      amountDueRaw: Number(d.amountDueRaw),
      amountPaidRaw: Number(d.amountPaidRaw),
      outstandingRaw: Number(d.amountDueRaw) - Number(d.amountPaidRaw),
      status: d.status,
      notes: d.notes,
      feeHead: d.feeHead
        ? { id: d.feeHead.id, name: d.feeHead.name, description: d.feeHead.description }
        : null,
      feeStructureItem: d.feeStructureItem
        ? { id: d.feeStructureItem.id, amountRaw: d.feeStructureItem.amountRaw, isOptional: d.feeStructureItem.isOptional }
        : null,
      academicYear: d.academicYear
        ? { id: d.academicYear.id, name: d.academicYear.name, isCurrent: d.academicYear.isCurrent }
        : null,
      createdAt: d.createdAt,
      updatedAt: d.updatedAt,
    };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Requirement A: Bulk Allocation
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Materializes all FeeStructureItems for every student enrolled in the
   * class associated with the given FeeStructure.
   *
   * Duplicate rows (already-allocated items per student) are silently skipped
   * thanks to ignoreDuplicates:true in the repository, so this endpoint is
   * safe to call more than once (e.g. after enrolling a new student).
   */
  async allocateStructureToClass(tenantId, feeStructureId) {
    // 1. Load the fee structure with its items
    const structure = await feeStructureRepo.findWithItems(feeStructureId, tenantId);
    if (!structure) {
      throw new AppError("Fee structure template not found.", 404);
    }

    const structureData = this.normalizeRecord(structure);

    if (!structureData.classId) {
      throw new AppError(
        "This fee structure has no associated class. Cannot perform bulk allocation.",
        400
      );
    }

    if (!structureData.items || structureData.items.length === 0) {
      throw new AppError(
        "Fee structure has no items configured. Please add fee items before allocating.",
        400
      );
    }

    // 2. Find all student enrollments in the class for the academic year.
    //    StudentSectionEnrollment → Section (classId), so we JOIN through Section.
    const enrollments = await StudentSectionEnrollment.findAll({
      where: { academicYearId: structureData.academicYearId, tenantId },
      include: [
        {
          association: "section",
          where: { classId: structureData.classId },
          attributes: ["id", "classId"],
          required: true,
        },
      ],
    });

    if (enrollments.length === 0) {
      return {
        message: "No active student enrollments found for this class and academic year.",
        allocated: 0,
        students: 0,
      };
    }

    // 3. Build the payload matrix: every student × every fee item
    const ledgerPayloads = [];
    for (const enrollment of enrollments) {
      for (const item of structureData.items) {
        ledgerPayloads.push({
          tenantId,
          studentId: enrollment.id,
          feeStructureItemId: item.id,
          feeHeadId: item.feeHeadId,
          academicYearId: structureData.academicYearId,
          amountDueRaw: item.amountRaw,
          amountPaidRaw: 0,
          status: "unpaid",
          notes: `Auto-allocated via fee structure: ${structureData.name}`,
        });
      }
    }

    // 4. Bulk insert under transaction (ignoreDuplicates skips already-allocated rows)
    const transaction = await sequelize.transaction();
    try {
      await ledgerRepo.bulkCreateLedger(ledgerPayloads, { transaction });
      await transaction.commit();
    } catch (error) {
      if (!transaction.finished) await transaction.rollback();
      throw error;
    }

    return {
      message: `Successfully allocated ${structureData.items.length} fee item(s) across ${enrollments.length} student(s).`,
      students: enrollments.length,
      itemsPerStudent: structureData.items.length,
      totalRowsAttempted: ledgerPayloads.length,
    };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Requirement B: Custom One-Off Charge
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Creates a standalone charge (fine, penalty, etc.) for a single student.
   * feeStructureItemId is explicitly null — no parent template relationship.
   */
  async createCustomCharge(tenantId, body) {
    const { studentId, feeHeadId, academicYearId, amountRaw, notes } = body;

    const entry = await ledgerRepo.create({
      tenantId,
      studentId,
      feeStructureItemId: null,
      feeHeadId,
      academicYearId,
      amountDueRaw: Math.abs(Number(amountRaw)),
      amountPaidRaw: 0,
      status: "unpaid",
      notes: notes || "Individual administrative custom charge.",
    });

    return this.formatLedgerLine(entry);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Requirement C: Waiver / Concession (Audit-Safe Credit Note)
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Writes a negative-amount credit note row.
   * The original debit row is NEVER modified — the balance is computed as
   * SUM(amountDueRaw) across all rows (positive debits + negative credits).
   * Status is immediately marked "paid" since this is an internal credit.
   */
  async applyWaiver(tenantId, body) {
    const { studentId, feeHeadId, academicYearId, amountToWaiveRaw, notes } = body;

    const entry = await ledgerRepo.create({
      tenantId,
      studentId,
      feeStructureItemId: null,
      feeHeadId,
      academicYearId,
      amountDueRaw: -Math.abs(Number(amountToWaiveRaw)),
      amountPaidRaw: 0,
      status: "paid",
      notes: notes || "Concession / waiver credit note.",
    });

    return this.formatLedgerLine(entry);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Requirement D: Student Account Statement
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Returns all ledger lines for a student and computes aggregate balance.
   * Waivers (negative amountDueRaw) are included in the SUM, naturally
   * reducing the outstanding balance without any special-case logic.
   */
  async getStudentStatement(tenantId, studentId, query) {
    const filters = {};
    if (query.academicYearId) filters.academicYearId = query.academicYearId;

    const lines = await ledgerRepo.findByStudent(studentId, tenantId, filters);

    let totalDueRaw = 0;
    let totalPaidRaw = 0;

    const formattedLines = lines.map((line) => {
      const d = this.normalizeRecord(line);
      totalDueRaw += Number(d.amountDueRaw);
      totalPaidRaw += Number(d.amountPaidRaw);
      return this.formatLedgerLine(line);
    });

    const outstandingDueRaw = totalDueRaw - totalPaidRaw;

    return {
      summary: {
        totalDebitedAmountRaw: totalDueRaw,
        totalCreditedAmountRaw: totalPaidRaw,
        outstandingDueAmountRaw: outstandingDueRaw,
        isCleared: outstandingDueRaw <= 0,
      },
      ledgerLines: formattedLines,
    };
  }
}
