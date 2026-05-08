import express from "express";
import { SectionController } from "../../controllers/Academic/section.controller.js";
import {
  createSectionValidator,
  updateSectionValidator,
} from "../../middlewares/validators/Academic/section.validator.js";
import { identifyUser, checkPermission } from "../../middlewares/security/index.js";

const router = express.Router();
const ctrl = new SectionController();

// Create Section
router.post("/", identifyUser, checkPermission("create:sections"), createSectionValidator, ctrl.create);

// Get All Sections (pagination + filters)
router.get("/", identifyUser, checkPermission("read:sections"), ctrl.getAll);

// Get Section by ID
router.get("/:id", identifyUser, checkPermission("read:sections"), ctrl.getOne);

// Update Section
router.patch("/:id", identifyUser, checkPermission("update:sections"), updateSectionValidator, ctrl.update);

// Delete Section
router.delete("/:id", identifyUser, checkPermission("delete:sections"), ctrl.delete);

export default router;