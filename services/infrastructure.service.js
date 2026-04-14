import {
    RoomRepository,
    TimetableRepository,
    TimetableSlotRepository,
} from "../repositories/infrastructure.repository.js";
import { AppError } from "../utils/AppError.js";
import { withTransaction } from "../utils/withTransaction.js";

const roomRepo = new RoomRepository();
const timetableRepo = new TimetableRepository();
const slotRepo = new TimetableSlotRepository();

// ─── Formatters ────────────────────────────────────────────────────────────────

export function formatRoomResponse(room) {
    return {
        id: room.id,
        name: room.name,
        roomType: room.roomType,
        capacity: room.capacity,
        tenantId: room.tenantId,
        createdAt: room.createdAt,
        updatedAt: room.updatedAt,
    };
}

export function formatTimetableListResponse(timetable) {
    return {
        id: timetable.id,
        name: timetable.name,
        sectionId: timetable.sectionId,
        academicYearId: timetable.academicYearId,
        status: timetable.status,
        isPublished: timetable.status === "published",
        tenantId: timetable.tenantId,
        createdAt: timetable.createdAt,
        updatedAt: timetable.updatedAt,
    };
}

export function formatSlotResponse(slot) {
    return {
        id: slot.id,
        timetableId: slot.timetableId,
        subjectId: slot.subjectId,
        teacherId: slot.teacherId,
        roomId: slot.roomId ?? null,
        dayOfWeek: slot.dayOfWeek,
        periodNumber: slot.periodNumber,
        startTime: slot.startTime,
        endTime: slot.endTime,
        tenantId: slot.tenantId,
    };
}

// ─── Room Service ──────────────────────────────────────────────────────────────

export class RoomService {
    async listRooms(tenantId, filters = {}) {
        const rooms = await roomRepo.findAll(tenantId, filters);
        return rooms.map(formatRoomResponse);
    }

    async getRoomDetails(id, tenantId) {
        const room = await roomRepo.findById(id, tenantId);
        return formatRoomResponse(room);
    }

    async createRoom(body, tenantId) {
        const { name, roomType, capacity } = body;

        // Duplicate name check within the tenant
        const existing = await roomRepo.findByName(name, tenantId);
        if (existing) throw new AppError("A room with this name already exists", 409);

        const room = await roomRepo.create({
            name: name.trim(),
            roomType: roomType ?? "classroom",
            capacity: capacity,
            tenantId,
        });

        return formatRoomResponse(room);
    }

    async updateRoom(id, tenantId, body) {
        const updates = {};
        if (body.name !== undefined) updates.name = body.name.trim();
        if (body.roomType !== undefined) updates.roomType = body.roomType;
        if (body.capacity !== undefined) updates.capacity = body.capacity;

        if (body.name !== undefined) {
            const existing = await roomRepo.findByName(body.name, tenantId);
            if (existing && existing.id !== id)
                throw new AppError("A room with this name already exists", 409);
        }

        const room = await roomRepo.update(id, tenantId, updates);
        return formatRoomResponse(room);
    }

    async deleteRoom(id, tenantId) {
        await roomRepo.delete(id, tenantId);
        return { message: "Room deleted successfully" };
    }
}

// ─── Timetable Service ─────────────────────────────────────────────────────────

export class TimetableService {
    async listTimetables(tenantId, filters = {}) {
        const timetables = await timetableRepo.findAll(tenantId, filters);
        return timetables.map((t) => formatTimetableListResponse(t));
    }

    async getTimetableDetails(id, tenantId) {
        const timetable = await timetableRepo.findWithSlots(id, tenantId);
        const slots = timetable.slots ?? [];
        return formatTimetableListResponse(timetable, slots);
    }

    async createTimetable(body, tenantId) {
        const { sectionId, academicYearId, name, status } = body;

        const duplicate = await timetableRepo.findByNameForSectionYear(
            name,
            sectionId,
            academicYearId,
            tenantId
        );
        if (duplicate) {
            throw new AppError(
                "A timetable with this name already exists for this section and academic year",
                409
            );
        }

        const timetable = await timetableRepo.create({
            sectionId,
            academicYearId,
            name: name.trim(),
            status: status ?? "draft",
            tenantId,
        });

        return formatTimetableListResponse(timetable);
    }

