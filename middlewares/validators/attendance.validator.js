import { AppError } from "../../utils/AppError.js";

/**
 * Higher-order function to create a middleware validator
 */
const createValidator = (validateFn) => (req, res, next) => {
  try {
    validateFn(req);
    next();
  } catch (error) {
    next(error);
  }
};

// --- Helper Functions ---

const ensureString = (value, fieldName, { min = 1, max = 255 } = {}) => {
  if (typeof value !== "string" || value.trim().length < min || value.trim().length > max) {
    throw new AppError(`${fieldName} must be between ${min} and ${max} characters`, 400);
  }
};

const ensureOptionalString = (value, fieldName, options = {}) => {
  if (value === undefined || value === null || value === "") return;
  ensureString(value, fieldName, options);
};

const ensureDate = (value, fieldName) => {
  if (!value) throw new AppError(`${fieldName} is required`, 400);
  const date = new Date(value);
  if (isNaN(date.getTime())) {
    throw new AppError(`${fieldName} must be a valid date format (YYYY-MM-DD)`, 400);
  }
};

const ensureTime = (value, fieldName) => {
  if (!value) return;
  const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/;
  if (!timeRegex.test(value)) {
    throw new AppError(`${fieldName} must be in HH:MM:SS format`, 400);
  }
};

const ensureUUID = (value, fieldName) => {
  if (!value) throw new AppError(`${fieldName} is required`, 400);
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(value)) {
    throw new AppError(`${fieldName} must be a valid UUID`, 400);
  }
};

const ensureOptionalUUID = (value, fieldName) => {
  if (value === undefined || value === null || value === "") return;
  ensureUUID(value, fieldName);
};

const ensureEnum = (value, fieldName, allowedValues) => {
  if (!allowedValues.includes(value)) {
    throw new AppError(`${fieldName} must be one of: ${allowedValues.join(", ")}`, 400);
  }
};

// --- UUID Validator for Route Params ---

export const attendanceIdValidator = createValidator((req) => {
  const { id } = req.params;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  if (!id || !uuidRegex.test(id)) {
    throw new AppError("Invalid or missing Attendance ID", 400);
  }
});

export const studentIdValidator = createValidator((req) => {
  const { studentId } = req.params;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  if (!studentId || !uuidRegex.test(studentId)) {
    throw new AppError("Invalid or missing Student ID", 400);
  }
});

export const sectionIdValidator = createValidator((req) => {
  const { sectionId } = req.params;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  if (!sectionId || !uuidRegex.test(sectionId)) {
    throw new AppError("Invalid or missing Section ID", 400);
  }
});

export const dateParamValidator = createValidator((req) => {
  const { date } = req.params;
  if (!date) {
    throw new AppError("Date parameter is required", 400);
  }
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(date)) {
    throw new AppError("Date must be in YYYY-MM-DD format", 400);
  }
});

// --- CREATE ATTENDANCE VALIDATOR ---

export const createAttendanceValidator = createValidator((req) => {
  const { body } = req;

  // Required fields
  ensureUUID(body.studentId, "studentId");
  ensureUUID(body.sectionId, "sectionId");
  ensureUUID(body.academicYearId, "academicYearId");
  ensureDate(body.date, "date");
  ensureEnum(body.status, "status", ["present", "absent", "late", "half_day", "on_leave", "holiday"]);

  // Optional time fields
  ensureOptionalString(body.inTime, "inTime", { min: 1, max: 8 });
  ensureOptionalString(body.outTime, "outTime", { min: 1, max: 8 });

  // Validate time format if provided
  if (body.inTime) ensureTime(body.inTime, "inTime");
  if (body.outTime) ensureTime(body.outTime, "outTime");

  // Optional fields
  ensureOptionalString(body.remarks, "remarks", { min: 1, max: 1000 });
});

// --- UPDATE ATTENDANCE VALIDATOR ---

export const updateAttendanceValidator = createValidator((req) => {
  const { body } = req;

  // All fields are optional for update
  if (body.status) {
    ensureEnum(body.status, "status", ["present", "absent", "late", "half_day", "on_leave", "holiday"]);
  }

  if (body.inTime) ensureTime(body.inTime, "inTime");
  if (body.outTime) ensureTime(body.outTime, "outTime");

  ensureOptionalString(body.remarks, "remarks", { min: 1, max: 1000 });
  ensureOptionalString(body.correctionReason, "correctionReason", { min: 1, max: 1000 });

  if (body.correctedById) {
    ensureUUID(body.correctedById, "correctedById");
  }
});

// --- BULK MARK ATTENDANCE VALIDATOR ---

export const bulkMarkAttendanceValidator = createValidator((req) => {
  const { body } = req;

  if (!Array.isArray(body.records)) {
    throw new AppError("records must be an array", 400);
  }

  if (body.records.length === 0) {
    throw new AppError("At least one attendance record is required", 400);
  }

  body.records.forEach((record, index) => {
    if (!record.studentId) throw new AppError(`Record ${index}: studentId is required`, 400);
    if (!record.sectionId) throw new AppError(`Record ${index}: sectionId is required`, 400);
    if (!record.academicYearId) throw new AppError(`Record ${index}: academicYearId is required`, 400);
    if (!record.date) throw new AppError(`Record ${index}: date is required`, 400);
    if (!record.status) throw new AppError(`Record ${index}: status is required`, 400);

    const validStatuses = ["present", "absent", "late", "half_day", "on_leave", "holiday"];
    if (!validStatuses.includes(record.status)) {
      throw new AppError(`Record ${index}: Invalid status value`, 400);
    }
  });
});

// --- SEARCH VALIDATOR ---

export const searchAttendanceValidator = createValidator((req) => {
  const { q, search } = req.query;
  const searchTerm = q || search || "";

  if (searchTerm && searchTerm.length < 2) {
    throw new AppError("Search term must be at least 2 characters", 400);
  }

  if (req.query.page && Number.parseInt(req.query.page, 10) <= 0) {
    throw new AppError("Page must be a positive number", 400);
  }

  if (req.query.limit && Number.parseInt(req.query.limit, 10) <= 0) {
    throw new AppError("Limit must be a positive number", 400);
  }
});

// --- DATE RANGE VALIDATOR ---

export const dateRangeValidator = createValidator((req) => {
  const { startDate, endDate } = req.query;

  if (!startDate) throw new AppError("startDate is required", 400);
  if (!endDate) throw new AppError("endDate is required", 400);

  const startDateRegex = /^\d{4}-\d{2}-\d{2}$/;
  const endDateRegex = /^\d{4}-\d{2}-\d{2}$/;

  if (!startDateRegex.test(startDate)) {
    throw new AppError("startDate must be in YYYY-MM-DD format", 400);
  }

  if (!endDateRegex.test(endDate)) {
    throw new AppError("endDate must be in YYYY-MM-DD format", 400);
  }

  const start = new Date(startDate);
  const end = new Date(endDate);

  if (start > end) {
    throw new AppError("startDate must be before endDate", 400);
  }
});
