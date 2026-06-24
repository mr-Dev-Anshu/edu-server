import { AppError } from "../../../utils/AppError.js";

/**
 * Higher-order function to create a middleware validator
 */
const createValidator = (validateFn) => (req, res, next) => {
  try {
    validateFn(req);
    next();
  } catch (error) {
    next(error);
  }
};

// --- Helper Functions for Clean Validation ---

const ensureUUID = (value, fieldName) => {
  const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!UUID_REGEX.test(value)) {
    throw new AppError(`${fieldName} must be a valid UUID`, 400);
  }
};

const ensureNumber = (value, fieldName) => {
  const num = parseInt(value);
  if (isNaN(num) || num < 0 || num > 999999999) {
    throw new AppError(`${fieldName} must be valid positive amount (in paise, max 9999999.99)`, 400);
  }
};

const ensureBoolean = (value, fieldName) => {
  if (typeof value !== "boolean") {
    throw new AppError(`${fieldName} must be a boolean`, 400);
  }
};

// --- FeeStructureItem Validators ---

export const createFeeStructureItemValidator = createValidator((req) => {
  const { feeStructureId, feeHeadId, amountRaw, isOptional } = req.body;

  // Required fields
  if (!feeStructureId) throw new AppError("FeeStructure ID is required", 400);
  ensureUUID(feeStructureId, "FeeStructure ID");

  if (!feeHeadId) throw new AppError("FeeHead ID is required", 400);
  ensureUUID(feeHeadId, "FeeHead ID");

  if (amountRaw === undefined) throw new AppError("Amount is required", 400);
  ensureNumber(amountRaw, "Amount");

  // Optional fields
  if (isOptional !== undefined) {
    ensureBoolean(isOptional, "isOptional");
  }
});

export const updateFeeStructureItemValidator = createValidator((req) => {
  const { amountRaw, isOptional } = req.body;

  if (amountRaw !== undefined) {
    ensureNumber(amountRaw, "Amount");
  }

  if (isOptional !== undefined) {
    ensureBoolean(isOptional, "isOptional");
  }
});

export const feeStructureItemIdValidator = createValidator((req) => {
  const { id } = req.params;
  ensureUUID(id, "FeeStructureItem ID");
});

export const feeStructureIdValidator = createValidator((req) => {
  const { feeStructureId } = req.params;
  ensureUUID(feeStructureId, "FeeStructure ID");
});
