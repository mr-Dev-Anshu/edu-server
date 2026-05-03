import express from "express";
import { SubjectController } from "../controllers/subject.controller.js";
import {
  createSubjectValidator,
  updateSubjectValidator,
  subjectIdValidator,
  classIdValidator,
} from "../middlewares/validators/subject.validator.js";
import {
  identifyUser,
  checkPermission,
} from "../middlewares/security/index.js";

const router = express.Router();
const ctrl = new SubjectController();

/**
 * Subject Routes
 * All routes require authentication (identifyUser middleware)
 * Permission checks are enforced on write operations
 */

// Create subject
// POST /api/v1/subjects
router.post(
  "/",
  identifyUser,
  checkPermission("create:subject"),
  createSubjectValidator,
  ctrl.create,
);

// Get all subjects with pagination
// GET /api/v1/subjects
router.get("/", identifyUser, ctrl.getAll);

// Search subjects
// GET /api/v1/subjects/search
router.get("/search", identifyUser, ctrl.search);

// Get subjects by class
// GET /api/v1/subjects/by-class/:classId
router.get(
  "/by-class/:classId",
  identifyUser,
  classIdValidator,
  ctrl.getByClass,
);

// Get specific subject by ID
// GET /api/v1/subjects/:id
router.get("/:id", identifyUser, subjectIdValidator, ctrl.getOne);

// Update subject
// PATCH /api/v1/subjects/:id
router.patch(
  "/:id",
  identifyUser,
  checkPermission("update:subject"),
  subjectIdValidator,
  updateSubjectValidator,
  ctrl.update,
);

// Delete subject (soft delete)
// DELETE /api/v1/subjects/:id
router.delete(
  "/:id",
  identifyUser,
  checkPermission("delete:subject"),
  subjectIdValidator,
  ctrl.delete,
);

export default router;
