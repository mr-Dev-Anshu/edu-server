import express from "express";
import { ClassSubjectController } from "../../../controllers/Academic/subject/ClassSubject.controller.js";
import {
  assignSubjectsValidator,
  updateClassSubjectValidator,
  classSubjectIdValidator,
  classIdValidator,
} from "../../../middlewares/validators/Academic/subject/classSubject.validator.js";
import { subjectIdValidator } from "../../../middlewares/validators/Academic/subject/subjectMaster.validator.js";
import { identifyUser, checkPermission } from "../../../middlewares/security/index.js";

const router = express.Router();
const ctrl = new ClassSubjectController();

router.post(
  "/assign",
  identifyUser,
  checkPermission("create:class-subject"),
  assignSubjectsValidator,
  ctrl.assignSubjects
);

router.get("/by-class/:classId", identifyUser, checkPermission("read:class-subject"), classIdValidator, ctrl.getSubjectsByClass);
router.get("/by-subject/:subjectId", identifyUser, checkPermission("read:class-subject"), subjectIdValidator, ctrl.getClassesBySubject);
router.get("/search", identifyUser, checkPermission("read:class-subject"), ctrl.search);
router.get("/:id", identifyUser, checkPermission("read:class-subject"), classSubjectIdValidator, ctrl.getOne);
router.patch(
  "/:id",
  identifyUser,
  checkPermission("update:class-subject"),
  classSubjectIdValidator,
  updateClassSubjectValidator,
  ctrl.update
);
router.delete(
  "/remove-all/:classId",
  identifyUser,
  checkPermission("delete:class-subject"),
  classIdValidator,
  ctrl.removeAllFromClass
);
router.delete(
  "/:id",
  identifyUser,
  checkPermission("delete:class-subject"),
  classSubjectIdValidator,
  ctrl.delete
);

export default router;
