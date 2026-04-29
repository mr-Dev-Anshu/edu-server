import { NoteService } from "../services/note.service.js";
import { catchAsync } from "../utils/catchAsync.js";

const noteService = new NoteService();

export class NoteController {
  create = catchAsync(async (req, res) => {
    const data = await noteService.createNote(req.body);
    res.status(201).json({ success: true, data });
  });

  getAll = catchAsync(async (req, res) => {
    const filter = req.query.filter ? JSON.parse(req.query.filter) : {};
    const data = await noteService.getNotes(filter);
    res.status(200).json({ success: true, data });
  });

  getOne = catchAsync(async (req, res) => {
    const data = await noteService.getNoteById(req.params.id);
    res.status(200).json({ success: true, data });
  });

  update = catchAsync(async (req, res) => {
    const data = await noteService.updateNote(req.params.id, req.body);
    res.status(200).json({ success: true, data });
  });

  delete = catchAsync(async (req, res) => {
    await noteService.deleteNote(req.params.id);
    res.status(200).json({ success: true, message: "Note deleted" });
  });
}