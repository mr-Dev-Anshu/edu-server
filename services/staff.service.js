import { StaffRepository } from "../repositories/staff.repository.js";
import { UserService } from "./user.service.js";
import { RoleService } from "./role.service.js";
import { AppError } from "../utils/AppError.js";
import sequelize from "../config/db.js";
import { UserRoleService } from "./user-role.service.js";
import { BaseService } from "./base.service.js";
import { Op } from "sequelize";

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

export class StaffService extends BaseService {
  constructor() {
    super(staffRepo);
  }

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
      
      // Reload staff with associations for complete response
      const completeStaff = await staffRepo.findById(staff.id, tenantId, {
        include: [
          { association: "user", attributes: ["id", "firstName", "lastName", "email", "phone", "status"] },
          { association: "organization", attributes: ["id", "name", "organizationType", "officialEmail", "subdomain"] }
        ]
      });
      
      return this.formatStaffResponse(completeStaff);
    } catch (error) {
      if (!transaction.finished) await transaction.rollback();
      throw error;
    }
  }

  async getAllStaff(tenantId, query) {
    const page = Number.parseInt(query.page, 10) > 0 ? Number.parseInt(query.page, 10) : 1;
    const limit = Number.parseInt(query.limit, 10) > 0 ? Number.parseInt(query.limit, 10) : 10;

    const where = { tenantId };
    const andClauses = [];

    if (query.staffType) {
      where.staffType = query.staffType;
    }

    const employmentStatus = query.employmentStatus || query.status;
    if (employmentStatus) {
      andClauses.push({
        employmentStatus: String(employmentStatus).trim().toLowerCase(),
      });
    }

    if (query.department) {
      andClauses.push({
        department: { [Op.iLike]: `%${String(query.department).trim()}%` },
      });
    }

    const searchTerm = String(query.search || "").trim();
    if (searchTerm) {
      andClauses.push({
        [Op.or]: [
          { employeeCode: { [Op.iLike]: `%${searchTerm}%` } },
          sequelize.where(sequelize.col("user.first_name"), {
            [Op.iLike]: `%${searchTerm}%`,
          }),
          sequelize.where(sequelize.col("user.last_name"), {
            [Op.iLike]: `%${searchTerm}%`,
          }),
          sequelize.where(sequelize.col("user.email"), {
            [Op.iLike]: `%${searchTerm}%`,
          }),
          sequelize.where(
            sequelize.fn(
              "concat",
              sequelize.col("user.first_name"),
              " ",
              sequelize.col("user.last_name"),
            ),
            {
            [Op.iLike]: `%${searchTerm}%`,
            },
          ),
        ],
      });
    }

    if (andClauses.length) {
      where[Op.and] = andClauses;
    }

    const sortableColumns = {
      createdAt: sequelize.col("Staff.created_at"),
      updatedAt: sequelize.col("Staff.updated_at"),
      employeeCode: sequelize.fn("LOWER", sequelize.col("Staff.employee_code")),
      department: sequelize.fn("LOWER", sequelize.col("Staff.department")),
      staffType: sequelize.fn("LOWER", sequelize.col("Staff.staff_type")),
      employmentStatus: sequelize.fn("LOWER", sequelize.col("Staff.employment_status")),
      firstName: sequelize.fn("LOWER", sequelize.col("user.first_name")),
      lastName: sequelize.fn("LOWER", sequelize.col("user.last_name")),
      email: sequelize.fn("LOWER", sequelize.col("user.email")),
    };

    const sortAliases = {
      createdat: "createdAt",
      updatedat: "updatedAt",
      employeecode: "employeeCode",
      department: "department",
      stafftype: "staffType",
      employmentstatus: "employmentStatus",
      firstname: "firstName",
      lastname: "lastName",
      email: "email",
    };

    const rawSortKey = String(query.sort || "createdAt").trim();
    const normalizedSortKey = sortAliases[rawSortKey.toLowerCase()] || rawSortKey;
    const sortCol = sortableColumns[normalizedSortKey] || sortableColumns.createdAt;
    const orderDirection = String(query.order || "desc").toUpperCase() === "ASC" ? "ASC" : "DESC";

    const result = await staffRepo.findWithPagination(tenantId, {}, page, limit, {
      where,
      include: [
        {
          association: "user",
          attributes: ["id", "firstName", "lastName", "email"],
          required: false,
        },
      ],
      subQuery: false,
      order: [[sortCol, orderDirection]],
    });

    return {
      ...result,
      data: result.data.map(s => this.formatStaffResponse(s))
    };
  }

  async getStaffById(id, tenantId) {
    const staff = await staffRepo.findById(id, tenantId, {
      include: [
        { association: "user", attributes: ["id", "firstName", "lastName", "email", "phone", "status"] },
        { association: "organization", attributes: ["id", "name", "organizationType", "officialEmail", "subdomain"] }
      ]
    });
    return this.formatStaffResponse(staff);
  }

  async updateStaff(id, tenantId, updateData) {
    const staff = await staffRepo.findById(id, tenantId);

    if (updateData.employeeCode && updateData.employeeCode !== staff.employeeCode) {
      const existingStaff = await staffRepo.findByEmployeeCode(updateData.employeeCode, tenantId);
      if (existingStaff) throw new AppError("Employee code already exists", 400);
    }

    await staffRepo.update(id, tenantId, {
      ...updateData,
      employeeCode: updateData.employeeCode?.trim() || staff.employeeCode,
      designation: updateData.designation?.trim() || staff.designation,
      department: updateData.department?.trim() || staff.department,
    });

    // Reload staff with associations for complete response
    const updatedStaff = await staffRepo.findById(id, tenantId, {
      include: [
        { association: "user", attributes: ["id", "firstName", "lastName", "email", "phone", "status"] },
        { association: "organization", attributes: ["id", "name", "organizationType", "officialEmail", "subdomain"] }
      ]
    });

    return this.formatStaffResponse(updatedStaff);
  }

  async deleteStaff(id, tenantId) {
    const staff = await staffRepo.findById(id, tenantId);
    await staffRepo.delete(id, tenantId);
    return { message: "Staff record deleted successfully" };
  }

  async searchStaff(tenantId, query) {
    return await this.search(tenantId, query, [
      "employeeCode",
      "designation",
      "department",
    ], {
      filterableFields: ["staffType", "employmentStatus", "department"],
      include: [
        { association: "user", attributes: ["id", "firstName", "lastName", "email", "phone", "status"] },
        { association: "organization", attributes: ["id", "name", "organizationType", "officialEmail", "subdomain"] }
      ],
      formatter: (staff) => this.formatStaffResponse(staff),
      order: [["createdAt", "DESC"]],
    });
  }

  formatStaffResponse(staff) {
    return {
      id: staff.id,
      tenant: staff.organization ? {
        id: staff.organization.id,
        name: staff.organization.name,
        organizationType: staff.organization.organizationType,
        officialEmail: staff.organization.officialEmail,
        subdomain: staff.organization.subdomain
      } : null,
      user: staff.user ? {
        id: staff.user.id,
        firstName: staff.user.firstName,
        lastName: staff.user.lastName,
        email: staff.user.email,
        phone: staff.user.phone,
        status: staff.user.status
      } : null,
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
      updatedAt: staff.updatedAt
    };
  }
}
