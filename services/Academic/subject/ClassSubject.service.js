import { ClassSubjectRepository } from "../../../repositories/Academic/subject/ClassSubject.repository.js";
import { SubjectMasterRepository } from "../../../repositories/Academic/subject/SubjectMaster.repository.js";
import { Class } from "../../../models/index.js";
import { BaseService } from "../../base.service.js";
import { AppError } from "../../../utils/AppError.js";
import sequelize from "../../../config/db.js";
import { Op } from "sequelize";

const classSubjectRepo = new ClassSubjectRepository();
const subjectRepo = new SubjectMasterRepository();

export class ClassSubjectService extends BaseService {
  constructor() {
    super(classSubjectRepo);
  }

  /**
   * ASSIGN MULTIPLE SUBJECTS TO A CLASS
   * Accepts array of subjects with mapping details
   */
  async assignSubjectsToClass(tenantId, payload) {
    const { classId, subjects } = payload;

    if (!classId) {
      throw new AppError("classId is required", 400);
    }

    if (!Array.isArray(subjects) || subjects.length === 0) {
      throw new AppError("subjects array is required and must not be empty", 400);
    }

    // Verify class exists
    const classRecord = await Class.findOne({
      where: { id: classId, tenantId }
    });
    if (!classRecord) {
      throw new AppError("Class not found", 404);
    }

    // Verify all subjects exist
    const subjectIds = subjects.map(s => s.subjectMasterId);
    const existingSubjects = await subjectRepo.model.findAll({
      where: {
        id: { [Op.in]: subjectIds },
        tenantId
      }
    });

    if (existingSubjects.length !== subjectIds.length) {
      throw new AppError("One or more subjects not found", 404);
    }

    const transaction = await sequelize.transaction();

    try {
      const results = [];

      for (const subjectData of subjects) {
        const { subjectMasterId, code, isElective, weeklyPeriods, passingMarks } = subjectData;

        // Check if this mapping already exists
        const existing = await classSubjectRepo.findByClassAndSubject(
          classId,
          subjectMasterId,
          tenantId
        );

        if (existing) {
          // Update existing mapping
          const updated = await classSubjectRepo.update(
            existing.id,
            tenantId,
            {
              code: code || existing.code,
              isElective: isElective !== undefined ? isElective : existing.isElective,
              weeklyPeriods: weeklyPeriods || existing.weeklyPeriods,
              passingMarks: passingMarks || existing.passingMarks
            },
            { transaction }
          );
          results.push(this.formatClassSubjectResponse(updated));
        } else {
          // Create new mapping
          const newMapping = await classSubjectRepo.create({
            tenantId,
            classId,
            subjectMasterId,
            code: code || null,
            isElective: isElective || false,
            weeklyPeriods: weeklyPeriods || 5,
            passingMarks: passingMarks || 33
          }, { transaction });

          // Fetch with associations
          const withAssociations = await classSubjectRepo.findById(newMapping.id, tenantId, {
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
            transaction
          });

          results.push(this.formatClassSubjectResponse(withAssociations));
        }
      }

      await transaction.commit();
      return {
        message: `${results.length} subject(s) assigned to class successfully`,
        classId,
        data: results
      };
    } catch (error) {
      if (!transaction.finished) await transaction.rollback();
      throw error;
    }
  }

  /**
   * GET ALL CLASS SUBJECTS BY CLASS ID
   */
  async getSubjectsByClassId(classId, tenantId, query) {
    const page = Number.parseInt(query.page, 10) > 0 ? Number.parseInt(query.page, 10) : 1;
    const limit = Number.parseInt(query.limit, 10) > 0 ? Number.parseInt(query.limit, 10) : 10;

    const where = { classId, tenantId };

    if (query.isElective) {
      where.isElective = query.isElective === "true" || query.isElective === true;
    }

    const result = await classSubjectRepo.findWithPagination(tenantId, where, page, limit);
    result.data = result.data.map(cs => this.formatClassSubjectResponse(cs));
    
    return result;
  }

