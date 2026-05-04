import { ExamGroupRepository } from "../../repositories/Exam/examGroup.repository.js";
import { AppError } from "../../utils/AppError.js";

const examGroupRepo = new ExamGroupRepository();

export class ExamGroupService {
  async createExamGroup(tenantId, payload) {
    const { academicYearId, name, examType, gradingSchemeId, startDate, endDate, weightagePercent } = payload;

    // Validate date range if both provided
    if (startDate && endDate) {
      if (new Date(endDate) <= new Date(startDate)) {
        throw new AppError("endDate must be after startDate", 400);
      }
    }

    // Name uniqueness per tenant
    const existing = await examGroupRepo.findByName(name.trim(), tenantId);
    if (existing) {
      throw new AppError("An exam group with this name already exists", 400);
    }

    const examGroup = await examGroupRepo.create({
      tenantId,
      academicYearId,
      name: name.trim(),
      examType,
      gradingSchemeId: gradingSchemeId || null,
      startDate: startDate || null,
      endDate: endDate || null,
      weightagePercent: weightagePercent || null,
      isResultPublished: false,
    });

    return this.formatResponse(examGroup);
  }

  async getAllExamGroups(tenantId, query) {
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 10;

    const filters = {};
    if (query.academicYearId) filters.academicYearId = query.academicYearId;
    if (query.examType) filters.examType = query.examType;
    if (query.isResultPublished === "true") filters.isResultPublished = true;
    if (query.isResultPublished === "false") filters.isResultPublished = false;

    return await examGroupRepo.findWithPagination(tenantId, filters, page, limit);
  }

  async getExamGroupById(id, tenantId) {
    const examGroup = await examGroupRepo.findById(id, tenantId);
    return this.formatResponse(examGroup);
  }

  async updateExamGroup(id, tenantId, updateData) {
    const examGroup = await examGroupRepo.findById(id, tenantId);

    // If result is published, restrict edits
    if (examGroup.isResultPublished) {
      throw new AppError("Cannot update an exam group after result is published", 400);
    }

    if (updateData.startDate || updateData.endDate) {
      const start = new Date(updateData.startDate || examGroup.startDate);
      const end = new Date(updateData.endDate || examGroup.endDate);
      if (end <= start) {
        throw new AppError("endDate must be after startDate", 400);
      }
    }

    if (updateData.name && updateData.name.trim() !== examGroup.name) {
      const existing = await examGroupRepo.findByName(updateData.name.trim(), tenantId);
      if (existing) throw new AppError("An exam group with this name already exists", 400);
    }

    const updated = await examGroupRepo.update(id, tenantId, {
      ...(updateData.name !== undefined ? { name: updateData.name.trim() } : {}),
      ...(updateData.examType !== undefined ? { examType: updateData.examType } : {}),
      ...(updateData.academicYearId !== undefined ? { academicYearId: updateData.academicYearId } : {}),
      ...(updateData.gradingSchemeId !== undefined ? { gradingSchemeId: updateData.gradingSchemeId } : {}),
      ...(updateData.startDate !== undefined ? { startDate: updateData.startDate } : {}),
      ...(updateData.endDate !== undefined ? { endDate: updateData.endDate } : {}),
      ...(updateData.weightagePercent !== undefined ? { weightagePercent: updateData.weightagePercent } : {}),
    });

    return this.formatResponse(updated);
  }

  async deleteExamGroup(id, tenantId) {
    const examGroup = await examGroupRepo.findById(id, tenantId);

    if (examGroup.isResultPublished) {
      throw new AppError("Cannot delete an exam group after result is published", 400);
    }

    await examGroupRepo.delete(id, tenantId);
    return {
      message: "Exam group deleted successfully",
      data: this.formatResponse(examGroup),
    };
  }

  async publishResult(id, tenantId) {
    const examGroup = await examGroupRepo.findById(id, tenantId);
    if (examGroup.isResultPublished) {
      throw new AppError("Result is already published", 400);
    }
    await examGroupRepo.setResultPublished(id, tenantId, true);
    const updated = await examGroupRepo.findById(id, tenantId);
    return this.formatResponse(updated);
  }

  async unpublishResult(id, tenantId) {
    const examGroup = await examGroupRepo.findById(id, tenantId);
    if (!examGroup.isResultPublished) {
      throw new AppError("Result is not published yet", 400);
    }
    await examGroupRepo.setResultPublished(id, tenantId, false);
    const updated = await examGroupRepo.findById(id, tenantId);
    return this.formatResponse(updated);
  }

  formatResponse(examGroup) {
    return {
      id: examGroup.id,
      tenantId: examGroup.tenantId,
      academicYearId: examGroup.academicYearId,
      name: examGroup.name,
      examType: examGroup.examType,
      gradingSchemeId: examGroup.gradingSchemeId,
      startDate: examGroup.startDate,
      endDate: examGroup.endDate,
      isResultPublished: examGroup.isResultPublished,
      weightagePercent: examGroup.weightagePercent,
      createdAt: examGroup.createdAt,
      updatedAt: examGroup.updatedAt,
    };
  }
}