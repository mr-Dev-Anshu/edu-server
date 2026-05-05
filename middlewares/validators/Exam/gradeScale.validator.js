import {
  createValidator,
  ensureString,
  ensureEnum,
  ensureBoolean,
} from "./examValidatorHelpers.js";

const SCALE_TYPES = ["percentage", "gpa", "cgpa", "letter", "custom"];

export const createGradeScaleValidator = createValidator((req) => {
  const { body } = req;

  ensureString(body.name, "name", { min: 2, max: 150 });
  ensureEnum(body.scaleType, "scaleType", SCALE_TYPES);

  if (body.isDefault !== undefined) ensureBoolean(body.isDefault, "isDefault");
});

export const updateGradeScaleValidator = createValidator((req) => {
  const { body } = req;

  if (body.name !== undefined) ensureString(body.name, "name", { min: 2, max: 150 });
  if (body.scaleType !== undefined) ensureEnum(body.scaleType, "scaleType", SCALE_TYPES);
  if (body.isDefault !== undefined) ensureBoolean(body.isDefault, "isDefault");
});