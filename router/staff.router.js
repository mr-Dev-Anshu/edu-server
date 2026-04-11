import express from "express";
import { StaffController } from "../controllers/staff.controller.js";
import { staffIdValidator ,createStaffValidator, updateStaffValidator } from "../middlewares/validators/staff.validator.js";
import { requireTenantId, tenantIdMiddleware } from "../middlewares/tenant.middleware.js";

const router = express.Router();
const ctrl = new StaffController();

router.use(tenantIdMiddleware);
router.use(requireTenantId);

// Create staff
router.post("/", createStaffValidator, ctrl.create);

// Get all staff
router.get("/", requireTenantId, ctrl.getAll);

// Search staff
router.get("/search", requireTenantId, ctrl.search);

// Get specific staff by ID
router.get("/:id", requireTenantId, staffIdValidator, ctrl.getOne);

// Update staff
router.patch("/:id", staffIdValidator, updateStaffValidator, ctrl.update);

// Delete staff
router.delete("/:id", staffIdValidator, ctrl.delete);

export default router;
