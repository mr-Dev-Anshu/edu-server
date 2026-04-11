import express from "express";
import { ClassController } from "../../controllers/Academic/class.controller.js";
import {
  createClassValidator,
  updateClassValidator,
} from "../../middlewares/validators/Academic/class.validator.js";
import { requireTenantId, tenantIdMiddleware } from "../../middlewares/tenant.middleware.js";

const router = express.Router();
const ctrl = new ClassController();

router.use(tenantIdMiddleware);
router.use(requireTenantId);

// Create Class
router.post("/", createClassValidator, ctrl.create);

// Get All Classes (pagination supported)
router.get("/", ctrl.getAll);

// Extra: Get classes with sections
router.get("/with-sections/all", ctrl.getWithSections);

// Get Class by ID
router.get("/:id", ctrl.getOne);

// Update Class
router.patch("/:id", updateClassValidator, ctrl.update);

// Delete Class
router.delete("/:id", ctrl.delete);

export default router;