import { AppError } from "../../utils/AppError.js";

// ─── Core validator wrapper (same as your example) ───
const createValidator = (validateFn) => (req, res, next) => {
  try {
    validateFn(req);
    next();
  } catch (error) {
    next(error);
  }
};

// ─── Helper functions ───
const ensureString = (value, fieldName, { min = 1, max = 255 } = {}) => {
  if (
    typeof value !== "string" ||
    value.trim().length < min ||
    value.trim().length > max
  ) {
    throw new AppError(`${fieldName} must be ${min}-${max} characters`, 400);
  }
};

const ensureOptionalString = (value, fieldName, options = {}) => {
  if (value === undefined || value === null) return;
  ensureString(value, fieldName, options);
};

const ensureNumber = (value, fieldName, { min = 0, max = Infinity } = {}) => {
  if (typeof value !== "number" || isNaN(value) || value < min || value > max) {
    throw new AppError(
      `${fieldName} must be a number between ${min} and ${max}`,
      400
    );
  }
};

const ensureOptionalNumber = (value, fieldName, options = {}) => {
  if (value === undefined || value === null) return;
  ensureNumber(value, fieldName, options);
};

const ensureBoolean = (value, fieldName) => {
  if (typeof value !== "boolean") {
    throw new AppError(`${fieldName} must be true or false`, 400);
  }
};

const ensureOptionalBoolean = (value, fieldName) => {
  if (value === undefined || value === null) return;
  ensureBoolean(value, fieldName);
};

// ─── CREATE validator ───
export const createProductValidator = createValidator((req) => {
  // required fields
  ensureString(req.body.name, "name", { min: 2, max: 255 });
  ensureNumber(req.body.price, "price", { min: 0, max: 999999 });

  // optional fields
  ensureOptionalString(req.body.description, "description", { min: 5, max: 2000 });
  ensureOptionalString(req.body.category, "category", { min: 2, max: 100 });
  ensureOptionalNumber(req.body.stock, "stock", { min: 0, max: 999999 });
  ensureOptionalBoolean(req.body.isActive, "isActive");
});

// ─── UPDATE validator ───
export const updateProductValidator = createValidator((req) => {
  const { body } = req;

  // all fields optional on update
  ensureOptionalString(body.name, "name", { min: 2, max: 255 });
  ensureOptionalNumber(body.price, "price", { min: 0, max: 999999 });
  ensureOptionalString(body.description, "description", { min: 5, max: 2000 });
  ensureOptionalString(body.category, "category", { min: 2, max: 100 });
  ensureOptionalNumber(body.stock, "stock", { min: 0, max: 999999 });
  ensureOptionalBoolean(body.isActive, "isActive");

  // make sure body is not empty on update
  const allowedFields = ["name", "price", "description", "category", "stock", "isActive"];
  const hasAtLeastOne = allowedFields.some((field) => body[field] !== undefined);
  if (!hasAtLeastOne) {
    throw new AppError("Provide at least one field to update", 400);
  }
});