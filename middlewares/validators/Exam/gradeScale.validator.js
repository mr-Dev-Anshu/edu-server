import {
  createValidator,
  ensureString,
  ensureEnum,
  ensureBoolean,
  ensureDecimal,
} from "./examValidatorHelpers.js";
import { AppError } from "../../../utils/AppError.js";

const SCALE_TYPES = ["percentage", "gpa", "cgpa", "letter", "custom"];

const validateGradeScaleRule = (rule, index, { isUpdate = false } = {}) => {
  if (rule.id !== undefined && rule.id !== null && String(rule.id).trim() === "") {
    throw new AppError(`Grade ID cannot be empty.`, 400);
  }

  const isExistingRuleUpdate = isUpdate && rule.id !== undefined && rule.id !== null;

  if (!isExistingRuleUpdate || rule.gradeLabel !== undefined) {
    ensureString(rule.gradeLabel, `gradeScaleRules[${index}].gradeLabel`, { min: 1, max: 20 });
  }

  if (!isExistingRuleUpdate || rule.minPercentage !== undefined) {
    ensureDecimal(rule.minPercentage, `gradeScaleRules[${index}].minPercentage`, { min: 0, max: 100 });
  }

  if (!isExistingRuleUpdate || rule.maxPercentage !== undefined) {
    ensureDecimal(rule.maxPercentage, `gradeScaleRules[${index}].maxPercentage`, { min: 0, max: 100 });
  }

  if (
    rule.minPercentage !== undefined &&
    rule.maxPercentage !== undefined &&
    parseFloat(rule.minPercentage) >= parseFloat(rule.maxPercentage)
  ) {
    throw new AppError(
      `Minimum percentage must be less than maximum percentage.`,
      400
    );
  }

  if (rule.gradePoint !== undefined && rule.gradePoint !== null) {
    ensureDecimal(rule.gradePoint, `gradeScaleRules[${index}].gradePoint`, { min: 0, max: 10 });
  }
};

export const createGradeScaleValidator = createValidator((req) => {
  const { body } = req;

  ensureString(body.name, "name", { min: 2, max: 150 });
  ensureEnum(body.scaleType, "scaleType", SCALE_TYPES);

  if (body.isDefault !== undefined) ensureBoolean(body.isDefault, "isDefault");

  if (body.gradeScaleRules !== undefined) {
    if (!Array.isArray(body.gradeScaleRules) || body.gradeScaleRules.length === 0) {
      throw new AppError("Please add at least one grade to the scale.", 400);
    }

    body.gradeScaleRules.forEach((rule, index) => validateGradeScaleRule(rule, index));
  }
});

export const updateGradeScaleValidator = createValidator((req) => {
  const { body } = req;

  if (body.name !== undefined) ensureString(body.name, "name", { min: 2, max: 150 });
  if (body.scaleType !== undefined) ensureEnum(body.scaleType, "scaleType", SCALE_TYPES);
  if (body.isDefault !== undefined) ensureBoolean(body.isDefault, "isDefault");

  if (body.gradeScaleRules !== undefined) {
    if (!Array.isArray(body.gradeScaleRules)) {
      throw new AppError("Grades must be provided as a list.", 400);
    }

    body.gradeScaleRules.forEach((rule, index) => validateGradeScaleRule(rule, index, { isUpdate: true }));
  }
  if (body.rulesToDelete !== undefined) {
    if (!Array.isArray(body.rulesToDelete)) {
      throw new AppError("Grades to delete must be provided as a list.", 400);
    }
    body.rulesToDelete.forEach((id, idx) => {
      if (!id || String(id).trim() === "") {
        throw new AppError(`Please provide valid grade IDs to delete.`, 400);
      }
    });
  }
});