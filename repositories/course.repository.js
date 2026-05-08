// repositories/course.repository.js

import { BaseRepository } from "./base.repository.js";
import { Course } from "../models/Course.js";
import { Op } from "sequelize"; // ✅ IMPORTANT

export class CourseRepository extends BaseRepository {
  constructor() {
    super(Course);
  }

  async findAllWithFilters(tenantId, filters = {}) {
    let { page = 1, limit = 10, name } = filters;

    // ✅ Convert to numbers (VERY IMPORTANT)
    page = parseInt(page);
    limit = parseInt(limit);

    const offset = (page - 1) * limit;

    return await this.model.findAndCountAll({ // ✅ use this.model
      where: {
        tenantId,
        ...(name && {
          name: {
            [Op.iLike]: `%${name}%`, // ✅ case-insensitive search
          },
        }),
      },
      limit,
      offset,
      order: [["createdAt", "DESC"]], // ✅ stable pagination
    });
  }
}