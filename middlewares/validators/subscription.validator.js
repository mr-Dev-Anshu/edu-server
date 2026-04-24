import { AppError } from '../../utils/AppError.js';
import { createValidator } from '../../utils/createValidator.js';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
// Note: 'paused' is a valid DB state but is omitted here because it can only be set via the toggle endpoint.
const ALLOWED_STATUSES = ['active', 'past_due', 'canceled', 'trialing', 'expired'];
const ALLOWED_BILLING = ['monthly', 'yearly'];
const MAX_LIMIT = 100;
const MIN_LIMIT = 1;

function ensureUUID(value, fieldName) {
    if (!value || typeof value !== 'string' || !UUID_REGEX.test(value.trim())) {
        throw new AppError(`${fieldName} must be a valid UUID`, 422);
    }
}

function ensureString(value, fieldName) {
    if (typeof value !== 'string' || value.trim() === '') {
        throw new AppError(`${fieldName} must be a non-empty string`, 400);
    }
}

function ensureEnum(value, fieldName, allowed) {
    if (!allowed.includes(value)) {
        throw new AppError(`${fieldName} must be one of: ${allowed.join(', ')}`, 400);
    }
}

function ensureOptionalEnum(value, fieldName, allowed) {
    if (value !== undefined) ensureEnum(value, fieldName, allowed);
}

function ensureSlugOrUUID(value, fieldName) {
    if (!value || typeof value !== 'string' || (!UUID_REGEX.test(value.trim()) && !/^[a-z0-9-]+$/.test(value.trim()))) {
        throw new AppError(`${fieldName} must be a valid plan ID or slug`, 422);
    }
}

function ensureOptionalPositiveInt(value, fieldName, min, max) {
    if (value === undefined) return;
    const n = Number(value);
    if (!Number.isInteger(n) || n < min || n > max) {
        throw new AppError(`${fieldName} must be an integer between ${min} and ${max}`, 400);
    }
}

function ensureDate(value, fieldName) {
    if (!value) throw new AppError(`${fieldName} is required`, 400);
    if (isNaN(new Date(value).getTime())) {
        throw new AppError(`${fieldName} must be a valid ISO date string`, 400);
    }
}

function rejectAmountPaid(body) {
    if (body.amountPaid !== undefined) {
        throw new AppError(
            'amountPaid must not be sent by the client — price is computed server-side',
            400
        );
    }
}

export const createSubscriptionValidator = createValidator((req) => {
    rejectAmountPaid(req.body);

    const { tenantId, planId, billingCycle } = req.body;

    ensureUUID(tenantId, 'tenantId');
    ensureSlugOrUUID(planId, 'planId');
    ensureEnum(billingCycle, 'billingCycle', ALLOWED_BILLING);

    if (req.body.startDate !== undefined) ensureDate(req.body.startDate, 'startDate');
    if (req.body.status !== undefined) ensureEnum(req.body.status, 'status', ALLOWED_STATUSES);
});

export const updateSubscriptionValidator = createValidator((req) => {
    if (req.body.planId !== undefined) {
        throw new AppError('planId cannot be changed after creation — use the /upgrade endpoint', 400);
    }
    if (req.body.tenantId !== undefined) {
        throw new AppError('tenantId cannot be changed after creation', 400);
    }

    rejectAmountPaid(req.body);

    ensureOptionalEnum(req.body.billingCycle, 'billingCycle', ALLOWED_BILLING);
    ensureOptionalEnum(req.body.status, 'status', ALLOWED_STATUSES);

    if (req.body.endDate !== undefined) ensureDate(req.body.endDate, 'endDate');
    if (req.body.nextBillingDate !== undefined) ensureDate(req.body.nextBillingDate, 'nextBillingDate');
});

export const upgradeValidator = createValidator((req) => {
    rejectAmountPaid(req.body);
    ensureSlugOrUUID(req.body.newPlanId, 'newPlanId');
    ensureEnum(req.body.billingCycle, 'billingCycle', ALLOWED_BILLING);
});

export const validateSubscriptionId = createValidator((req) => {
    ensureUUID(req.params.id, 'id');
});

export const validateTenantId = createValidator((req) => {
    ensureUUID(req.params.tenantId, 'tenantId');
});

export const validateListFilters = createValidator((req) => {
    ensureOptionalEnum(req.query.status, 'status', ALLOWED_STATUSES);
    ensureOptionalEnum(req.query.billingCycle, 'billingCycle', ALLOWED_BILLING);
    ensureOptionalPositiveInt(req.query.limit, 'limit', MIN_LIMIT, MAX_LIMIT);
    ensureOptionalPositiveInt(req.query.offset, 'offset', 0, Number.MAX_SAFE_INTEGER);

    if (req.query.tenantId !== undefined) ensureUUID(req.query.tenantId, 'tenantId (query)');
});