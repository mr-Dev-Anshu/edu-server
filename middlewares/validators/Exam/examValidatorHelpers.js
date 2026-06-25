import { AppError } from "../../../utils/AppError.js";

export const createValidator = (validateFn) => (req, res, next) => {
  try {
    validateFn(req);
    next();
  } catch (error) {
    next(error);
  }
};

// FIX — Warning #4: Added null/undefined guard before running regex to prevent runtime crash
export const ensureUUID = (value, fieldName) => {
  if (!value || typeof value !== "string") {
    throw new AppError(`${fieldName} is required and must be a string`, 400);
  }
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(value)) {
    throw new AppError(`${fieldName} must be a valid UUID`, 400);
  }
};

export const ensureString = (value, fieldName, { min = 1, max = 255 } = {}) => {
  if (typeof value !== "string" || value.trim().length < min || value.trim().length > max) {
    throw new AppError(`${fieldName} must be ${min}-${max} characters`, 400);
  }
};

export const ensureDate = (value, fieldName) => {
  if (isNaN(new Date(value).getTime())) {
    throw new AppError(`${fieldName} must be a valid date (YYYY-MM-DD)`, 400);
  }
};

export const ensureEnum = (value, fieldName, allowedValues) => {
  if (!allowedValues.includes(value)) {
    throw new AppError(`${fieldName} must be one of: ${allowedValues.join(", ")}`, 400);
  }
};

export const ensureNumber = (value, fieldName, { min = 0, max = Infinity } = {}) => {
  const num = Number(value);
  if (isNaN(num) || num < min || num > max) {
    throw new AppError(`${fieldName} must be a number between ${min} and ${max}`, 400);
  }
};

export const ensureBoolean = (value, fieldName) => {
  if (typeof value !== "boolean") {
    throw new AppError(`${fieldName} must be a boolean`, 400);
  }
};

export const ensureDecimal = (value, fieldName, { min = 0, max = 100 } = {}) => {
  const num = parseFloat(value);
  if (isNaN(num) || num < min || num > max) {
    throw new AppError(`${fieldName} must be a number between ${min} and ${max}`, 400);
  }
};