import { validate as isUUID } from "uuid";
import { AppError } from "../../utils/AppError.js";

export const validateUUID = (paramName) => (req, res, next) => {
  const value = req.params[paramName];

  if (!isUUID(value)) {
    return next(new AppError(`${paramName} must be a valid UUID`, 400));
  }

  next();
};