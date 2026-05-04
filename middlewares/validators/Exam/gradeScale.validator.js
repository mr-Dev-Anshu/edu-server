import { AppError } from "../../../utils/AppError.js";

const SCALE_TYPES = ["percentage", "gpa", "cgpa", "letter", "custom"];

const createValidator = (validateFn) => (req, res, next) => {
  try {
    validateFn(req);
    next();
  } catch (error) {
    next(error);
  }
};

const ensureString = (value, fieldName, { min = 1, max = 255 } = {}) => {
  if (typeof value !== "string" || value.trim().length < min || value.trim().length > max) {
    throw new AppError(`${fieldName} must be ${min}-${max} characters`, 400);
  }
};

const ensureEnum = (value, fieldName, allowedValues) => {
  if (!allowedValues.includes(value)) {
    throw new AppError(`${fieldName} must be one of: ${allowedValues.join(", ")}`, 400);
  }
};

const ensureBoolean = (value, fieldName) => {
  if (typeof value !== "boolean") {
    throw new AppError(`${fieldName} must be a boolean`, 400);
  }
};

export const createGradeScaleValidator = createValidator((req) => {
  const { body } = req;

  ensureString(body.name, "name", { min: 2, max: 150 });
  ensureEnum(body.scaleType, "scaleType", SCALE_TYPES);

  if (body.isDefault !== undefined) ensureBoolean(body.isDefault, "isDefault");
});

export const updateGradeScaleValidator = createValidator((req) => {
  const { body } = req;

  if (body.name !== undefined) ensureString(body.name, "name", { min: 2, max: 150 });
  if (body.scaleType !== undefined) ensureEnum(body.scaleType, "scaleType", SCALE_TYPES);
  if (body.isDefault !== undefined) ensureBoolean(body.isDefault, "isDefault");
});