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
    throw new AppError(`${fieldName} must be a valid UUID`, 400);
  }
};

const ensureString = (value, fieldName, { min = 1, max = 255 } = {}) => {
  if (typeof value !== "string" || value.trim().length < min || value.trim().length > max) {
    throw new AppError(`${fieldName} must be ${min}-${max} characters`, 400);
  }
};

const ensureDecimal = (value, fieldName, { min = 0, max = 100 } = {}) => {
  const num = parseFloat(value);
  if (isNaN(num) || num < min || num > max) {
    throw new AppError(`${fieldName} must be a number between ${min} and ${max}`, 400);
  }
};

export const createGradeScaleRuleValidator = createValidator((req) => {
  const { body } = req;

  ensureUUID(body.gradeScaleId, "gradeScaleId");
  ensureString(body.gradeLabel, "gradeLabel", { min: 1, max: 20 });
  ensureDecimal(body.minPercentage, "minPercentage", { min: 0, max: 100 });
  ensureDecimal(body.maxPercentage, "maxPercentage", { min: 0, max: 100 });

  if (parseFloat(body.minPercentage) >= parseFloat(body.maxPercentage)) {
    throw new AppError("minPercentage must be less than maxPercentage", 400);
  }

  if (body.gradePoint !== undefined && body.gradePoint !== null) {
    ensureDecimal(body.gradePoint, "gradePoint", { min: 0, max: 10 });
  }
});

export const updateGradeScaleRuleValidator = createValidator((req) => {
  const { body } = req;

  if (body.gradeScaleId !== undefined) ensureUUID(body.gradeScaleId, "gradeScaleId");
  if (body.gradeLabel !== undefined) ensureString(body.gradeLabel, "gradeLabel", { min: 1, max: 20 });
  if (body.minPercentage !== undefined) ensureDecimal(body.minPercentage, "minPercentage", { min: 0, max: 100 });
  if (body.maxPercentage !== undefined) ensureDecimal(body.maxPercentage, "maxPercentage", { min: 0, max: 100 });

  if (body.minPercentage !== undefined && body.maxPercentage !== undefined) {
    if (parseFloat(body.minPercentage) >= parseFloat(body.maxPercentage)) {
      throw new AppError("minPercentage must be less than maxPercentage", 400);
    }
  }

  if (body.gradePoint !== undefined && body.gradePoint !== null) {
    ensureDecimal(body.gradePoint, "gradePoint", { min: 0, max: 10 });
  }
});