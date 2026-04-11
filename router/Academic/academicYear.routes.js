import express from "express";
import { AcademicYearController } from "../../controllers/Academic/academicYear.controller.js";
import {
  tenantIdValidator,
  createAcademicYearValidator,
  updateAcademicYearValidator,
} from "../../middlewares/validators/Academic/academicYear.validator.js";
import { requireTenantId, tenantIdMiddleware } from "../../middlewares/tenant.middleware.js";

const router = express.Router();
const ctrl = new AcademicYearController();

router.use(tenantIdMiddleware);
router.use(tenantIdValidator);

// Create academic year
router.post("/", requireTenantId, createAcademicYearValidator, ctrl.create);

// Get all academic years
router.get("/", ctrl.getAll);

// Get current academic year
router.get("/current", ctrl.getCurrent);

// Get specific academic year by ID
router.get("/:id", ctrl.getOne);

// Update academic year
router.patch("/:id", requireTenantId, updateAcademicYearValidator, ctrl.update);

// Delete academic year
router.delete("/:id", requireTenantId, ctrl.delete);

// Set academic year as current
router.post("/:id/set-current", requireTenantId, ctrl.setCurrent);

// Lock academic year
router.post("/:id/lock", requireTenantId, ctrl.lock);

// Unlock academic year
router.post("/:id/unlock", requireTenantId, ctrl.unlock);

export default router;
