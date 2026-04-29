import { BaseRepository } from "./base.repository.js";
import Note from "../models/Note.js";
import { AppError } from "../utils/AppError.js";

export class NoteRepository extends BaseRepository {
  constructor() {
    super(Note);
  }

  async findAllNotes(filter = {}) {
    return await this.model.findAll({
      where: { ...filter },
      order: [["pinned", "DESC"], ["createdAt", "DESC"]],
    });
  }

  async findByIdNote(id) {
    const note = await this.model.findOne({ where: { id } });
    if (!note) throw new AppError("Note not found", 404);
    return note;
  }

  async updateNote(id, data) {
    const note = await this.findByIdNote(id);
    return await note.update(data);
  }

  async deleteNote(id) {
    const note = await this.findByIdNote(id);
    return await note.destroy();
  }
}