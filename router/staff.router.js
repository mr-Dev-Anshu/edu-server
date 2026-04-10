import express from "express";
import { StaffController } from "../controllers/staff.controller.js";
import { tenantValidator ,createStaffValidator, updateStaffValidator } from "../middlewares/validators/staff.validator.js";


const router = express.Router();
const ctrl = new StaffController();

router.use(tenantValidator);

// Create staff
router.post("/", createStaffValidator, ctrl.create);

// Get all staff
router.get("/", ctrl.getAll);

// Search staff
router.get("/search", ctrl.search);

// Get specific staff by ID
router.get("/:id", ctrl.getOne);

// Update staff
router.patch("/:id", updateStaffValidator, ctrl.update);

// Delete staff
router.delete("/:id", ctrl.delete);

export default router;
