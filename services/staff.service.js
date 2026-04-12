import { StaffRepository } from "../repositories/staff.repository.js";
import { AppError } from "../utils/AppError.js";

const staffRepo = new StaffRepository();

export class StaffService {
  async createStaff(tenantId, payload) {
    const { employeeCode, userId, staffType, department, designation } = payload;

    // Check if employee code already exists for this tenant
    const existingStaff = await staffRepo.findByEmployeeCode(employeeCode, tenantId);
    if (existingStaff) {
      throw new AppError("Employee code already exists for this tenant", 400);
    }

    // Check if user already has staff record
    const userStaff = await staffRepo.findByUserId(userId, tenantId);
    if (userStaff) {
      throw new AppError("This user already has a staff record", 400);
    }

    const staff = await staffRepo.create({
      tenantId,
      userId,
      employeeCode: employeeCode.trim(),
      staffType,
      designation: designation?.trim() || null,
      department: department?.trim() || null,
      joiningDate: payload.joiningDate,
      employmentStatus: payload.employmentStatus || "probation",
      panNumber: payload.panNumber?.trim() || null,
      bankAccountNumber: payload.bankAccountNumber?.trim() || null,
    });

    return this.formatStaffResponse(staff);
  }

  async getAllStaff(tenantId, query) {
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 10;

    const filters = {};
    if (query.staffType) filters.staffType = query.staffType;
    if (query.employmentStatus) filters.employmentStatus = query.employmentStatus;
    if (query.department) filters.department = query.department;

    return await staffRepo.findWithPagination(tenantId, filters, page, limit);
  }

  async getStaffById(id, tenantId) {
    const staff = await staffRepo.findById(id, tenantId);
    return this.formatStaffResponse(staff);
  }

  async updateStaff(id, tenantId, updateData) {
    const staff = await staffRepo.findById(id, tenantId);

    // If updating employee code, check for uniqueness
    if (updateData.employeeCode && updateData.employeeCode !== staff.employeeCode) {
      const existingStaff = await staffRepo.findByEmployeeCode(updateData.employeeCode, tenantId);
      if (existingStaff) {
        throw new AppError("Employee code already exists for this tenant", 400);
      }
    }

    const updatedStaff = await staffRepo.update(id, tenantId, {
      ...(updateData.employeeCode !== undefined ? { employeeCode: updateData.employeeCode.trim() } : {}),
      ...(updateData.staffType !== undefined ? { staffType: updateData.staffType } : {}),
      ...(updateData.designation !== undefined ? { designation: updateData.designation?.trim() || null } : {}),
      ...(updateData.department !== undefined ? { department: updateData.department?.trim() || null } : {}),
      ...(updateData.joiningDate !== undefined ? { joiningDate: updateData.joiningDate } : {}),
      ...(updateData.employmentStatus !== undefined ? { employmentStatus: updateData.employmentStatus } : {}),
      ...(updateData.panNumber !== undefined ? { panNumber: updateData.panNumber?.trim() || null } : {}),
      ...(updateData.bankAccountNumber !== undefined ? { bankAccountNumber: updateData.bankAccountNumber?.trim() || null } : {}),
    });

    return this.formatStaffResponse(updatedStaff);
  }

  async deleteStaff(id, tenantId) {
    const staff = await staffRepo.findById(id, tenantId);
    await staffRepo.delete(id, tenantId);
    return { message: "Staff record deleted successfully", data: this.formatStaffResponse(staff) };
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
      createdAt: staff.createdAt,
      updatedAt: staff.updatedAt,
    };
  }
}
