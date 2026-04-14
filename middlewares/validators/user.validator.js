import { AppError } from "../../utils/AppError.js";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USER_TYPES = ["super_admin", "org_admin", "staff", "teacher", "student", "parent"];
const USER_STATUSES = ["active", "inactive", "suspended", "pending_verification"];

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

const ensureEmail = (value, fieldName) => {
  if (typeof value !== "string" || !EMAIL_REGEX.test(value.trim())) {
    throw new AppError(`${fieldName} must be a valid email address`, 400);
  }
};

const ensureUuid = (value, fieldName) => {
  if (typeof value !== "string" || !UUID_REGEX.test(value.trim())) {
    throw new AppError(`${fieldName} must be a valid UUID`, 400);
  }
};

const ensurePlainObject = (value, fieldName) => {
  if (value === undefined) return;
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new AppError(`${fieldName} must be an object`, 400);
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

export const createUserValidator = createValidator((req) => {
  const { body } = req;

  // Required fields
  ensureEmail(body.email, "email");
  ensureString(body.password, "password", { min: 8, max: 255 });
  ensureString(body.firstName, "firstName", { min: 2, max: 100 });
  ensureString(body.lastName, "lastName", { min: 2, max: 100 });
  ensureEnum(body.userType, "userType", USER_TYPES);

  // Optional fields
  ensureOptionalString(body.phone, "phone", { min: 7, max: 20 });
  ensureOptionalString(body.cognitoSub, "cognitoSub");

  // Validate status
  if (body.status !== undefined) {
    ensureEnum(body.status, "status", USER_STATUSES);
  }

  // Validate emailVerified
  if (body.emailVerified !== undefined && typeof body.emailVerified !== "boolean") {
    throw new AppError("emailVerified must be a boolean", 400);
  }

  // Validate preferences
  ensurePlainObject(body.preferences, "preferences");

  if (req.tenantId) {
    ensureUuid(req.tenantId, "x-tenant-id header");
  } else if (body.userType !== "super_admin") {
    throw new AppError("x-tenant-id header is required for tenant-scoped users", 400);
  }
});

export const updateUserValidator = createValidator((req) => {
  const { body } = req;

  if (body.email !== undefined) {
    ensureEmail(body.email, "email");
  }

  if (body.firstName !== undefined) {
    ensureString(body.firstName, "firstName", { min: 2, max: 100 });
  }

  if (body.lastName !== undefined) {
    ensureString(body.lastName, "lastName", { min: 2, max: 100 });
  }

  if (body.phone !== undefined) {
    ensureOptionalString(body.phone, "phone", { min: 7, max: 20 });
  }

  if (body.userType !== undefined) {
    ensureEnum(body.userType, "userType", USER_TYPES);
  }

  if (body.status !== undefined) {
    ensureEnum(body.status, "status", USER_STATUSES);
  }

  if (body.preferences !== undefined) {
    ensurePlainObject(body.preferences, "preferences");
  }

  if (body.cognitoSub !== undefined) {
    ensureOptionalString(body.cognitoSub, "cognitoSub");
  }
});

export const updateUserStatusValidator = createValidator((req) => {
  const { body } = req;

  if (body.status === undefined) {
    throw new AppError("status is required", 400);
  }

  ensureEnum(body.status, "status", USER_STATUSES);
});

export const assignUserRolesValidator = createValidator((req) => {
  const { body } = req;

  if (!Array.isArray(body.roles) || body.roles.length === 0) {
    throw new AppError("roles must be a non-empty array", 400);
  }

  for (const role of body.roles) {
    ensureUuid(role.roleId, "roleId in roles");

    if (role.academicYearId !== undefined && role.academicYearId !== null) {
      ensureUuid(role.academicYearId, "academicYearId in roles");
    }
  }
});

export const removeUserRolesValidator = createValidator((req) => {
  const { body } = req;

  if (!Array.isArray(body.roleIds) || body.roleIds.length === 0) {
    throw new AppError("roleIds must be a non-empty array", 400);
  }

  for (const roleId of body.roleIds) {
    ensureUuid(roleId, "roleIds");
  }
});

export const loginValidator = createValidator((req) => {
  const { body } = req;

  if (body.email === undefined) {
    throw new AppError("email is required", 400);
  }

  if (body.password === undefined) {
    throw new AppError("password is required", 400);
  }

  ensureEmail(body.email, "email");
  ensureString(body.password, "password", { min: 1, max: 255 });
});