    async updateTimetable(id, tenantId, body) {
        const updates = {};
        if (body.name !== undefined) updates.name = body.name.trim();
        if (body.status !== undefined) {
            // Guard: cannot re-publish if another published timetable already exists for same section+year
            if (body.status === "published") {
                const current = await timetableRepo.findById(id, tenantId);
                const conflict = await timetableRepo.findPublishedConflict(
                    current.sectionId,
                    current.academicYearId,
                    tenantId,
                    id
                );
                if (conflict)
                    throw new AppError(
                        "Another timetable is already published for this section and academic year",
                        409
                    );
            }
            updates.status = body.status;
        }

        await timetableRepo.update(id, tenantId, updates);
        const updated = await timetableRepo.findWithSlots(id, tenantId);
        return formatTimetableListResponse(updated, updated.slots ?? []);
    }

    async deleteTimetable(id, tenantId) {
        // Cascade delete slots inside a transaction before soft-deleting the timetable
        await withTransaction(async (t) => {
            await slotRepo.deleteByTimetable(id, tenantId, t);
            const timetable = await timetableRepo.findById(id, tenantId, { transaction: t });
            await timetable.destroy({ transaction: t });
        });
        return { message: "Timetable and all its slots deleted successfully" };
    }
}

// ─── TimetableSlot Service ─────────────────────────────────────────────────────

export class TimetableSlotService {
    async listSlots(timetableId, tenantId) {
        // Verify parent timetable exists first
        await timetableRepo.findById(timetableId, tenantId);
        const slots = await slotRepo.findByTimetable(timetableId, tenantId);
        return slots.map(formatSlotResponse);
    }

    async getSlotDetails(id, tenantId) {
        const slot = await slotRepo.findById(id, tenantId);
        return formatSlotResponse(slot);
    }

    async createSlot(body, tenantId) {
        const {
            timetableId,
            subjectId,
            teacherId,
            roomId,
            dayOfWeek,
            periodNumber,
            startTime,
            endTime,
        } = body;

        // Verify parent timetable exists
        const timetable = await timetableRepo.findById(timetableId, tenantId);
        if (timetable.status === "archived")
            throw new AppError("Cannot add slots to an archived timetable", 400);

        // Parallel collision checks
        const [teacherConflict, roomConflict] = await Promise.all([
            slotRepo.findTeacherConflict(tenantId, teacherId, dayOfWeek, periodNumber),
            slotRepo.findRoomConflict(tenantId, roomId, dayOfWeek, periodNumber),
        ]);

        if (teacherConflict)
            throw new AppError(
                "This teacher already has a class scheduled at this day and period",
                409
            );
        if (roomConflict)
            throw new AppError(
                "This room is already booked for this day and period",
                409
            );

        const slot = await slotRepo.create({
            timetableId,
            subjectId,
            teacherId,
            roomId: roomId ?? null,
            dayOfWeek,
            periodNumber,
            startTime,
            endTime,
            tenantId,
        });

        return formatSlotResponse(slot);
    }

    async updateSlot(id, tenantId, body) {
        const existing = await slotRepo.findById(id, tenantId);

        const teacherId = body.teacherId ?? existing.teacherId;
        const roomId = body.roomId !== undefined ? body.roomId : existing.roomId;
        const dayOfWeek = body.dayOfWeek ?? existing.dayOfWeek;
        const periodNumber = body.periodNumber ?? existing.periodNumber;

        // Collision checks for updated values
        const [teacherConflict, roomConflict] = await Promise.all([
            slotRepo.findTeacherConflict(tenantId, teacherId, dayOfWeek, periodNumber, id),
            slotRepo.findRoomConflict(tenantId, roomId, dayOfWeek, periodNumber, id),
        ]);

        if (teacherConflict)
            throw new AppError(
                "This teacher already has a class scheduled at this day and period",
                409
            );
        if (roomConflict)
            throw new AppError(
                "This room is already booked for this day and period",
                409
            );

        const updates = {};
        if (body.subjectId !== undefined) updates.subjectId = body.subjectId;
        if (body.teacherId !== undefined) updates.teacherId = body.teacherId;
        if (body.roomId !== undefined) updates.roomId = body.roomId ?? null;
        if (body.dayOfWeek !== undefined) updates.dayOfWeek = body.dayOfWeek;
        if (body.periodNumber !== undefined) updates.periodNumber = body.periodNumber;
        if (body.startTime !== undefined) updates.startTime = body.startTime;
        if (body.endTime !== undefined) updates.endTime = body.endTime;

        const slot = await slotRepo.update(id, tenantId, updates);
        return formatSlotResponse(slot);
    }

    async deleteSlot(id, tenantId) {
        await slotRepo.delete(id, tenantId);
        return { message: "Timetable slot deleted successfully" };
    }
}