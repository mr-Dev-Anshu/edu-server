import { AppError } from "../../../utils/AppError.js";
import {
  createValidator,
  ensureUUID,
  ensureString,
  ensureDecimal,
} from "./examValidatorHelpers.js";

export const createGradeScaleRuleValidator = createValidator((req) => {
  const { body } = req;

  ensureUUID(body.gradeScaleId, "gradeScaleId");
  ensureString(body.gradeLabel, "gradeLabel", { min: 1, max: 20 });
  ensureDecimal(body.minPercentage, "minPercentage", { min: 0, max: 100 });
  ensureDecimal(body.maxPercentage, "maxPercentage", { min: 0, max: 100 });

  if (parseFloat(body.minPercentage) >= parseFloat(body.maxPercentage)) {
    throw new AppError("minPercentage must be less than maxPercentage", 400);
  }

  if (body.gradePoint !== undefined && body.gradePoint !== null) {
    ensureDecimal(body.gradePoint, "gradePoint", { min: 0, max: 10 });
  }
});

export const updateGradeScaleRuleValidator = createValidator((req) => {
  const { body } = req;

  if (body.gradeScaleId !== undefined) ensureUUID(body.gradeScaleId, "gradeScaleId");
  if (body.gradeLabel !== undefined) ensureString(body.gradeLabel, "gradeLabel", { min: 1, max: 20 });
  if (body.minPercentage !== undefined) ensureDecimal(body.minPercentage, "minPercentage", { min: 0, max: 100 });
  if (body.maxPercentage !== undefined) ensureDecimal(body.maxPercentage, "maxPercentage", { min: 0, max: 100 });

  if (body.minPercentage !== undefined && body.maxPercentage !== undefined) {
    if (parseFloat(body.minPercentage) >= parseFloat(body.maxPercentage)) {
      throw new AppError("minPercentage must be less than maxPercentage", 400);
    }
  }

  if (body.gradePoint !== undefined && body.gradePoint !== null) {
    ensureDecimal(body.gradePoint, "gradePoint", { min: 0, max: 10 });
  }
});