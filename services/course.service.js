import { CourseRepository } from "../repositories/course.repository.js";
import { AppError } from "../utils/AppError.js";

export class CourseService {
  constructor() {
    this.repository = new CourseRepository();
  }

  // ✅ Course banao
  async createCourse(data) {
    // Step 1 — Request se data variable mein store karo
    const { name, description, tenantId } = data;

    // Step 2 — Validation — Business logic yahan!
    if (!name) {
      throw new AppError("Course name is required", 400);
    }

    // Step 3 — Same name ka course already exist karta hai?
    const existing = await this.repository.findByName(name, tenantId);
    if (existing) {
      throw new AppError("Course with this name already exists", 400);
    }

    // Step 4 — Repository ko data pass karo
    return await this.repository.create({ name, description, tenantId });
  }

  // ✅ Sab courses laao
  async getCourses(tenantId) {
    // Step 1 — tenantId variable mein already hai
    // Step 2 — Repository se data laao
    return await this.repository.findAll(tenantId);
  }

  // ✅ Ek course laao
  async getCourse(id, tenantId) {
    // Step 1 — id aur tenantId variable mein store
    // Step 2 — Repository se laao — andar se error throw hoga agar nahi mila
    return await this.repository.findById(id, tenantId);
  }

  // ✅ Course update karo
  async updateCourse(id, tenantId, data) {
    // Step 1 — Data variable mein store karo
    const { name, description } = data;

    // Step 2 — Kuch update karne ko hai?
    if (!name && !description) {
      throw new AppError("At least one field is required to update", 400);
    }

    // Step 3 — Repository se update karo
    return await this.repository.update(id, tenantId, { name, description });
  }

  // ✅ Course delete karo
  async deleteCourse(id, tenantId) {
    // Step 1 — Repository se delete karo
    // paranoid: true hai toh soft delete hoga automatically!
    return await this.repository.delete(id, tenantId);
  }
}