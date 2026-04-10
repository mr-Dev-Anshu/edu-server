import { AppError } from './AppError.js';

export function createValidator(validatorFn) {
    return (req, res, next) => {
        try {
            validatorFn(req);
            next();
        } catch (error) {
            if (error instanceof AppError) return next(error);
            next(new AppError(error.message || 'Validation failed', 400));
        }
    };
}