// export const catchAsync = (fn) => {
//   return (req, res, next) => {
//     fn(req, res, next).catch(next); // Sends error to Global Handler
//   };
// };
import { AppError } from "./AppError.js";

export const catchAsync = (fn) => (req, res, next) => {
  fn(req, res, next).catch((err) => {
    // If it's an AppError, use its statusCode
    if (err instanceof AppError) {
      return res.status(err.statusCode).json({
        success: false,
        message: err.message,
      });
    }

    // Unknown error — 500
    console.error("ERROR", err);
    res.status(500).json({
      success: false,
      message: err.message,
      stack: err.stack,
    });
  });
};
