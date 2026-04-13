import { Router } from "express";
import { TransportController } from "../controllers/transport.controller.js";

const router = Router();
const ctrl = new TransportController();

router.get("/", ctrl.getAll);
router.get("/:id", ctrl.getOne);
router.post("/", ctrl.create);
router.patch("/:id", ctrl.update);

export default router;