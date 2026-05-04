import { AppError } from "../../../utils/AppError.js";

const EXAM_TYPES = ["unit_test", "mid_term", "half_yearly", "annual", "practical", "board", "internal", "other"];

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

const ensureDate = (value, fieldName) => {
  const date = new Date(value);
  if (isNaN(date.getTime())) {
    throw new AppError(`${fieldName} must be a valid date (YYYY-MM-DD)`, 400);
  }
};

const ensureEnum = (value, fieldName, allowedValues) => {
  if (!allowedValues.includes(value)) {
    throw new AppError(`${fieldName} must be one of: ${allowedValues.join(", ")}`, 400);
  }
};

const ensureNumber = (value, fieldName, { min = 0, max = Infinity } = {}) => {
  const num = Number(value);
  if (isNaN(num) || num < min || num > max) {
    throw new AppError(`${fieldName} must be a number between ${min} and ${max}`, 400);
  }
};

export const createExamGroupValidator = createValidator((req) => {
  const { body } = req;

  ensureUUID(body.academicYearId, "academicYearId");
  ensureString(body.name, "name", { min: 2, max: 150 });
  ensureEnum(body.examType, "examType", EXAM_TYPES);

  if (body.gradingSchemeId !== undefined && body.gradingSchemeId !== null) {
    ensureUUID(body.gradingSchemeId, "gradingSchemeId");
  }

  if (body.startDate !== undefined) ensureDate(body.startDate, "startDate");
  if (body.endDate !== undefined) ensureDate(body.endDate, "endDate");

  if (body.weightagePercent !== undefined) {
    ensureNumber(body.weightagePercent, "weightagePercent", { min: 0, max: 100 });
  }
});

export const updateExamGroupValidator = createValidator((req) => {
  const { body } = req;

  if (body.academicYearId !== undefined) ensureUUID(body.academicYearId, "academicYearId");
  if (body.name !== undefined) ensureString(body.name, "name", { min: 2, max: 150 });
  if (body.examType !== undefined) ensureEnum(body.examType, "examType", EXAM_TYPES);
  if (body.gradingSchemeId !== undefined && body.gradingSchemeId !== null) {
    ensureUUID(body.gradingSchemeId, "gradingSchemeId");
  }
  if (body.startDate !== undefined) ensureDate(body.startDate, "startDate");
  if (body.endDate !== undefined) ensureDate(body.endDate, "endDate");
  if (body.weightagePercent !== undefined) {
    ensureNumber(body.weightagePercent, "weightagePercent", { min: 0, max: 100 });
  }
});