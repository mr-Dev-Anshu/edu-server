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

const ensureOptionalUuid = (value, fieldName) => {
  if (value === undefined || value === null) return;
  ensureUuid(value, fieldName);
};

const ensureString = (value, fieldName, { min = 1, max = 255 } = {}) => {
  if (typeof value !== "string" || value.trim().length < min || value.trim().length > max) {
    throw new AppError(`${fieldName} must be ${min}-${max} characters`, 400);
  }
};

const ensureOptionalString = (value, fieldName, options = {}) => {
  if (value === undefined || value === null) return;
  ensureString(value, fieldName, options);
};

const ensureDate = (value, fieldName) => {
  if (value === undefined || value === null) return;
  const date = new Date(value);
  if (isNaN(date.getTime())) {
    throw new AppError(`${fieldName} must be a valid date`, 400);
  }
};

const ensureRequiredDate = (value, fieldName) => {
  if (value === undefined || value === null) {
    throw new AppError(`${fieldName} is required`, 400);
  }
  ensureDate(value, fieldName);
};

const ensureBoolean = (value, fieldName) => {
  if (value === undefined || value === null) return;
  if (typeof value !== "boolean") {
    throw new AppError(`${fieldName} must be a boolean`, 400);
  }
};

const ensureEnum = (value, fieldName, allowedValues) => {
  if (value === undefined || value === null) return;
  if (!allowedValues.includes(value)) {
    throw new AppError(`${fieldName} must be one of: ${allowedValues.join(", ")}`, 400);
  }
};

const ensureRequiredEnum = (value, fieldName, allowedValues) => {
  if (value === undefined || value === null) {
    throw new AppError(`${fieldName} is required`, 400);
  }
  ensureEnum(value, fieldName, allowedValues);
};

const ensureOptionalEnum = (value, fieldName, allowedValues) => {
  if (value === undefined || value === null) return;
  ensureEnum(value, fieldName, allowedValues);
};

const ensureNoTenantId = (body) => {
  if (body.tenantId !== undefined || body.tenant_id !== undefined) {
    throw new AppError("tenantId may not be provided in request body", 400);
  }
};

const ensureDisallowedField = (value, fieldName) => {
  if (value !== undefined) {
    throw new AppError(`${fieldName} cannot be modified`, 400);
  }
};

const GENDERS = ["male", "female", "other", "prefer_not_to_say"];
const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", "unknown"];
const CATEGORIES = ["general", "obc", "sc", "st", "ews", "other"];
const STATUSES = ["active", "inactive", "transferred_out", "passed_out", "dropped"];
const GUARDIAN_RELATIONS = ["father", "mother", "guardian", "grandparent", "sibling", "other"];
const GUARDIAN_MAP_RELATIONS = ["father", "mother", "guardian", "other"];

const ensureArray = (value, fieldName) => {
  if (!Array.isArray(value)) {
    throw new AppError(`${fieldName} must be an array`, 400);
  }
};

const ensureGuardianPayload = (guardian, index) => {
  const fieldPrefix = `guardians[${index}]`;

  if (!guardian || typeof guardian !== "object" || Array.isArray(guardian)) {
    throw new AppError(`${fieldPrefix} must be an object`, 400);
  }

  ensureString(guardian.email, `${fieldPrefix}.email`, { min: 5, max: 100 });
  ensureString(guardian.password, `${fieldPrefix}.password`, { min: 6, max: 50 });
  ensureString(guardian.firstName, `${fieldPrefix}.firstName`, { min: 1, max: 100 });
  ensureString(guardian.lastName, `${fieldPrefix}.lastName`, { min: 1, max: 100 });
  ensureRequiredEnum(guardian.relation, `${fieldPrefix}.relation`, GUARDIAN_RELATIONS);
  ensureString(guardian.phone, `${fieldPrefix}.phone`, { min: 1, max: 20 });
  ensureOptionalString(guardian.occupation, `${fieldPrefix}.occupation`, { min: 1, max: 150 });
  ensureOptionalEnum(guardian.relationType, `${fieldPrefix}.relationType`, GUARDIAN_MAP_RELATIONS);
  ensureBoolean(guardian.isPrimaryContact, `${fieldPrefix}.isPrimaryContact`);
  ensureBoolean(guardian.isPrimary, `${fieldPrefix}.isPrimary`);
  ensureBoolean(guardian.canPickup, `${fieldPrefix}.canPickup`);
};

