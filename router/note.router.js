import express from "express";
import { NoteController } from "../controllers/note.controller.js";
import {
  createNoteValidator,
  updateNoteValidator,
} from "../middlewares/validators/note.validator.js";

const router = express.Router();
const ctrl = new NoteController();

router.post("/", createNoteValidator, ctrl.create);
router.get("/", ctrl.getAll);
router.get("/:id", ctrl.getOne);
router.put("/:id", updateNoteValidator, ctrl.update);
router.delete("/:id", ctrl.delete);

export default router;