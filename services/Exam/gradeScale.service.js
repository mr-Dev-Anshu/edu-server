import sequelize from "../../config/db.js";
import { GradeScaleRule } from "../../models/index.js";
import { GradeScaleRepository } from "../../repositories/Exam/gradeScale.repository.js";
import { GradeScaleRuleRepository } from "../../repositories/Exam/gradeScaleRule.repository.js";
import { AppError } from "../../utils/AppError.js";

const gradeScaleRepo = new GradeScaleRepository();
const gradeScaleRuleRepo = new GradeScaleRuleRepository();

const normalizeGradeScaleRule = (rule) => ({
  gradeLabel: rule.gradeLabel.trim(),
  minPercentage: parseFloat(rule.minPercentage),
  maxPercentage: parseFloat(rule.maxPercentage),
  gradePoint:
    rule.gradePoint !== undefined && rule.gradePoint !== null
      ? parseFloat(rule.gradePoint)
      : null,
});

const gradeScaleRuleInclude = [
  {
    model: GradeScaleRule,
    as: "gradeScaleRules",
    separate: true,
    order: [["minPercentage", "ASC"]],
  },
];

const isRuleIdPresent = (rule) => rule.id !== undefined && rule.id !== null && String(rule.id).trim() !== "";

const rangesOverlap = (left, right) => left.minPercentage < right.maxPercentage && left.maxPercentage > right.minPercentage;

const buildRuleSnapshot = (rule) => ({
  id: rule.id,
  tenantId: rule.tenantId,
  gradeScaleId: rule.gradeScaleId,
  gradeLabel: rule.gradeLabel,
  minPercentage: rule.minPercentage,
  maxPercentage: rule.maxPercentage,
  gradePoint: rule.gradePoint,
  createdAt: rule.createdAt,
  updatedAt: rule.updatedAt,
});

export class GradeScaleService {
  async createGradeScale(tenantId, payload) {
    const { name, scaleType, isDefault, gradeScaleRules = [] } = payload;

    return await sequelize.transaction(async (transaction) => {
      const existing = await gradeScaleRepo.findByName(name.trim(), tenantId);
      if (existing) {
        throw new AppError("A grade scale with this name already exists", 400);
      }

      const gradeScale = await gradeScaleRepo.create(
        {
          tenantId,
          name: name.trim(),
          scaleType,
          isDefault: false,
        },
        { transaction }
      );

      if (isDefault) {
        await gradeScaleRepo.setDefault(gradeScale.id, tenantId, { transaction });
      }

      let createdRules = [];

      if (gradeScaleRules.length) {
        const seenRanges = [];
        const seenLabels = new Map();
        const normalizedRules = [];

        // Single pass: normalize and validate in-memory
        for (const [index, rule] of gradeScaleRules.entries()) {
          const min = parseFloat(rule.minPercentage);
          const max = parseFloat(rule.maxPercentage);
          const label = rule.gradeLabel.trim();
          const normalizedLabel = label.toUpperCase();

          // Check for duplicate grade labels (case-insensitive)
          if (seenLabels.has(normalizedLabel)) {
            throw new AppError(
              `Grade label '${label}' is used more than once. Each grade must have a unique label.`,
              400
            );
          }
          seenLabels.set(normalizedLabel, index);

          // Check for overlapping ranges
          for (const existingRange of seenRanges) {
            if (min < existingRange.max && max > existingRange.min) {
              throw new AppError(
                `Grade '${label}' range overlaps with '${existingRange.gradeLabel}'. Please use different percentage ranges.`,
                400
              );
            }
          }

          seenRanges.push({ min, max, gradeLabel: label });
          normalizedRules.push({ min, max, label });
        }

        // Batch DB check: single query for all overlaps with existing rules
        const existingOverlaps = await gradeScaleRuleRepo.findOverlappingRules(
          gradeScale.id,
          normalizedRules,
          tenantId,
          { transaction }
        );

        if (existingOverlaps.length > 0) {
          const overlap = existingOverlaps[0];
          const incomingRule = normalizedRules.find(
            (r) => r.min < overlap.maxPercentage && r.max > overlap.minPercentage
          );
          throw new AppError(
            `Grade '${incomingRule.label}' range overlaps with existing grade '${overlap.gradeLabel}'. Please use different percentage ranges.`,
            400
          );
        }

        const ruleRecords = gradeScaleRules.map((rule) => ({
          tenantId,
          gradeScaleId: gradeScale.id,
          ...normalizeGradeScaleRule(rule),
        }));

        createdRules = await gradeScaleRuleRepo.createMany(ruleRecords, { transaction });
      }

      const finalGradeScale = await gradeScaleRepo.findById(gradeScale.id, tenantId, {
        transaction,
        include: gradeScaleRuleInclude,
      });

      return this.formatResponse(finalGradeScale);
    });
  }

