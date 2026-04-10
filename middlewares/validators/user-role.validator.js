import { AppError } from "../../utils/AppError.js";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/;

const createValidator = (validateFn) => (req, res, next) => {
  try {
    validateFn(req);
    next();
  } catch (error) {
    next(error);
  }
};

const ensureUuid = (value, fieldName) => {
  if (typeof value !== "string" || !UUID_REGEX.test(value.trim())) {
    throw new AppError(`${fieldName} must be a valid UUID`, 400);
  }
};

const ensureOptionalUuid = (value, fieldName) => {
  if (value === undefined || value === null) return;
  ensureUuid(value, fieldName);
};

const ensureArray = (value, fieldName, itemValidator = null) => {
  if (!Array.isArray(value)) {
    throw new AppError(`${fieldName} must be an array`, 400);
  }

  if (itemValidator && value.length > 0) {
    for (const item of value) {
      itemValidator(item, fieldName);
    }
  }
};

const ensureNonEmptyArray = (value, fieldName, itemValidator = null) => {
  if (!Array.isArray(value) || value.length === 0) {
    throw new AppError(`${fieldName} must be a non-empty array`, 400);
  }

  if (itemValidator) {
    for (const item of value) {
      itemValidator(item, fieldName);
    }
  }
};

const ensureValidDate = (value, fieldName) => {
  if (typeof value !== "string" || !ISO_DATE_REGEX.test(value)) {
    throw new AppError(`${fieldName} must be a valid ISO 8601 date string`, 400);
  }

  const date = new Date(value);
  if (isNaN(date.getTime())) {
    throw new AppError(`${fieldName} is not a valid date`, 400);
  }

  if (date <= new Date()) {
    throw new AppError(`${fieldName} must be a future date`, 400);
  }
};

export const assignRoleValidator = createValidator((req) => {
  const { body } = req;

  if (body.userId === undefined) {
    throw new AppError("userId is required", 400);
  }
  ensureUuid(body.userId, "userId");

  if (body.roleId === undefined) {
    throw new AppError("roleId is required", 400);
  }
  ensureUuid(body.roleId, "roleId");

  ensureOptionalUuid(body.academicYearId, "academicYearId");
  ensureOptionalUuid(body.assignedById, "assignedById");

  if (body.tenantId === undefined) {
    throw new AppError("tenantId is required", 400);
  }
  ensureUuid(body.tenantId, "tenantId");
});

export const assignMultipleRolesValidator = createValidator((req) => {
  const { body } = req;

  if (body.userId === undefined) {
    throw new AppError("userId is required", 400);
  }
  ensureUuid(body.userId, "userId");

  if (body.roleIds === undefined) {
    throw new AppError("roleIds is required", 400);
  }
  ensureNonEmptyArray(body.roleIds, "roleIds", ensureUuid);

  ensureOptionalUuid(body.academicYearId, "academicYearId");
  ensureOptionalUuid(body.assignedById, "assignedById");

  if (body.tenantId === undefined) {
    throw new AppError("tenantId is required", 400);
  }
  ensureUuid(body.tenantId, "tenantId");
});

export const revokeRoleValidator = createValidator((req) => {
  const { body } = req;

  if (body.userId === undefined) {
    throw new AppError("userId is required", 400);
  }
  ensureUuid(body.userId, "userId");

  if (body.roleId === undefined) {
    throw new AppError("roleId is required", 400);
  }
  ensureUuid(body.roleId, "roleId");

  ensureOptionalUuid(body.academicYearId, "academicYearId");

  if (body.tenantId === undefined) {
    throw new AppError("tenantId is required", 400);
  }
  ensureUuid(body.tenantId, "tenantId");
});

export const revokeMultipleRolesValidator = createValidator((req) => {
  const { body } = req;

  if (body.userId === undefined) {
    throw new AppError("userId is required", 400);
  }
  ensureUuid(body.userId, "userId");

  if (body.roleIds === undefined) {
    throw new AppError("roleIds is required", 400);
  }
  ensureNonEmptyArray(body.roleIds, "roleIds", ensureUuid);

  if (body.tenantId === undefined) {
    throw new AppError("tenantId is required", 400);
  }
  ensureUuid(body.tenantId, "tenantId");
});

export const updateRoleExpiryValidator = createValidator((req) => {
  const { body } = req;

  if (body.expiresAt === undefined) {
    throw new AppError("expiresAt is required", 400);
  }

  ensureValidDate(body.expiresAt, "expiresAt");
});
