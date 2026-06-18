import { ClassRepository } from "../../repositories/Academic/class.repository.js";
import { SectionRepository } from "../../repositories/Academic/section.repository.js";
import { StudentSectionEnrollmentRepository } from "../../repositories/studentSectionEnrollment.repository.js";
import { AppError } from "../../utils/AppError.js";

const classRepo = new ClassRepository();
const sectionRepo = new SectionRepository();
const enrollmentRepo = new StudentSectionEnrollmentRepository();

const formatTeacherSummary = (user) =>
  user
    ? {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        status: user.status,
      }
    : null;

const formatAcademicYearSummary = (academicYear) =>
  academicYear
    ? {
        id: academicYear.id,
        tenantId: academicYear.tenantId,
        name: academicYear.name,
        startDate: academicYear.startDate,
        endDate: academicYear.endDate,
        isCurrent: academicYear.isCurrent,
        isLocked: academicYear.isLocked,
      }
    : null;

const formatClassSection = (section, enrolledCount = 0) => ({
  id: section.id,
  tenantId: section.tenantId,
  name: section.name,
  capacity: section.capacity,
  enrolledCount,
  classTeacherId: section.classTeacherId,
  classTeacher: formatTeacherSummary(section.classTeacher),
  classId: section.classId,
  academicYearId: section.academicYearId,
  academicYear: formatAcademicYearSummary(section.academicYear),
  createdAt: section.createdAt,
  updatedAt: section.updatedAt,
});

const formatClassWithSections = (classData, sectionCounts = new Map()) => {
  const sections = (classData.sections || []).map((section) =>
    formatClassSection(section, sectionCounts.get(section.id) || 0),
  );

  return {
    id: classData.id,
    tenantId: classData.tenantId,
    name: classData.name,
    numericLevel: classData.numericLevel,
    description: classData.description,
    totalEnrollment: sections.reduce((sum, section) => sum + section.enrolledCount, 0),
    createdAt: classData.createdAt,
    updatedAt: classData.updatedAt,
    sections,
  };
};

export class ClassService {

  async attachEnrollmentCounts(classes, academicYearId = null) {
    const sectionIds = classes.flatMap((classData) => (classData.sections || []).map((section) => section.id));
    const tenantId = classes[0]?.tenantId || null;
    const counts = await enrollmentRepo.countBySectionIds(tenantId, sectionIds, academicYearId);
    const sectionCountMap = new Map(counts.map(({ sectionId, count }) => [sectionId, count]));

    return classes.map((classData) => formatClassWithSections(classData, sectionCountMap));
  }

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
    const search = String(query.search || "").trim();

    const filters = {};
    if (query.numericLevel) filters.numericLevel = query.numericLevel;
    if (search) filters.search = search;

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
    return await this.attachEnrollmentCounts(classes);
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

    const classesWithCounts = await this.attachEnrollmentCounts(result.data, academicYearId);

    return {
      total: result.total,
      page: result.page,
      limit: result.limit,
      pages: result.pages,
      data: classesWithCounts,
    };
  }

  // ===== NEW: Get sections for a specific class, optionally filtered by academic year =====
  async getClassSections(classId, tenantId, query) {
    const classData = await classRepo.findById(classId, tenantId);
    if (!classData) {
      throw new AppError("Class not found", 404);
    }

    const page = Math.max(parseInt(query.page) || 1, 1);
    const limit = Math.max(parseInt(query.limit) || 10, 1);
    const academicYearId = query.academicYearId ? String(query.academicYearId).trim() : null;
    const search = query.search ? String(query.search).trim() : null;
    const result = await sectionRepo.findByClassWithPagination(
      classId,
      tenantId,
      page,
      limit,
      academicYearId,
      search,
    );

    const sectionCounts = await enrollmentRepo.countBySectionIds(
      tenantId,
      result.data.map((section) => section.id),
      academicYearId,
    );
    const sectionCountMap = new Map(sectionCounts.map((entry) => [entry.sectionId, entry.count]));

    return {
      total: result.total,
      page: result.page,
      limit: result.limit,
      pages: result.pages,
      totalEnrollment: sectionCounts.reduce((sum, entry) => sum + entry.count, 0),
      data: result.data.map((section) => formatClassSection(section, sectionCountMap.get(section.id) || 0)),
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