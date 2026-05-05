import { SubjectRepository } from "../../repositories/Academic/subject.repository.js";
import { BaseService } from "../base.service.js";
import { AppError } from "../../utils/AppError.js";

const subjectRepo = new SubjectRepository();

export class SubjectService extends BaseService {
  constructor() {
    super(subjectRepo);
  }

  normalizeCode(code) {
    return typeof code === "string" ? code.trim() : code;
  }

  async createSubject(tenantId, payload) {
    const { classId, name, code, subjectType, isElective, weeklyPeriods } =
      payload;

    const normalizedCode = this.normalizeCode(code);

    // Validate code uniqueness if provided
    if (normalizedCode) {
      const existingSubject = await subjectRepo.findByCode(
        normalizedCode,
        classId,
        tenantId,
      );
      if (existingSubject) {
        throw new AppError("Subject code already exists for this class", 400);
      }
    }

    const subject = await subjectRepo.create({
      tenantId,
      classId,
      name: name.trim(),
      code: normalizedCode || null,
      subjectType: subjectType || "theory",
      isElective: isElective ?? false,
      weeklyPeriods: weeklyPeriods || 5,
    });

    return await this.enrichSubject(subject, tenantId);
  }

  async getAllSubjects(tenantId, query = {}) {
    const page = Math.max(1, parseInt(query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 10));
    const filters = {};

    if (query.classId) filters.classId = query.classId;
    if (query.subjectType) filters.subjectType = query.subjectType;
    if (query.isElective !== undefined)
      filters.isElective = query.isElective === "true";
    if (query.weeklyPeriods !== undefined) {
      const weeklyPeriods = Number.parseInt(query.weeklyPeriods, 10);
      if (!Number.isNaN(weeklyPeriods)) {
        filters.weeklyPeriods = weeklyPeriods;
      }
    }

    const result = await subjectRepo.findWithPagination(
      tenantId,
      filters,
      page,
      limit,
      {
        include: [
          { association: "class", attributes: ["id", "name", "numericLevel"] },
          {
            association: "organization",
            attributes: ["id", "name", "subdomain"],
          },
        ],
      },
    );

    return result;
  }

  async getSubjectById(id, tenantId) {
    const subject = await subjectRepo.findById(id, tenantId, {
      include: [
        { association: "class", attributes: ["id", "name", "numericLevel"] },
        {
          association: "organization",
          attributes: ["id", "name", "subdomain"],
        },
      ],
    });

    if (!subject) {
      throw new AppError("Subject not found", 404);
    }

    return subject;
  }

  async updateSubject(id, tenantId, payload) {
    const subject = await subjectRepo.findById(id, tenantId);
    if (!subject) {
      throw new AppError("Subject not found", 404);
    }

    const normalizedCode = this.normalizeCode(payload.code);

    if (normalizedCode && normalizedCode !== subject.code) {
      const existingSubject = await subjectRepo.findByCode(
        normalizedCode,
        subject.classId,
        tenantId,
      );
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
        updateData[field] =
          field === "code"
            ? normalizedCode || null
            : typeof payload[field] === "string"
              ? payload[field].trim()
              : payload[field];
      }
    }

    const updated = await subjectRepo.update(id, tenantId, updateData);
    return await this.enrichSubject(updated, tenantId);
  }

  async deleteSubject(id, tenantId) {
    const subject = await subjectRepo.findById(id, tenantId);
    if (!subject) {
      throw new AppError("Subject not found", 404);
    }

    const deletedCount = await subjectRepo.softDelete(id, tenantId);
    if (!deletedCount) {
      throw new AppError("Subject not found", 404);
    }
    return { message: "Subject deleted successfully" };
  }

  async searchSubjects(tenantId, query = {}) {
    const searchTerm = (query.q || query.search || query.keyword || "").trim();
    const page = Math.max(1, parseInt(query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 10));

    if (searchTerm.length < 2) {
      throw new AppError("Search term must be at least 2 characters", 400);
    }

    const normalizedQuery = {
      ...query,
      classId: query.classId?.trim(),
      subjectType: query.subjectType?.trim(),
      isElective:
        query.isElective === undefined
          ? undefined
          : query.isElective === true || query.isElective === "true",
      weeklyPeriods: (() => {
        if (query.weeklyPeriods === undefined) return undefined;
        const parsedWeeklyPeriods = Number.parseInt(query.weeklyPeriods, 10);
        return Number.isNaN(parsedWeeklyPeriods)
          ? undefined
          : parsedWeeklyPeriods;
      })(),
      page,
      limit,
      q: searchTerm,
    };

    const result = await super.search(
      tenantId,
      normalizedQuery,
      ["name", "code"],
      {
        filterableFields: [
          "classId",
          "subjectType",
          "isElective",
          "weeklyPeriods",
        ],
        page,
        limit,
        include: [
          { association: "class", attributes: ["id", "name", "numericLevel"] },
          {
            association: "organization",
            attributes: ["id", "name", "subdomain"],
          },
        ],
      },
    );
    return result;
  }

  async getSubjectsByClass(classId, tenantId, query = {}) {
    const page = Math.max(1, parseInt(query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 10));
    const filters = { classId };

    if (query.subjectType) filters.subjectType = query.subjectType;
    if (query.isElective !== undefined)
      filters.isElective = query.isElective === "true";
    if (query.weeklyPeriods !== undefined) {
      const weeklyPeriods = Number.parseInt(query.weeklyPeriods, 10);
      if (!Number.isNaN(weeklyPeriods)) {
        filters.weeklyPeriods = weeklyPeriods;
      }
    }

    const result = await subjectRepo.findWithPagination(
      tenantId,
      filters,
      page,
      limit,
      {
        include: [
          { association: "class", attributes: ["id", "name", "numericLevel"] },
        ],
      },
    );

    return result;
  }

  async enrichSubject(subject, tenantId) {
    return await subjectRepo.findById(subject.id, tenantId, {
      include: [
        { association: "class", attributes: ["id", "name", "numericLevel"] },
        {
          association: "organization",
          attributes: ["id", "name", "subdomain"],
        },
      ],
    });
  }
}
