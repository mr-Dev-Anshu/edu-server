import { AppError } from "../../utils/AppError.js";

/**
 * Subject Validators
 * Comprehensive validation for all subject-related operations
 */

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

// --- Helper Validation Functions ---

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
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(value)) {
    throw new AppError(`${fieldName} must be a valid UUID`, 400);
  }
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

const ensureInteger = (value, fieldName, { min = Number.MIN_SAFE_INTEGER, max = Number.MAX_SAFE_INTEGER } = {}) => {
  if (!Number.isInteger(value) || value < min || value > max) {
    throw new AppError(`${fieldName} must be an integer between ${min} and ${max}`, 400);
  }
};

const ensureOptionalInteger = (value, fieldName, options = {}) => {
  if (value === undefined || value === null) return;
  ensureInteger(value, fieldName, options);
};

const ensureDecimal = (value, fieldName, { min = 0, max = 999.99 } = {}) => {
  const num = parseFloat(value);
  if (isNaN(num) || num < min || num > max) {
    throw new AppError(`${fieldName} must be a decimal number between ${min} and ${max}`, 400);
  }
};

const ensureOptionalDecimal = (value, fieldName, options = {}) => {
  if (value === undefined || value === null) return;
  ensureDecimal(value, fieldName, options);
};

const ensureEnum = (value, fieldName, allowedValues) => {
  if (!allowedValues.includes(value)) {
    throw new AppError(`${fieldName} must be one of: ${allowedValues.join(", ")}`, 400);
  }
};

const ensureOptionalEnum = (value, fieldName, allowedValues) => {
  if (value === undefined || value === null) return;
  ensureEnum(value, fieldName, allowedValues);
};

// --- Exported Validators ---

/**
 * Validates Subject Creation
 * Validates all required and optional fields
 */
export const createSubjectValidator = createValidator((req) => {
  const { body } = req;

  // Required fields
  ensureUUID(body.classId, "classId");
  ensureString(body.name, "name", { min: 2, max: 150 });

  // Optional but validated fields
  ensureOptionalString(body.code, "code", { min: 1, max: 30 });

  // Subject classification
  if (body.subjectType) {
    ensureEnum(body.subjectType, "subjectType", ["theory", "practical", "co_curricular", "language"]);
  }

  // Boolean flags
  if (body.isElective !== undefined) ensureOptionalBoolean(body.isElective, "isElective");

  // Numeric fields
  if (body.weeklyPeriods !== undefined) {
    ensureOptionalInteger(body.weeklyPeriods, "weeklyPeriods", { min: 1, max: 30 });
  }
});

/**
 * Validates Subject Update
 * Only validates fields that are being updated
 */
export const updateSubjectValidator = createValidator((req) => {
  const { body } = req;

  // All fields are optional on update
  if (body.name !== undefined) {
    ensureString(body.name, "name", { min: 2, max: 150 });
  }

  if (body.code !== undefined) {
    ensureOptionalString(body.code, "code", { min: 1, max: 30 });
  }

  if (body.subjectType !== undefined) {
    ensureEnum(body.subjectType, "subjectType", ["theory", "practical", "co_curricular", "language"]);
  }

  if (body.isElective !== undefined) {
    ensureOptionalBoolean(body.isElective, "isElective");
  }

  if (body.weeklyPeriods !== undefined) {
    ensureOptionalInteger(body.weeklyPeriods, "weeklyPeriods", { min: 1, max: 30 });
  }
});

/**
 * Validates Subject ID parameter
 * Ensures ID is a valid UUID
 */
export const subjectIdValidator = createValidator((req) => {
  ensureUUID(req.params.id, "Subject ID");
});

/**
 * Validates Class ID parameter
 * Ensures ID is a valid UUID
 */
export const classIdValidator = createValidator((req) => {
  ensureUUID(req.params.classId, "Class ID");
});
