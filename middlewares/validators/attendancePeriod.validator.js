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
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(value)) {
    throw new AppError(`${fieldName} must be in YYYY-MM-DD format`, 400);
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

// --- UUID Validators for Route Params ---

export const attendancePeriodIdValidator = createValidator((req) => {
  const { id } = req.params;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  if (!id || !uuidRegex.test(id)) {
    throw new AppError("Invalid or missing Attendance Period ID", 400);
  }
});

export const studentIdValidator = createValidator((req) => {
  const { studentId } = req.params;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  if (!studentId || !uuidRegex.test(studentId)) {
    throw new AppError("Invalid or missing Student ID", 400);
  }
});

export const timetableSlotIdValidator = createValidator((req) => {
  const { timetableSlotId } = req.params;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  if (!timetableSlotId || !uuidRegex.test(timetableSlotId)) {
    throw new AppError("Invalid or missing Timetable Slot ID", 400);
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

// --- CREATE ATTENDANCE PERIOD VALIDATOR ---

export const createAttendancePeriodValidator = createValidator((req) => {
  const { body } = req;

  // Required fields
  ensureUUID(body.studentId, "studentId");
  ensureUUID(body.timetableSlotId, "timetableSlotId");
  ensureDate(body.date, "date");
  ensureEnum(body.status, "status", ["present", "absent", "late"]);

  // Optional fields
  ensureOptionalString(body.remarks, "remarks", { min: 1, max: 1000 });
});

// --- UPDATE ATTENDANCE PERIOD VALIDATOR ---

export const updateAttendancePeriodValidator = createValidator((req) => {
  const { body } = req;

  // All fields are optional for update
  if (body.status) {
    ensureEnum(body.status, "status", ["present", "absent", "late"]);
  }

  ensureOptionalString(body.remarks, "remarks", { min: 1, max: 1000 });
});

// --- BULK MARK ATTENDANCE PERIOD VALIDATOR ---

export const bulkMarkAttendancePeriodValidator = createValidator((req) => {
  const { body } = req;

  if (!Array.isArray(body.records)) {
    throw new AppError("records must be an array", 400);
  }

  if (body.records.length === 0) {
    throw new AppError("At least one attendance period record is required", 400);
  }

  body.records.forEach((record, index) => {
    if (!record.studentId) throw new AppError(`Record ${index}: studentId is required`, 400);
    if (!record.timetableSlotId)
      throw new AppError(`Record ${index}: timetableSlotId is required`, 400);
    if (!record.date) throw new AppError(`Record ${index}: date is required`, 400);
    if (!record.status) throw new AppError(`Record ${index}: status is required`, 400);

    const validStatuses = ["present", "absent", "late"];
    if (!validStatuses.includes(record.status)) {
      throw new AppError(
        `Record ${index}: Invalid status value. Must be one of: ${validStatuses.join(", ")}`,
        400
      );
    }

    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(record.date)) {
      throw new AppError(`Record ${index}: date must be in YYYY-MM-DD format`, 400);
    }
  });
});

// --- SEARCH VALIDATOR ---

export const searchAttendancePeriodValidator = createValidator((req) => {
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
