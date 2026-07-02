import { AppError } from "../../utils/AppError.js";

const createValidator = (validateFn) => (req, res, next) => {
  try {
    validateFn(req);
    next();
  } catch (error) {
    next(error);
  }
};

const ensureString = (value, fieldName, { min = 1, max = 255 } = {}) => {
  if (typeof value !== "string" || value.trim().length < min || value.trim().length > max) {
    throw new AppError(`${fieldName} must be between ${min} and ${max} characters`, 400);
  }
};

const ensureOptionalString = (value, fieldName, options = {}) => {
  if (value === undefined || value === null || value === "") return;
  ensureString(value, fieldName, options);
};

const ensureDate = (value, fieldName) => {
  if (!value) throw new AppError(`${fieldName} is required`, 400);
  const date = new Date(value);
  if (isNaN(date.getTime())) {
    throw new AppError(`${fieldName} must be a valid date format`, 400);
  }
};

const ensureUUID = (value, fieldName) => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!value || !uuidRegex.test(value)) {
    throw new AppError(`${fieldName} must be a valid UUID`, 400);
  }
};

const ensureEnum = (value, fieldName, allowedValues) => {
  if (!allowedValues.includes(value)) {
    throw new AppError(
      `${fieldName} must be one of: ${allowedValues.join(", ")}`,
      400
    );
  }
};

export const createLibraryBookIssuanceValidator = createValidator((req) => {
  const { body } = req;

  ensureString(body.bookTitle, "bookTitle", { min: 1, max: 255 });
  ensureString(body.bookAuthor, "bookAuthor", { min: 1, max: 255 });
  ensureOptionalString(body.isbn, "isbn", { min: 10, max: 20 });
  ensureUUID(body.issuedToId, "issuedToId");
  ensureDate(body.issueDate, "issueDate");
  ensureDate(body.dueDate, "dueDate");

  const issueDate = new Date(body.issueDate);
  const dueDate = new Date(body.dueDate);
  if (dueDate <= issueDate) {
    throw new AppError("dueDate must be after issueDate", 400);
  }

  ensureOptionalString(body.remarks, "remarks", { min: 1, max: 1000 });
});

export const updateLibraryBookIssuanceValidator = createValidator((req) => {
  const { body } = req;

  ensureOptionalString(body.bookTitle, "bookTitle", { min: 1, max: 255 });
  ensureOptionalString(body.bookAuthor, "bookAuthor", { min: 1, max: 255 });
  ensureOptionalString(body.isbn, "isbn", { min: 10, max: 20 });

  if (body.dueDate) ensureDate(body.dueDate, "dueDate");
  if (body.returnDate) ensureDate(body.returnDate, "returnDate");

  if (body.status) {
    ensureEnum(body.status, "status", ["issued", "returned", "overdue", "lost"]);
  }

  ensureOptionalString(body.remarks, "remarks", { min: 1, max: 1000 });
});

export const libraryBookIssuanceIdValidator = createValidator((req) => {
  const { id } = req.params;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  if (!id || !uuidRegex.test(id)) {
    throw new AppError("Invalid or missing Library Book Issuance ID", 400);
  }
});
