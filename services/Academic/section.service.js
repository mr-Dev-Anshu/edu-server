import { SectionRepository } from "../../repositories/Academic/section.repository.js";
import { ClassRepository } from "../../repositories/Academic/class.repository.js";
import { AcademicYearRepository } from "../../repositories/Academic/academicYear.repository.js";
import { AppError } from "../../utils/AppError.js";

const sectionRepo = new SectionRepository();
const classRepo = new ClassRepository();
const academicYearRepo = new AcademicYearRepository();

export class SectionService {

  // Create Section
  async createSection(payload) {
    const { tenantId, name, classId, academicYearId, capacity, classTeacherId } = payload;

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
      capacity: capacity || 40,
      classTeacherId,
    });

    return this.formatSectionResponse(section);
  }

  // Get All Sections
  async getAllSections(tenantId, query) {
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 10;

    const filters = {};
    if (query.classId) filters.classId = query.classId;
    if (query.academicYearId) filters.academicYearId = query.academicYearId;

    return await sectionRepo.findWithPagination(tenantId, filters, page, limit);
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

    // Duplicate check if name/class/year change
    if (
      updateData.name ||
      updateData.classId ||
      updateData.academicYearId
    ) {
      const name = updateData.name || existing.name;
      const classId = updateData.classId || existing.classId;
      const academicYearId =
        updateData.academicYearId || existing.academicYearId;

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

    return this.formatSectionResponse(updated);
  }

  // Delete Section
  async deleteSection(id, tenantId) {
    const section = await sectionRepo.findById(id, tenantId);

    await sectionRepo.delete(id, tenantId);

    return {
      message: "Section deleted successfully",
      data: this.formatSectionResponse(section),
    };
  }

  // Clean Response
  formatSectionResponse(section) {
    return {
      id: section.id,
      tenantId: section.tenantId,
      name: section.name,
      classId: section.classId,
      academicYearId: section.academicYearId,
      capacity: section.capacity,
      classTeacherId: section.classTeacherId,
      createdAt: section.createdAt,
      updatedAt: section.updatedAt,
    };
  }
}