import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { AppError } from './AppError.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

/**
 * Hash password using bcrypt
 * @param {string} password - Plain password
 * @returns {Promise<string>} Hashed password
 */
export const hashPassword = async (password) => {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
};

/**
 * Compare plain password with hashed password
 * @param {string} plainPassword - Plain password
 * @param {string} hashedPassword - Hashed password
 * @returns {Promise<boolean>} True if passwords match
 */
export const comparePasswords = async (plainPassword, hashedPassword) => {
  return await bcrypt.compare(plainPassword, hashedPassword);
};

/**
 * Generate JWT token
 * @param {object} payload - Token payload
 * @returns {string} JWT token
 */
export const generateToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

/**
 * Verify JWT token
 * @param {string} token - JWT token
 * @returns {object} Decoded token payload
 * @throws {AppError} If token is invalid or expired
 */
export const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new AppError('Token has expired', 401);
    } else if (error.name === 'JsonWebTokenError') {
      throw new AppError('Invalid token', 401);
    } else {
      throw new AppError('Token verification failed', 401);
    }
  }
};

/**
 * Decode JWT token without verification (for debugging)
 * @param {string} token - JWT token
 * @returns {object} Decoded token
 */
export const decodeToken = (token) => {
  return jwt.decode(token);
};
