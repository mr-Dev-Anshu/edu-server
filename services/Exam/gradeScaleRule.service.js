import { GradeScaleRuleRepository } from "../../repositories/Exam/gradeScaleRule.repository.js";
import { GradeScaleRepository } from "../../repositories/Exam/gradeScale.repository.js";
import { AppError } from "../../utils/AppError.js";

const gradeScaleRuleRepo = new GradeScaleRuleRepository();
const gradeScaleRepo = new GradeScaleRepository();

export class GradeScaleRuleService {
  async createGradeScaleRule(tenantId, payload) {
    const { gradeScaleId, gradeLabel, minPercentage, maxPercentage, gradePoint } = payload;

    const gradeScale = await gradeScaleRepo.findById(gradeScaleId, tenantId);
    if (!gradeScale) {
      throw new AppError("Grade scale not found", 404);
    }

    const min = parseFloat(minPercentage);
    const max = parseFloat(maxPercentage);

    if (min >= max) {
      throw new AppError("minPercentage must be less than maxPercentage", 400);
    }

    const overlap = await gradeScaleRuleRepo.findOverlappingRule(
      gradeScaleId,
      min,
      max,
      tenantId
    );

    if (overlap) {
      throw new AppError(
        `Percentage range [${min}-${max}] overlaps with existing rule "${overlap.gradeLabel}"`,
        400
      );
    }

    const rule = await gradeScaleRuleRepo.create({
      tenantId,
      gradeScaleId,
      gradeLabel: gradeLabel.trim(),
      minPercentage: min,
      maxPercentage: max,
      gradePoint: gradePoint !== undefined ? parseFloat(gradePoint) : null,
    });

    return this.formatResponse(rule);
  }

  async getAllGradeScaleRules(tenantId, query) {
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 10;

    const filters = {};
    if (query.gradeScaleId) filters.gradeScaleId = query.gradeScaleId;

    return await gradeScaleRuleRepo.findWithPagination(
      tenantId,
      filters,
      page,
      limit
    );
  }

  async getGradeScaleRuleById(id, tenantId) {
    const rule = await gradeScaleRuleRepo.findById(id, tenantId);

    if (!rule) {
      throw new AppError("Grade scale rule not found", 404);
    }

    return this.formatResponse(rule);
  }

  async updateGradeScaleRule(id, tenantId, updateData) {
    const rule = await gradeScaleRuleRepo.findById(id, tenantId);

    if (!rule) {
      throw new AppError("Grade scale rule not found", 404);
    }

    const gradeScaleId = updateData.gradeScaleId || rule.gradeScaleId;

    const gradeScale = await gradeScaleRepo.findById(gradeScaleId, tenantId);
    if (!gradeScale) {
      throw new AppError("Grade scale not found", 404);
    }

    const min =
      updateData.minPercentage !== undefined
        ? parseFloat(updateData.minPercentage)
        : parseFloat(rule.minPercentage);

    const max =
      updateData.maxPercentage !== undefined
        ? parseFloat(updateData.maxPercentage)
        : parseFloat(rule.maxPercentage);

    if (min >= max) {
      throw new AppError("minPercentage must be less than maxPercentage", 400);
    }

    const overlap = await gradeScaleRuleRepo.findOverlappingRule(
      gradeScaleId,
      min,
      max,
      tenantId,
      id
    );

    if (overlap) {
      throw new AppError(
        `Percentage range [${min}-${max}] overlaps with existing rule "${overlap.gradeLabel}"`,
        400
      );
    }

    const updated = await gradeScaleRuleRepo.update(id, tenantId, {
      ...(updateData.gradeScaleId !== undefined
        ? { gradeScaleId: updateData.gradeScaleId }
        : {}),

      ...(updateData.gradeLabel !== undefined
        ? { gradeLabel: updateData.gradeLabel.trim() }
        : {}),

      ...(updateData.minPercentage !== undefined ? { minPercentage: min } : {}),

      ...(updateData.maxPercentage !== undefined ? { maxPercentage: max } : {}),

      ...(updateData.gradePoint !== undefined
        ? {
            gradePoint:
              updateData.gradePoint !== null
                ? parseFloat(updateData.gradePoint)
                : null,
          }
        : {}),
    });

    return this.formatResponse(updated);
  }

  async deleteGradeScaleRule(id, tenantId) {
    const rule = await gradeScaleRuleRepo.findById(id, tenantId);

    if (!rule) {
      throw new AppError("Grade scale rule not found", 404);
    }

    await gradeScaleRuleRepo.delete(id, tenantId);

    return {
      message: "Grade scale rule deleted successfully",
      data: this.formatResponse(rule),
    };
  }

  formatResponse(rule) {
    return {
      id: rule.id,
      tenantId: rule.tenantId,
      gradeScaleId: rule.gradeScaleId,
      gradeLabel: rule.gradeLabel,
      minPercentage: rule.minPercentage,
      maxPercentage: rule.maxPercentage,
      gradePoint: rule.gradePoint,
      createdAt: rule.createdAt,
      updatedAt: rule.updatedAt,
    };
  }
}