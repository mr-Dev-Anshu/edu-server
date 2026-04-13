import { AppError } from "../utils/AppError.js";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const tenantIdMiddleware = (req, res, next) => {
  const headerValue = req.get("x-tenant-id");
  req.tenantId = typeof headerValue === "string" ? headerValue.trim() : undefined;
  next();
};

export const requireTenantId = (req, res, next) => {
  if (!req.tenantId) {
    return next(new AppError("x-tenant-id header is required", 400));
  }

  if (!UUID_REGEX.test(req.tenantId)) {
    return next(new AppError("x-tenant-id header must be a valid UUID", 400));
  }

  next();
};
