import { ClassSubject } from "../../../models/index.js";
import { BaseRepository } from "../../base.repository.js";
import { Op } from "sequelize";

export class ClassSubjectRepository extends BaseRepository {
  constructor() {
    super(ClassSubject);
  }

  async findByClassId(classId, tenantId, options = {}) {
    const queryOptions = Array.isArray(options) ? { include: options } : options;
    
    return await this.model.findAll({
      where: { classId, tenantId },
      include: [
        {
          association: "subject",
          attributes: ["id", "name", "type"]
        },
        {
          association: "class",
          attributes: ["id", "name", "numericLevel"]
        }
      ],
      order: [["createdAt", "DESC"]],
      ...queryOptions,
    });
  }

  async findBySubjectId(subjectMasterId, tenantId, options = {}) {
    const queryOptions = Array.isArray(options) ? { include: options } : options;
    
    return await this.model.findAll({
      where: { subjectMasterId, tenantId },
      include: [
        {
          association: "subject",
          attributes: ["id", "name", "type"]
        },
        {
          association: "class",
          attributes: ["id", "name", "numericLevel"]
        }
      ],
      order: [["createdAt", "DESC"]],
      ...queryOptions,
    });
  }

  async findByClassAndSubject(classId, subjectMasterId, tenantId, options = {}) {
    const queryOptions = Array.isArray(options) ? { include: options } : options;
    
    return await this.model.findOne({
      where: { classId, subjectMasterId, tenantId },
      include: [
        {
          association: "subject",
          attributes: ["id", "name", "type"]
        },
        {
          association: "class",
          attributes: ["id", "name", "numericLevel"]
        }
      ],
      ...queryOptions,
    });
  }

  async findAllByClassAndSubjectIds(classId, subjectMasterIds, tenantId, options = {}) {
    const queryOptions = Array.isArray(options) ? { include: options } : options;

    return await this.model.findAll({
      where: {
        classId,
        subjectMasterId: { [Op.in]: subjectMasterIds },
        tenantId,
      },
      attributes: ["id", "subjectMasterId", "code", "isElective", "weeklyPeriods", "passingMarks"],
      ...queryOptions,
    });
  }

  async findWithPagination(tenantId, filters = {}, page = 1, limit = 10, options = {}) {
    const offset = (page - 1) * limit;
    const where = { tenantId, ...filters };
    const { where: _where, distinct, order, ...queryOptions } = options;
    
    const include = options.include || [
      {
        association: "subject",
        attributes: ["id", "name", "type"]
      },
      {
        association: "class",
        attributes: ["id", "name", "numericLevel"]
      }
    ];
    
    const { count, rows } = await this.model.findAndCountAll({
      where,
      offset,
      limit,
      include,
      distinct: distinct ?? Boolean(include),
      order: order || [["createdAt", "DESC"]],
      ...queryOptions,
    });

    return {
      total: count,
      page,
      limit,
      pages: Math.ceil(count / limit),
      data: rows,
    };
  }

  async searchClassSubject(tenantId, searchTerm, page = 1, limit = 10, filters = {}) {
    return await this.search(tenantId, searchTerm, [
      "code",
    ], {
      page,
      limit,
      filters,
      order: [["createdAt", "DESC"]],
      include: [
        {
          association: "subject",
          attributes: ["id", "name", "type"]
        },
        {
          association: "class",
          attributes: ["id", "name", "numericLevel"]
        }
      ],
    });
  }

  async deleteByClassId(classId, tenantId) {
    return await this.model.destroy({
      where: { classId, tenantId }
    });
  }
}
