import { JwtHelper } from "../utils/jwt.js";
import { AppError } from "../utils/AppError.js";

export const authMiddleware = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return next(new AppError("No token provided, please login", 401));
    }

    const decoded = JwtHelper.verifyToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    next(error);
  }
};
