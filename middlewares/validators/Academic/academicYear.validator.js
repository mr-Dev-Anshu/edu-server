import { AppError } from "../../../utils/AppError.js";

const createValidator = (validateFn) => (req, res, next) => {
  try {
    validateFn(req);
    next();
  } catch (error) {
    next(error);
  }
};

const ensureUUID = (value, fieldName) => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(value)) {
    throw new AppError(`${fieldName} must be a valid UUID (v1-v5)`, 400);
  }
};

const ensureString = (value, fieldName, { min = 1, max = 255 } = {}) => {
  if (typeof value !== "string" || value.trim().length < min || value.trim().length > max) {
    throw new AppError(`${fieldName} must be ${min}-${max} characters`, 400);
  }
};

const ensureDate = (value, fieldName) => {
  const date = new Date(value);
  if (isNaN(date.getTime())) {
    throw new AppError(`${fieldName} must be a valid date (YYYY-MM-DD)`, 400);
  }
};

const ensureBoolean = (value, fieldName) => {
  if (typeof value !== "boolean") {
    throw new AppError(`${fieldName} must be a boolean`, 400);
  }
};

export const createAcademicYearValidator = createValidator((req) => {
  const { body } = req;

  ensureString(body.name, "name", { min: 2, max: 20 });
  ensureDate(body.startDate, "startDate");
  ensureDate(body.endDate, "endDate");

  if (body.isCurrent !== undefined) {
    ensureBoolean(body.isCurrent, "isCurrent");
  }
});

export const updateAcademicYearValidator = createValidator((req) => {
  const { body } = req;

  if (body.name !== undefined) {
    ensureString(body.name, "name", { min: 2, max: 20 });
  }

  if (body.startDate !== undefined) {
    ensureDate(body.startDate, "startDate");
  }

  if (body.endDate !== undefined) {
    ensureDate(body.endDate, "endDate");
  }

  if (body.isCurrent !== undefined) {
    ensureBoolean(body.isCurrent, "isCurrent");
  }

  if (body.isLocked !== undefined) {
    ensureBoolean(body.isLocked, "isLocked");
  }
});
