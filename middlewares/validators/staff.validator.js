import { AppError } from "../../utils/AppError.js";

/**
 * Higher-order function to create a middleware validator
 */
const createValidator = (validateFn) => (req, res, next) => {
  try {
    validateFn(req);
    next();
  } catch (error) {
    next(error);
  }
};

// --- Helper Functions for Clean Validation ---

const ensureString = (value, fieldName, { min = 1, max = 255 } = {}) => {
  if (typeof value !== "string" || value.trim().length < min || value.trim().length > max) {
    throw new AppError(`${fieldName} must be between ${min} and ${max} characters`, 400);
  }
};

const ensureOptionalString = (value, fieldName, options = {}) => {
  if (value === undefined || value === null || value === "") return;
  ensureString(value, fieldName, options);
};

const ensureDate = (value, fieldName) => {
  if (!value) throw new AppError(`${fieldName} is required`, 400);
  const date = new Date(value);
  if (isNaN(date.getTime())) {
    throw new AppError(`${fieldName} must be a valid date format`, 400);
  }
};

const ensureEnum = (value, fieldName, allowedValues) => {
  if (!allowedValues.includes(value)) {
    throw new AppError(
      `${fieldName} must be one of: ${allowedValues.join(", ")}`,
      400
    );
  }
};

const ensurePrice = (value, fieldName) => {
  if (value !== undefined && value !== null) {
    const num = parseFloat(value);
    if (isNaN(num) || num < 0) {
      throw new AppError(`${fieldName} must be a valid positive number`, 400);
    }
  }
};

// --- Exported Validators ---

/**
 * Validates Staff Creation (Includes User and Bank details)
 */
export const createStaffValidator = createValidator((req) => {
  const { body } = req;

  // 1. User Account Details (Required for creation)
  ensureString(body.email, "email", { min: 5, max: 100 });
  ensureString(body.password, "password", { min: 6, max: 50 });
  ensureString(body.firstName, "firstName", { min: 2, max: 50 });
  ensureOptionalString(body.lastName, "lastName", { min: 1, max: 50 });

  // 2. Staff Professional Details (Sync with PascalCase Model)
  ensureString(body.employeeCode, "employeeCode", { min: 3, max: 50 });
  ensureEnum(body.staffType, "staffType", ["Teacher", "Librarian", "AdmissionHead", "Other"]);
  
  ensureOptionalString(body.designation, "designation", { min: 2, max: 150 });
  ensureOptionalString(body.department, "department", { min: 2, max: 150 });
  ensureDate(body.joiningDate, "joiningDate");
  
  if (body.employmentStatus) {
    ensureEnum(body.employmentStatus, "employmentStatus", [
      "probation", "confirmed", "notice_period", "resigned", "terminated"
    ]);
  }

  // 3. Identity & Banking Details
  ensureOptionalString(body.panNumber, "panNumber", { min: 10, max: 10 });
  ensureOptionalString(body.bankName, "bankName", { min: 2, max: 150 });
  ensureOptionalString(body.bankBranch, "bankBranch", { min: 2, max: 150 });
  ensureOptionalString(body.bankAccountNumber, "bankAccountNumber", { min: 8, max: 50 });
  ensureOptionalString(body.accountHolderName, "accountHolderName", { min: 2, max: 150 });

  if (body.ifscCode) {
    const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
    if (!ifscRegex.test(body.ifscCode)) {
      throw new AppError("Invalid IFSC Code format (Expected: ABCD0123456)", 400);
    }
  }

  // 4. Payroll
  ensurePrice(body.basicSalary, "basicSalary");
});

/**
 * Validates Staff Updates (Everything is optional)
 */
export const updateStaffValidator = createValidator((req) => {
  const { body } = req;

  if (body.employeeCode) ensureString(body.employeeCode, "employeeCode", { min: 3, max: 50 });
  if (body.staffType) ensureEnum(body.staffType, "staffType", ["Teacher", "Librarian", "AdmissionHead", "Other"]);
  if (body.joiningDate) ensureDate(body.joiningDate, "joiningDate");
  if (body.employmentStatus) {
    ensureEnum(body.employmentStatus, "employmentStatus", [
      "probation", "confirmed", "notice_period", "resigned", "terminated"
    ]);
  }
  
  if (body.ifscCode) {
    const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
    if (!ifscRegex.test(body.ifscCode)) {
      throw new AppError("Invalid IFSC Code format", 400);
    }
  }

  ensurePrice(body.basicSalary, "basicSalary");
  ensureOptionalString(body.designation, "designation");
  ensureOptionalString(body.department, "department");
  ensureOptionalString(body.panNumber, "panNumber");
});

/**
 * Validates UUID for params
 */
export const staffIdValidator = createValidator((req) => {
  const { id } = req.params;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  if (!id || !uuidRegex.test(id)) {
    throw new AppError("Invalid or missing Staff ID", 400);
  }
});