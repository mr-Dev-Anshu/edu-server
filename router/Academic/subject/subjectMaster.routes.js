import express from "express";
import { SubjectMasterController } from "../../../controllers/Academic/subject/SubjectMaster.controller.js";
import {
  createSubjectValidator,
  updateSubjectValidator,
  subjectIdValidator,
} from "../../../middlewares/validators/Academic/subject/subjectMaster.validator.js";
import { identifyUser, checkPermission } from "../../../middlewares/security/index.js";

const router = express.Router();
const ctrl = new SubjectMasterController();

router.post(
  "/",
  identifyUser,
  checkPermission("create:subject"),
  createSubjectValidator,
  ctrl.create
);

router.get("/", identifyUser, ctrl.getAll);
router.get("/search", identifyUser, ctrl.search);
router.get("/:id/classes", identifyUser, subjectIdValidator, ctrl.getWithClasses);
router.get("/:id", identifyUser, subjectIdValidator, ctrl.getOne);
router.patch(
  "/:id",
  identifyUser,
  checkPermission("update:subject"),
  subjectIdValidator,
  updateSubjectValidator,
  ctrl.update
);
router.delete(
  "/:id",
  identifyUser,
  checkPermission("delete:subject"),
  subjectIdValidator,
  ctrl.delete
);

export default router;
