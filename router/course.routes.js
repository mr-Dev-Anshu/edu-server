import express from "express";
import { CourseController } from "../controllers/course.controller.js";
import {
  tenantIdMiddleware,
  requireTenantId,
} from "../middlewares/tenant.middleware.js";

const router = express.Router();

// ✅ create instance (IMPORTANT FIX)
const ctrl = new CourseController();

// ✅ middleware
router.use(tenantIdMiddleware);
router.use(requireTenantId);

// ✅ routes
router.post("/", ctrl.create);
router.get("/", ctrl.getAll);
router.get("/:id", ctrl.getOne);
router.patch("/:id", ctrl.update);
router.delete("/:id", ctrl.delete);

export default router;