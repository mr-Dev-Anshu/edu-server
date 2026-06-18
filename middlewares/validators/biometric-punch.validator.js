import { AppError } from "../../utils/AppError.js";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const createValidator = (validateFn) => (req, res, next) => {
  try {
    validateFn(req);
    next();
  } catch (error) {
    next(error);
  }
};

const ensureUuid = (value, fieldName) => {
  if (typeof value !== "string" || !UUID_REGEX.test(value.trim())) {
    throw new AppError(`${fieldName} must be a valid UUID`, 400);
  }
};

const ensureDate = (value, fieldName) => {
  if (value === undefined || value === null) {
    throw new AppError(`${fieldName} is required`, 400);
  }
  const timestamp = Date.parse(value);
  if (Number.isNaN(timestamp)) {
    throw new AppError(`${fieldName} must be a valid date/time string`, 400);
  }
};

export const createBiometricPunchValidator = createValidator((req) => {
  const { body } = req;

  ensureUuid(body.staffId, "staffId");
  ensureDate(body.punchTime, "punchTime");

  if (body.isProcessed !== undefined && typeof body.isProcessed !== "boolean") {
    throw new AppError("isProcessed must be a boolean", 400);
  }
});

export const updateBiometricPunchValidator = createValidator((req) => {
  const { body } = req;

  if (body.staffId !== undefined) {
    ensureUuid(body.staffId, "staffId");
  }

  if (body.punchTime !== undefined) {
    ensureDate(body.punchTime, "punchTime");
  }

  if (body.isProcessed !== undefined && typeof body.isProcessed !== "boolean") {
    throw new AppError("isProcessed must be a boolean", 400);
  }
});

export const bulkCreateBiometricPunchValidator = createValidator((req) => {
  const { body } = req;

  if (!body.punches || !Array.isArray(body.punches) || body.punches.length === 0) {
    throw new AppError("punches must be a non-empty array", 400);
  }

  body.punches.forEach((punch, index) => {
    ensureUuid(punch.staffId, `punches[${index}].staffId`);
    ensureDate(punch.punchTime, `punches[${index}].punchTime`);

    if (punch.isProcessed !== undefined && typeof punch.isProcessed !== "boolean") {
      throw new AppError(`punches[${index}].isProcessed must be a boolean`, 400);
    }
  });
});
