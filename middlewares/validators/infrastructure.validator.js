import { AppError } from "../../utils/AppError.js";
import { createValidator } from "../../utils/createValidator.js";

// ─── Shared Helpers ────────────────────────────────────────────────────────────

function ensureString(value, fieldName) {
    if (typeof value !== "string" || value.trim() === "") {
        throw new AppError(`${fieldName} must be a non-empty string`, 400);
    }
}

function ensureOptionalString(value, fieldName) {
    if (value !== undefined && (typeof value !== "string" || value.trim() === "")) {
        throw new AppError(`${fieldName} must be a non-empty string if provided`, 400);
    }
}

function ensureUUID(value, fieldName) {
    const UUID_REGEX =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!UUID_REGEX.test(value)) {
        throw new AppError(`${fieldName} must be a valid UUID`, 400);
    }
}

function ensurePositiveInteger(value, fieldName) {
    if (!Number.isInteger(value) || value <= 0) {
        throw new AppError(`${fieldName} must be a positive integer`, 400);
    }
}

function ensureOptionalPositiveInteger(value, fieldName) {
    if (value !== undefined) ensurePositiveInteger(value, fieldName);
}

function ensureRoomType(value) {
    const VALID = ["classroom", "lab", "hall", "sports", "library"];
    if (!VALID.includes(value)) {
        throw new AppError(
            `roomType must be one of: ${VALID.join(", ")}`,
            400
        );
    }
}

function ensureOptionalRoomType(value) {
    if (value !== undefined) ensureRoomType(value);
}

function ensureTimetableStatus(value) {
    const VALID = ["draft", "published", "archived"];
    if (!VALID.includes(value)) {
        throw new AppError(
            `status must be one of: ${VALID.join(", ")}`,
            400
        );
    }
}

function ensureDayOfWeek(value) {
    if (!Number.isInteger(value) || value < 0 || value > 6) {
        throw new AppError("dayOfWeek must be an integer between 0 (Sunday) and 6 (Saturday)", 400);
    }
}

function ensureTimeFormat(value, fieldName) {
    // Accepts HH:MM or HH:MM:SS
    if (!/^\d{2}:\d{2}(:\d{2})?$/.test(value)) {
        throw new AppError(`${fieldName} must be in HH:MM or HH:MM:SS format`, 400);
    }
}

function ensureEndAfterStart(startTime, endTime) {
    const [sh, sm] = startTime.split(":").map(Number);
    const [eh, em] = endTime.split(":").map(Number);
    const startMinutes = sh * 60 + sm;
    const endMinutes = eh * 60 + em;
    if (endMinutes <= startMinutes) {
        throw new AppError("endTime must be after startTime", 400);
    }
}

// ─── Room Validators ───────────────────────────────────────────────────────────

export const createRoomValidator = createValidator((req) => {
    const { name, roomType, capacity } = req.body;

    ensureString(name, "name");
    if (name.trim().length > 100)
        throw new AppError("name must not exceed 100 characters", 400);

    if (roomType !== undefined) ensureRoomType(roomType);
    if (capacity !== undefined) ensurePositiveInteger(capacity, "capacity");
});

export const updateRoomValidator = createValidator((req) => {
    const { name, roomType, capacity } = req.body;

    if (Object.keys(req.body).length === 0)
        throw new AppError("No fields provided for update", 400);

    ensureOptionalString(name, "name");
    if (name !== undefined && name.trim().length > 100)
        throw new AppError("name must not exceed 100 characters", 400);

    ensureOptionalRoomType(roomType);
    ensureOptionalPositiveInteger(capacity, "capacity");
});

// ─── Timetable Validators ──────────────────────────────────────────────────────

export const createTimetableValidator = createValidator((req) => {
    const { sectionId, academicYearId, name, status } = req.body;

    ensureString(sectionId, "sectionId");
    ensureUUID(sectionId, "sectionId");

    ensureString(academicYearId, "academicYearId");
    ensureUUID(academicYearId, "academicYearId");

    ensureString(name, "name");
    if (name.trim().length > 150)
        throw new AppError("name must not exceed 150 characters", 400);

    if (status !== undefined) ensureTimetableStatus(status);
});

export const updateTimetableValidator = createValidator((req) => {
    const { name, status, sectionId, academicYearId } = req.body;

    if (Object.keys(req.body).length === 0)
        throw new AppError("No fields provided for update", 400);

    // sectionId and academicYearId are structural — block changes after creation
    if (sectionId !== undefined)
        throw new AppError("sectionId cannot be changed after creation", 400);
    if (academicYearId !== undefined)
        throw new AppError("academicYearId cannot be changed after creation", 400);

    ensureOptionalString(name, "name");
    if (name !== undefined && name.trim().length > 150)
        throw new AppError("name must not exceed 150 characters", 400);

    if (status !== undefined) ensureTimetableStatus(status);
});

// ─── TimetableSlot Validators ──────────────────────────────────────────────────

export const createTimetableSlotValidator = createValidator((req) => {
    const {
        timetableId,
        subjectId,
        teacherId,
        roomId,
        dayOfWeek,
        periodNumber,
        startTime,
        endTime,
    } = req.body;

    ensureString(timetableId, "timetableId");
    ensureUUID(timetableId, "timetableId");

    ensureString(subjectId, "subjectId");
    ensureUUID(subjectId, "subjectId");

    ensureString(teacherId, "teacherId");
    ensureUUID(teacherId, "teacherId");

    if (roomId !== undefined) {
        ensureString(roomId, "roomId");
        ensureUUID(roomId, "roomId");
    }

    if (dayOfWeek === undefined || dayOfWeek === null)
        throw new AppError("dayOfWeek is required", 400);
    ensureDayOfWeek(dayOfWeek);

    if (periodNumber === undefined || periodNumber === null)
        throw new AppError("periodNumber is required", 400);
    ensurePositiveInteger(periodNumber, "periodNumber");

    if (!startTime) throw new AppError("startTime is required", 400);
    ensureTimeFormat(startTime, "startTime");

    if (!endTime) throw new AppError("endTime is required", 400);
    ensureTimeFormat(endTime, "endTime");

    ensureEndAfterStart(startTime, endTime);
});

export const updateTimetableSlotValidator = createValidator((req) => {
    const {
        timetableId,
        subjectId,
        teacherId,
        roomId,
        dayOfWeek,
        periodNumber,
        startTime,
        endTime,
    } = req.body;

    if (Object.keys(req.body).length === 0)
        throw new AppError("No fields provided for update", 400);

    // timetableId is the structural parent — block reassignment
    if (timetableId !== undefined)
        throw new AppError("timetableId cannot be changed after creation", 400);

    if (subjectId !== undefined) ensureUUID(subjectId, "subjectId");
    if (teacherId !== undefined) ensureUUID(teacherId, "teacherId");
    if (roomId !== undefined) ensureUUID(roomId, "roomId");
    if (dayOfWeek !== undefined) ensureDayOfWeek(dayOfWeek);
    if (periodNumber !== undefined) ensurePositiveInteger(periodNumber, "periodNumber");

    if (startTime !== undefined) ensureTimeFormat(startTime, "startTime");
    if (endTime !== undefined) ensureTimeFormat(endTime, "endTime");

    // Only validate time ordering if both are present in this update
    if (startTime !== undefined && endTime !== undefined) {
        ensureEndAfterStart(startTime, endTime);
    }
});