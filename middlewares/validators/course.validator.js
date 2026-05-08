
import Joi from "joi";

export const createCourseValidator = (req, res, next) => {
  const schema = Joi.object({
    name: Joi.string().required(),
    code: Joi.string().required(),
    description: Joi.string().optional(),
  });

  const { error } = schema.validate(req.body);

  if (error) {
    return res.status(400).json({
      message: error.message,
    });
  }

  next();
};