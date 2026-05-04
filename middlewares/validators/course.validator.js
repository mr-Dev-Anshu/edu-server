import { AppError } from "../../utils/AppError.js";

const createValidator = (fn) => (req, res, next) => {
  try {
    fn(req);
    next();
  } catch (err) {
    next(err);
  }
};

export const createCourseValidator = createValidator((req) => {
  const { title, code } = req.body;

  if (!title || typeof title !== "string") {
    throw new AppError("Title is required", 400);
  }

  if (!code || typeof code !== "string") {
    throw new AppError("Code is required", 400);
  }
});

export const updateCourseValidator = createValidator((req) => {
  const { title, code } = req.body;

  if (title !== undefined && typeof title !== "string") {
    throw new AppError("Title must be string", 400);
  }

  if (code !== undefined && typeof code !== "string") {
    throw new AppError("Code must be string", 400);
  }
});