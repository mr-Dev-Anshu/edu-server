import jwt from "jsonwebtoken";
import { AppError } from "./AppError.js";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";
const JWT_EXPIRY = process.env.JWT_EXPIRY || "7d";

export class JwtHelper {
  static generateToken(payload) {
    try {
      const token = jwt.sign(payload, JWT_SECRET, {
        expiresIn: JWT_EXPIRY,
      });
      return token;
    } catch (error) {
      throw new AppError("Error generating JWT token", 500);
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

  static decodeToken(token) {
    try {
      const decoded = jwt.decode(token);
      return decoded;
    } catch (error) {
      throw new AppError("Error decoding token", 400);
    }
  }
}
