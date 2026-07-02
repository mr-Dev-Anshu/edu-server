import { AppError } from "../../../utils/AppError.js";

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

const ensureOptionalEnum = (value, fieldName, allowedValues) => {
  if (value === undefined || value === null || value === "") return;
  if (!allowedValues.includes(value)) {
    throw new AppError(
      `${fieldName} must be one of: ${allowedValues.join(", ")}`,
      400
    );
  }
};

export const createDriverValidator = createValidator((req) => {
  const { body } = req;
  
  ensureString(body.firstName, "firstName", { min: 2, max: 100 });
  ensureOptionalString(body.lastName, "lastName", { min: 1, max: 100 });
  ensureString(body.phone, "phone", { min: 5, max: 20 });
  ensureString(body.licenseNumber, "licenseNumber", { min: 2, max: 50 });
  ensureDate(body.licenseExpiryDate, "licenseExpiryDate");
  
  ensureOptionalEnum(body.bloodGroup, "bloodGroup", ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]);
  ensureOptionalEnum(body.status, "status", ["active", "inactive"]);
});

export const updateDriverValidator = createValidator((req) => {
  const { body } = req;
  
  ensureOptionalString(body.firstName, "firstName", { min: 2, max: 100 });
  ensureOptionalString(body.lastName, "lastName", { min: 1, max: 100 });
  ensureOptionalString(body.phone, "phone", { min: 5, max: 20 });
  ensureOptionalString(body.licenseNumber, "licenseNumber", { min: 2, max: 50 });
  if (body.licenseExpiryDate) ensureDate(body.licenseExpiryDate, "licenseExpiryDate");
  
  ensureOptionalEnum(body.bloodGroup, "bloodGroup", ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]);
  ensureOptionalEnum(body.status, "status", ["active", "inactive"]);
});

export const driverIdValidator = createValidator((req) => {
  const { id } = req.params;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  if (!id || !uuidRegex.test(id)) {
    throw new AppError("Invalid or missing Driver ID", 400);
  }
});