export const createStudentValidator = createValidator((req) => {
  ensureNoTenantId(req.body);

  const hasSectionId = req.body.sectionId !== undefined && req.body.sectionId !== null;
  const hasAcademicYearId = req.body.academicYearId !== undefined && req.body.academicYearId !== null;
  if (hasSectionId !== hasAcademicYearId) {
    throw new AppError("sectionId and academicYearId must be provided together for student enrollment", 400);
  }

  ensureString(req.body.email, "email", { min: 5, max: 100 });
  ensureString(req.body.password, "password", { min: 6, max: 50 });
  ensureString(req.body.admissionNumber, "admissionNumber", { min: 1, max: 50 });
  ensureOptionalString(req.body.rollNumber, "rollNumber", { min: 1, max: 30 });
  ensureString(req.body.firstName, "firstName", { min: 1, max: 100 });
  ensureOptionalString(req.body.middleName, "middleName", { min: 1, max: 100 });
  ensureString(req.body.lastName, "lastName", { min: 1, max: 100 });
  ensureRequiredDate(req.body.dateOfBirth, "dateOfBirth");
  ensureRequiredEnum(req.body.gender, "gender", GENDERS);
  ensureOptionalEnum(req.body.bloodGroup, "bloodGroup", BLOOD_GROUPS);
  ensureOptionalString(req.body.nationality, "nationality", { min: 1, max: 100 });
  ensureOptionalString(req.body.religion, "religion", { min: 1, max: 100 });
  ensureOptionalString(req.body.caste, "caste", { min: 1, max: 100 });
  ensureOptionalEnum(req.body.category, "category", CATEGORIES);
  ensureOptionalString(req.body.aadharNumber, "aadharNumber", { min: 1, max: 255 });
  ensureOptionalString(req.body.photoUrl, "photoUrl", { min: 1, max: 2048 });
  ensureRequiredDate(req.body.enrollmentDate, "enrollmentDate");
  ensureOptionalString(req.body.previousSchool, "previousSchool", { min: 1, max: 255 });
  ensureOptionalString(req.body.previousClass, "previousClass", { min: 1, max: 100 });
  ensureOptionalString(req.body.tcNumber, "tcNumber", { min: 1, max: 100 });
  ensureOptionalUuid(req.body.siblingId, "siblingId");
  ensureBoolean(req.body.isStaffWard, "isStaffWard");
  ensureOptionalEnum(req.body.status, "status", STATUSES);
  ensureBoolean(req.body.transportRequired, "transportRequired");
  ensureBoolean(req.body.hostelRequired, "hostelRequired");
  ensureOptionalString(req.body.medicalConditions, "medicalConditions", { min: 1, max: 1000 });
  ensureOptionalString(req.body.emergencyContactName, "emergencyContactName", { min: 1, max: 150 });
  ensureOptionalString(req.body.emergencyContactPhone, "emergencyContactPhone", { min: 1, max: 20 });
  ensureOptionalString(req.body.address, "address", { min: 1, max: 1000 });
  ensureOptionalString(req.body.city, "city", { min: 1, max: 100 });
  ensureOptionalString(req.body.pincode, "pincode", { min: 1, max: 20 });
});

