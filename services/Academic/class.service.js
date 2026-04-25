import { ClassRepository } from "../../repositories/Academic/class.repository.js";
import { AppError } from "../../utils/AppError.js";

const classRepo = new ClassRepository();

export class ClassService {

  // Create Class
  async createClass(tenantId, payload) {
    const { name, numericLevel, description } = payload;
    const trimmedName = name.trim();

    // Duplicate check - case-insensitive
    const existing = await classRepo.findByName(trimmedName, tenantId);
    if (existing) {
      throw new AppError("Class name already exists for this tenant", 400);
    }

    const newClass = await classRepo.create({
      tenantId,
      name: trimmedName,
      numericLevel,
      description,
    });

    return this.formatClassResponse(newClass);
  }

  // Get All Classes (with pagination + filters)
  async getAllClasses(tenantId, query) {
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 10;

    const filters = {};
    if (query.numericLevel) filters.numericLevel = query.numericLevel;

    return await classRepo.findWithPagination(tenantId, filters, page, limit);
  }

  // Get Class By ID
  async getClassById(id, tenantId) {
    const classData = await classRepo.findById(id, tenantId);
    return this.formatClassResponse(classData);
  }

  // Update Class
  async updateClass(id, tenantId, updateData) {
    const existingClass = await classRepo.findById(id, tenantId);

    // Name update → duplicate check (case-insensitive)
    if (updateData.name && updateData.name.trim() !== existingClass.name) {
      const trimmedName = updateData.name.trim();
      const duplicate = await classRepo.findByName(trimmedName, tenantId);
      if (duplicate) {
        throw new AppError("Class name already exists for this tenant", 400);
      }
    }

    const updated = await classRepo.update(id, tenantId, {
      ...(updateData.name !== undefined ? { name: updateData.name.trim() } : {}),
      ...(updateData.numericLevel !== undefined ? { numericLevel: updateData.numericLevel } : {}),
      ...(updateData.description !== undefined ? { description: updateData.description } : {}),
    });

    return this.formatClassResponse(updated);
  }

  // Delete Class
  async deleteClass(id, tenantId) {
    const classData = await classRepo.findById(id, tenantId);

    await classRepo.delete(id, tenantId);

    return {
      message: "Class deleted successfully",
      data: this.formatClassResponse(classData),
    };
  }

  // Get Classes with Sections (relation use)
  async getClassesWithSections(tenantId) {
    return await classRepo.findWithSections(tenantId);
  }

  // Response Formatter (clean response)
  formatClassResponse(classData) {
    return {
      id: classData.id,
      tenantId: classData.tenantId,
      name: classData.name,
      numericLevel: classData.numericLevel,
      description: classData.description,
      createdAt: classData.createdAt,
      updatedAt: classData.updatedAt,
    };
  }
}