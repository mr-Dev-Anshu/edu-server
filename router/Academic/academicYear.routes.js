import express from "express";
import { AcademicYearController } from "../../controllers/Academic/academicYear.controller.js";
import {
  createAcademicYearValidator,
  updateAcademicYearValidator,
} from "../../middlewares/validators/Academic/academicYear.validator.js";
import { identifyUser, checkPermission } from "../../middlewares/security/index.js";

const router = express.Router();
const ctrl = new AcademicYearController();

// Create academic year
router.post("/", identifyUser, checkPermission("create:academicyears"), createAcademicYearValidator, ctrl.create);

// Get all academic years
router.get("/", identifyUser, ctrl.getAll);

// Get current academic year
router.get("/current", identifyUser, ctrl.getCurrent);

// Get specific academic year by ID
router.get("/:id", identifyUser, ctrl.getOne);

// Update academic year
router.patch("/:id", identifyUser, checkPermission("update:academicyears"), updateAcademicYearValidator, ctrl.update);

// Delete academic year
router.delete("/:id", identifyUser, checkPermission("delete:academicyears"), ctrl.delete);

// Set academic year as current
router.post("/:id/set-current", identifyUser,  ctrl.setCurrent);

// Lock academic year
router.post("/:id/lock", identifyUser, checkPermission("update:academicyears"), ctrl.lock);

// Unlock academic year
router.post("/:id/unlock", identifyUser, checkPermission("update:academicyears"), ctrl.unlock);

export default router;
