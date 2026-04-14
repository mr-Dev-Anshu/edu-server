import { JwtHelper } from "../utils/jwt.js";
import { AppError } from "../utils/AppError.js";
import { getCookieValue, getTokenCookieName } from "../utils/cookie.js";

export const authMiddleware = (req, res, next) => {
  try {
    const bearerToken = req.headers.authorization?.split(" ")[1];
    const cookieToken = getCookieValue(
      req.headers.cookie,
      getTokenCookieName()
    );
    const token = bearerToken || cookieToken;

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
