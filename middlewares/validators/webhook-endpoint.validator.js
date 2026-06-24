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

const isValidUrl = (string) => {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
};

export const createWebhookEndpointValidator = createValidator((req) => {
  const { body } = req;

  ensureString(body.url, "url", { min: 5, max: 2048 });
  if (!isValidUrl(body.url)) {
    throw new AppError("url must be a valid URL", 400);
  }

  ensureString(body.secretHash, "secretHash", { min: 8, max: 255 });

  if (body.isActive !== undefined && typeof body.isActive !== "boolean") {
    throw new AppError("isActive must be a boolean", 400);
  }
});

export const updateWebhookEndpointValidator = createValidator((req) => {
  const { body } = req;

  if (body.url !== undefined) {
    ensureString(body.url, "url", { min: 5, max: 2048 });
    if (!isValidUrl(body.url)) {
      throw new AppError("url must be a valid URL", 400);
    }
  }

  if (body.secretHash !== undefined) {
    ensureString(body.secretHash, "secretHash", { min: 8, max: 255 });
  }

  if (body.isActive !== undefined && typeof body.isActive !== "boolean") {
    throw new AppError("isActive must be a boolean", 400);
  }
});
