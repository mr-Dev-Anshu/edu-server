import express from "express";
import { SectionController } from "../../controllers/Academic/section.controller.js";
import {
  createSectionValidator,
  updateSectionValidator,
} from "../../middlewares/validators/Academic/section.validator.js";

const router = express.Router();
const ctrl = new SectionController();

// ✅ Create Section
router.post("/", createSectionValidator, ctrl.create);

// ✅ Get All Sections (pagination + filters)
router.get("/", ctrl.getAll);

// ✅ Get Section by ID
router.get("/:id", ctrl.getOne);

// ✅ Update Section
router.patch("/:id", updateSectionValidator, ctrl.update);

// ✅ Delete Section
router.delete("/:id", ctrl.delete);

export default router;