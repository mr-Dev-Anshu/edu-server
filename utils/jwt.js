import jwt from "jsonwebtoken";
import { AppError } from "./AppError.js";

let JWT_SECRET = process.env.JWT_SECRET;
let JWT_EXPIRY = process.env.JWT_EXPIRY || "1h"; // Default 1 hour
let JWT_REFRESH_EXPIRY = process.env.JWT_REFRESH_EXPIRY || "7d"; // Default 7 days
let JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET must be set");
}

if (!JWT_REFRESH_SECRET) {
  throw new Error("JWT_REFRESH_SECRET must be set");
}

export class JwtHelper {
  static generateToken(payload) {
    try {
      if (!JWT_SECRET) {
        throw new Error("JWT_SECRET is not configured");
      }
      const token = jwt.sign(payload, JWT_SECRET, {
        expiresIn: JWT_EXPIRY,
      });
      return token;
    } catch (error) {
      throw new AppError("Error generating JWT token", 500);
    }
  }

  static generateRefreshToken(payload) {
    try {
      if (!JWT_REFRESH_SECRET) {
        throw new Error("JWT_REFRESH_SECRET is not configured");
      }
      const refreshToken = jwt.sign(payload, JWT_REFRESH_SECRET, {
        expiresIn: JWT_REFRESH_EXPIRY,
      });
      return refreshToken;
    } catch (error) {
      throw new AppError("Error generating JWT refresh token", 500);
    }
  }

  static verifyToken(token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      return decoded;
    } catch (error) {
      if (error.name === "TokenExpiredError") {
        throw new AppError("Token has expired", 401);
      }
      throw new AppError("Invalid token", 401);
    }
  }

  static verifyRefreshToken(token) {
    try {
      const decoded = jwt.verify(token, JWT_REFRESH_SECRET);
      return decoded;
    } catch (error) {
      if (error.name === "TokenExpiredError") {
        throw new AppError("Refresh token has expired", 401);
      }
      throw new AppError("Invalid refresh token", 401);
    }
  }
}
