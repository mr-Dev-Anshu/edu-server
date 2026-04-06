// src/middlewares/validators/subscription.validator.js

import { body } from 'express-validator';

/**
 * Validator for Super Admin assigning a plan to a tenant
 * Required: tenantId, planId, billingCycle, amountPaid
 */
export const createSubscriptionValidator = [
    body('tenantId')
        .notEmpty().withMessage('tenantId is required')
        .isUUID().withMessage('tenantId must be a valid UUID'),

    body('planId')
        .notEmpty().withMessage('planId is required')
        .isUUID().withMessage('planId must be a valid UUID'),

    body('billingCycle')
        .notEmpty().withMessage('billingCycle is required')
        .isIn(['monthly', 'yearly']).withMessage('billingCycle must be either monthly or yearly'),

    body('amountPaid')
        .notEmpty().withMessage('amountPaid is required')
        .isDecimal({ decimal_digits: '0,2' }).withMessage('amountPaid must be a valid decimal number')
        .custom((value) => parseFloat(value) >= 0).withMessage('amountPaid must be a non-negative number'),

    body('status')
        .optional()
        .isIn(['active', 'past_due', 'canceled', 'trialing', 'expired'])
        .withMessage('status must be one of: active, past_due, canceled, trialing, expired'),

    body('nextBillingDate')
        .optional()
        .isISO8601().withMessage('nextBillingDate must be a valid ISO 8601 date'),
];

/**
 * Validator for updating an existing subscription
 * tenantId and planId CANNOT be changed after creation
 */
export const updateSubscriptionValidator = [
    body('tenantId')
        .not().exists().withMessage('tenantId cannot be changed after creation'),

    body('planId')
        .not().exists().withMessage('planId cannot be changed after creation'),

    body('billingCycle')
        .optional()
        .isIn(['monthly', 'yearly']).withMessage('billingCycle must be either monthly or yearly'),

    body('amountPaid')
        .optional()
        .isDecimal({ decimal_digits: '0,2' }).withMessage('amountPaid must be a valid decimal number')
        .custom((value) => parseFloat(value) >= 0).withMessage('amountPaid must be a non-negative number'),

    body('status')
        .optional()
        .isIn(['active', 'past_due', 'canceled', 'trialing', 'expired'])
        .withMessage('status must be one of: active, past_due, canceled, trialing, expired'),

    body('nextBillingDate')
        .optional()
        .isISO8601().withMessage('nextBillingDate must be a valid ISO 8601 date'),
];

/**
 * Validator for School Owner upgrading their own plan
 * tenantId comes from JWT — not required in body
 */
export const upgradeSubscriptionValidator = [
    body('planId')
        .notEmpty().withMessage('planId is required')
        .isUUID().withMessage('planId must be a valid UUID'),

    body('billingCycle')
        .notEmpty().withMessage('billingCycle is required')
        .isIn(['monthly', 'yearly']).withMessage('billingCycle must be either monthly or yearly'),

    body('amountPaid')
        .notEmpty().withMessage('amountPaid is required')
        .isDecimal({ decimal_digits: '0,2' }).withMessage('amountPaid must be a valid decimal number')
        .custom((value) => parseFloat(value) >= 0).withMessage('amountPaid must be a non-negative number'),
];