import { AppError } from "../../utils/AppError.js";

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

const ensureOptionalString = (value, fieldName, options = {}) => {
  if (value === undefined || value === null) return;
  ensureString(value, fieldName, options);
};

const ensureUUID = (value, fieldName) => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(value)) {
    throw new AppError(`${fieldName} must be a valid UUID`, 400);
  }
};

const ensureDate = (value, fieldName) => {
  const date = new Date(value);
  if (isNaN(date.getTime())) {
    throw new AppError(`${fieldName} must be a valid date`, 400);
  }
};

const ensureEnum = (value, fieldName, allowedValues) => {
  if (!allowedValues.includes(value)) {
    throw new AppError(`${fieldName} must be one of: ${allowedValues.join(", ")}`, 400);
  }
};

export const createStaffValidator = createValidator((req) => {
  const { body } = req;

  ensureUUID(body.userId, "userId");
  ensureString(body.employeeCode, "employeeCode", { min: 3, max: 50 });
  ensureEnum(body.staffType, "staffType", ["teaching", "non_teaching", "contractual", "visiting"]);
  ensureOptionalString(body.designation, "designation", { min: 2, max: 150 });
  ensureOptionalString(body.department, "department", { min: 2, max: 150 });
  ensureDate(body.joiningDate, "joiningDate");
  
  if (body.employmentStatus) {
    ensureEnum(body.employmentStatus, "employmentStatus", [
      "probation",
      "confirmed",
      "notice_period",
      "resigned",
      "terminated",
    ]);
  }
  
  ensureOptionalString(body.panNumber, "panNumber", { min: 10, max: 20 });
  ensureOptionalString(body.bankAccountNumber, "bankAccountNumber", { min: 8, max: 20 });
});

export const updateStaffValidator = createValidator((req) => {
  const { body } = req;

  if (body.employeeCode) {
    ensureString(body.employeeCode, "employeeCode", { min: 3, max: 50 });
  }

  if (body.staffType) {
    ensureEnum(body.staffType, "staffType", ["teaching", "non_teaching", "contractual", "visiting"]);
  }

  if (body.designation !== undefined) {
    ensureOptionalString(body.designation, "designation", { min: 2, max: 150 });
  }

  if (body.department !== undefined) {
    ensureOptionalString(body.department, "department", { min: 2, max: 150 });
  }

  if (body.joiningDate) {
    ensureDate(body.joiningDate, "joiningDate");
  }

  if (body.employmentStatus) {
    ensureEnum(body.employmentStatus, "employmentStatus", [
      "probation",
      "confirmed",
      "notice_period",
      "resigned",
      "terminated",
    ]);
  }

  if (body.panNumber !== undefined) {
    ensureOptionalString(body.panNumber, "panNumber", { min: 10, max: 20 });
  }

  if (body.bankAccountNumber !== undefined) {
    ensureOptionalString(body.bankAccountNumber, "bankAccountNumber", { min: 8, max: 20 });
  }
});
