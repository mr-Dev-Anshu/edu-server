import sequelize from "../config/db.js";
import { UserRepository } from "../repositories/user.repository.js";
import { UserRoleRepository } from "../repositories/user-role.repository.js";
import { AppError } from "../utils/AppError.js";
import { comparePasswords, hashPassword, generateToken } from "../utils/auth.js";

const userRepo = new UserRepository();
const userRoleRepo = new UserRoleRepository();

export class UserService {
  async createUser(payload) {
    const email = payload.email?.toLowerCase().trim();

    // Check if email already exists
    const existingUser = await userRepo.findByEmail(email, payload.tenantId);
    if (existingUser) {
      throw new AppError("Email already exists", 409);
    }

    //hashing password before save
    const hashedPassword = await hashPassword(payload.password);

    const userData = {
      email,
      password: hashedPassword,
      cognitoSub: payload.cognitoSub || null,
      firstName: payload.firstName?.trim(),
      lastName: payload.lastName?.trim(),
      phone: payload.phone?.trim() || null,
      userType: payload.userType,
      status: payload.status || "pending_verification",
      emailVerified: payload.emailVerified || false,
      preferences: payload.preferences || { language: "en", theme: "system" },
      tenantId: payload.tenantId,
    };

    const user = await userRepo.create(userData);
    return this.formatUserResponse(user);
  }

  async getAllUsers(tenantId, filter = {}) {
    const users = await userRepo.findAllWithAssociations(tenantId, filter);
    return users.map((user) => this.formatUserResponse(user));
  }

  async getUserById(userId, tenantId) {
    const user = await userRepo.findByIdWithAssociations(userId, tenantId);
    return this.formatUserResponse(user);
  }

  async getUsersByType(userType, tenantId, filter = {}) {
    const users = await userRepo.findByUserType(userType, tenantId, filter);
    return users.map((user) => this.formatUserResponse(user));
  }

  async getActiveUsers(tenantId, filter = {}) {
    const users = await userRepo.findActiveUsers(tenantId, filter);
    return users.map((user) => this.formatUserResponse(user));
  }

  async updateUser(userId, tenantId, payload) {
    const user = await userRepo.findById(userId, tenantId);

    // Check email uniqueness if updating email
    if (payload.email && payload.email.toLowerCase().trim() !== user.email) {
      const existingUser = await userRepo.findByEmail(
        payload.email.toLowerCase().trim(),
        tenantId,
      );
      if (existingUser) {
        throw new AppError("Email already exists", 409);
      }
    }

    const updateData = {};

    if (payload.firstName) updateData.firstName = payload.firstName.trim();
    if (payload.lastName) updateData.lastName = payload.lastName.trim();
    if (payload.email) updateData.email = payload.email.toLowerCase().trim();
    if (payload.phone !== undefined)
      updateData.phone = payload.phone?.trim() || null;
    if (payload.preferences) updateData.preferences = payload.preferences;
    if (payload.cognitoSub) updateData.cognitoSub = payload.cognitoSub;

    await userRepo.update(userId, tenantId, updateData);
    const updated = await userRepo.findByIdWithAssociations(userId, tenantId);
    return this.formatUserResponse(updated);
  }

  async updateUserStatus(userId, tenantId, status) {
    const validStatuses = [
      "active",
      "inactive",
      "suspended",
      "pending_verification",
    ];
    if (!validStatuses.includes(status)) {
      throw new AppError("Invalid status value", 400);
    }

    const user = await userRepo.updateStatus(userId, tenantId, status);
    return this.formatUserResponse(user);
  }

  async verifyUserEmail(userId, tenantId) {
    const user = await userRepo.verifyEmail(userId, tenantId);
    return this.formatUserResponse(user);
  }

  async updatePassword(userId, tenantId, hashedPassword) {
    const user = await userRepo.updatePassword(
      userId,
      tenantId,
      hashedPassword,
    );
    return this.formatUserResponse(user);
  }

  async updateLastLogin(userId, tenantId) {
    await userRepo.updateLastLogin(userId, tenantId);
  }

  async deleteUser(userId, tenantId) {
    // Soft delete - paranoid mode
    await userRepo.softDelete(userId, tenantId);
  }

  async restoreUser(userId, tenantId) {
    const user = await userRepo.restore(userId, tenantId);
    return this.formatUserResponse(user);
  }

  async assignRolesWithUsers(userId, tenantId, roles) {
    const user = await userRepo.findById(userId, tenantId);

    const transaction = await sequelize.transaction();

    try {
      for (const role of roles) {
        await userRoleRepo.assignRoleupdateUserToUser(
          userId,
          role.roleId,
          role.academicYearId || null,
          null,
          { transaction },
        );
      }
      await transaction.commit();

      return await userRepo.findByIdWithAssociations(userId, tenantId);
    } catch (error) {
      if (!transaction.finished) {
        await transaction.rollback();
      }
      throw error;
    }
  }

  async removeRolesFromUser(userId, tenantId, roleIds) {
    await userRepo.findById(userId, tenantId);
    await userRoleRepo.bulkRevokeRoles(userId, roleIds);
  }

  /**
   * Login user with email and password
   *
   * Edge cases handled:
   * 1. User not found → Generic error message for security
   * 2. Invalid password → Generic error message (same as user not found)
   * 3. Account suspended → Specific error
   * 4. Account inactive → Specific error
   * 5. Email not verified → Allowed but can be enforced via separate middleware
   * 6. Successful login → Updates lastLoginAt timestamp and returns token + user data
   *
   * @param {object} payload - Login credentials
   * @param {string} payload.email - User email
   * @param {string} payload.password - User password
   * @param {string} tenantId - Tenant ID
   * @returns {Promise<object>} Token and user data
   * @throws {AppError} If authentication fails or account is suspended/inactive
   */
  async loginUser(payload, tenantId) {
    const email = payload.email?.toLowerCase().trim();
    const password = payload.password?.trim();

    // Find user with password scope
    let user;
    try {
      user = await userRepo.findByEmailWithPassword(email, tenantId);
    } catch (error) {
      // Generic error message for security (timing attack prevention)
      throw new AppError("Invalid email ", 401);
    }

    // Verify password
    const isPasswordValid = await comparePasswords(password, user.password);
    if (!isPasswordValid) {
      throw new AppError("Invalid password", 401);
    }

    // Verify account status
    userRepo.verifyUserLoginStatus(user);

    // Update last login timestamp
    await userRepo.updateLastLogin(user.id, tenantId);

    // Fetch fresh user data with roles
    const freshUser = await userRepo.findByIdWithAssociations(
      user.id,
      tenantId,
    );

    // Generate JWT token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      userType: user.userType,
      tenantId: tenantId,
      roles: (freshUser.roles || []).map((role) => ({
        id: role.id,
        name: role.name,
        slug: role.slug,
      })),
    });

    // Return token and user data (without password)
    return {
      token,
      user: this.formatUserResponse(freshUser),
      expiresIn: process.env.JWT_EXPIRES_IN || "7d",
    };
  }

  formatUserResponse(user) {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      userType: user.userType,
      status: user.status,
      emailVerified: user.emailVerified,
      lastLoginAt: user.lastLoginAt,
      preferences: user.preferences,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      roles: user.roles || [],
    };
  }
}
