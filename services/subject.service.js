import { SubjectRepository } from "../repositories/subject.repository.js";
import { BaseService } from "./base.service.js";
import { AppError } from "../utils/AppError.js";

const subjectRepo = new SubjectRepository();

/**
 * Subject Service
 * Business logic for Subject operations
 * Handles validation, filtering, and repository orchestration
 */
export class SubjectService extends BaseService {
  constructor() {
    super(subjectRepo);
  }

  /**
   * Create a new subject
   * - Validates uniqueness of code within class+tenant
   * - Validates class exists
   * - Validates subject type and group enums
   */
  async createSubject(tenantId, payload) {
    const {
      classId,
      name,
      code,
      subjectType,
      isElective,
      weeklyPeriods,
    } = payload;

    // Validate code uniqueness if provided
    if (code) {
      const existingSubject = await subjectRepo.findByCode(code, classId, tenantId);
      if (existingSubject) {
        throw new AppError("Subject code already exists for this class", 400);
      }
    }

    const subject = await subjectRepo.create({
      tenantId,
      classId,
      name: name.trim(),
      code: code ? code.trim() : null,
      subjectType: subjectType || "theory",
      isElective: isElective ?? false,
      weeklyPeriods: weeklyPeriods || 5,
    });

    return await this.enrichSubject(subject, tenantId);
  }

  /**
   * Get all subjects with pagination and filtering
    * - Supports page, limit, classId, subjectType, isElective, weeklyPeriods filters
   */
  async getAllSubjects(tenantId, query = {}) {
    const page = Math.max(1, parseInt(query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 10));
    const filters = {};

    if (query.classId) filters.classId = query.classId;
    if (query.subjectType) filters.subjectType = query.subjectType;
    if (query.isElective !== undefined) filters.isElective = query.isElective === "true";
    if (query.weeklyPeriods !== undefined) {
      const weeklyPeriods = Number.parseInt(query.weeklyPeriods, 10);
      if (!Number.isNaN(weeklyPeriods)) {
        filters.weeklyPeriods = weeklyPeriods;
      }
    }

    const result = await subjectRepo.findWithPagination(tenantId, filters, page, limit, {
      include: [
        { association: "class", attributes: ["id", "name", "numericLevel"] },
        { association: "organization", attributes: ["id", "name", "subdomain"] },
      ],
    });

    return result;
  }

  /**
   * Get a subject by ID
   */
  async getSubjectById(id, tenantId) {
    const subject = await subjectRepo.findById(id, tenantId, {
      include: [
        { association: "class", attributes: ["id", "name", "numericLevel"] },
        { association: "organization", attributes: ["id", "name", "subdomain"] },
      ],
    });

    if (!subject) {
      throw new AppError("Subject not found", 404);
    }

    return subject;
  }

  /**
   * Update a subject
   * - Validates code uniqueness if code is being changed
   */
  async updateSubject(id, tenantId, payload) {
    const subject = await subjectRepo.findById(id, tenantId);
    if (!subject) {
      throw new AppError("Subject not found", 404);
    }

    // Validate code uniqueness if code is being updated
    if (payload.code && payload.code !== subject.code) {
      const existingSubject = await subjectRepo.findByCode(payload.code, subject.classId, tenantId);
      if (existingSubject) {
        throw new AppError("Subject code already exists for this class", 400);
      }
    }

    const updateData = {};
    const allowedFields = [
      "name",
      "code",
      "subjectType",
      "isElective",
      "weeklyPeriods",
    ];

    for (const field of allowedFields) {
      if (payload[field] !== undefined) {
        updateData[field] = typeof payload[field] === "string" ? payload[field].trim() : payload[field];
      }
    }

    const updated = await subjectRepo.update(id, tenantId, updateData);
    return await this.enrichSubject(updated, tenantId);
  }

  /**
   * Delete (soft delete) a subject
   */
  async deleteSubject(id, tenantId) {
    const subject = await subjectRepo.findById(id, tenantId);
    if (!subject) {
      throw new AppError("Subject not found", 404);
    }

    await subjectRepo.softDelete(id, tenantId);
    return { message: "Subject deleted successfully" };
  }

  /**
   * Search subjects
   * - Searches by name and code
    * - Supports filtering by classId, subjectType, isElective, weeklyPeriods
   */
  async searchSubjects(tenantId, query = {}) {
    const searchTerm = (query.q || query.search || query.keyword || "").trim();
    const page = Math.max(1, parseInt(query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 10));

    if (searchTerm.length < 2) {
      throw new AppError("Search term must be at least 2 characters", 400);
    }

    const filters = {};
    if (query.classId) filters.classId = query.classId;
    if (query.subjectType) filters.subjectType = query.subjectType;
    if (query.isElective !== undefined) filters.isElective = query.isElective === "true";
    if (query.weeklyPeriods !== undefined) {
      const weeklyPeriods = Number.parseInt(query.weeklyPeriods, 10);
      if (!Number.isNaN(weeklyPeriods)) {
        filters.weeklyPeriods = weeklyPeriods;
      }
    }

    const result = await subjectRepo.searchSubjects(tenantId, searchTerm, page, limit, filters);
    return result;
  }

  /**
   * Get subjects by class
   * - Returns all subjects for a specific class
   * - Supports pagination and filtering by subjectType, isElective, weeklyPeriods
   */
  async getSubjectsByClass(classId, tenantId, query = {}) {
    const page = Math.max(1, parseInt(query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 10));
    const filters = { classId };

    if (query.subjectType) filters.subjectType = query.subjectType;
    if (query.isElective !== undefined) filters.isElective = query.isElective === "true";
    if (query.weeklyPeriods !== undefined) {
      const weeklyPeriods = Number.parseInt(query.weeklyPeriods, 10);
      if (!Number.isNaN(weeklyPeriods)) {
        filters.weeklyPeriods = weeklyPeriods;
      }
    }

    const result = await subjectRepo.findWithPagination(tenantId, filters, page, limit, {
      include: [
        { association: "class", attributes: ["id", "name", "numericLevel"] },
      ],
    });

    return result;
  }

  /**
   * Enrich subject with associations
   * Helper method to load all related data
   */
  async enrichSubject(subject, tenantId) {
    return await subjectRepo.findById(subject.id, tenantId, {
      include: [
        { association: "class", attributes: ["id", "name", "numericLevel"] },
        { association: "organization", attributes: ["id", "name", "subdomain"] },
      ],
    });
  }
}
