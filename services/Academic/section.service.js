import { SectionRepository } from "../../repositories/Academic/section.repository.js";
import { ClassRepository } from "../../repositories/Academic/class.repository.js";
import { AcademicYearRepository } from "../../repositories/Academic/academicYear.repository.js";
import { AppError } from "../../utils/AppError.js";

const sectionRepo = new SectionRepository();
const classRepo = new ClassRepository();
const academicYearRepo = new AcademicYearRepository();

export class SectionService {

  // Create Section
  async createSection(tenantId, payload) {
    const { name, classId, academicYearId, capacity, classTeacherId } = payload;

    // Check Class exists
    const classExists = await classRepo.findById(classId, tenantId);
    if (!classExists) {
      throw new AppError("Class not found", 404);
    }

    // Check Academic Year exists
    const yearExists = await academicYearRepo.findById(academicYearId, tenantId);
    if (!yearExists) {
      throw new AppError("Academic year not found", 404);
    }

    // Duplicate check
    const duplicate = await sectionRepo.findDuplicate(
      name,
      classId,
      academicYearId,
      tenantId
    );

    if (duplicate) {
      throw new AppError("Section already exists for this class and academic year", 400);
    }

    const section = await sectionRepo.create({
      tenantId,
      name: name.trim(),
      classId,
      academicYearId,
      capacity: capacity ?? 40,
      classTeacherId,
    });

    // Reload with associations
    const fullSection = await sectionRepo.findWithDetails(section.id, tenantId);
    return this.formatSectionResponse(fullSection);
  }

  // Get All Sections
  async getAllSections(tenantId, query) {
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 10;

    const filters = {};
    if (query.classId) filters.classId = query.classId;
    if (query.academicYearId) filters.academicYearId = query.academicYearId;

    const result = await sectionRepo.findWithPagination(tenantId, filters, page, limit);
    
    return {
      total: result.total,
      page: result.page,
      limit: result.limit,
      pages: result.pages,
      data: result.data.map((section) => this.formatSectionResponse(section)),
    };
  }

  // Get Section by ID
  async getSectionById(id, tenantId) {
    const section = await sectionRepo.findWithDetails(id, tenantId);
    if (!section) {
      throw new AppError("Section not found", 404);
    }
    return this.formatSectionResponse(section);
  }

  // Update Section
  async updateSection(id, tenantId, updateData) {
    const existing = await sectionRepo.findById(id, tenantId);

    // Validate changed references and duplicate values
    if (updateData.classId !== undefined && updateData.classId !== existing.classId) {
      await classRepo.findById(updateData.classId, tenantId);
    }

    if (updateData.academicYearId !== undefined && updateData.academicYearId !== existing.academicYearId) {
      await academicYearRepo.findById(updateData.academicYearId, tenantId);
    }

    if (
      updateData.name !== undefined ||
      updateData.classId !== undefined ||
      updateData.academicYearId !== undefined
    ) {
      const name = updateData.name !== undefined ? updateData.name.trim() : existing.name;
      const classId = updateData.classId !== undefined ? updateData.classId : existing.classId;
      const academicYearId =
        updateData.academicYearId !== undefined ? updateData.academicYearId : existing.academicYearId;

      const duplicate = await sectionRepo.findDuplicate(
        name,
        classId,
        academicYearId,
        tenantId
      );

      if (duplicate && duplicate.id !== id) {
        throw new AppError("Section already exists for this class and academic year", 400);
      }
    }

    const updated = await sectionRepo.update(id, tenantId, {
      ...(updateData.name !== undefined ? { name: updateData.name.trim() } : {}),
      ...(updateData.classId !== undefined ? { classId: updateData.classId } : {}),
      ...(updateData.academicYearId !== undefined ? { academicYearId: updateData.academicYearId } : {}),
      ...(updateData.capacity !== undefined ? { capacity: updateData.capacity } : {}),
      ...(updateData.classTeacherId !== undefined ? { classTeacherId: updateData.classTeacherId } : {}),
    });

    // Reload with associations
    const fullSection = await sectionRepo.findWithDetails(id, tenantId);
    return this.formatSectionResponse(fullSection);
  }

  // Delete Section
  async deleteSection(id, tenantId) {
    const section = await sectionRepo.findWithDetails(id, tenantId);

    await sectionRepo.delete(id, tenantId);

    return {
      message: "Section deleted successfully",
      data: this.formatSectionResponse(section),
    };
  }

  // Get Section Options (for dropdowns)
  async getSectionOptions(tenantId, classId, academicYearId) {
    // Validate classId
    const classExists = await classRepo.findById(classId, tenantId);
    if (!classExists) {
      throw new AppError("Class not found", 404);
    }

    // Validate academicYearId
    const yearExists = await academicYearRepo.findById(academicYearId, tenantId);
    if (!yearExists) {
      throw new AppError("Academic year not found", 404);
    }

    return await sectionRepo.findOptions(tenantId, classId, academicYearId);
  }

  // Clean Response
  formatSectionResponse(section) {
    return {
      id: section.id,
      name: section.name,
      capacity: section.capacity,
      classTeacherId: section.classTeacherId,
      createdAt: section.createdAt,
      updatedAt: section.updatedAt,
      class: section.class
        ? {
            id: section.class.id,
            name: section.class.name,
            numericLevel: section.class.numericLevel,
          }
        : undefined,
      academicYear: section.academicYear
        ? {
            id: section.academicYear.id,
            name: section.academicYear.name,
            isCurrent: section.academicYear.isCurrent,
          }
        : undefined,
    };
  }
}