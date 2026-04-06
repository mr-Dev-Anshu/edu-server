import { body } from 'express-validator';

const RESERVED_SLUGS = ['free', 'trial', 'admin', 'test', 'demo', 'default'];

// ─── Create Plan Validator ────────────────────────────────────────────────────
export const createPlanValidator = [

    body('name')
        .trim()
        .notEmpty().withMessage('Plan name is required')
        .isLength({ min: 2, max: 100 }).withMessage('Plan name must be between 2 and 100 characters'),

    body('slug')
        .trim()
        .notEmpty().withMessage('Slug is required')
        .customSanitizer(value => value?.toLowerCase())      
        .matches(/^[a-z0-9-]+$/).withMessage('Slug must contain only lowercase letters, numbers, and hyphens')
        .isLength({ min: 2, max: 100 }).withMessage('Slug must be between 2 and 100 characters')
        .custom(value => {                                       
            if (RESERVED_SLUGS.includes(value)) {
                throw new Error(`Slug "${value}" is reserved and cannot be used`);
            }
            return true;
        }),

    body('description')
        .optional()
        .trim()
        .isString().withMessage('Description must be a string')
        .isLength({ max: 1000 }).withMessage('Description must not exceed 1000 characters'),

    body('monthlyPrice')
        .notEmpty().withMessage('Monthly price is required')
        .isFloat({ min: 0 }).withMessage('Monthly price must be a valid number >= 0'),

    body('yearlyPrice')
        .notEmpty().withMessage('Yearly price is required')
        .isFloat({ min: 0 }).withMessage('Yearly price must be a valid number >= 0'),

    body('currency')
        .optional()
        .trim()
        .isLength({ min: 3, max: 3 }).withMessage('Currency must be a 3-letter code (e.g. INR, USD)')
        .toUpperCase()                                           
        .isIn(['INR', 'USD', 'EUR', 'GBP', 'AED']).withMessage('Currency must be a supported code: INR, USD, EUR, GBP, AED'),

    body('features')
        .optional()
        .isObject().withMessage('Features must be a valid JSON object'),

    body('features.maxStudents')
        .optional()
        .isInt({ min: 1 }).withMessage('maxStudents must be a positive integer'),

    body('features.hasTransport')
        .optional()
        .isBoolean().withMessage('hasTransport must be true or false'),

    body('features.hasLMS')
        .optional()
        .isBoolean().withMessage('hasLMS must be true or false'),

    body('features.hasExams')
        .optional()
        .isBoolean().withMessage('hasExams must be true or false'),

    body('features.storageLimitGb')
        .optional()
        .isFloat({ min: 1 }).withMessage('storageLimitGb must be at least 1 GB'),
];

// ─── Update Plan Validator ────────────────────────────────────────────────────

export const updatePlanValidator = [

    body('slug')
        .not().exists().withMessage('Slug cannot be updated after creation'),

    body('name')
        .optional()
        .trim()
        .isLength({ min: 2, max: 100 }).withMessage('Plan name must be between 2 and 100 characters'),

    body('description')
        .optional()
        .trim()
        .isString().withMessage('Description must be a string')
        .isLength({ max: 1000 }).withMessage('Description must not exceed 1000 characters'),

    body('monthlyPrice')
        .optional()
        .isFloat({ min: 0 }).withMessage('Monthly price must be a valid number >= 0'),

    body('yearlyPrice')
        .optional()
        .isFloat({ min: 0 }).withMessage('Yearly price must be a valid number >= 0'),

    body('currency')
        .optional()
        .trim()
        .isLength({ min: 3, max: 3 }).withMessage('Currency must be a 3-letter code')
        .toUpperCase()
        .isIn(['INR', 'USD', 'EUR', 'GBP', 'AED']).withMessage('Currency must be a supported code: INR, USD, EUR, GBP, AED'),

    body('features')
        .optional()
        .isObject().withMessage('Features must be a valid JSON object'),

    body('features.maxStudents')
        .optional()
        .isInt({ min: 1 }).withMessage('maxStudents must be a positive integer'),

    body('features.hasTransport')
        .optional()
        .isBoolean().withMessage('hasTransport must be true or false'),

    body('features.hasLMS')
        .optional()
        .isBoolean().withMessage('hasLMS must be true or false'),

    body('features.hasExams')
        .optional()
        .isBoolean().withMessage('hasExams must be true or false'),

    body('features.storageLimitGb')
        .optional()
        .isFloat({ min: 1 }).withMessage('storageLimitGb must be at least 1 GB'),
];