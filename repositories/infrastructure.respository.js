import { Op } from "sequelize";
import { Room, Timetable, TimetableSlot } from "../models/index.js";
import { AppError } from "../utils/AppError.js";
import { BaseRepository } from "./base.repository.js";

// ─── Room Repository ───────────────────────────────────────────────────────────

export class RoomRepository extends BaseRepository {
    constructor() {
        super(Room);
    }

    async findByName(name, tenantId) {
        return await Room.findOne({ where: { name: name.trim(), tenantId } });
    }
}

// ─── Timetable Repository ──────────────────────────────────────────────────────

export class TimetableRepository extends BaseRepository {
    constructor() {
        super(Timetable);
    }

    async findWithSlots(id, tenantId) {
        const record = await Timetable.findOne({
            where: { id, tenantId },
            include: [
                {
                    model: TimetableSlot,
                    as: "slots",
                    required: false,
                },
            ],
            order: [[{ model: TimetableSlot, as: "slots" }, "dayOfWeek", "ASC"],
            [{ model: TimetableSlot, as: "slots" }, "periodNumber", "ASC"]],
        });
        if (!record) throw new AppError("Timetable not found", 404);
        return record;
    }

    async softDelete(id, tenantId) {
        const timetable = await this.findById(id, tenantId);
        return await timetable.destroy();
    }

    // Check for an existing published timetable for the same section + year
    async findPublishedConflict(sectionId, academicYearId, tenantId, excludeId = null) {
        const where = { sectionId, academicYearId, tenantId, status: "published" };
        if (excludeId) where.id = { [Op.ne]: excludeId };
        return await Timetable.findOne({ where });
    }
}

// ─── TimetableSlot Repository ──────────────────────────────────────────────────

export class TimetableSlotRepository extends BaseRepository {
    constructor() {
        super(TimetableSlot);
    }


    async findByTimetable(timetableId, tenantId) {
        return await TimetableSlot.findAll({
            where: { timetableId, tenantId },
            order: [
                ["dayOfWeek", "ASC"],
                ["periodNumber", "ASC"],
            ],
        });
    }

    async deleteByTimetable(timetableId, tenantId, transaction) {
        return await TimetableSlot.destroy({
            where: { timetableId, tenantId },
            transaction,
        });
    }

    // Collision check: same teacher already booked in this period
    async findTeacherConflict(tenantId, teacherId, dayOfWeek, periodNumber, excludeId = null) {
        const where = { tenantId, teacherId, dayOfWeek, periodNumber };
        if (excludeId) where.id = { [Op.ne]: excludeId };
        return await TimetableSlot.findOne({ where });
    }

    // Collision check: same room already booked in this period
    async findRoomConflict(tenantId, roomId, dayOfWeek, periodNumber, excludeId = null) {
        if (!roomId) return null;
        const where = { tenantId, roomId, dayOfWeek, periodNumber };
        if (excludeId) where.id = { [Op.ne]: excludeId };
        return await TimetableSlot.findOne({ where });
    }

    // async bulkCreate(slots, transaction) {
    //     return await TimetableSlot.bulkCreate(slots, {
    //         transaction,
    //         validate: true,
    //     });
    // }
}