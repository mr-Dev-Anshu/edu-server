import { CourseRepository } from "../repositories/course.repository.js";
import { AppError } from "../utils/AppError.js";

export class CourseService {
  constructor() {
    this.repo = new CourseRepository();
  }

  // ✅ CREATE COURSE
  async createCourse(data, tenantId) {
    if (!data.name || !data.code) {
      throw new AppError("name and code are required", 400);
    }

    const payload = {
      ...data,
      tenantId,
    };

    return await this.repo.create(payload);
  }

  // ✅ GET ALL COURSES
  async getAllCourses(tenantId, query) {
  const filter = {};

  if (query.name) {
    filter.name = {
      [Op.iLike]: `%${query.name}%`
    };
  }

  return await this.repo.findAll(tenantId, filter);
}

  // ✅ GET SINGLE COURSE
  async getCourseById(id, tenantId) {
    const course = await this.repo.findById(id, tenantId);

    if (!course) {
      throw new AppError("Course not found", 404);
    }

    return course;
  }

  // ✅ UPDATE COURSE
  async updateCourse(id, tenantId, data) {
    const course = await this.getCourseById(id, tenantId);

    await course.update(data);

    return course;
  }

  // ✅ DELETE COURSE (soft delete if paranoid = true)
  async deleteCourse(id, tenantId) {
    const course = await this.getCourseById(id, tenantId);

    await course.destroy();

    return { message: "Course deleted successfully" };
  }
}