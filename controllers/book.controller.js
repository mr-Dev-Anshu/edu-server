import { BookService } from "../services/book.service.js";
import { catchAsync } from "../utils/catchAsync.js";

const bookService = new BookService();

export class BookController {
  create = catchAsync(async (req, res) => {
    const tenantId = req.headers["x-tenant-id"];
    if (!tenantId) {
      throw new Error("Tenant ID missing in headers");
    }
    const data = await bookService.createBook(req.body, tenantId);

    res.status(201).json({ success: true, data });
  });

  getAll = catchAsync(async (req, res) => {
    const tenantId = req.headers["x-tenant-id"];
    if (!tenantId) {
      throw new Error("Tenant ID missing in headers");
    }
    const data = await bookService.getAllBooks(tenantId);
    res.status(200).json({ success: true, data });
  });

  getById = catchAsync(async (req, res) => {
    const tenantId = req.headers["x-tenant-id"];

    if (!tenantId) {
      throw new Error("Tenant ID missing in headers");
    }
    const data = await bookService.getBookById(req.params.id, tenantId);
    res.status(200).json({ success: true, data });
  });

  update = catchAsync(async (req, res) => {
    const tenantId = req.headers["x-tenant-id"];

    if (!tenantId) {
      throw new Error("Tenant ID missing in headers");
    }

    const data = await bookService.updateBook(
      req.params.id,
      req.body,
      tenantId,
    );
    res.status(200).json({ success: true, data });
  });

  delete = catchAsync(async (req, res) => {
    const tenantId = req.headers["x-tenant-id"];

    if (!tenantId) {
      throw new Error("Tenant ID missing in headers");
    }

    await bookService.deleteBook(req.params.id, tenantId);
    res
      .status(200)
      .json({ success: true, message: "Book Deleted successfully" });
  });
}
