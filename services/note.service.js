import { NoteRepository } from "../repositories/note.repository.js";
import { AppError } from "../utils/AppError.js";

const noteRepo = new NoteRepository();

export class NoteService {
  async createNote(payload) {
    if (!payload.title || !String(payload.title).trim()) {
      throw new AppError("Title is required", 400);
    }

    const data = {
      title: String(payload.title).trim(),
      body: payload.body !== undefined ? String(payload.body) : null,
      pinned: payload.pinned === true,
    };

    const note = await noteRepo.create(data);
    return this.formatNoteResponse(note);
  }

  async getNotes(filter = {}) {
    const notes = await noteRepo.findAllNotes(filter);
    return notes.map((n) => this.formatNoteResponse(n));
  }

  async getNoteById(noteId) {
    const note = await noteRepo.findByIdNote(noteId);
    return this.formatNoteResponse(note);
  }

  async updateNote(noteId, payload) {
    const updateData = {};

    if (payload.title !== undefined) {
      if (!String(payload.title).trim()) {
        throw new AppError("Title cannot be empty", 400);
      }
      updateData.title = String(payload.title).trim();
    }

    if (payload.body !== undefined) {
      updateData.body = payload.body === null ? null : String(payload.body);
    }

    if (payload.pinned !== undefined) {
      updateData.pinned = !!payload.pinned;
    }

    const note = await noteRepo.updateNote(noteId, updateData);
    return this.formatNoteResponse(note);
  }

  async deleteNote(noteId) {
    await noteRepo.deleteNote(noteId);
  }

  formatNoteResponse(note) {
    return {
      id: note.id,
      title: note.title,
      body: note.body,
      pinned: note.pinned,
      createdAt: note.createdAt,
      updatedAt: note.updatedAt,
    };
  }
}