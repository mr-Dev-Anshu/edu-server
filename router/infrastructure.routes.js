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
    checkPermission("read:room"),
    roomController.getAll
);

router.post("/rooms",
    identifyUser,
    checkPermission("create:room"),
    createRoomValidator,
    roomController.create
);

router.get("/rooms/:id",
    identifyUser,
    checkPermission("read:room"),
    roomController.getOne
);

router.patch("/rooms/:id",
    identifyUser,
    checkPermission("update:room"),
    updateRoomValidator,
    roomController.update
);

router.delete("/rooms/:id",
    identifyUser,
    checkPermission("delete:room"),
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
    checkPermission("read:timetable"),
    timetableController.getAll
);

router.post("/timetables",
    identifyUser,
    checkPermission("create:timetable"),
    createTimetableValidator,
    timetableController.create
);

router.get("/timetables/:id",
    identifyUser,
    checkPermission("read:timetable"),
    timetableController.getOne
);

router.patch("/timetables/:id",
    identifyUser,
    checkPermission("update:timetable"),
    updateTimetableValidator,
    timetableController.update
);

router.delete("/timetables/:id",
    identifyUser,
    checkPermission("delete:timetable"),
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
    checkPermission("read:timetable_slot"),
    timetableSlotController.getAll
);

router.post("/slots",
    identifyUser,
    checkPermission("create:timetable_slot"),
    createTimetableSlotValidator,
    timetableSlotController.create
);

router.get("/slots/:id",
    identifyUser,
    checkPermission("read:timetable_slot"),
    timetableSlotController.getOne
);

router.patch("/slots/:id",
    identifyUser,
    checkPermission("update:timetable_slot"),
    updateTimetableSlotValidator,
    timetableSlotController.update
);

router.delete("/slots/:id",
    identifyUser,
    checkPermission("delete:timetable_slot"),
    timetableSlotController.delete
);

export default router;