  async getAllGradeScales(tenantId, query) {
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 10;

    const filters = {};
    if (query.scaleType) filters.scaleType = query.scaleType;
    if (query.isDefault === "true") filters.isDefault = true;

    return await gradeScaleRepo.findWithPagination(tenantId, filters, page, limit);
  }

  async getGradeScaleById(id, tenantId) {
    const gradeScale = await gradeScaleRepo.findById(id, tenantId, { include: gradeScaleRuleInclude });
    if (!gradeScale) throw new AppError("Grade scale not found", 404);
    return this.formatResponse(gradeScale);
  }

  async getDefaultGradeScale(tenantId) {
    const gradeScale = await gradeScaleRepo.findDefault(tenantId, {
      include: gradeScaleRuleInclude,
    });
    if (!gradeScale) {
      throw new AppError("No default grade scale set for this tenant", 404);
    }

    return this.formatResponse(gradeScale);
  }

  async updateGradeScale(id, tenantId, updateData) {
    return await sequelize.transaction(async (transaction) => {
      const gradeScale = await gradeScaleRepo.findById(id, tenantId, {
        transaction,
        include: gradeScaleRuleInclude,
      });

      if (updateData.name !== undefined && updateData.name.trim() !== gradeScale.name) {
        const existing = await gradeScaleRepo.findByName(updateData.name.trim(), tenantId, { transaction });
        if (existing && existing.id !== gradeScale.id) {
          throw new AppError("A grade scale with this name already exists", 400);
        }
      }

      const nextScaleData = {
        ...(updateData.name !== undefined ? { name: updateData.name.trim() } : {}),
        ...(updateData.scaleType !== undefined ? { scaleType: updateData.scaleType } : {}),
        ...(updateData.isDefault !== undefined ? { isDefault: updateData.isDefault } : {}),
      };

      if (Object.keys(nextScaleData).length) {
        await gradeScale.update(nextScaleData, { transaction });
      }

      if (updateData.isDefault === true) {
        await gradeScaleRepo.setDefault(id, tenantId, { transaction });
      }

      if (updateData.gradeScaleRules !== undefined) {
        const incomingRules = updateData.gradeScaleRules;
        const existingRules = Array.isArray(gradeScale.gradeScaleRules) ? gradeScale.gradeScaleRules : [];
        const existingRulesById = new Map(existingRules.map((rule) => [String(rule.id), rule]));

        // Start from existing rules (they remain unless explicitly deleted)
        const finalRules = existingRules.map((r) => (r.get ? r.get({ plain: true }) : { ...r }));

        const ruleUpdates = [];
        const rulesToCreate = [];
        const seenIds = new Set();

        for (const [index, rule] of incomingRules.entries()) {
          if (isRuleIdPresent(rule)) {
            const ruleId = String(rule.id);
            const existingRule = existingRulesById.get(ruleId);

            if (!existingRule) {
              throw new AppError(`One of the grade rules you're trying to update doesn't exist. Please check the grade scale.`, 404);
            }

            if (seenIds.has(ruleId)) {
              throw new AppError(`One grade rule is listed more than once. Please remove the duplicate.`, 400);
            }

            seenIds.add(ruleId);

            const merged = {
              ...existingRule.get({ plain: true }),
              ...(rule.gradeLabel !== undefined ? { gradeLabel: rule.gradeLabel.trim() } : {}),
              ...(rule.minPercentage !== undefined ? { minPercentage: parseFloat(rule.minPercentage) } : {}),
              ...(rule.maxPercentage !== undefined ? { maxPercentage: parseFloat(rule.maxPercentage) } : {}),
              ...(rule.gradePoint !== undefined ? { gradePoint: rule.gradePoint !== null ? parseFloat(rule.gradePoint) : null } : {}),
            };

            // replace in finalRules
            const idx = finalRules.findIndex((fr) => String(fr.id) === ruleId);
            if (idx !== -1) finalRules[idx] = merged;

            ruleUpdates.push(merged);
          } else {
            const newRec = {
              tenantId,
              gradeScaleId: id,
              ...normalizeGradeScaleRule(rule),
            };
            finalRules.push(newRec);
            rulesToCreate.push(newRec);
          }
        }

        // Handle explicit deletions if provided (optional)
        let rulesToDelete = [];
        if (Array.isArray(updateData.rulesToDelete) && updateData.rulesToDelete.length) {
          const deleteIds = new Set(updateData.rulesToDelete.map((d) => String(d)));
          rulesToDelete = existingRules.filter((r) => deleteIds.has(String(r.id)));
          // remove from finalRules
          for (const delId of deleteIds) {
            const pos = finalRules.findIndex((fr) => fr.id && String(fr.id) === delId);
            if (pos !== -1) finalRules.splice(pos, 1);
          }
        }

        // Validate for duplicate labels and overlapping ranges across the resulting rule set
        const labelCheck = new Map();
        for (let i = 0; i < finalRules.length; i += 1) {
          const currentLabel = finalRules[i].gradeLabel.trim();
          const normalizedCurrentLabel = currentLabel.toUpperCase();
          const currentMin = finalRules[i].minPercentage;
          const currentMax = finalRules[i].maxPercentage;
          
          // Check for duplicate grade labels (case-insensitive)
          if (labelCheck.has(normalizedCurrentLabel)) {
            throw new AppError(
              `Grade label '${currentLabel}' is used more than once. Each grade must have a unique label.`,
              400
            );
          }
          labelCheck.set(normalizedCurrentLabel, i);
          
          // Check for overlapping ranges
          for (let j = i + 1; j < finalRules.length; j += 1) {
            if (rangesOverlap(finalRules[i], finalRules[j])) {
              const otherLabel = finalRules[j].gradeLabel.trim();
              throw new AppError(
                `Grade '${currentLabel}' range overlaps with '${otherLabel}'. Please use different percentage ranges.`,
                400
              );
            }
          }
        }

        // Apply updates (batch operation)
        if (ruleUpdates.length > 0) {
          await gradeScaleRuleRepo.updateMany(
            ruleUpdates.map((r) => ({
              id: r.id,
              data: {
                gradeLabel: r.gradeLabel,
                minPercentage: r.minPercentage,
                maxPercentage: r.maxPercentage,
                gradePoint: r.gradePoint,
              },
            })),
            tenantId,
            { transaction }
          );
        }

        if (rulesToCreate.length > 0) {
          await gradeScaleRuleRepo.createMany(rulesToCreate, { transaction });
        }

        if (rulesToDelete.length > 0) {
          const deleteIds = rulesToDelete.map((r) => r.id);
          await gradeScaleRuleRepo.deleteMany(deleteIds, tenantId, { transaction });
        }
      }

      const populatedUpdated = await gradeScaleRepo.findById(id, tenantId, {
        transaction,
        include: gradeScaleRuleInclude,
      });

      return this.formatResponse(populatedUpdated);
    });
  }

