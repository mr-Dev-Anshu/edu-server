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

    async findByNameForSectionYear(name, sectionId, academicYearId, tenantId) {
        return await Timetable.findOne({
            where: {
                name: name.trim(),
                sectionId,
                academicYearId,
                tenantId,
            },
        });
    }

    async findWithSlots(id, tenantId) {
        // 1. Fetch the Timetable without 'include'
        const record = await Timetable.findOne({
            where: { id, tenantId }
        });

        if (!record) return null;

        // 2. Fetch the slots manually using the timetableId
        const slots = await TimetableSlot.findAll({
            where: { timetableId: id, tenantId },
            order: [
                ["dayOfWeek", "ASC"],
                ["periodNumber", "ASC"]
            ]
        });

        // 3. Manually attach the slots to the Sequelize instance's dataValues
        // so the Service layer can read them just like it did before
        record.dataValues.slots = slots;

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
        // 1. Get all published timetables for this tenant manually
        const publishedTimetables = await Timetable.findAll({
            where: { tenantId, status: "published" },
            attributes: ["id"] // We only need the IDs
        });
        const publishedIds = publishedTimetables.map(t => t.id);

        if (publishedIds.length === 0) return null; // No published timetables to conflict with

        // 2. Search for a slot that matches the teacher AND belongs to a published timetable
        const where = {
            tenantId,
            teacherId,
            dayOfWeek,
            periodNumber,
            timetableId: publishedIds // Sequelize will turn this into an IN (...) clause
        };

        if (excludeId) {
            where.id = { [Op.ne]: excludeId };
        }

        return await TimetableSlot.findOne({ where });
    }


    // Collision check: same room already booked in this period
    async findRoomConflict(tenantId, roomId, dayOfWeek, periodNumber, excludeId = null) {
        if (!roomId) return null;

        // 1. Get all published timetables for this tenant manually
        const publishedTimetables = await Timetable.findAll({
            where: { tenantId, status: "published" },
            attributes: ["id"] // We only need the IDs
        });
        const publishedIds = publishedTimetables.map(t => t.id);

        if (publishedIds.length === 0) return null; // No published timetables to conflict with

        const where = { 
            tenantId, 
            roomId, 
            dayOfWeek, 
            periodNumber,
            timetableId: publishedIds 
        };
        
        if (excludeId) {
            where.id = { [Op.ne]: excludeId };
        }
        
        return await TimetableSlot.findOne({ where });
    }

    // async bulkCreate(slots, transaction) {
    //     return await TimetableSlot.bulkCreate(slots, {
    //         transaction,
    //         validate: true,
    //     });
    // }
}