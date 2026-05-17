import { Router } from "express";
import { GuardianController } from "../controllers/guardian.controller.js";
import { identifyUser } from "../middlewares/security/index.js";

const router = Router();
const ctrl = new GuardianController();

router.get("/",identifyUser, ctrl.getAll);
router.get("/student/:studentId",identifyUser, ctrl.getByStudent);
router.get("/:id",identifyUser, ctrl.getOne);
router.post("/",identifyUser, ctrl.createGuardian);

export default router;