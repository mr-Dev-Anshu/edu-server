import { ClassRepository } from "../../repositories/Academic/class.repository.js";
import { SectionRepository } from "../../repositories/Academic/section.repository.js";
import { AcademicYearRepository } from "../../repositories/Academic/academicYear.repository.js";
import { AppError } from "../../utils/AppError.js";
import sequelize from "../../config/db.js";

const classRepo = new ClassRepository();
const sectionRepo = new SectionRepository();
const academicYearRepo = new AcademicYearRepository();

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
    return await classRepo.findWithSections(tenantId);
  }

  // Bulk Create Classes with Sections
  async bulkCreateClassesWithSections(tenantId, classesData) {
    // Get current academic year
    const academicYear = await academicYearRepo.findCurrentYear(tenantId);
    if (!academicYear) {
      throw new AppError("No current academic year set", 400);
    }

    const validationErrors = [];
    const classNames = new Set();
    const classesToCreate = [];

    // Validate input
    if (!Array.isArray(classesData)) {
      throw new AppError("Input must be an array of class objects", 400);
    }

    // First pass: validate format
    for (let i = 0; i < classesData.length; i++) {
      const item = classesData[i];
      if (!item || typeof item !== 'object') {
        validationErrors.push(`Item ${i + 1}: Must be an object`);
        continue;
      }

      if (!item.class || typeof item.class !== 'string' || item.class.trim() === '') {
        validationErrors.push(`Item ${i + 1}: Class name is required and must be a non-empty string`);
        continue;
      }

      const className = item.class.trim();
      if (classNames.has(className)) {
        validationErrors.push(`Item ${i + 1}: Duplicate class name '${className}' in input`);
        continue;
      }

      if (!Array.isArray(item.sections)) {
        validationErrors.push(`Item ${i + 1}: Sections must be an array`);
        continue;
      }

      const sectionNames = new Set();
      let hasInvalidSection = false;
      for (let j = 0; j < item.sections.length; j++) {
        const sec = item.sections[j];
        if (!sec || typeof sec !== 'string' || sec.trim() === '') {
          validationErrors.push(`Item ${i + 1}, Section ${j + 1}: Section name is required and must be a non-empty string`);
          hasInvalidSection = true;
          continue;
        }

        const secName = sec.trim();
        if (sectionNames.has(secName)) {
          validationErrors.push(`Item ${i + 1}, Section ${j + 1}: Duplicate section name '${secName}' in this class`);
          hasInvalidSection = true;
          continue;
        }

        sectionNames.add(secName);
      }

      if (hasInvalidSection) continue;

      classNames.add(className);
      classesToCreate.push({
        className,
        sections: item.sections.map(s => s.trim()),
        index: i + 1,
      });
    }

    if (validationErrors.length > 0) {
      throw new AppError(`Validation failed: ${validationErrors.join('; ')}`, 400);
    }

    // Now create with transaction - second pass inside transaction to avoid race conditions
    const result = await sequelize.transaction(async (transaction) => {
      const createdClasses = [];
      const createdSections = [];
      const skipped = [];

      for (const classItem of classesToCreate) {
        let classId;
        let isExisting = false;

        // Check if class already exists (inside transaction)
        const existingClass = await classRepo.findByName(classItem.className, tenantId, { transaction });
        if (existingClass) {
          skipped.push({
            className: classItem.className,
            reason: "Class already exists",
          });
          classId = existingClass.id;
          isExisting = true;
        } else {
          // Create new class
          const newClass = await classRepo.create({
            tenantId,
            name: classItem.className,
          }, { transaction });
          classId = newClass.id;
          createdClasses.push(this.formatClassResponse(newClass));
        }

        // Create sections for this class (whether new or existing)
        for (const secName of classItem.sections) {
          // Check if section already exists for this class and academic year (inside transaction)
          const existingSection = await sectionRepo.findDuplicate(
            secName,
            classId,
            academicYear.id,
            tenantId,
            { transaction }
          );

          if (!existingSection) {
            try {
              const newSection = await sectionRepo.create({
                tenantId,
                name: secName,
                classId: classId,
                academicYearId: academicYear.id,
                capacity: 40,
              }, { transaction });

              createdSections.push({
                id: newSection.id,
                tenantId: newSection.tenantId,
                name: newSection.name,
                classId: newSection.classId,
                academicYearId: newSection.academicYearId,
                capacity: newSection.capacity,
                createdAt: newSection.createdAt,
                updatedAt: newSection.updatedAt,
              });
            } catch (err) {
              // Skip section if unique constraint error (section already exists)
              if (err.name === 'SequelizeUniqueConstraintError') {
                continue;
              }
              throw err;
            }
          }
        }
      }

      return { classes: createdClasses, sections: createdSections, skipped };
    });

    return result;
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