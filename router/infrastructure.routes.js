import { Router } from "express";
// import { authenticate } from "../middlewares/authenticate.js";
// import { authorizeRoles } from "../middlewares/authorizeRoles.js";
import {
    createRoomValidator,
    updateRoomValidator,
    createTimetableValidator,
    updateTimetableValidator,
    createTimetableSlotValidator,
    updateTimetableSlotValidator,
} from "../middlewares/validators/infrastructure.validator.js";
import {
    roomController,
    timetableController,
    timetableSlotController,
} from "../controllers/infrastructure.controller.js";

const router = Router();

// All routes require authentication and tenant-level authorization
// Adjust roles to match your system — e.g., "admin", "teacher", etc.
// router.use(authenticate);

// ─── Room Routes ───────────────────────────────────────────────────────────────
// GET  /infrastructure/rooms              → list all rooms (filterable by roomType)
// POST /infrastructure/rooms              → create room (admin only)
// GET  /infrastructure/rooms/:id          → get one room
// PATCH /infrastructure/rooms/:id         → update room (admin only)
// DELETE /infrastructure/rooms/:id        → soft delete room (admin only)

router.get("/rooms", roomController.getAll);
router.post("/rooms", authorizeRoles("admin"), createRoomValidator, roomController.create);
router.get("/rooms/:id", roomController.getOne);
router.patch("/rooms/:id", authorizeRoles("admin"), updateRoomValidator, roomController.update);
router.delete("/rooms/:id", authorizeRoles("admin"), roomController.delete);

// ─── Timetable Routes ──────────────────────────────────────────────────────────
// GET  /infrastructure/timetables                         → list (filter: sectionId, academicYearId, status)
// POST /infrastructure/timetables                         → create timetable
// GET  /infrastructure/timetables/:id                     → get timetable WITH all its slots
// PATCH /infrastructure/timetables/:id                    → update name or status
// DELETE /infrastructure/timetables/:id                   → soft delete + cascade slots

router.get("/timetables", timetableController.getAll);
router.post(
    "/timetables",
    authorizeRoles("admin"),
    createTimetableValidator,
    timetableController.create
);
router.get("/timetables/:id", timetableController.getOne);
router.patch(
    "/timetables/:id",
    authorizeRoles("admin"),
    updateTimetableValidator,
    timetableController.update
);
router.delete("/timetables/:id", authorizeRoles("admin"), timetableController.delete);

// ─── TimetableSlot Routes ──────────────────────────────────────────────────────
// GET  /infrastructure/timetables/:timetableId/slots      → all slots for a timetable
// POST /infrastructure/slots                              → add a slot
// GET  /infrastructure/slots/:id                          → get one slot
// PATCH /infrastructure/slots/:id                         → update a slot
// DELETE /infrastructure/slots/:id                        → remove a slot

router.get("/timetables/:timetableId/slots", timetableSlotController.getAll);
router.post(
    "/slots",
    authorizeRoles("admin"),
    createTimetableSlotValidator,
    timetableSlotController.create
);
router.get("/slots/:id", timetableSlotController.getOne);
router.patch(
    "/slots/:id",
    authorizeRoles("admin"),
    updateTimetableSlotValidator,
    timetableSlotController.update
);
router.delete("/slots/:id", authorizeRoles("admin"), timetableSlotController.delete);

export default router;