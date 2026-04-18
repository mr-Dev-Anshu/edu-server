import { StaffRepository } from "../repositories/staff.repository.js";
import { UserService } from "./user.service.js";
import { RoleService } from "./role.service.js";
import { AppError } from "../utils/AppError.js";
import sequelize from "../config/db.js";
import { UserRoleService } from "./user-role.service.js";

const staffRepo = new StaffRepository();
const userService = new UserService();
const userRoleService = new UserRoleService()
const roleService = new RoleService();

// Mapping for PascalCase StaffType to Lowercase Role Slugs
const STAFF_ROLE_MAP = {
  "Teacher": "teacher",
  "Librarian": "librarian",
  "AdmissionHead": "admission-head",
  "Accountant": "accountant",
  "Other": "other" 
};

export class StaffService {
  /**
   * CREATE STAFF: Comprehensive flow including User & Role assignment
   */
  async createStaff(tenantId, payload) {
    const { 
      email, password, firstName, lastName, 
      employeeCode, staffType, department, designation , requestedBy
    } = payload;

    // 1. Check if employee code already exists (Atomic  check  before transaction)
    const existingStaff = await staffRepo.findByEmployeeCode(employeeCode, tenantId);
    if (existingStaff) throw new AppError("Employee code already exists for this tenant", 400);

    const transaction = await sequelize.transaction();

    try {
      // 2. Create User Account
      const user = await userService.createUser({
        email,
        password,
        firstName,
        lastName,
        tenantId,
        status: "active",
        emailVerified: true
      }, { transaction });

      // 3. Resolve and Assign Role
      const roleSlug = STAFF_ROLE_MAP[staffType] || "other";
      const roles = await roleService.getAllRoles(tenantId, { slug: roleSlug });
      const targetRole = roles[0];

      if (!targetRole) {
        throw new AppError(`Role for type ${staffType} (slug: ${roleSlug}) not found`, 404);
      }

      await userRoleService.assignRoleToUser({
        userId: user.id,
        roleId: targetRole.id,
        tenantId,
        assignedById: requestedBy || null
      }, { transaction });

      // 4. Create Staff Record
      const staff = await staffRepo.create({
        tenantId,
        userId: user.id,
        employeeCode: employeeCode.trim(),
        staffType, 
        designation: designation?.trim() || null,
        department: department?.trim() || null,
        joiningDate: payload.joiningDate,
        employmentStatus: payload.employmentStatus || "probation",
        panNumber: payload.panNumber?.trim() || null,
        bankName: payload.bankName?.trim() || null,
        bankBranch: payload.bankBranch?.trim() || null,
        bankAccountNumber: payload.bankAccountNumber?.trim() || null,
        ifscCode: payload.ifscCode?.trim() || null,
        accountHolderName: payload.accountHolderName?.trim() || null,
        basicSalary: payload.basicSalary || 0,
      }, { transaction });

      await transaction.commit();
      return this.formatStaffResponse(staff);
    } catch (error) {
      if (!transaction.finished) await transaction.rollback();
      throw error;
    }
  }

  async getAllStaff(tenantId, query) {
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 10;

    const filters = {};
    if (query.staffType) filters.staffType = query.staffType;
    if (query.employmentStatus) filters.employmentStatus = query.employmentStatus;
    if (query.department) filters.department = query.department;

    // Pagination handles the formatting internally or we map it
    const result = await staffRepo.findWithPagination(tenantId, filters, page, limit);
    return {
      ...result,
      data: result.data.map(s => this.formatStaffResponse(s))
    };
  }

  async getStaffById(id, tenantId) {
    const staff = await staffRepo.findById(id, tenantId, {
      include: ["user"] 
    });
    return this.formatStaffResponse(staff);
  }

  async updateStaff(id, tenantId, updateData) {
    const staff = await staffRepo.findById(id, tenantId);

    if (updateData.employeeCode && updateData.employeeCode !== staff.employeeCode) {
      const existingStaff = await staffRepo.findByEmployeeCode(updateData.employeeCode, tenantId);
      if (existingStaff) throw new AppError("Employee code already exists", 400);
    }

    const updatedStaff = await staffRepo.update(id, tenantId, {
      ...updateData,
      employeeCode: updateData.employeeCode?.trim() || staff.employeeCode,
      designation: updateData.designation?.trim() || staff.designation,
      department: updateData.department?.trim() || staff.department,
    });

    return this.formatStaffResponse(updatedStaff);
  }

  async deleteStaff(id, tenantId) {
    const staff = await staffRepo.findById(id, tenantId);
    await staffRepo.delete(id, tenantId);
    return { message: "Staff record deleted successfully" };
  }

  async searchStaff(tenantId, searchTerm) {
    if (!searchTerm || searchTerm.trim().length < 2) {
      throw new AppError("Search term must be at least 2 characters", 400);
    }
    const results = await staffRepo.searchStaff(tenantId, searchTerm);
    return results.map((staff) => this.formatStaffResponse(staff));
  }

  formatStaffResponse(staff) {
    return {
      id: staff.id,
      tenantId: staff.tenantId,
      userId: staff.userId,
      employeeCode: staff.employeeCode,
      staffType: staff.staffType,
      designation: staff.designation,
      department: staff.department,
      joiningDate: staff.joiningDate,
      employmentStatus: staff.employmentStatus,
      // Banking & Identity (Selective display)
      bankName: staff.bankName,
      ifscCode: staff.ifscCode,
      basicSalary: staff.basicSalary,
      createdAt: staff.createdAt,
      updatedAt: staff.updatedAt,
      // Include user profile if loaded via include
      profile: staff.user ? {
        firstName: staff.user.firstName,
        lastName: staff.user.lastName,
        email: staff.user.email
      } : null
    };
  }
}