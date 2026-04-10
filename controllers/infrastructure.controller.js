import {
    RoomService,
    TimetableService,
    TimetableSlotService,
} from "../services/infrastructure.service.js";
import { AppError } from "../utils/AppError.js";

const roomService = new RoomService();
const timetableService = new TimetableService();
const slotService = new TimetableSlotService();

// ─── Room Controller ───────────────────────────────────────────────────────────

const tenantId = "c43e1e2a-9aad-4f59-9a72-776514d361f1"

export class RoomController {
    getAll = async (req, res, next) => {
        try {
            const { roomType } = req.query;
            const data = await roomService.listRooms(req.tenantId || tenantId, { roomType });
            res.status(200).json({ success: true, results: data.length, data });
        } catch (error) {
            next(error);
        }
    };

    getOne = async (req, res, next) => {
        try {
            const data = await roomService.getRoomDetails(req.params.id, req.tenantId || tenantId);
            res.status(200).json({ success: true, data });
        } catch (error) {
            next(error);
        }
    };

    create = async (req, res, next) => {
        try {
            const data = await roomService.createRoom(req.body, req.tenantId || tenantId);
            res.status(201).json({ success: true, data });
        } catch (error) {
            next(error);
        }
    };

    update = async (req, res, next) => {
        try {
            const data = await roomService.updateRoom(req.params.id, req.tenantId || tenantId, req.body);
            res.status(200).json({ success: true, data });
        } catch (error) {
            next(error);
        }
    };

    delete = async (req, res, next) => {
        try {
            const data = await roomService.deleteRoom(req.params.id, req.tenantId || tenantId);
            res.status(200).json({ success: true, data });
        } catch (error) {
            next(error);
        }
    };
}

// ─── Timetable Controller ──────────────────────────────────────────────────────

export class TimetableController {
    getAll = async (req, res, next) => {
        try {
            const { sectionId, academicYearId, status } = req.query;
            const data = await timetableService.listTimetables(req.tenantId || tenantId, {
                sectionId,
                academicYearId,
                status,
            });
            res.status(200).json({ success: true, results: data.length, data });
        } catch (error) {
            next(error);
        }
    };

    getOne = async (req, res, next) => {
        try {
            const data = await timetableService.getTimetableDetails(req.params.id, req.tenantId || tenantId);
            res.status(200).json({ success: true, data });
        } catch (error) {
            next(error);
        }
    };

    create = async (req, res, next) => {
        try {
            const data = await timetableService.createTimetable(req.body, req.tenantId || tenantId);
            res.status(201).json({ success: true, data });
        } catch (error) {
            next(error);
        }
    };

    update = async (req, res, next) => {
        try {
            const data = await timetableService.updateTimetable(
                req.params.id,
                req.tenantId || tenantId,
                req.body
            );
            res.status(200).json({ success: true, data });
        } catch (error) {
            next(error);
        }
    };

    delete = async (req, res, next) => {
        try {
            const data = await timetableService.deleteTimetable(req.params.id, req.tenantId || tenantId);
            res.status(200).json({ success: true, data });
        } catch (error) {
            next(error);
        }
    };
}

// ─── TimetableSlot Controller ──────────────────────────────────────────────────

export class TimetableSlotController {
    getAll = async (req, res, next) => {
        try {
            const { timetableId } = req.params;
            if (!timetableId) return next(new AppError("timetableId is required", 400));
            const data = await slotService.listSlots(timetableId, req.tenantId || tenantId);
            res.status(200).json({ success: true, results: data.length, data });
        } catch (error) {
            next(error);
        }
    };

    getOne = async (req, res, next) => {
        try {
            const data = await slotService.getSlotDetails(req.params.id, req.tenantId || tenantId);
            res.status(200).json({ success: true, data });
        } catch (error) {
            next(error);
        }
    };

    create = async (req, res, next) => {
        try {
            const data = await slotService.createSlot(req.body, req.tenantId || tenantId);
            res.status(201).json({ success: true, data });
        } catch (error) {
            next(error);
        }
    };

    update = async (req, res, next) => {
        try {
            const data = await slotService.updateSlot(req.params.id, req.tenantId || tenantId, req.body);
            res.status(200).json({ success: true, data });
        } catch (error) {
            next(error);
        }
    };

    delete = async (req, res, next) => {
        try {
            const data = await slotService.deleteSlot(req.params.id, req.tenantId || tenantId);
            res.status(200).json({ success: true, data });
        } catch (error) {
            next(error);
        }
    };
}

export const roomController = new RoomController();
export const timetableController = new TimetableController();
export const timetableSlotController = new TimetableSlotController();