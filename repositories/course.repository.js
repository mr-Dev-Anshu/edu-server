import { BaseRepository } from "./base.repository.js";
import { Course } from "../models/Course.js";

export class CourseRepository extends BaseRepository {
  constructor() {
    super(Course); // BaseRepository ko Course model pass karo
  }

  // BaseRepository se yeh sab automatically milega:
  // ✅ findById(id, tenantId)
  // ✅ findAll(tenantId, filter)
  // ✅ search(tenantId, searchTerm, fields)
  // ✅ create(data)
  // ✅ update(id, tenantId, data)
  // ✅ delete(id, tenantId)

  // 🔹 Course specific — name se dhundna
  async findByName(name, tenantId) {
    return await this.model.findOne({
      where: { name, tenant_id: tenantId },
    });
  }
}