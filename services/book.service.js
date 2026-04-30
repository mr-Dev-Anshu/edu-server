import { BookRepository } from "../repositories/book.repository.js";
import { AppError } from "../utils/AppError.js";

const bookRepo = new BookRepository();

export class BookService {
  async createBook(payload, tenantId) {
    if (!payload.title || !payload.author) {
      console.log("Payload:", payload);
      throw new AppError("Product name and price required", 400);
    }
    console.log("FINAL DATA:", {
      ...payload,
      tenantId,
    });
    return await bookRepo.create({ ...payload, tenantId });
  }

  async getAllBooks(tenantId) {
    const data = await bookRepo.findAll(tenantId);
    return data;
  }

  async getBookById(id, tenantId) {
    return await bookRepo.findById(id, tenantId);
  }

  async updateBook(id, payload, tenantId) {
    return await bookRepo.update(id, tenantId, payload);
  }

  async deleteBook(id, tenantId) {
    return await bookRepo.delete(id, tenantId);
  }
}
