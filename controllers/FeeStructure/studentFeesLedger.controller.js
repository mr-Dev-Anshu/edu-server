import { StudentFeesLedgerService } from "../../services/FeeStructure/studentFeesLedger.service.js";
import { catchAsync } from "../../utils/catchAsync.js";

const ledgerService = new StudentFeesLedgerService();

export class StudentFeesLedgerController {
  /**
   * POST /api/v1/fees-ledger/allocate-bulk
   * Requirement A: Bulk-allocate a fee structure template to all students in a class.
   */
  allocateStructureToClass = catchAsync(async (req, res) => {
    const { feeStructureId } = req.body;
    const result = await ledgerService.allocateStructureToClass(req.tenantId, feeStructureId);
    res.status(201).json({ success: true, ...result });
  });

  /**
   * POST /api/v1/fees-ledger/custom-charge
   * Requirement B: Issue a custom one-off charge/fine for a specific student.
   */
  createCustomCharge = catchAsync(async (req, res) => {
    const data = await ledgerService.createCustomCharge(req.tenantId, req.body);
    res.status(201).json({ success: true, data });
  });

  /**
   * POST /api/v1/fees-ledger/waiver
   * Requirement C: Apply an audit-safe waiver/concession as a credit note.
   */
  applyWaiver = catchAsync(async (req, res) => {
    const data = await ledgerService.applyWaiver(req.tenantId, req.body);
    res.status(201).json({ success: true, data });
  });

  /**
   * GET /api/v1/fees-ledger/student/:studentId/statement
   * Requirement D: Retrieve full ledger statement and computed balance for a student.
   * Query params: ?academicYearId=<uuid>  (optional filter)
   */
  getStudentStatement = catchAsync(async (req, res) => {
    const { studentId } = req.params;
    const result = await ledgerService.getStudentStatement(req.tenantId, studentId, req.query);
    res.status(200).json({ success: true, ...result });
  });
}
