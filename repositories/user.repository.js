import { User } from "../models/index.js";
import { BaseRepository } from "./base.repository.js";
import { AppError } from "../utils/AppError.js";

export class UserRepository extends BaseRepository {
  constructor() {
    super(User);
  }

  async findByEmail(email, tenantId = null) {
    const where = { email: email.toLowerCase().trim() };
    if (tenantId) where.tenantId = tenantId;
    
    return await this.model.scope("withPassword").findOne({ where });
  }

  async findByCognitoSub(cognitoSub) {
    return await this.model.findOne({ where: { cognitoSub } });
  }

  async findActiveUsers(tenantId, filter = {}) {
    return await this.model.findAll({
      where: { ...filter, tenantId, status: "active" },
      attributes: { exclude: ["password"] },
    });
  }

  async findByUserType(userType, tenantId, filter = {}) {
    return await this.model.findAll({
      where: { ...filter, tenantId, userType },
      attributes: { exclude: ["password"] },
    });
  }

  async findAllWithAssociations(tenantId, filter = {}, include = []) {
    const defaultInclude = [
      {
        association: "roles",
        attributes: ["id", "name", "slug"],
        through: { attributes: [] },
      },
    ];

    return await this.model.findAll({
      where: { ...filter, tenantId },
      attributes: { exclude: ["password"] },
      include: include.length > 0 ? include : defaultInclude,
    });
  }

  async findByIdWithAssociations(id, tenantId, include = []) {
    const defaultInclude = [
      {
        association: "roles",
        attributes: ["id", "name", "slug"],
        through: { attributes: [] },
      },
    ];

    const user = await this.model.findOne({
      where: { id, tenantId },
      attributes: { exclude: ["password"] },
      include: include.length > 0 ? include : defaultInclude,
    });

    if (!user) throw new AppError("User not found", 404);
    return user;
  }

  async updatePassword(id, tenantId, hashedPassword) {
    const user = await this.findById(id, tenantId);
    return await user.update({ password: hashedPassword });
  }

  async updateLastLogin(id, tenantId) {
    const user = await this.findById(id, tenantId);
    return await user.update({ lastLoginAt: new Date() });
  }

  async verifyEmail(id, tenantId) {
    const user = await this.findById(id, tenantId);
    return await user.update({ emailVerified: true });
  }

  async updateStatus(id, tenantId, status) {
    const validStatuses = ["active", "inactive", "suspended", "pending_verification"];
    if (!validStatuses.includes(status)) {
      throw new AppError("Invalid user status", 400);
    }
    const user = await this.findById(id, tenantId);
    return await user.update({ status });
  }

  async softDelete(id, tenantId) {
    const user = await this.findById(id, tenantId);
    return await user.destroy();
  }

  async restore(id, tenantId) {
    const user = await this.model.findOne({
      where: { id, tenantId },
      paranoid: false,
    });
    if (!user) throw new AppError("User not found", 404);
    return await user.restore();
  }

  /**
   * Find user by email with password scope (for authentication)
   * This method retrieves the user including the password hash
   * 
   * @param {string} email - User email
   * @param {string} tenantId - Tenant ID
   * @returns {Promise<User>} User object with password
   * @throws {AppError} If user not found
   */
  async findByEmailWithPassword(email, tenantId) {
    const where = { email: email.toLowerCase().trim(), tenantId };
    const user = await this.model.scope("withPassword").findOne({ where });
    if (!user) throw new AppError("Invalid Credentials", 401);
    return user;
  }

  /**
   * Verify user status for login
   * Checks if user account is eligible for login
   * 
   * Edge cases:
   * - User is suspended → throw error
   * - User is inactive → throw error
   * - User is pending_verification → allow but warn (can be enforced later)
   * 
   * @param {User} user - User object
   * @throws {AppError} If user account is not eligible for login
   */
  verifyUserLoginStatus(user) {
    if (user.status === "suspended") {
      throw new AppError("Account is suspended. Contact support.", 403);
    }
    if (user.status === "inactive") {
      throw new AppError("Account is inactive. Please contact administrator.", 403);
    }
    // Note: pending_verification is allowed - email verification can be enforced via middleware
  }
}
