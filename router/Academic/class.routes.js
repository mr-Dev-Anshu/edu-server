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

// Bulk Create Classes with Sections
router.post("/bulk", identifyUser, checkPermission("create:classes"), ctrl.bulkCreate);

// Get All Classes (pagination supported)
router.get("/", identifyUser, ctrl.getAll);

// Extra: Get classes with sections
router.get("/with-sections/all", identifyUser, ctrl.getWithSections);

// Get Class by ID
router.get("/:id", identifyUser, ctrl.getOne);

// Update Class
router.patch("/:id", identifyUser, checkPermission("update:classes"), updateClassValidator, ctrl.update);

// Delete Class
router.delete("/:id", identifyUser, checkPermission("delete:classes"), ctrl.delete);

export default router;