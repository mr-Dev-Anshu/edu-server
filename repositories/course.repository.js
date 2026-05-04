import { Course } from "../models/index.js";
import { BaseRepository } from "./base.repository.js";
import { AppError } from "../utils/AppError.js";

export class CourseRepository extends BaseRepository {
  constructor() {
    super(Course);
  }

  async findByCode(code, tenantId) {
    return await this.model.findOne({
      where: {
        code: code.trim().toUpperCase(),
        tenantId,
      },
    });
  }

  async findAllCourses(tenantId, filter = {}) {
    return await this.model.findAll({
      where: {
        ...filter,
        tenantId,
      },
      order: [["createdAt", "DESC"]],
    });
  }

  async findCourseById(id, tenantId) {
    const course = await this.model.findOne({
      where: { id, tenantId },
    });

    if (!course) {
      throw new AppError("Course not found", 404);
    }

    return course;
  }

  async updateCourse(id, tenantId, data) {
    const course = await this.findCourseById(id, tenantId);
    return await course.update(data);
  }

  async deleteCourse(id, tenantId) {
    const course = await this.findCourseById(id, tenantId);
    return await course.destroy();
  }
}