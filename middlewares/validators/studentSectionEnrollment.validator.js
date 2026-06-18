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

// Helpers
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

// ENUM validation
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

const ensureNoTenantId = (body) => {
  if (body.tenantId !== undefined || body.tenant_id !== undefined) {
    throw new AppError("tenantId may not be provided in request body", 400);
  }
};

const ensureDisallowedField = (value, fieldName) => {
  if (value !== undefined) {
    throw new AppError(`${fieldName} cannot be modified`, 400);
  }
};

// Validate single enrollment payload
const validateSingleEnrollment = (payload, index = null) => {
  const prefix = index !== null ? `[${index}]` : "";
  
  if (!payload || typeof payload !== 'object') {
    throw new AppError(`${prefix} Enrollment must be an object`, 400);
  }

  ensureUuid(payload.studentId, `${prefix}studentId`);
  ensureUuid(payload.sectionId, `${prefix}sectionId`);
  ensureUuid(payload.academicYearId, `${prefix}academicYearId`);

  ensureOptionalString(payload.rollNumber, `${prefix}rollNumber`, { min: 1, max: 30 });
  ensureOptionalStatus(payload.enrollmentStatus, `${prefix}enrollmentStatus`);

  if (payload.isCurrent !== undefined) {
    ensureBoolean(payload.isCurrent, `${prefix}isCurrent`);
  }
};

// Create Enrollment Validator (handles both single and bulk)
export const createEnrollmentValidator = createValidator((req) => {
  const { body } = req;

  // Check if it's an array (bulk) or single object
  if (Array.isArray(body)) {
    if (body.length === 0) {
      throw new AppError("Enrollment array cannot be empty", 400);
    }
    
    // Validate each enrollment in array
    body.forEach((enrollment, index) => {
      if (enrollment.tenantId !== undefined || enrollment.tenant_id !== undefined) {
        throw new AppError(`[${index}] tenantId may not be provided in request body`, 400);
      }
      validateSingleEnrollment(enrollment, index);
    });
  } else {
    // Single enrollment
    ensureNoTenantId(body);
    validateSingleEnrollment(body);
  }
});



// Update Enrollment Validator
export const updateEnrollmentValidator = createValidator((req) => {
  const { body } = req;

  ensureNoTenantId(body);
  ensureDisallowedField(body.studentId, "studentId");
  ensureOptionalUuid(body.sectionId, "sectionId");
  ensureDisallowedField(body.academicYearId, "academicYearId");

  ensureOptionalString(body.rollNumber, "rollNumber", { min: 1, max: 30 });
  ensureOptionalStatus(body.enrollmentStatus, "enrollmentStatus");

  if (body.isCurrent !== undefined) {
    ensureBoolean(body.isCurrent, "isCurrent");
  }
});