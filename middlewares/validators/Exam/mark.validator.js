import { AppError } from "../../../utils/AppError.js";

const createValidator = (validateFn) => (req, res, next) => {
  try {
    validateFn(req);
    next();
  } catch (error) {
    next(error);
  }
};

const ensureUUID = (value, fieldName) => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(value)) {
    throw new AppError(`${fieldName} must be a valid UUID`, 400);
  }
};

const ensureBoolean = (value, fieldName) => {
  if (typeof value !== "boolean") {
    throw new AppError(`${fieldName} must be a boolean`, 400);
  }
};

const validateSingleMark = (mark, index = null) => {
  const prefix = index !== null ? `marks[${index}]` : "";

  ensureUUID(mark.studentId, `${prefix}.studentId`);
  ensureUUID(mark.examScheduleId, `${prefix}.examScheduleId`);

  if (mark.isAbsent !== undefined) ensureBoolean(mark.isAbsent, `${prefix}.isAbsent`);

  // If not absent, marksObtainedRaw should be a valid number
  if (!mark.isAbsent && mark.marksObtainedRaw !== undefined && mark.marksObtainedRaw !== null) {
    const num = parseInt(mark.marksObtainedRaw);
    if (isNaN(num) || num < 0) {
      throw new AppError(`${prefix}.marksObtainedRaw must be a non-negative integer`, 400);
    }
  }
};

export const createMarkValidator = createValidator((req) => {
  validateSingleMark(req.body);
});

export const updateMarkValidator = createValidator((req) => {
  const { body } = req;

  if (body.isAbsent !== undefined) ensureBoolean(body.isAbsent, "isAbsent");

  if (!body.isAbsent && body.marksObtainedRaw !== undefined && body.marksObtainedRaw !== null) {
    const num = parseInt(body.marksObtainedRaw);
    if (isNaN(num) || num < 0) {
      throw new AppError("marksObtainedRaw must be a non-negative integer", 400);
    }
  }
});

export const bulkCreateMarksValidator = createValidator((req) => {
  const { body } = req;

  if (!Array.isArray(body.marks) || body.marks.length === 0) {
    throw new AppError("marks must be a non-empty array", 400);
  }

  if (body.marks.length > 500) {
    throw new AppError("Cannot bulk insert more than 500 marks at once", 400);
  }

  body.marks.forEach((mark, index) => validateSingleMark(mark, index));
});