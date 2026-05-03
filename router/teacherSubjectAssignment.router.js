import express from "express";
import TeacherSubjectAssignmentController from "../controllers/teacherSubjectAssignment.controller.js";
import { createTeacherSubjectAssignmentValidator, updateTeacherSubjectAssignmentValidator, teacherSubjectAssignmentIdValidator } from "../middlewares/validators/teacherSubjectAssignment.validator.js";
import { identifyUser, checkPermission } from "../middlewares/security/index.js";

const router = express.Router();
const ctrl = new TeacherSubjectAssignmentController();

router.post("/", identifyUser, checkPermission("create:teacher-subject-assignment"), createTeacherSubjectAssignmentValidator, ctrl.create);
router.get("/", identifyUser, ctrl.getAll);
router.get("/search", identifyUser, ctrl.search);
router.get("/:id", identifyUser, teacherSubjectAssignmentIdValidator, ctrl.getOne);
router.patch("/:id", identifyUser, checkPermission("update:teacher-subject-assignment"), teacherSubjectAssignmentIdValidator, updateTeacherSubjectAssignmentValidator, ctrl.update);
router.delete("/:id", identifyUser, checkPermission("delete:teacher-subject-assignment"), teacherSubjectAssignmentIdValidator, ctrl.delete);

export default router;
