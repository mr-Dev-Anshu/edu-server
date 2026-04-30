import express from "express";
import { CourseController } from "../controllers/course.controller.js";
import {
  tenantIdMiddleware,
  requireTenantId,
} from "../middlewares/tenant.middleware.js";

const router = express.Router();
const ctrl = new CourseController();

// ✅ Har request mein tenantId check hoga
router.use(tenantIdMiddleware);
router.use(requireTenantId);

router.route("/").post(ctrl.create).get(ctrl.getAll);

router.route("/:id").get(ctrl.getById).patch(ctrl.update).delete(ctrl.delete);

export default router;
