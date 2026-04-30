import express from "express"
import { BookController } from "../controllers/book.controller.js";


const router = express.Router();
const ctrl = new BookController();

router.post("/", ctrl.create);
router.get("/", ctrl.getAll);
router.get("/:id", ctrl.getById);
router.put("/:id", ctrl.update);
router.delete("/:id", ctrl.delete);

export default router;