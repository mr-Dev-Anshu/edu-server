import express from "express";
import { CourseController } from "../controllers/course.controller.js";
import {
  createCourseValidator,
  updateCourseValidator,
} from "../middlewares/validators/course.validator.js";
import { identifyUser } from "../middlewares/security/index.js";

const router = express.Router();
const ctrl = new CourseController();

// routes
router
  .route("/")
  .get(ctrl.getAll)
.post(createCourseValidator, ctrl.create);

router
  .route("/:id")
  .get( ctrl.getById)
  .put(updateCourseValidator, ctrl.update)
  .delete(ctrl.delete);

export default router;