import { AppError } from "../../utils/AppError.js";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const createValidator = (validateFn) => (req, res, next) => {
  try {
    validateFn(req);
    next();
  } catch (error) {
    next(error);
  }
};

// 🔹 Helpers
const ensureUuid = (value, fieldName) => {
  if (typeof value !== "string" || !UUID_REGEX.test(value.trim())) {
    throw new AppError(`${fieldName} must be a valid UUID`, 400);
  }
};

const ensureOptionalUuid = (value, fieldName) => {
  if (value === undefined || value === null) return;
  ensureUuid(value, fieldName);
};

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

const ensureBoolean = (value, fieldName) => {
  if (typeof value !== "boolean") {
    throw new AppError(`${fieldName} must be a boolean`, 400);
  }
};

// 🔥 ENUM validation
const VALID_STATUS = ["regular", "repeater", "promoted", "detained"];

const ensureStatus = (value, fieldName) => {
  if (!VALID_STATUS.includes(value)) {
    throw new AppError(
      `${fieldName} must be one of: ${VALID_STATUS.join(", ")}`,
      400
    );
  }
};

const ensureOptionalStatus = (value, fieldName) => {
  if (value === undefined || value === null) return;
  ensureStatus(value, fieldName);
};



// ✅ Create Enrollment Validator
export const createEnrollmentValidator = createValidator((req) => {
  const { body } = req;

  // Required fields
  ensureUuid(body.studentId, "studentId");
  ensureUuid(body.sectionId, "sectionId");
  ensureUuid(body.academicYearId, "academicYearId");

  // Optional
  ensureOptionalString(body.rollNumber, "rollNumber", { min: 1, max: 30 });
  ensureOptionalStatus(body.enrollmentStatus, "enrollmentStatus");

  if (body.isCurrent !== undefined) {
    ensureBoolean(body.isCurrent, "isCurrent");
  }
});



// ✅ Update Enrollment Validator
export const updateEnrollmentValidator = createValidator((req) => {
  const { body } = req;

  // Optional fields only
  ensureOptionalUuid(body.studentId, "studentId");
  ensureOptionalUuid(body.sectionId, "sectionId");
  ensureOptionalUuid(body.academicYearId, "academicYearId");

  ensureOptionalString(body.rollNumber, "rollNumber", { min: 1, max: 30 });
  ensureOptionalStatus(body.enrollmentStatus, "enrollmentStatus");

  if (body.isCurrent !== undefined) {
    ensureBoolean(body.isCurrent, "isCurrent");
  }
});