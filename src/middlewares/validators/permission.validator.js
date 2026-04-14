import { AppError } from '../../utils/AppError.js';

const createValidator = (validateFn) => (req, res, next) => {
  try {
    validateFn(req);
    next();
  } catch (error) {
    next(error);
  }
};

const ensureString = (value, fieldName, { min = 1, max = 255 } = {}) => {
  if (typeof value !== 'string' || value.trim().length < min || value.trim().length > max) {
    throw new AppError(`${fieldName} must be ${min}-${max} characters`, 400);
  }
};

const ensureOptionalString = (value, fieldName, options = {}) => {
  if (value === undefined || value === null) return;
  ensureString(value, fieldName, options);
};

export const createPermissionValidator = createValidator((req) => {
  const { body } = req;

  ensureString(body.action, 'action', { min: 2, max: 50 });
  ensureString(body.resource, 'resource', { min: 2, max: 100 });
  ensureString(body.module, 'module', { min: 2, max: 100 });
  ensureOptionalString(body.name, 'name', { min: 3, max: 150 });
  ensureOptionalString(body.description, 'description', { min: 3, max: 1000 });
});
