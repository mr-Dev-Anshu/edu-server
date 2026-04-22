import { AppError } from '../../utils/AppError.js';
import { createValidator } from '../../utils/createValidator.js';

const RESERVED_SLUGS = ['free', 'trial', 'admin', 'test', 'demo', 'default'];
const ALLOWED_CURRENCIES = ['INR', 'USD', 'EUR', 'GBP', 'AED'];

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function ensureString(value, field, min = 1, max = 100) {
    // Note: If min=0, empty string (length 0) will pass `value.trim().length < min` because 0 < 0 is false.
    // This is intentional and allows explicitly clearing optional fields like 'description'.
    if (typeof value !== 'string' || value.trim().length < min || value.trim().length > max) {
        throw new AppError(`${field} must be between ${min} and ${max} characters`, 400);
    }
}

function ensureSlug(value) {
    if (!value || typeof value !== 'string') {
        throw new AppError('Slug is required', 400);
    }

    const slug = value.trim().toLowerCase();

    if (!/^[a-z0-9-]+$/.test(slug)) {
        throw new AppError('Slug must contain only lowercase letters, numbers, and hyphens', 400);
    }

    if (slug.length < 2 || slug.length > 100) {
        throw new AppError('Slug must be between 2 and 100 characters', 400);
    }

    if (RESERVED_SLUGS.includes(slug)) {
        throw new AppError(`Slug "${slug}" is reserved and cannot be used`, 400);
    }
}

function ensurePrice(value, field) {
    if (value === undefined || value === null) {
        throw new AppError(`${field} is required`, 400);
    }

    const num = Number(value);
    if (isNaN(num) || num < 0) {
        throw new AppError(`${field} must be a number >= 0`, 400);
    }
}

function ensureOptionalPrice(value, field) {
    if (value === undefined) return;
    const num = Number(value);
    if (isNaN(num) || num < 0) {
        throw new AppError(`${field} must be a number >= 0`, 400);
    }
}

function ensureCurrency(value) {
    if (value === undefined) return;

    if (typeof value !== 'string' || value.trim().length !== 3) {
        throw new AppError('Currency must be a 3-letter code', 400);
    }

    const upper = value.toUpperCase();

    if (!ALLOWED_CURRENCIES.includes(upper)) {
        throw new AppError(`Currency must be one of: ${ALLOWED_CURRENCIES.join(', ')}`, 400);
    }
}

function ensureFeatures(features) {
    if (features === undefined) return;

    if (typeof features !== 'object' || Array.isArray(features)) {
        throw new AppError('Features must be a valid object', 400);
    }

    if (features.maxStudents !== undefined) {
        if (!Number.isInteger(features.maxStudents) || features.maxStudents < 1) {
            throw new AppError('features.maxStudents must be a positive integer', 400);
        }
    }

    if (features.hasTransport !== undefined && typeof features.hasTransport !== 'boolean') {
        throw new AppError('features.hasTransport must be boolean', 400);
    }

    if (features.hasLMS !== undefined && typeof features.hasLMS !== 'boolean') {
        throw new AppError('features.hasLMS must be boolean', 400);
    }

    if (features.hasExams !== undefined && typeof features.hasExams !== 'boolean') {
        throw new AppError('features.hasExams must be boolean', 400);
    }

    if (features.storageLimitGb !== undefined) {
        if (typeof features.storageLimitGb !== 'number' || features.storageLimitGb < 1) {
            throw new AppError('features.storageLimitGb must be >= 1', 400);
        }
    }
}

// ─────────────────────────────────────────────
// Create Plan
// ─────────────────────────────────────────────

export const createPlanValidator = createValidator((req) => {
    const { name, slug, description, monthlyPrice, yearlyPrice, currency, features } = req.body;

    ensureString(name, 'Plan name', 2, 100);
    ensureSlug(slug);

    if (description !== undefined) {
        ensureString(description, 'Description', 0, 1000);
    }

    ensurePrice(monthlyPrice, 'Monthly price');
    ensurePrice(yearlyPrice, 'Yearly price');

    ensureCurrency(currency);
    ensureFeatures(features);
});

// ─────────────────────────────────────────────
// Update Plan
// ─────────────────────────────────────────────

export const updatePlanValidator = createValidator((req) => {
    const { name, description, monthlyPrice, yearlyPrice, currency, features, slug } = req.body;

    if (slug !== undefined) {
        throw new AppError('Slug cannot be updated after creation', 400);
    }

    if (name !== undefined) {
        ensureString(name, 'Plan name', 2, 100);
    }

    if (description !== undefined) {
        ensureString(description, 'Description', 0, 1000);
    }

    ensureOptionalPrice(monthlyPrice, 'Monthly price');
    ensureOptionalPrice(yearlyPrice, 'Yearly price');

    ensureCurrency(currency);
    ensureFeatures(features);
});

// ─────────────────────────────────────────────
// Common parameter validations
// ─────────────────────────────────────────────

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const validatePlanId = createValidator((req) => {
    if (!req.params.id || typeof req.params.id !== 'string' || !UUID_REGEX.test(req.params.id.trim())) {
        throw new AppError('params.id must be a valid UUID', 422);
    }
});