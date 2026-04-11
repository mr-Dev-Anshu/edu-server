import { AppError } from "../../utils/AppError.js";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

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

  ensureString(body.name, "name", { min: 2, max: 100 });
  ensureOptionalString(body.slug, "slug", { min: 2, max: 100 });
  ensureOptionalString(body.description, "description", { min: 3, max: 1000 });

  if (body.slug !== undefined && !SLUG_REGEX.test(body.slug.trim().toLowerCase())) {
    throw new AppError("slug must contain only lowercase letters, numbers, and hyphens", 400);
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
    ensureUuid(req.tenantId, "x-tenant-id header");
  } else if (body.isSystem !== true) {
    throw new AppError("x-tenant-id header is required for tenant-specific roles", 400);
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
