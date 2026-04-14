import bcrypt from "bcrypt";
import { AppError } from "./AppError.js";

const SALT_ROUNDS = 10;

export class BcryptHelper {
  static async hashPassword(password) {
    try {
      const hash = await bcrypt.hash(password, SALT_ROUNDS);
      return hash;
    } catch (error) {
      throw new AppError("Error hashing password", 500);
    }
  }

  static async comparePassword(plainPassword, hashedPassword) {
    try {
      const isMatch = await bcrypt.compare(plainPassword, hashedPassword);
      return isMatch;
    } catch (error) {
      throw new AppError("Error comparing passwords", 500);
    }
  }
}
