import express from "express";
import { ExamScheduleController } from "../../controllers/Exam/examSchedule.controller.js";
import {
  createExamScheduleValidator,
  updateExamScheduleValidator,
} from "../../middlewares/validators/Exam/examSchedule.validator.js";
import { identifyUser, checkPermission } from "../../middlewares/security/index.js";

const router = express.Router();
const ctrl = new ExamScheduleController();

router.post("/", identifyUser, checkPermission("create:examschedules"), createExamScheduleValidator, ctrl.create);
router.get("/", identifyUser, ctrl.getAll);
router.get("/:id", identifyUser, ctrl.getOne);
router.patch("/:id", identifyUser, checkPermission("update:examschedules"), updateExamScheduleValidator, ctrl.update);
router.delete("/:id", identifyUser, checkPermission("delete:examschedules"), ctrl.delete);

export default router;