  // FIX — Blocker #1: Uncommented deleteGradeScale logic
  async deleteGradeScale(id, tenantId) {
    const gradeScale = await gradeScaleRepo.findById(id, tenantId, {
      include: gradeScaleRuleInclude,
    });
    if (!gradeScale) throw new AppError("Grade scale not found", 404);

    if (gradeScale.isDefault) {
      throw new AppError("Cannot delete the default grade scale", 400);
    }

    await gradeScaleRepo.delete(id, tenantId);

    return {
      message: "Grade scale deleted successfully",
      data: this.formatResponse(gradeScale),
    };
  }

  // FIX — Blocker #3: findById result assign karke null check lagaya
  async setDefaultGradeScale(id, tenantId) {
    await gradeScaleRepo.setDefault(id, tenantId);

    const updated = await gradeScaleRepo.findById(id, tenantId, {
      include: gradeScaleRuleInclude,
    });
    if (!updated) throw new AppError("Grade scale not found", 404);

    return this.formatResponse(updated);
  }

  formatResponse(gradeScale, gradeScaleRules = []) {
    const resolvedRules = Array.isArray(gradeScale?.gradeScaleRules)
      ? gradeScale.gradeScaleRules
      : gradeScaleRules;

    return {
      id: gradeScale.id,
      tenantId: gradeScale.tenantId,
      name: gradeScale.name,
      scaleType: gradeScale.scaleType,
      isDefault: gradeScale.isDefault,
      createdAt: gradeScale.createdAt,
      updatedAt: gradeScale.updatedAt,
      gradeScaleRules: resolvedRules.map((rule) => buildRuleSnapshot(rule)),
    };
  }
}