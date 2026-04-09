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

const ensureUUID = (value, fieldName) => {
  if (typeof value !== "string" || !value.match(/^[0-9a-fA-F-]{36}$/)) {
    throw new AppError(`${fieldName} must be a valid UUID`, 400);
  }
};

const ensureNumber = (value, fieldName) => {
  if (typeof value !== "number" || isNaN(value)) {
    throw new AppError(`${fieldName} must be a valid number`, 400);
  }
};

// ✅ Create Validator
export const createSectionValidator = createValidator((req) => {
  const { body } = req;

  // Required fields
  ensureString(body.name, "name", { min: 1, max: 50 });
  ensureUUID(body.classId, "classId");
  ensureUUID(body.academicYearId, "academicYearId");

  // Optional fields
  if (body.capacity !== undefined) {
    ensureNumber(body.capacity, "capacity");
  }

  if (body.classTeacherId !== undefined) {
    ensureUUID(body.classTeacherId, "classTeacherId");
  }
});

// ✅ Update Validator
export const updateSectionValidator = createValidator((req) => {
  const { body } = req;

  if (body.name !== undefined) {
    ensureString(body.name, "name", { min: 1, max: 50 });
  }

  if (body.classId !== undefined) {
    ensureUUID(body.classId, "classId");
  }

  if (body.academicYearId !== undefined) {
    ensureUUID(body.academicYearId, "academicYearId");
  }

  if (body.capacity !== undefined) {
    ensureNumber(body.capacity, "capacity");
  }

  if (body.classTeacherId !== undefined) {
    ensureUUID(body.classTeacherId, "classTeacherId");
  }
});