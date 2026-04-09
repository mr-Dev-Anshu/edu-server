import express from "express";
import { StudentSectionEnrollmentController } from "../controllers/studentSectionEnrollment.controller.js";
import {
  createEnrollmentValidator,
  updateEnrollmentValidator,
} from "../middlewares/validators/studentSectionEnrollment.validator.js";

const router = express.Router();
const ctrl = new StudentSectionEnrollmentController();

// Enroll Student
router.post("/", createEnrollmentValidator, ctrl.create);

// Get All
router.get("/", ctrl.getAll);

// Get One
router.get("/:id", ctrl.getOne);

// Update (transfer)
router.patch("/:id", updateEnrollmentValidator, ctrl.update);

// Delete
router.delete("/:id", ctrl.delete);

export default router;