import express from "express";
import { StudentController } from "../controllers/student.controller.js";
import {
  createStudentValidator,
  updateStudentValidator,
} from "../middlewares/validators/student.validator.js";
import { requireTenantId, tenantIdMiddleware } from "../middlewares/tenant.middleware.js";

const router = express.Router();
const ctrl = new StudentController();

router.use(tenantIdMiddleware);
router.use(requireTenantId);

router.post("/", createStudentValidator, ctrl.create);
router.get("/", ctrl.getAll);
router.get("/:id", ctrl.getOne);
router.patch("/:id", updateStudentValidator, ctrl.update);
router.delete("/:id", ctrl.delete);

export default router;
