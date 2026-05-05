import express from "express";
import { SubjectController } from "../../controllers/Academic/subject.controller.js";
import {
  createSubjectValidator,
  updateSubjectValidator,
  subjectIdValidator,
  classIdValidator,
} from "../../middlewares/validators/subject.validator.js";
import {
  identifyUser,
  checkPermission,
} from "../../middlewares/security/index.js";

const router = express.Router();
const ctrl = new SubjectController();

router.post(
  "/",
  identifyUser,
  checkPermission("create:subjects"),
  createSubjectValidator,
  ctrl.create,
);

router.get("/", identifyUser, ctrl.getAll);

router.get("/search", identifyUser, ctrl.search);

router.get(
  "/by-class/:classId",
  identifyUser,
  classIdValidator,
  ctrl.getByClass,
);

router.get("/:id", identifyUser, subjectIdValidator, ctrl.getOne);

router.patch(
  "/:id",
  identifyUser,
  checkPermission("update:subjects"),
  subjectIdValidator,
  updateSubjectValidator,
  ctrl.update,
);

router.delete(
  "/:id",
  identifyUser,
  checkPermission("delete:subjects"),
  subjectIdValidator,
  ctrl.delete,
);

export default router;
