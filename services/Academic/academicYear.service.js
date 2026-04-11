import { AcademicYearRepository } from "../../repositories/Academic/academicYear.repository.js";
import { AppError } from "../../utils/AppError.js";

const academicYearRepo = new AcademicYearRepository();

export class AcademicYearService {
  async createAcademicYear(tenantId, payload) {
    const { name, startDate, endDate, isCurrent } = payload;

    // Validate dates
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (end <= start) {
      throw new AppError("End date must be after start date", 400);
    }

    // Check if name already exists for this tenant
    const existingYear = await academicYearRepo.findByName(name, tenantId);
    if (existingYear) {
      throw new AppError(
        "Academic year name already exists for this tenant",
        400,
      );
    }

    // Check for date conflicts
    const conflictingYears = await academicYearRepo.findYearsByDateRange(
      start,
      end,
      tenantId,
    );
    if (conflictingYears.length > 0) {
      throw new AppError(
        "Date range overlaps with existing academic year",
        400,
      );
    }

    let academicYear = await academicYearRepo.create({
      tenantId,
      name: name.trim(),
      startDate,
      endDate,
      isCurrent: false,
      isLocked: false,
    });

    if (isCurrent) {
      await academicYearRepo.updateCurrentYear(academicYear.id, tenantId);
      academicYear.isCurrent = true;
    }

    return this.formatAcademicYearResponse(academicYear);
  }

  async getAllAcademicYears(tenantId, query) {
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 10;

    const filters = {};
    if (query.isCurrent === "true") filters.isCurrent = true;
    if (query.isLocked === "true") filters.isLocked = true;

    return await academicYearRepo.findWithPagination(
      tenantId,
      filters,
      page,
      limit,
    );
  }

  async getAcademicYearById(id, tenantId) {
    const academicYear = await academicYearRepo.findById(id, tenantId);
    return this.formatAcademicYearResponse(academicYear);
  }

  async getCurrentYear(tenantId) {
    const currentYear = await academicYearRepo.findCurrentYear(tenantId);
    if (!currentYear) {
      throw new AppError("No current academic year set for this tenant", 404);
    }
    return this.formatAcademicYearResponse(currentYear);
  }

  async updateAcademicYear(id, tenantId, updateData) {
    const academicYear = await academicYearRepo.findById(id, tenantId);

    // If year is locked and not being unlocked, prevent updates
    if (academicYear.isLocked && !updateData.isLocked) {
      throw new AppError("Cannot update a locked academic year", 400);
    }

    // Validate dates if provided
    if (updateData.startDate || updateData.endDate) {
      const start = new Date(updateData.startDate || academicYear.startDate);
      const end = new Date(updateData.endDate || academicYear.endDate);

      if (end <= start) {
        throw new AppError("End date must be after start date", 400);
      }

      // Check for date conflicts (excluding current record)
      const conflictingYears = await academicYearRepo.findYearsByDateRange(
        start,
        end,
        tenantId,
      );
      if (conflictingYears.some((year) => year.id !== id)) {
        throw new AppError(
          "Date range overlaps with existing academic year",
          400,
        );
      }
    }

    // If updating name, check uniqueness
    if (updateData.name && updateData.name !== academicYear.name) {
      const existingYear = await academicYearRepo.findByName(
        updateData.name,
        tenantId,
      );
      if (existingYear) {
        throw new AppError(
          "Academic year name already exists for this tenant",
          400,
        );
      }
    }

    // Handle current year change
    if (updateData.isCurrent === true && !academicYear.isCurrent) {
      await academicYearRepo.updateCurrentYear(id, tenantId);
      updateData.isCurrent = true;
    }

    const updatedYear = await academicYearRepo.update(id, tenantId, {
      ...(updateData.name !== undefined
        ? { name: updateData.name.trim() }
        : {}),
      ...(updateData.startDate !== undefined
        ? { startDate: updateData.startDate }
        : {}),
      ...(updateData.endDate !== undefined
        ? { endDate: updateData.endDate }
        : {}),
      ...(updateData.isCurrent !== undefined
        ? { isCurrent: updateData.isCurrent }
        : {}),
      ...(updateData.isLocked !== undefined
        ? { isLocked: updateData.isLocked }
        : {}),
    });

    return this.formatAcademicYearResponse(updatedYear);
  }

  async deleteAcademicYear(id, tenantId) {
    const academicYear = await academicYearRepo.findById(id, tenantId);

    if (academicYear.isCurrent) {
      throw new AppError("Cannot delete the current academic year", 400);
    }

    if (academicYear.isLocked) {
      throw new AppError("Cannot delete a locked academic year", 400);
    }

    await academicYearRepo.delete(id, tenantId);
    return {
      message: "Academic year deleted successfully",
      data: this.formatAcademicYearResponse(academicYear),
    };
  }

  async setCurrentYear(id, tenantId) {
    const academicYear = await academicYearRepo.findById(id, tenantId);
    await academicYearRepo.updateCurrentYear(id, tenantId);
    const updated = await academicYearRepo.findById(id, tenantId);
    return this.formatAcademicYearResponse(updated);
  }

  async lockAcademicYear(id, tenantId) {
    const academicYear = await academicYearRepo.findById(id, tenantId);
    await academicYearRepo.lockYear(id, tenantId);
    const updated = await academicYearRepo.findById(id, tenantId);
    return this.formatAcademicYearResponse(updated);
  }

  async unlockAcademicYear(id, tenantId) {
    const academicYear = await academicYearRepo.findById(id, tenantId);
    await academicYearRepo.unlockYear(id, tenantId);
    const updated = await academicYearRepo.findById(id, tenantId);
    return this.formatAcademicYearResponse(updated);
  }

  formatAcademicYearResponse(academicYear) {
    return {
      id: academicYear.id,
      tenantId: academicYear.tenantId,
      name: academicYear.name,
      startDate: academicYear.startDate,
      endDate: academicYear.endDate,
      isCurrent: academicYear.isCurrent,
      isLocked: academicYear.isLocked,
      createdAt: academicYear.createdAt,
      updatedAt: academicYear.updatedAt,
    };
  }
}
