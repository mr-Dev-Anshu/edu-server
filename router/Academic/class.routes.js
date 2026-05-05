import express from "express";
import { ClassController } from "../../controllers/Academic/class.controller.js";
import {
  createClassValidator,
  updateClassValidator,
} from "../../middlewares/validators/Academic/class.validator.js";
import { identifyUser, checkPermission } from "../../middlewares/security/index.js";

const router = express.Router();
const ctrl = new ClassController();

// Create Class
router.post("/", identifyUser, checkPermission("create:classes"), createClassValidator, ctrl.create);

// NEW: Get classes with sections (filtered by academic year, search, and paginated)
// Placed before /:id to avoid route conflicts
router.get("/with-sections", identifyUser, ctrl.getWithSectionsFiltered);

// Get All Classes (pagination supported)
router.get("/", identifyUser, ctrl.getAll);

// Extra: Get classes with sections (legacy - full fetch without pagination)
router.get("/with-sections/all", identifyUser, ctrl.getWithSections);

// NEW: Get sections for a specific class (optional academic year filter)
// Placed before /:id to avoid route conflicts with :id parameter
router.get("/:id/sections", identifyUser, ctrl.getClassSections);

// Get Class by ID
router.get("/:id", identifyUser, ctrl.getOne);

// Update Class
router.patch("/:id", identifyUser, checkPermission("update:classes"), updateClassValidator, ctrl.update);

// Delete Class
router.delete("/:id", identifyUser, checkPermission("delete:classes"), ctrl.delete);

export default router;