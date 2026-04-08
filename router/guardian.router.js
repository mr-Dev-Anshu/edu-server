import { Router } from "express";
import { GuardianController } from "../controllers/guardian.controller.js";

const router = Router();
const ctrl = new GuardianController();

router.get("/", ctrl.getAll);
router.get("/student/:studentId", ctrl.getByStudent);
router.get("/:id", ctrl.getOne);
router.post("/", ctrl.create);
router.post("/:id/attach-students", ctrl.attachStudents);

export default router;