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

// --- FeeHead Validators ---

export const createFeeHeadValidator = createValidator((req) => {
  const { name, description } = req.body;

  if (!name) throw new AppError("FeeHead name is required", 400);
  ensureString(name, "FeeHead name", { min: 2, max: 100 });
  ensureOptionalString(description, "Description", { min: 0, max: 500 });
});

export const updateFeeHeadValidator = createValidator((req) => {
  const { name, description } = req.body;

  if (name) {
    ensureString(name, "FeeHead name", { min: 2, max: 100 });
  }

  if (description !== undefined) {
    ensureOptionalString(description, "Description", { min: 0, max: 500 });
  }
});

export const feeHeadIdValidator = createValidator((req) => {
  const { id } = req.params;
  ensureUUID(id, "FeeHead ID");
});
