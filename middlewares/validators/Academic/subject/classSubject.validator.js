import { AppError } from "../../../../utils/AppError.js";

const createValidator = (validateFn) => (req, res, next) => {
  try {
    validateFn(req);
    next();
  } catch (error) {
    next(error);
  }
};

const ensureString = (value, fieldName, { min = 1, max = 255 } = {}) => {
  if (typeof value !== "string" || value.trim().length < min || value.trim().length > max) {
    throw new AppError(`${fieldName} must be between ${min} and ${max} characters`, 400);
  }
};

const ensureNumber = (value, fieldName, { min = 0, max = Infinity } = {}) => {
  if (value !== undefined && value !== null) {
    const number = Number(value);
    if (Number.isNaN(number) || number < min || number > max) {
      throw new AppError(`${fieldName} must be a number between ${min} and ${max}`, 400);
    }
  }
};

const ensureBoolean = (value, fieldName) => {
  if (value !== undefined && value !== null) {
    if (typeof value !== "boolean" && value !== "true" && value !== "false") {
      throw new AppError(`${fieldName} must be a boolean value`, 400);
    }
  }
};

const ensureUUID = (value, fieldName) => {
  if (!value) throw new AppError(`${fieldName} is required`, 400);
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(value)) {
    throw new AppError(`Invalid ${fieldName} format`, 400);
  }
};

export const assignSubjectsValidator = createValidator((req) => {
  const { body } = req;

  ensureUUID(body.classId, "classId");

  if (!Array.isArray(body.subjects) || body.subjects.length === 0) {
    throw new AppError("subjects must be a non-empty array", 400);
  }

  body.subjects.forEach((subject, index) => {
    ensureUUID(subject.subjectMasterId, `subjects[${index}].subjectMasterId`);

    if (subject.code) {
      ensureString(subject.code, `subjects[${index}].code`, { min: 1, max: 30 });
    }

    ensureBoolean(subject.isElective, `subjects[${index}].isElective`);
    ensureNumber(subject.weeklyPeriods, `subjects[${index}].weeklyPeriods`, { min: 1, max: 50 });
    ensureNumber(subject.passingMarks, `subjects[${index}].passingMarks`, { min: 0, max: 100 });
  });
});

export const updateClassSubjectValidator = createValidator((req) => {
  const { body } = req;

  if (body.code) {
    ensureString(body.code, "code", { min: 1, max: 30 });
  }

  if (body.isElective !== undefined && body.isElective !== null) {
    ensureBoolean(body.isElective, "isElective");
  }

  if (body.weeklyPeriods !== undefined && body.weeklyPeriods !== null) {
    ensureNumber(body.weeklyPeriods, "weeklyPeriods", { min: 1, max: 50 });
  }

  if (body.passingMarks !== undefined && body.passingMarks !== null) {
    ensureNumber(body.passingMarks, "passingMarks", { min: 0, max: 100 });
  }

  if (Object.keys(body).length === 0) {
    throw new AppError("At least one field is required to update", 400);
  }
});

export const classSubjectIdValidator = createValidator((req) => {
  ensureUUID(req.params.id, "ClassSubject ID");
});

export const classIdValidator = createValidator((req) => {
  ensureUUID(req.params.classId, "Class ID");
});
