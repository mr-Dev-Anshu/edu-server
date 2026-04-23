import { Router } from "express";
import { identifyUser, checkPermission } from "../middlewares/security/index.js";
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

// ─── Room Routes ────────────────────────────────────────────────────────────────

router.get("/rooms",
    identifyUser,
    checkPermission("read:infrastructure"),
    roomController.getAll
);

router.post("/rooms",
    identifyUser,
    checkPermission("create:infrastructure"),
    createRoomValidator,
    roomController.create
);

router.get("/rooms/:id",
    identifyUser,
    checkPermission("read:infrastructure"),
    roomController.getOne
);

router.patch("/rooms/:id",
    identifyUser,
    checkPermission("update:infrastructure"),
    updateRoomValidator,
    roomController.update
);

router.delete("/rooms/:id",
    identifyUser,
    checkPermission("delete:infrastructure"),
    roomController.delete
);

// ─── Timetable Routes ──────────────────────────────────────────────────────────
// GET    /infrastructure/timetables          → list (filter: sectionId, academicYearId, status)
// POST   /infrastructure/timetables          → create timetable
// GET    /infrastructure/timetables/:id      → get timetable WITH all its slots
// PATCH  /infrastructure/timetables/:id      → update name or status
// DELETE /infrastructure/timetables/:id      → soft delete + cascade slots

router.get("/timetables",
    identifyUser,
    checkPermission("read:infrastructure"),
    timetableController.getAll
);

router.post("/timetables",
    identifyUser,
    checkPermission("create:infrastructure"),
    createTimetableValidator,
    timetableController.create
);

router.get("/timetables/:id",
    identifyUser,
    checkPermission("read:infrastructure"),
    timetableController.getOne
);

router.patch("/timetables/:id",
    identifyUser,
    checkPermission("update:infrastructure"),
    updateTimetableValidator,
    timetableController.update
);

router.delete("/timetables/:id",
    identifyUser,
    checkPermission("delete:infrastructure"),
    timetableController.delete
);

// ─── TimetableSlot Routes ──────────────────────────────────────────────────────
// GET    /infrastructure/timetables/:timetableId/slots  → all slots for a timetable
// POST   /infrastructure/slots                          → add a slot
// GET    /infrastructure/slots/:id                      → get one slot
// PATCH  /infrastructure/slots/:id                      → update a slot
// DELETE /infrastructure/slots/:id                      → remove a slot

router.get("/timetables/:timetableId/slots",
    identifyUser,
    checkPermission("read:infrastructure"),
    timetableSlotController.getAll
);

router.post("/slots",
    identifyUser,
    checkPermission("create:infrastructure"),
    createTimetableSlotValidator,
    timetableSlotController.create
);

router.get("/slots/:id",
    identifyUser,
    checkPermission("read:infrastructure"),
    timetableSlotController.getOne
);

router.patch("/slots/:id",
    identifyUser,
    checkPermission("update:infrastructure"),
    updateTimetableSlotValidator,
    timetableSlotController.update
);

router.delete("/slots/:id",
    identifyUser,
    checkPermission("delete:infrastructure"),
    timetableSlotController.delete
);

export default router;