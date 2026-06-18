import { AppError } from "../../../../utils/AppError.js";

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
    throw new AppError(`${fieldName} must be between ${min} and ${max} characters`, 400);
  }
};

const ensureEnum = (value, fieldName, allowedValues) => {
  if (!allowedValues.includes(value)) {
    throw new AppError(`${fieldName} must be one of: ${allowedValues.join(", ")}`, 400);
  }
};

const ensureUUID = (value, fieldName) => {
  if (!value) throw new AppError(`${fieldName} is required`, 400);
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(value)) {
    throw new AppError(`Invalid ${fieldName} format`, 400);
  }
};

export const createSubjectValidator = createValidator((req) => {
  const { body } = req;
  ensureString(body.name, "name", { min: 2, max: 150 });
  if (body.type) {
    ensureEnum(body.type, "type", ["theory", "practical", "both"]);
  }
});

export const updateSubjectValidator = createValidator((req) => {
  const { body } = req;

  if (body.name) {
    ensureString(body.name, "name", { min: 2, max: 150 });
  }

  if (body.type) {
    ensureEnum(body.type, "type", ["theory", "practical", "both"]);
  }

  if (Object.keys(body).length === 0) {
    throw new AppError("At least one field is required to update", 400);
  }
});

export const subjectIdValidator = createValidator((req) => {
  // Accept both :id (used in subject-master routes) and :subjectId (used when referenced from class-subject routes)
  const id = req.params.id || req.params.subjectId || req.params.subject_id;
  ensureUUID(id, "Subject ID");
});
