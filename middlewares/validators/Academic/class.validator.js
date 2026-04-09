import { AppError } from "../../../utils/AppError.js";

const createValidator = (validateFn) => (req, res, next) => {
  try {
    validateFn(req);
    next();
  } catch (error) {
    next(error);
  }
};

// 🔹 Helpers
const ensureString = (value, fieldName, { min = 1, max = 255 } = {}) => {
  if (
    typeof value !== "string" ||
    value.trim().length < min ||
    value.trim().length > max
  ) {
    throw new AppError(`${fieldName} must be ${min}-${max} characters`, 400);
  }
};

const ensureNumber = (value, fieldName) => {
  if (typeof value !== "number" || isNaN(value)) {
    throw new AppError(`${fieldName} must be a valid number`, 400);
  }
};

// ✅ Create Validator
export const createClassValidator = createValidator((req) => {
  const { body } = req;

  // name required
  ensureString(body.name, "name", { min: 2, max: 50 });

  // numericLevel optional but if present validate
  if (body.numericLevel !== undefined) {
    ensureNumber(body.numericLevel, "numericLevel");
  }

  // description optional
  if (body.description !== undefined) {
    ensureString(body.description, "description", { min: 0, max: 500 });
  }
});

// ✅ Update Validator
export const updateClassValidator = createValidator((req) => {
  const { body } = req;

  if (body.name !== undefined) {
    ensureString(body.name, "name", { min: 2, max: 50 });
  }

  if (body.numericLevel !== undefined) {
    ensureNumber(body.numericLevel, "numericLevel");
  }

  if (body.description !== undefined) {
    ensureString(body.description, "description", { min: 0, max: 500 });
  }
});