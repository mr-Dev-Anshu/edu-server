import {
  createValidator,
  ensureUUID,
  ensureString,
  ensureDate,
  ensureEnum,
  ensureNumber,
} from "./examValidatorHelpers.js";

const EXAM_TYPES = ["unit_test", "mid_term", "half_yearly", "annual", "practical", "board", "internal", "other"];

export const createExamGroupValidator = createValidator((req) => {
  const { body } = req;

  ensureUUID(body.academicYearId, "academicYearId");
  ensureString(body.name, "name", { min: 2, max: 150 });
  ensureEnum(body.examType, "examType", EXAM_TYPES);

  if (body.gradingSchemeId !== undefined && body.gradingSchemeId !== null) {
    ensureUUID(body.gradingSchemeId, "gradingSchemeId");
  }

  if (body.startDate !== undefined) ensureDate(body.startDate, "startDate");
  if (body.endDate !== undefined) ensureDate(body.endDate, "endDate");

  if (body.weightagePercent !== undefined) {
    ensureNumber(body.weightagePercent, "weightagePercent", { min: 0, max: 100 });
  }
});

export const updateExamGroupValidator = createValidator((req) => {
  const { body } = req;

  if (body.academicYearId !== undefined) ensureUUID(body.academicYearId, "academicYearId");
  if (body.name !== undefined) ensureString(body.name, "name", { min: 2, max: 150 });
  if (body.examType !== undefined) ensureEnum(body.examType, "examType", EXAM_TYPES);
  if (body.gradingSchemeId !== undefined && body.gradingSchemeId !== null) {
    ensureUUID(body.gradingSchemeId, "gradingSchemeId");
  }
  if (body.startDate !== undefined) ensureDate(body.startDate, "startDate");
  if (body.endDate !== undefined) ensureDate(body.endDate, "endDate");
  if (body.weightagePercent !== undefined) {
    ensureNumber(body.weightagePercent, "weightagePercent", { min: 0, max: 100 });
  }
});