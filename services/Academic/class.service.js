import { ClassRepository } from "../../repositories/Academic/class.repository.js";
import { SectionRepository } from "../../repositories/Academic/section.repository.js";
import { AppError } from "../../utils/AppError.js";
import { Op } from "sequelize";

const classRepo = new ClassRepository();
const sectionRepo = new SectionRepository();

export class ClassService {

  // Create Class
  async createClass(tenantId, payload) {
    const { name, numericLevel, description } = payload;

    // Duplicate check
    const existing = await classRepo.findByName(name, tenantId);
    if (existing) {
      throw new AppError("Class name already exists for this tenant", 400);
    }

    const newClass = await classRepo.create({
      tenantId,
      name: name.trim(),
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

    // Name update → duplicate check
    if (updateData.name && updateData.name !== existingClass.name) {
      const duplicate = await classRepo.findByName(updateData.name, tenantId);
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
    const classes = await classRepo.findWithSections(tenantId);
    return classes.map((cls) => ({
      id: cls.id,
      tenantId: cls.tenantId,
      name: cls.name,
      numericLevel: cls.numericLevel,
      description: cls.description,
      createdAt: cls.createdAt,
      updatedAt: cls.updatedAt,
      sections: (cls.sections || []).map((sec) => ({
        id: sec.id,
        tenantId: sec.tenantId,
        name: sec.name,
        capacity: sec.capacity,
        classTeacherId: sec.classTeacherId,
        classTeacher: sec.classTeacher ? {
          id: sec.classTeacher.id,
          firstName: sec.classTeacher.firstName,
          lastName: sec.classTeacher.lastName,
          email: sec.classTeacher.email,
          phone: sec.classTeacher.phone,
          status: sec.classTeacher.status,
        } : null,
        classId: sec.classId,
        academicYearId: sec.academicYearId,
        academicYear: sec.academicYear ? {
          id: sec.academicYear.id,
          name: sec.academicYear.name,
          startDate: sec.academicYear.startDate,
          endDate: sec.academicYear.endDate,
          isCurrent: sec.academicYear.isCurrent,
          isLocked: sec.academicYear.isLocked,
        } : null,
        createdAt: sec.createdAt,
        updatedAt: sec.updatedAt,
      })),
    }));
  }

  // ===== NEW: Get classes with sections filtered by academic year, search, and pagination =====
  async getClassesWithSectionsFiltered(tenantId, query) {
    const page = Math.max(parseInt(query.page) || 1, 1);
    const limit = Math.max(parseInt(query.limit) || 10, 1);
    const search = String(query.search || "").trim();
    const academicYearId = query.academicYearId ? String(query.academicYearId).trim() : null;
    const numericLevel = query.numericLevel ? parseInt(query.numericLevel) : null;

    const result = await classRepo.findWithSectionsFiltered(tenantId, {
      search,
      academicYearId,
      numericLevelSearch: numericLevel,
      page,
      limit,
    });

    // Format response with fully populated nested objects
    return {
      total: result.total,
      page: result.page,
      limit: result.limit,
      pages: result.pages,
      data: result.data.map((cls) => ({
        id: cls.id,
        tenantId: cls.tenantId,
        name: cls.name,
        numericLevel: cls.numericLevel,
        description: cls.description,
        createdAt: cls.createdAt,
        updatedAt: cls.updatedAt,
        sections: (cls.sections || []).map((sec) => ({
          id: sec.id,
          tenantId: sec.tenantId,
          name: sec.name,
          capacity: sec.capacity,
          classTeacherId: sec.classTeacherId,
          classTeacher: sec.classTeacher ? {
            id: sec.classTeacher.id,
            firstName: sec.classTeacher.firstName,
            lastName: sec.classTeacher.lastName,
            email: sec.classTeacher.email,
            phone: sec.classTeacher.phone,
            status: sec.classTeacher.status,
          } : null,
          classId: sec.classId,
          academicYearId: sec.academicYearId,
          academicYear: sec.academicYear ? {
            id: sec.academicYear.id,
            name: sec.academicYear.name,
            startDate: sec.academicYear.startDate,
            endDate: sec.academicYear.endDate,
            isCurrent: sec.academicYear.isCurrent,
            isLocked: sec.academicYear.isLocked,
          } : null,
          createdAt: sec.createdAt,
          updatedAt: sec.updatedAt,
        })),
      })),
    };
  }

  // ===== NEW: Get sections for a specific class, optionally filtered by academic year =====
  async getClassSections(classId, tenantId, query) {
    // Verify class exists
    const classData = await classRepo.findById(classId, tenantId);
    if (!classData) {
      throw new AppError("Class not found", 404);
    }

    const page = Math.max(parseInt(query.page) || 1, 1);
    const limit = Math.max(parseInt(query.limit) || 10, 1);
    const academicYearId = query.academicYearId ? String(query.academicYearId).trim() : null;

    // Use repository method to get sections with pagination
    const result = await sectionRepo.findByClassWithPagination(classId, tenantId, page, limit, academicYearId);

    return {
      total: result.total,
      page: result.page,
      limit: result.limit,
      pages: result.pages,
      data: result.data.map((sec) => ({
        id: sec.id,
        tenantId: sec.tenantId,
        name: sec.name,
        capacity: sec.capacity,
        classTeacherId: sec.classTeacherId,
        classTeacher: sec.classTeacher ? {
          id: sec.classTeacher.id,
          firstName: sec.classTeacher.firstName,
          lastName: sec.classTeacher.lastName,
          email: sec.classTeacher.email,
          phone: sec.classTeacher.phone,
          status: sec.classTeacher.status,
        } : null,
        classId: sec.classId,
        academicYearId: sec.academicYearId,
        academicYear: sec.academicYear ? {
          id: sec.academicYear.id,
          tenantId: sec.academicYear.tenantId,
          name: sec.academicYear.name,
          startDate: sec.academicYear.startDate,
          endDate: sec.academicYear.endDate,
          isCurrent: sec.academicYear.isCurrent,
          isLocked: sec.academicYear.isLocked,
        } : null,
        createdAt: sec.createdAt,
        updatedAt: sec.updatedAt,
      })),
    };
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