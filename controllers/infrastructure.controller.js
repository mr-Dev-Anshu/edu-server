import {
    RoomService,
    TimetableService,
    TimetableSlotService,
} from "../services/infrastructure.service.js";
import { AppError } from "../utils/AppError.js";
import { catchAsync } from "../utils/catchAsync.js";

const roomService = new RoomService();
const timetableService = new TimetableService();
const slotService = new TimetableSlotService();

// ─── Room Controller ───────────────────────────────────────────────────────────


export class RoomController {
    getAll = catchAsync(async (req, res) => {
        const { roomType } = req.query;
        const data = await roomService.listRooms(req.tenantId, { roomType });
        res.status(200).json({ success: true, results: data.length, data });
    });

    getOne = catchAsync(async (req, res) => {
        const data = await roomService.getRoomDetails(req.params.id, req.tenantId);
        res.status(200).json({ success: true, data });
    });

    create = catchAsync(async (req, res) => {
        const data = await roomService.createRoom(req.body, req.tenantId);
        res.status(201).json({ success: true, data });
    });

    update = catchAsync(async (req, res) => {
        const data = await roomService.updateRoom(req.params.id, req.tenantId, req.body);
        res.status(200).json({ success: true, data });
    });

    delete = catchAsync(async (req, res) => {
        const data = await roomService.deleteRoom(req.params.id, req.tenantId);
        res.status(200).json({ success: true, data });
    });
}

// ─── Timetable Controller ──────────────────────────────────────────────────────

export class TimetableController {
    getAll = catchAsync(async (req, res) => {
        const { sectionId, academicYearId, status } = req.query;
        const data = await timetableService.listTimetables(req.tenantId, {
            sectionId,
            academicYearId,
            status,
        });
        res.status(200).json({ success: true, results: data.length, data });
    });

    getOne = catchAsync(async (req, res) => {
        const data = await timetableService.getTimetableDetails(req.params.id, req.tenantId);
        res.status(200).json({ success: true, data });
    });

    create = catchAsync(async (req, res) => {
        const data = await timetableService.createTimetable(req.body, req.tenantId);
        res.status(201).json({ success: true, data });
    });

    update = catchAsync(async (req, res) => {
        const data = await timetableService.updateTimetable(
            req.params.id,
            req.tenantId,
            req.body
        );
        res.status(200).json({ success: true, data });
    });

    delete = catchAsync(async (req, res) => {
        const data = await timetableService.deleteTimetable(req.params.id, req.tenantId);
        res.status(200).json({ success: true, data });
    });
}

// ─── TimetableSlot Controller ──────────────────────────────────────────────────

export class TimetableSlotController {
    getAll = catchAsync(async (req, res, next) => {
        const { timetableId } = req.params;
        if (!timetableId) return next(new AppError("timetableId is required", 400));
        const data = await slotService.listSlots(timetableId, req.tenantId);
        res.status(200).json({ success: true, results: data.length, data });
    });

    getOne = catchAsync(async (req, res) => {
        const data = await slotService.getSlotDetails(req.params.id, req.tenantId);
        res.status(200).json({ success: true, data });
    });

    create = catchAsync(async (req, res) => {
        const data = await slotService.createSlot(req.body, req.tenantId);
        res.status(201).json({ success: true, data });
    });

    update = catchAsync(async (req, res) => {
        const data = await slotService.updateSlot(req.params.id, req.tenantId, req.body);
        res.status(200).json({ success: true, data });
    });

    delete = catchAsync(async (req, res) => {
        const data = await slotService.deleteSlot(req.params.id, req.tenantId);
        res.status(200).json({ success: true, data });
    });
}

export const roomController = new RoomController();
export const timetableController = new TimetableController();
export const timetableSlotController = new TimetableSlotController();