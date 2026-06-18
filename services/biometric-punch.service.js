import { Op } from "sequelize";
import sequelize from "../config/db.js";
import { BiometricPunchRepository } from "../repositories/biometric-punch.repository.js";
import { StaffRepository } from "../repositories/staff.repository.js";
import { BaseService } from "./base.service.js";
import { AppError } from "../utils/AppError.js";

const biometricPunchRepo = new BiometricPunchRepository();
const staffRepo = new StaffRepository();

export class BiometricPunchService extends BaseService {
  constructor() {
    super(biometricPunchRepo);
  }

  async createPunch(payload) {
    const { tenantId, staffId, punchTime, isProcessed } = payload;

    // Future date validation
    const punchDate = new Date(punchTime);
    const now = new Date();
    if (punchDate > now) {
      throw new AppError("punchTime cannot be in the future", 400);
    }

    // Validate staff exists for this tenant
    await staffRepo.findById(staffId, tenantId);

    const punch = await biometricPunchRepo.create({
      tenantId,
      staffId,
      punchTime: new Date(punchTime),
      isProcessed: isProcessed ?? false,
    });

    return this.formatResponse(punch);
  }

  async bulkCreatePunches(tenantId, punches) {
    const now = new Date();
    for (const p of punches) {
      const punchDate = new Date(p.punchTime);
      if (punchDate > now) {
        throw new AppError("punchTime cannot be in the future", 400);
      }
    }

    // Extract unique staff IDs
    const staffIds = [...new Set(punches.map((p) => p.staffId))];

    // Validate all staff exist for this tenant
    const staffRecords = await staffRepo.model.findAll({
      where: {
        id: { [Op.in]: staffIds },
        tenantId,
      },
    });

    if (staffRecords.length !== staffIds.length) {
      throw new AppError(
        "One or more staffIds are invalid or do not belong to this tenant",
        400,
      );
    }

    const transaction = await sequelize.transaction();

    try {
      const recordsToCreate = punches.map((p) => ({
        tenantId,
        staffId: p.staffId,
        punchTime: new Date(p.punchTime),
        isProcessed: p.isProcessed ?? false,
      }));

      const createdPunches = await biometricPunchRepo.model.bulkCreate(
        recordsToCreate,
        {
          transaction,
        },
      );

      await transaction.commit();
      return createdPunches.map((punch) => this.formatResponse(punch));
    } catch (error) {
      if (!transaction.finished) {
        await transaction.rollback();
      }
      throw error;
    }
  }

  async getAllPunches(tenantId, query = {}) {
    const filter = {};

    if (query.staffId) {
      filter.staffId = query.staffId;
    }

    if (query.isProcessed !== undefined) {
      filter.isProcessed =
        query.isProcessed === "true" || query.isProcessed === true;
    }

    if (query.fromDate || query.toDate) {
      filter.punchTime = {};
      if (query.fromDate) {
        filter.punchTime[Op.gte] = new Date(query.fromDate);
      }
      if (query.toDate) {
        filter.punchTime[Op.lte] = new Date(query.toDate);
      }
    }

    const punches = await biometricPunchRepo.findAll(tenantId, filter, {
      include: [
        {
          association: "staff",
          attributes: ["id", "employeeCode", "designation", "department"],
          include: [
            {
              association: "user",
              attributes: ["firstName", "lastName", "email"],
            },
          ],
        },
      ],
    });

    return punches.map((punch) => this.formatResponse(punch));
  }

  async getPunchById(id, tenantId) {
    const punch = await biometricPunchRepo.findById(id, tenantId, {
      include: [
        {
          association: "staff",
          attributes: ["id", "employeeCode", "designation", "department"],
          include: [
            {
              association: "user",
              attributes: ["firstName", "lastName", "email"],
            },
          ],
        },
      ],
    });
    return this.formatResponse(punch);
  }

  async updatePunch(id, tenantId, payload) {
    const updateData = {};

    if (payload.staffId !== undefined) {
      await staffRepo.findById(payload.staffId, tenantId);
      updateData.staffId = payload.staffId;
    }

    if (payload.punchTime !== undefined) {
      const punchDate = new Date(payload.punchTime);
      const now = new Date();
      if (punchDate > now) {
        throw new AppError("punchTime cannot be in the future", 400);
      }
      updateData.punchTime = punchDate;

      updateData.punchTime = new Date(payload.punchTime);
    }

    if (payload.isProcessed !== undefined) {
      updateData.isProcessed = payload.isProcessed;
    }

    const punch = await biometricPunchRepo.update(id, tenantId, updateData);
    return this.formatResponse(punch);
  }

  async deletePunch(id, tenantId) {
    let punch;
    try {
      punch = await biometricPunchRepo.findById(id, tenantId);
    } catch (error) {
      if (error.message.includes("not found")) {
        throw new AppError("Biometric punch not found", 404); // ✅ AppError with 404
      }
      throw error;
    }

    if (!punch) {
      throw new AppError("Biometric punch not found", 404); // ✅ AppError with 404
    }

    await biometricPunchRepo.delete(id, tenantId);
    return { message: "Biometric punch deleted successfully" };
  }

  formatResponse(punch) {
    const data = {
      id: punch.id,
      tenantId: punch.tenantId,
      staffId: punch.staffId,
      punchTime: punch.punchTime,
      isProcessed: punch.isProcessed,
      createdAt: punch.createdAt,
      updatedAt: punch.updatedAt,
    };

    if (punch.staff) {
      data.staff = {
        id: punch.staff.id,
        employeeCode: punch.staff.employeeCode,
        designation: punch.staff.designation,
        department: punch.staff.department,
      };

      if (punch.staff.user) {
        data.staff.firstName = punch.staff.user.firstName;
        data.staff.lastName = punch.staff.user.lastName;
        data.staff.email = punch.staff.user.email;
      }
    }

    return data;
  }
}
