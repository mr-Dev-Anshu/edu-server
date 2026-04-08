export const createValidator = (validateFn) => (req, res, next) => {
    try {
        validateFn(req);
        next();
    } catch (error) {
        next(error);
    }
};