import { AppError } from "../../utils/AppError.js";
import { ROLE_TYPES } from "../../utils/role-type.js";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const ROLE_TYPE_SET = new Set(ROLE_TYPES);

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

const ensurePlainObject = (value, fieldName) => {
  if (value === undefined) return;
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new AppError(`${fieldName} must be an object`, 400);
  }
};

const ensureUuid = (value, fieldName) => {
  if (typeof value !== "string" || !UUID_REGEX.test(value.trim())) {
    throw new AppError(`${fieldName} must be a valid UUID`, 400);
  }
};

export const createRoleValidator = createValidator((req) => {
  const { body } = req;
  const normalizedRoleType = body.roleType?.trim().toLowerCase();

  ensureString(body.name, "name", { min: 2, max: 100 });
  ensureString(body.roleType, "roleType", { min: 4, max: 20 });
  ensureOptionalString(body.description, "description", { min: 3, max: 1000 });

  if (!ROLE_TYPE_SET.has(normalizedRoleType)) {
    throw new AppError(
      `roleType must be one of: ${ROLE_TYPES.join(", ")}`,
      400,
    );
  }

  if (body.isSystem !== undefined && typeof body.isSystem !== "boolean") {
    throw new AppError("isSystem must be a boolean", 400);
  }

  if (
    body.hierarchyLevel !== undefined &&
    (!Number.isInteger(body.hierarchyLevel) || body.hierarchyLevel < 0 || body.hierarchyLevel > 100)
  ) {
    throw new AppError("hierarchyLevel must be an integer between 0 and 100", 400);
  }

  if (req.tenantId) {
    ensureUuid(req.tenantId, "tenantId");
  } else if (body.isSystem !== true) {
    throw new AppError("Tenant context is required for tenant-specific roles", 400);
  }

  if (body.permissionIds !== undefined) {
    if (!Array.isArray(body.permissionIds)) {
      throw new AppError("permissionIds must be an array", 400);
    }

    for (const permissionId of body.permissionIds) {
      ensureUuid(permissionId, "permissionIds");
    }
  }

  ensurePlainObject(body.customFields, "customFields");
  ensurePlainObject(body.metadata, "metadata");
});
