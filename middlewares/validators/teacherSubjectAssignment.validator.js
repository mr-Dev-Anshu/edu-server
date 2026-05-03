import { AppError } from "../../utils/AppError.js";
import { validate as isUUID } from "uuid";

const requireUUID = (value, fieldName) => {
  if (!value || typeof value !== "string" || !isUUID(value)) {
    throw new AppError(`${fieldName} must be a valid UUID`, 400);
  }
};

const createValidatorFn = (req) => {
  const { staffId, subjectId, sectionId, academicYearId, isPrimaryTeacher } = req.body || {};

  requireUUID(staffId, "staffId");
  requireUUID(subjectId, "subjectId");
  requireUUID(sectionId, "sectionId");
  requireUUID(academicYearId, "academicYearId");

  if (isPrimaryTeacher !== undefined && typeof isPrimaryTeacher !== "boolean") {
    throw new AppError("isPrimaryTeacher must be a boolean", 400);
  }
};

const updateValidatorFn = (req) => {
  const { staffId, subjectId, sectionId, academicYearId, isPrimaryTeacher } = req.body || {};

  if (staffId !== undefined) requireUUID(staffId, "staffId");
  if (subjectId !== undefined) requireUUID(subjectId, "subjectId");
  if (sectionId !== undefined) requireUUID(sectionId, "sectionId");
  if (academicYearId !== undefined) requireUUID(academicYearId, "academicYearId");

  if (isPrimaryTeacher !== undefined && typeof isPrimaryTeacher !== "boolean") {
    throw new AppError("isPrimaryTeacher must be a boolean", 400);
  }
};

const paramIdValidator = (req, res, next) => {
  try {
    const id = req.params.id;
    if (!id || !isUUID(id)) throw new AppError("id must be a valid UUID", 400);
    next();
  } catch (err) {
    next(err);
  }
};

const wrap = (fn) => (req, res, next) => {
  try {
    fn(req);
    next();
  } catch (err) {
    next(err);
  }
};

export const createTeacherSubjectAssignmentValidator = wrap(createValidatorFn);
export const updateTeacherSubjectAssignmentValidator = wrap(updateValidatorFn);
export const teacherSubjectAssignmentIdValidator = paramIdValidator;
