import express from "express";
import { StaffController } from "../controllers/staff.controller.js";
import { staffIdValidator ,createStaffValidator, updateStaffValidator } from "../middlewares/validators/staff.validator.js";
import { identifyUser, checkPermission } from "../middlewares/security/index.js";

const router = express.Router();
const ctrl = new StaffController();

// Create staff
router.post("/", identifyUser, checkPermission("create:staff"), createStaffValidator, ctrl.create);

// Get all staff
router.get("/", identifyUser, ctrl.getAll);

// Search staff
router.get("/search", identifyUser, ctrl.search);

// Get specific staff by ID
router.get("/:id", identifyUser, staffIdValidator, ctrl.getOne);

// Update staff
router.patch("/:id", identifyUser, checkPermission("update:staff"), staffIdValidator, updateStaffValidator, ctrl.update);

// Delete staff
router.delete("/:id", identifyUser, checkPermission("delete:staff"), staffIdValidator, ctrl.delete);

export default router;
