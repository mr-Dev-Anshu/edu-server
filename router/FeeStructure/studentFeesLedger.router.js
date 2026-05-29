import express from "express";
import { StudentFeesLedgerController } from "../../controllers/FeeStructure/studentFeesLedger.controller.js";
import {
  allocateBulkValidator,
  customChargeValidator,
  waiverValidator,
  studentIdParamValidator,
} from "../../middlewares/validators/FeeStructure/studentFeesLedger.validator.js";
import { identifyUser, checkPermission } from "../../middlewares/security/index.js";

const router = express.Router();
const ctrl = new StudentFeesLedgerController();

/**
 * POST /api/v1/fees-ledger/allocate-bulk
 * Bulk-materializes a fee structure template for all students in a class.
 */
router.post(
  "/allocate-bulk",
  identifyUser,
  checkPermission("create:fees-ledger"),
  allocateBulkValidator,
  ctrl.allocateStructureToClass
);

/**
 * POST /api/v1/fees-ledger/custom-charge
 * Issues a one-off custom charge (fine/penalty) for a specific student.
 */
router.post(
  "/custom-charge",
  identifyUser,
  checkPermission("create:fees-ledger"),
  customChargeValidator,
  ctrl.createCustomCharge
);

/**
 * POST /api/v1/fees-ledger/waiver
 * Applies an audit-safe waiver/concession as a negative credit note entry.
 */
router.post(
  "/waiver",
  identifyUser,
  checkPermission("create:fees-ledger"),
  waiverValidator,
  ctrl.applyWaiver
);

/**
 * GET /api/v1/fees-ledger/student/:studentId/statement
 * Returns the full ledger statement + computed balance summary for a student.
 * Optional query: ?academicYearId=<uuid>
 */
router.get(
  "/student/:studentId/statement",
  identifyUser,
  studentIdParamValidator,
  ctrl.getStudentStatement
);

export default router;
