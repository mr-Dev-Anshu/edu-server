import { SubjectMasterRepository } from "../../../repositories/Academic/subject/SubjectMaster.repository.js";
import { BaseService } from "../../base.service.js";
import { AppError } from "../../../utils/AppError.js";
import sequelize from "../../../config/db.js";
import { Op } from "sequelize";

const subjectRepo = new SubjectMasterRepository();

export class SubjectMasterService extends BaseService {
  constructor() {
    super(subjectRepo);
  }

  /**
   * CREATE SUBJECT MASTER
   */
  async createSubjectMaster(tenantId, payload) {
    const { name, type } = payload;

    // Check if subject with same name already exists
    const existingSubject = await subjectRepo.findByName(name, tenantId);
    if (existingSubject) {
      throw new AppError("Subject with this name already exists", 400);
    }

    const subject = await subjectRepo.create({
      tenantId,
      name: name.trim(),
      type: type || "theory"
    });

    return this.formatSubjectResponse(subject);
  }

  /**
   * GET ALL SUBJECTS WITH PAGINATION & FILTERS
   */
  async getAllSubjects(tenantId, query) {
    const page = Number.parseInt(query.page, 10) > 0 ? Number.parseInt(query.page, 10) : 1;
    const limit = Number.parseInt(query.limit, 10) > 0 ? Number.parseInt(query.limit, 10) : 10;

    const where = { tenantId };

    if (query.type) {
      where.type = query.type;
    }

    const result = await subjectRepo.findWithPagination(tenantId, where, page, limit);
    result.data = result.data.map(subject => this.formatSubjectResponse(subject));
    
    return result;
  }

  /**
   * GET SINGLE SUBJECT BY ID
   */
  async getSubjectById(id, tenantId) {
    const subject = await subjectRepo.findById(id, tenantId);
    return this.formatSubjectResponse(subject);
  }

  /**
   * GET SUBJECT WITH ALL MAPPED CLASSES
   */
  async getSubjectWithClasses(id, tenantId) {
    const subject = await subjectRepo.findWithClassSubjects(id, tenantId);
    if (!subject) {
      throw new AppError("Subject not found", 404);
    }
    return this.formatSubjectWithClassesResponse(subject);
  }

  /**
   * UPDATE SUBJECT
   */
  async updateSubjectMaster(id, tenantId, payload) {
    const { name, type } = payload;

    const subject = await subjectRepo.findById(id, tenantId);

    // Check if new name is already taken by another subject
    if (name && name !== subject.name) {
      const existingSubject = await subjectRepo.findByName(name, tenantId);
      if (existingSubject) {
        throw new AppError("Subject with this name already exists", 400);
      }
    }

    const updatedSubject = await subjectRepo.update(id, tenantId, {
      name: name ? name.trim() : subject.name,
      type: type || subject.type
    });

    return this.formatSubjectResponse(updatedSubject);
  }

  /**
   * DELETE SUBJECT
   */
  async deleteSubjectMaster(id, tenantId) {
    const subject = await subjectRepo.findById(id, tenantId);

    // Check if subject is mapped to any class
    const classSubjects = await subjectRepo.findWithClassSubjects(id, tenantId);
    if (classSubjects?.classSubjects?.length > 0) {
      throw new AppError(
        `Cannot delete subject - it is mapped to ${classSubjects.classSubjects.length} class(es)`,
        400
      );
    }

    await subjectRepo.delete(id, tenantId);

    return {
      message: "Subject deleted successfully",
      id
    };
  }

  /**
   * SEARCH SUBJECTS
   */
  async searchSubjects(tenantId, query) {
    const page = Number.parseInt(query.page, 10) > 0 ? Number.parseInt(query.page, 10) : 1;
    const limit = Number.parseInt(query.limit, 10) > 0 ? Number.parseInt(query.limit, 10) : 10;
    const searchTerm = String(query.search || "").trim();

    const result = await subjectRepo.searchSubject(tenantId, searchTerm, page, limit);
    result.data = result.data.map(subject => this.formatSubjectResponse(subject));
    
    return result;
  }

  /**
   * FORMAT RESPONSE
   */
  formatSubjectResponse(subject) {
    if (!subject) return null;

    return {
      id: subject.id,
      name: subject.name,
      type: subject.type,
      tenantId: subject.tenantId,
      createdAt: subject.createdAt,
      updatedAt: subject.updatedAt
    };
  }

  formatSubjectWithClassesResponse(subject) {
    if (!subject) return null;

    return {
      id: subject.id,
      name: subject.name,
      type: subject.type,
      tenantId: subject.tenantId,
      classSubjects: subject.classSubjects?.map(cs => ({
        id: cs.id,
        classId: cs.classId,
        code: cs.code,
        isElective: cs.isElective,
        weeklyPeriods: cs.weeklyPeriods,
        passingMarks: cs.passingMarks,
        class: cs.class ? {
          id: cs.class.id,
          name: cs.class.name,
          numericLevel: cs.class.numericLevel
        } : null,
        createdAt: cs.createdAt,
        updatedAt: cs.updatedAt
      })) || [],
      createdAt: subject.createdAt,
      updatedAt: subject.updatedAt
    };
  }
}
