import { AppError } from "../../utils/AppError.js";

const createValidator = (validateFn) => (req, res, next) => {
  try {
    validateFn(req);
    next();
  } catch (err) {
    next(err);
  }
};

const ensureString = (value, fieldName, { min = 1, max = 255 } = {}) => {
  if (typeof value !== "string" || value.trim().length < min || value.trim().length > max) {
    throw new AppError(`${fieldName} must be ${min}-${max} characters`, 400);
  }
};

export const createNoteValidator = createValidator((req) => {
  const { body } = req;

  if (!body.title) throw new AppError("Title is required", 400);
  ensureString(body.title, "title", { min: 1, max: 255 });

  if (body.body !== undefined && typeof body.body !== "string") {
    throw new AppError("Body must be a string", 400);
  }

  if (body.pinned !== undefined && typeof body.pinned !== "boolean") {
    throw new AppError("Pinned must be boolean", 400);
  }
});

export const updateNoteValidator = createValidator((req) => {
  const { body } = req;
  if (body.title !== undefined) ensureString(body.title, "title", { min: 1, max: 255 });
  if (body.body !== undefined && typeof body.body !== "string") throw new AppError("Body must be a string", 400);
  if (body.pinned !== undefined && typeof body.pinned !== "boolean") throw new AppError("Pinned must be boolean", 400);
});