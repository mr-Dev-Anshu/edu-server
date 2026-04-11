import express from "express";
import { AcademicYearController } from "../../controllers/Academic/academicYear.controller.js";
import {
  createAcademicYearValidator,
  updateAcademicYearValidator,
} from "../../middlewares/validators/Academic/academicYear.validator.js";
import { requireTenantId, tenantIdMiddleware } from "../../middlewares/tenant.middleware.js";

const router = express.Router();
const ctrl = new AcademicYearController();

router.use(tenantIdMiddleware);
router.use(requireTenantId);

// Create academic year
router.post("/", createAcademicYearValidator, ctrl.create);

// Get all academic years
router.get("/", requireTenantId, ctrl.getAll);

// Get current academic year
router.get("/current", requireTenantId, ctrl.getCurrent);

// Get specific academic year by ID
router.get("/:id", requireTenantId, ctrl.getOne);

// Update academic year
router.patch("/:id", updateAcademicYearValidator, ctrl.update);

// Delete academic year
router.delete("/:id", ctrl.delete);

// Set academic year as current
router.post("/:id/set-current", ctrl.setCurrent);

// Lock academic year
router.post("/:id/lock", ctrl.lock);

// Unlock academic year
router.post("/:id/unlock", ctrl.unlock);

export default router;
