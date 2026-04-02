import { body } from 'express-validator';

export const tenantValidator = [
  body('name')
    .trim()
    .notEmpty().withMessage('Organization name is required')
    .isLength({ min: 3, max: 255 }).withMessage('Name must be 3-255 characters'),

  body('organizationType')
    .isIn(['school', 'college', 'university', 'coaching', 'preschool', 'other'])
    .withMessage('Invalid organization type'),

  body('officialEmail')
    .isEmail().withMessage('Valid official email is required')
    .normalizeEmail(),

  body('subdomain')
    .toLowerCase()
    .matches(/^[a-z0-9-]+$/).withMessage('Subdomain must be alphanumeric and hyphens only')
    .custom(value => {
      const reserved = ['admin', 'www', 'api', 'support', 'billing', 'master'];
      if (reserved.includes(value)) throw new Error('Reserved subdomain');
      return true;
    }),

  body('registrationNumber')
    .optional({ checkFalsy: true })
    .isString().trim(),

  body('settings').optional().isObject(),
  body('themeConfig').optional().isObject(),
  body('status').optional().isIn(['onboarding', 'active', 'suspended', 'archived']),
  body('customFields').optional().isObject(),
  body('metadata').optional().isObject()
];