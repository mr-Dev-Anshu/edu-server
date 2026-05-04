import { CourseRepository } from "../repositories/course.repository.js";
import { AppError } from "../utils/AppError.js";

const courseRepo = new CourseRepository();

export class CourseService {
  async createCourse(payload, tenantId) {
    const code = payload.code?.trim().toUpperCase();

    const existingCourse = await courseRepo.findByCode(code, tenantId);
    if (existingCourse) {
      throw new AppError("Course code already exists", 409);
    }

    const courseData = {
      title: payload.title?.trim(),
      code,
      description: payload.description?.trim() || null,
      duration: payload.duration?.trim() || null,
      isActive: payload.isActive ?? true,
      tenantId,
    };

    return await courseRepo.create(courseData);
  }

  async getAllCourses(tenantId, filter = {}) {
    return await courseRepo.findAllCourses(tenantId, filter);
  }

  async getCourseById(id, tenantId) {
    return await courseRepo.findCourseById(id, tenantId);
  }

  async updateCourse(id, tenantId, payload) {
    const updateData = {};

    if (payload.title !== undefined) updateData.title = payload.title.trim();
    if (payload.code !== undefined) {
      const code = payload.code.trim().toUpperCase();

      const existingCourse = await courseRepo.findByCode(code, tenantId);
      if (existingCourse && existingCourse.id !== id) {
        throw new AppError("Course code already exists", 409);
      }

      updateData.code = code;
    }
    if (payload.description !== undefined) {
      updateData.description = payload.description?.trim() || null;
    }
    if (payload.duration !== undefined) {
      updateData.duration = payload.duration?.trim() || null;
    }
    if (payload.isActive !== undefined) {
      updateData.isActive = payload.isActive;
    }

    return await courseRepo.updateCourse(id, tenantId, updateData);
  }

  async deleteCourse(id, tenantId) {
    await courseRepo.deleteCourse(id, tenantId);
  }
}