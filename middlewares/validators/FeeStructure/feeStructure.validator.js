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

const ensureString = (value, fieldName, { min = 1, max = 255 } = {}) => {
  if (typeof value !== "string" || value.trim().length < min || value.trim().length > max) {
    throw new AppError(`${fieldName} must be between ${min} and ${max} characters`, 400);
  }
};

const ensureOptionalString = (value, fieldName, options = {}) => {
  if (value === undefined || value === null || value === "") return;
  ensureString(value, fieldName, options);
};

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

const ensureOptionalNumber = (value, fieldName) => {
  if (value === undefined || value === null) return;
  ensureNumber(value, fieldName);
};

const ensureBoolean = (value, fieldName) => {
  if (typeof value !== "boolean") {
    throw new AppError(`${fieldName} must be a boolean`, 400);
  }
};

const ensureOptionalBoolean = (value, fieldName) => {
  if (value === undefined || value === null) return;
  ensureBoolean(value, fieldName);
};

const ensureArray = (value, fieldName) => {
  if (!Array.isArray(value)) {
    throw new AppError(`${fieldName} must be an array`, 400);
  }
};

const ensureOptionalArray = (value, fieldName) => {
  if (value === undefined || value === null) return;
  ensureArray(value, fieldName);
};

const validateFeeStructureItems = (items) => {
  if (items === undefined || items === null) return;

  ensureOptionalArray(items, "Items");
  if (Array.isArray(items) && items.length > 0) {
    const seenFeeHeads = new Set();
    items.forEach((item, index) => {
      if (!item.feeHeadId) {
        throw new AppError(`Item ${index}: FeeHead ID is required`, 400);
      }
      ensureUUID(item.feeHeadId, `Item ${index}: FeeHead ID`);

      if (seenFeeHeads.has(item.feeHeadId)) {
        throw new AppError("Duplicate fee head selected in the fee structure items.", 400);
      }
      seenFeeHeads.add(item.feeHeadId);

      if (item.amountRaw === undefined) {
        throw new AppError(`Item ${index}: Amount is required`, 400);
      }
      ensureNumber(item.amountRaw, `Item ${index}: Amount`);

      if (item.isOptional !== undefined) {
        ensureBoolean(item.isOptional, `Item ${index}: isOptional`);
      }
    });
  }
};

// --- FeeStructure Validators ---

export const createFeeStructureValidator = createValidator((req) => {
  const { name, academicYearId, classId, items } = req.body;

  // Required fields
  if (!name) throw new AppError("FeeStructure name is required", 400);
  ensureString(name, "FeeStructure name", { min: 2, max: 100 });

  if (!academicYearId) throw new AppError("Academic year ID is required", 400);
  ensureUUID(academicYearId, "Academic year ID");

  if (!classId) throw new AppError("Class ID is required", 400);
  ensureUUID(classId, "Class ID");

  validateFeeStructureItems(items);
});

export const updateFeeStructureValidator = createValidator((req) => {
  const { name, academicYearId, classId, items } = req.body;

  if (name) {
    ensureString(name, "FeeStructure name", { min: 2, max: 100 });
  }

  if (academicYearId) {
    ensureUUID(academicYearId, "Academic year ID");
  }

  if (classId) {
    ensureUUID(classId, "Class ID");
  }

  validateFeeStructureItems(items);
});

export const feeStructureIdValidator = createValidator((req) => {
  const { id } = req.params;
  ensureUUID(id, "FeeStructure ID");
});
