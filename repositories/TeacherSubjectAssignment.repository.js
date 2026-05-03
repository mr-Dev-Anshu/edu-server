import { TeacherSubjectAssignment, Staff, Subject, Section, AcademicYear } from "../models/index.js";
import { BaseRepository } from "./base.repository.js";

export class TeacherSubjectAssignmentRepository extends BaseRepository {
  constructor() {
    super(TeacherSubjectAssignment);
  }

  async demotePrimaryByComposite(tenantId, subjectId, sectionId, academicYearId, transaction) {
    return await this.model.update(
      { isPrimaryTeacher: false },
      { where: { tenantId, subjectId, sectionId, academicYearId, isPrimaryTeacher: true }, transaction }
    );
  }

  async findWithFilters(tenantId, filters = {}, page = 1, limit = 10, options = {}) {
    const offset = (page - 1) * limit;
    const where = { tenantId, ...filters };

    const include = options.include || [
      {
        association: "staff",
        include: [{ association: "user", attributes: ["id", "firstName", "lastName", "email", "phone", "status"] }],
      },
      { association: "subject" },
      { association: "section" },
      { association: "academicYear" },
    ];

    const { count, rows } = await this.model.findAndCountAll({
      where,
      offset,
      limit,
      include,
      distinct: true,
      order: [["createdAt", "DESC"]],
      ...options,
    });

    return {
      total: count,
      page,
      limit,
      pages: Math.ceil(count / limit),
      data: rows,
    };
  }

  async softDelete(id, tenantId, options = {}) {
    return await this.model.destroy({ where: { id, tenantId }, ...options });
  }
}