  /**
   * GET ALL CLASSES FOR A SUBJECT ID
   */
  async getClassesBySubjectId(subjectMasterId, tenantId, query) {
    const page = Number.parseInt(query.page, 10) > 0 ? Number.parseInt(query.page, 10) : 1;
    const limit = Number.parseInt(query.limit, 10) > 0 ? Number.parseInt(query.limit, 10) : 10;

    const where = { subjectMasterId, tenantId };

    const result = await classSubjectRepo.findWithPagination(tenantId, where, page, limit);
    result.data = result.data.map(cs => this.formatClassSubjectResponse(cs));
    
    return result;
  }

  /**
   * GET SINGLE CLASS SUBJECT MAPPING
   */
  async getClassSubjectById(id, tenantId) {
    const classSubject = await classSubjectRepo.findById(id, tenantId, {
      include: [
        {
          association: "subject",
          attributes: ["id", "name", "type"]
        },
        {
          association: "class",
          attributes: ["id", "name", "numericLevel"]
        }
      ]
    });
    return this.formatClassSubjectResponse(classSubject);
  }

  /**
   * UPDATE CLASS SUBJECT MAPPING
   */
  async updateClassSubject(id, tenantId, payload) {
    const { code, isElective, weeklyPeriods, passingMarks } = payload;

    const classSubject = await classSubjectRepo.findById(id, tenantId);

    const updatedClassSubject = await classSubjectRepo.update(id, tenantId, {
      code: code !== undefined ? code : classSubject.code,
      isElective: isElective !== undefined ? isElective : classSubject.isElective,
      weeklyPeriods: weeklyPeriods !== undefined ? weeklyPeriods : classSubject.weeklyPeriods,
      passingMarks: passingMarks !== undefined ? passingMarks : classSubject.passingMarks
    });

    // Fetch with associations
    const withAssociations = await classSubjectRepo.findById(updatedClassSubject.id, tenantId, {
      include: [
        {
          association: "subject",
          attributes: ["id", "name", "type"]
        },
        {
          association: "class",
          attributes: ["id", "name", "numericLevel"]
        }
      ]
    });

    return this.formatClassSubjectResponse(withAssociations);
  }

  /**
   * DELETE CLASS SUBJECT MAPPING
   */
  async deleteClassSubject(id, tenantId) {
    const classSubject = await classSubjectRepo.findById(id, tenantId);

    await classSubjectRepo.delete(id, tenantId);

    return {
      message: "Subject removed from class successfully",
      id,
      classId: classSubject.classId,
      subjectId: classSubject.subjectMasterId
    };
  }

  /**
   * DELETE ALL SUBJECTS FROM A CLASS
   */
  async removeAllSubjectsFromClass(classId, tenantId) {
    const deletedCount = await classSubjectRepo.deleteByClassId(classId, tenantId);

    return {
      message: `${deletedCount} subject(s) removed from class`,
      classId,
      deletedCount
    };
  }

  /**
   * SEARCH CLASS SUBJECTS
   */
  async searchClassSubjects(tenantId, query) {
    const page = Number.parseInt(query.page, 10) > 0 ? Number.parseInt(query.page, 10) : 1;
    const limit = Number.parseInt(query.limit, 10) > 0 ? Number.parseInt(query.limit, 10) : 10;
    const searchTerm = String(query.search || "").trim();

    const result = await classSubjectRepo.searchClassSubject(tenantId, searchTerm, page, limit);
    result.data = result.data.map(cs => this.formatClassSubjectResponse(cs));
    
    return result;
  }

  /**
   * FORMAT RESPONSE
   */
  formatClassSubjectResponse(classSubject) {
    if (!classSubject) return null;

    return {
      id: classSubject.id,
      classId: classSubject.classId,
      subjectMasterId: classSubject.subjectMasterId,
      code: classSubject.code,
      isElective: classSubject.isElective,
      weeklyPeriods: classSubject.weeklyPeriods,
      passingMarks: classSubject.passingMarks,
      tenantId: classSubject.tenantId,
      subject: classSubject.subject ? {
        id: classSubject.subject.id,
        name: classSubject.subject.name,
        type: classSubject.subject.type
      } : null,
      class: classSubject.class ? {
        id: classSubject.class.id,
        name: classSubject.class.name,
        numericLevel: classSubject.class.numericLevel
      } : null,
      createdAt: classSubject.createdAt,
      updatedAt: classSubject.updatedAt
    };
  }
}
