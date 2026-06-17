import { AppError } from "../../../utils/AppError.js";

// ─── HOF: wraps a sync validate function into Express middleware ──────────────
const createValidator = (validateFn) => (req, res, next) => {
  try {
    validateFn(req);
    next();
  } catch (error) {
    next(error);
  }
};

// ─── Reusable helpers ─────────────────────────────────────────────────────────

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const ensureUUID = (value, fieldName) => {
  if (!value || !UUID_REGEX.test(value)) {
    throw new AppError(`${fieldName} must be a valid UUID.`, 400);
  }
};

/**
 * Validates a raw currency amount (integer in paise/cents, max 9 digits).
 * Must be > 0. The sign (positive/negative) is applied by the service layer.
 */
const ensurePositiveAmount = (value, fieldName) => {
  const num = Number(value);
  if (!Number.isInteger(num) || num <= 0 || num > 999_999_999) {
    throw new AppError(
      `${fieldName} must be a positive integer in lowest currency units (paise/cents, max 999999999).`,
      400
    );
  }
};

// ─── Validators ───────────────────────────────────────────────────────────────

/**
 * POST /allocate-bulk
 * Body: { feeStructureId }
 */
export const allocateBulkValidator = createValidator((req) => {
  const { feeStructureId } = req.body;
  if (!feeStructureId) throw new AppError("feeStructureId is required.", 400);
  ensureUUID(feeStructureId, "feeStructureId");
});

/**
 * POST /custom-charge
 * Body: { studentId, feeHeadId, academicYearId, amountRaw, notes? }
 */
export const customChargeValidator = createValidator((req) => {
  const { studentId, feeHeadId, academicYearId, amountRaw } = req.body;

  if (!studentId) throw new AppError("studentId is required.", 400);
  ensureUUID(studentId, "studentId");

  if (!feeHeadId) throw new AppError("feeHeadId is required.", 400);
  ensureUUID(feeHeadId, "feeHeadId");

  if (!academicYearId) throw new AppError("academicYearId is required.", 400);
  ensureUUID(academicYearId, "academicYearId");

  if (amountRaw === undefined || amountRaw === null)
    throw new AppError("amountRaw is required.", 400);
  ensurePositiveAmount(amountRaw, "amountRaw");
});

/**
 * POST /waiver
 * Body: { studentId, feeHeadId, academicYearId, amountToWaiveRaw, notes? }
 */
export const waiverValidator = createValidator((req) => {
  const { studentId, feeHeadId, academicYearId, amountToWaiveRaw } = req.body;

  if (!studentId) throw new AppError("studentId is required.", 400);
  ensureUUID(studentId, "studentId");

  if (!feeHeadId) throw new AppError("feeHeadId is required.", 400);
  ensureUUID(feeHeadId, "feeHeadId");

  if (!academicYearId) throw new AppError("academicYearId is required.", 400);
  ensureUUID(academicYearId, "academicYearId");

  if (amountToWaiveRaw === undefined || amountToWaiveRaw === null)
    throw new AppError("amountToWaiveRaw is required.", 400);
  ensurePositiveAmount(amountToWaiveRaw, "amountToWaiveRaw");
});

/**
 * GET /student/:studentId/statement
 * Params: { studentId }
 */
export const studentIdParamValidator = createValidator((req) => {
  const { studentId } = req.params;
  if (!studentId) throw new AppError("studentId param is required.", 400);
  ensureUUID(studentId, "studentId");
});