export const updateStudentValidator = createValidator((req) => {
  ensureNoTenantId(req.body);
  ensureDisallowedField(req.body.userId, "userId");

  if (req.body.admissionNumber !== undefined) {
    ensureString(req.body.admissionNumber, "admissionNumber", { min: 1, max: 50 });
  }
  if (req.body.rollNumber !== undefined) {
    ensureOptionalString(req.body.rollNumber, "rollNumber", { min: 1, max: 30 });
  }
  if (req.body.firstName !== undefined) {
    ensureString(req.body.firstName, "firstName", { min: 1, max: 100 });
  }
  if (req.body.middleName !== undefined) {
    ensureOptionalString(req.body.middleName, "middleName", { min: 1, max: 100 });
  }
  if (req.body.lastName !== undefined) {
    ensureString(req.body.lastName, "lastName", { min: 1, max: 100 });
  }
  if (req.body.dateOfBirth !== undefined) {
    ensureDate(req.body.dateOfBirth, "dateOfBirth");
  }
  if (req.body.gender !== undefined) {
    ensureEnum(req.body.gender, "gender", GENDERS);
  }
  if (req.body.bloodGroup !== undefined) {
    ensureOptionalEnum(req.body.bloodGroup, "bloodGroup", BLOOD_GROUPS);
  }
  if (req.body.nationality !== undefined) {
    ensureOptionalString(req.body.nationality, "nationality", { min: 1, max: 100 });
  }
  if (req.body.religion !== undefined) {
    ensureOptionalString(req.body.religion, "religion", { min: 1, max: 100 });
  }
  if (req.body.caste !== undefined) {
    ensureOptionalString(req.body.caste, "caste", { min: 1, max: 100 });
  }
  if (req.body.category !== undefined) {
    ensureOptionalEnum(req.body.category, "category", CATEGORIES);
  }
  if (req.body.aadharNumber !== undefined) {
    ensureOptionalString(req.body.aadharNumber, "aadharNumber", { min: 1, max: 255 });
  }
  if (req.body.photoUrl !== undefined) {
    ensureOptionalString(req.body.photoUrl, "photoUrl", { min: 1, max: 2048 });
  }
  if (req.body.enrollmentDate !== undefined) {
    ensureDate(req.body.enrollmentDate, "enrollmentDate");
  }
  if (req.body.previousSchool !== undefined) {
    ensureOptionalString(req.body.previousSchool, "previousSchool", { min: 1, max: 255 });
  }
  if (req.body.previousClass !== undefined) {
    ensureOptionalString(req.body.previousClass, "previousClass", { min: 1, max: 100 });
  }
  if (req.body.tcNumber !== undefined) {
    ensureOptionalString(req.body.tcNumber, "tcNumber", { min: 1, max: 100 });
  }
  if (req.body.siblingId !== undefined) {
    ensureOptionalUuid(req.body.siblingId, "siblingId");
  }
  if (req.body.isStaffWard !== undefined) {
    ensureBoolean(req.body.isStaffWard, "isStaffWard");
  }
  if (req.body.status !== undefined) {
    ensureEnum(req.body.status, "status", STATUSES);
  }
  if (req.body.transportRequired !== undefined) {
    ensureBoolean(req.body.transportRequired, "transportRequired");
  }
  if (req.body.hostelRequired !== undefined) {
    ensureBoolean(req.body.hostelRequired, "hostelRequired");
  }
  if (req.body.medicalConditions !== undefined) {
    ensureOptionalString(req.body.medicalConditions, "medicalConditions", { min: 1, max: 1000 });
  }
  if (req.body.emergencyContactName !== undefined) {
    ensureOptionalString(req.body.emergencyContactName, "emergencyContactName", { min: 1, max: 150 });
  }
  if (req.body.emergencyContactPhone !== undefined) {
    ensureOptionalString(req.body.emergencyContactPhone, "emergencyContactPhone", { min: 1, max: 20 });
  }
  if (req.body.address !== undefined) {
    ensureOptionalString(req.body.address, "address", { min: 1, max: 1000 });
  }
  if (req.body.city !== undefined) {
    ensureOptionalString(req.body.city, "city", { min: 1, max: 100 });
  }
  if (req.body.pincode !== undefined) {
    ensureOptionalString(req.body.pincode, "pincode", { min: 1, max: 20 });
  }
});