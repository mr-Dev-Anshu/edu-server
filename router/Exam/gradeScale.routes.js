import express from "express";
import { GradeScaleController } from "../../controllers/Exam/gradeScale.controller.js";

import {
  createGradeScaleValidator,
  updateGradeScaleValidator,
} from "../../middlewares/validators/Exam/gradeScale.validator.js";
import { identifyUser, checkPermission } from "../../middlewares/security/index.js";

const router = express.Router();
const ctrl = new GradeScaleController();

router.post("/", identifyUser, checkPermission("create:gradescales"), createGradeScaleValidator, ctrl.create);
router.get("/", identifyUser, ctrl.getAll);
router.get("/default", identifyUser, ctrl.getDefault);
router.get("/:id", identifyUser, ctrl.getOne);
router.patch("/:id", identifyUser, checkPermission("update:gradescales"), updateGradeScaleValidator, ctrl.update);
router.delete("/:id", identifyUser, checkPermission("delete:gradescales"), ctrl.delete);
router.post("/:id/set-default", identifyUser, checkPermission("update:gradescales"), ctrl.setDefault);

export default router;