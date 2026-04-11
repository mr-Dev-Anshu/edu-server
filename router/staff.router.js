import express from "express";
import { StaffController } from "../controllers/staff.controller.js";
import { tenantValidator, staffIdValidator ,createStaffValidator, updateStaffValidator } from "../middlewares/validators/staff.validator.js";
import { requireTenantId, tenantIdMiddleware } from "../middlewares/tenant.middleware.js";


const router = express.Router();
const ctrl = new StaffController();

router.use(tenantIdMiddleware);
router.use(tenantValidator);

// Create staff
router.post("/", requireTenantId, createStaffValidator, ctrl.create);

// Get all staff
router.get("/", ctrl.getAll);

// Search staff
router.get("/search", ctrl.search);

// Get specific staff by ID
router.get("/:id", staffIdValidator, ctrl.getOne);

// Update staff
router.patch("/:id", requireTenantId, staffIdValidator, updateStaffValidator, ctrl.update);

// Delete staff
router.delete("/:id", requireTenantId, staffIdValidator, ctrl.delete);

export default router;
