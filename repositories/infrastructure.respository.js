import { Op } from "sequelize";
import { Room, Timetable, TimetableSlot } from "../models/index.js";
import { AppError } from "../utils/AppError.js";
import { BaseRepository } from "./base.repository.js";

// ─── Room Repository ───────────────────────────────────────────────────────────

export class RoomRepository extends BaseRepository {
    constructor() {
        super(Room);
    }

    async findById(id, tenantId) {
        const record = await Room.findOne({ where: { id, tenantId } });
        if (!record) throw new AppError("Room not found", 404);
        return record;
    }

    async findAll(tenantId, filters = {}) {
        const where = { tenantId };
        if (filters.roomType) where.roomType = filters.roomType;

        return await Room.findAll({
            where,
            order: [["createdAt", "DESC"]],
        });
    }

    async findByName(name, tenantId) {
        return await Room.findOne({ where: { name: name.trim(), tenantId } });
    }

    async create(data) {
        return await Room.create(data);
    }

    async update(id, tenantId, data) {
        const room = await this.findById(id, tenantId);
        return await room.update(data);
    }

    async softDelete(id, tenantId) {
        const room = await this.findById(id, tenantId);
        return await room.destroy(); // paranoid: true → sets deletedAt
    }
}

// ─── Timetable Repository ──────────────────────────────────────────────────────

export class TimetableRepository extends BaseRepository {
    constructor() {
        super(Timetable);
    }

    async findById(id, tenantId) {
        const record = await Timetable.findOne({ where: { id, tenantId } });
        if (!record) throw new AppError("Timetable not found", 404);
        return record;
    }

    async findAll(tenantId, filters = {}) {
        const where = { tenantId };
        if (filters.sectionId) where.sectionId = filters.sectionId;
        if (filters.academicYearId) where.academicYearId = filters.academicYearId;
        if (filters.status) where.status = filters.status;

        return await Timetable.findAll({
            where,
            order: [["createdAt", "DESC"]],
        });
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

    async create(data) {
        return await Timetable.create(data);
    }

    async update(id, tenantId, data) {
        const timetable = await this.findById(id, tenantId);
        return await timetable.update(data);
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

    async findById(id, tenantId) {
        const record = await TimetableSlot.findOne({ where: { id, tenantId } });
        if (!record) throw new AppError("Timetable slot not found", 404);
        return record;
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

    async create(data) {
        return await TimetableSlot.create(data);
    }

    async update(id, tenantId, data) {
        const slot = await this.findById(id, tenantId);
        return await slot.update(data);
    }

    async delete(id, tenantId) {
        const slot = await this.findById(id, tenantId);
        return await slot.destroy();
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

    async bulkCreate(slots, transaction) {
        return await TimetableSlot.bulkCreate(slots, {
            transaction,
            validate: true,
        });
    }
}