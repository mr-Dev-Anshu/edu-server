import { AppError } from "../../utils/AppError.js";

export const globalErrorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  if (err.name === 'SequelizeUniqueConstraintError') error = new AppError('Duplicate field value entered', 400);
  if (err.name === 'SequelizeValidationError') error = new AppError(err.errors[0].message, 400);
    
  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || 'Internal Server Error',
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
};
