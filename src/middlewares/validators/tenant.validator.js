import { AppError } from '../../utils/AppError.js';

const ORGANIZATION_TYPES = ['school', 'college', 'university', 'coaching', 'preschool', 'other'];
const TENANT_STATUSES = ['onboarding', 'active', 'suspended', 'archived'];
const BRANDING_ASSET_KEYS = ['logo', 'favicon', 'coverImage'];
const PROVISIONING_STEPS = ['schema_created', 'seeded', 'dns_provisioned'];
const RESERVED_SUBDOMAINS = ['admin', 'www', 'api', 'support', 'billing', 'master'];
const HEX_COLOR_REGEX = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
const SUBDOMAIN_REGEX = /^[a-z0-9-]+$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const URL_OR_UPLOAD_PATH_REGEX = /^(https?:\/\/|\/uploads\/).+/i;
const MAX_BASE64_LENGTH = 7_000_000;

const ensurePlainObject = (value, fieldName) => {
  if (value === undefined) return;
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new AppError(`${fieldName} must be an object`, 400);
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

const ensureEmail = (value, fieldName) => {
  if (typeof value !== 'string' || !EMAIL_REGEX.test(value.trim())) {
    throw new AppError(`${fieldName} must be a valid email address`, 400);
  }
};

const ensureSubdomain = (value) => {
  if (typeof value !== 'string') {
    throw new AppError('subdomain must be a string', 400);
  }

  const normalized = value.trim().toLowerCase();

  if (!SUBDOMAIN_REGEX.test(normalized)) {
    throw new AppError('subdomain must contain only lowercase letters, numbers, and hyphens', 400);
  }

  if (RESERVED_SUBDOMAINS.includes(normalized)) {
    throw new AppError('subdomain is reserved', 400);
  }
};

const ensureThemeConfig = (themeConfig) => {
  ensurePlainObject(themeConfig, 'themeConfig');
  if (!themeConfig) return;

  for (const colorField of ['primaryColor', 'secondaryColor', 'accentColor']) {
    if (themeConfig[colorField] !== undefined && !HEX_COLOR_REGEX.test(themeConfig[colorField])) {
      throw new AppError(`${colorField} must be a valid hex color`, 400);
    }
  }

  if (themeConfig.fontFamily !== undefined) {
    ensureOptionalString(themeConfig.fontFamily, 'themeConfig.fontFamily');
  }
};

const ensureBrandingAssets = (brandingAssets) => {
  ensurePlainObject(brandingAssets, 'brandingAssets');
  if (!brandingAssets) return;

  for (const assetField of ['logoUrl', 'faviconUrl', 'coverImageUrl']) {
    if (
      brandingAssets[assetField] !== undefined &&
      brandingAssets[assetField] !== null &&
      (typeof brandingAssets[assetField] !== 'string' ||
        !URL_OR_UPLOAD_PATH_REGEX.test(brandingAssets[assetField]))
    ) {
      throw new AppError(`${assetField} must be a URL or /uploads path`, 400);
    }
  }
};

const ensureAtLeastOneField = (payload, fields, message) => {
  const hasAnyField = fields.some((field) => payload[field] !== undefined);
  if (!hasAnyField) {
    throw new AppError(message, 400);
  }
};

const createValidator = (validateFn) => (req, res, next) => {
  try {
    validateFn(req);
    next();
  } catch (error) {
    next(error);
  }
};

export const createTenantValidator = createValidator((req) => {
  const { body } = req;

  ensureString(body.name, 'name', { min: 3, max: 255 });
  ensureEmail(body.officialEmail, 'officialEmail');

  if (body.organizationType !== undefined && !ORGANIZATION_TYPES.includes(body.organizationType)) {
    throw new AppError('organizationType is invalid', 400);
  }

  if (body.subdomain !== undefined) {
    ensureSubdomain(body.subdomain);
  }

  const planIdentifier = body.plan ?? body.planId ?? body.planSlug;
  if (typeof planIdentifier !== 'string' || !planIdentifier.trim()) {
    throw new AppError('plan is required', 400);
  }

  if (body.billingCycle !== undefined && !['monthly', 'yearly'].includes(body.billingCycle)) {
    throw new AppError('billingCycle must be monthly or yearly', 400);
  }

  if (
    body.trialDays !== undefined &&
    (!Number.isInteger(body.trialDays) || body.trialDays < 1 || body.trialDays > 90)
  ) {
    throw new AppError('trialDays must be an integer between 1 and 90', 400);
  }

  ensureOptionalString(body.registrationNumber, 'registrationNumber');
  ensurePlainObject(body.settings, 'settings');
  ensurePlainObject(body.address, 'address');
  ensurePlainObject(body.contactInfo, 'contactInfo');
  ensureThemeConfig(body.themeConfig);
  ensureBrandingAssets(body.brandingAssets);
  ensurePlainObject(body.customFields, 'customFields');
  ensurePlainObject(body.metadata, 'metadata');
});

export const updateTenantProfileValidator = createValidator((req) => {
  const { body } = req;
  ensureAtLeastOneField(
    body,
    [
      'name',
      'officialEmail',
      'registrationNumber',
      'address',
      'contactInfo',
      'settings',
      'customFields',
      'metadata',
    ],
    'at least one profile field is required'
  );

  if (body.name !== undefined) ensureString(body.name, 'name', { min: 3, max: 255 });
  if (body.officialEmail !== undefined) ensureEmail(body.officialEmail, 'officialEmail');
  ensureOptionalString(body.registrationNumber, 'registrationNumber');
  ensurePlainObject(body.address, 'address');
  ensurePlainObject(body.contactInfo, 'contactInfo');
  ensurePlainObject(body.settings, 'settings');
  ensurePlainObject(body.customFields, 'customFields');
  ensurePlainObject(body.metadata, 'metadata');
});

export const updateTenantStatusValidator = createValidator((req) => {
  const { body } = req;
  const nextStatus = body.status;
  const action = body.action;

  if (!nextStatus && !action) {
    throw new AppError('status or action is required', 400);
  }

  if (nextStatus !== undefined && !TENANT_STATUSES.includes(nextStatus)) {
    throw new AppError('status is invalid', 400);
  }

  if (action !== undefined && !['activate', 'suspend', 'unsuspend'].includes(action)) {
    throw new AppError('action must be activate, suspend, or unsuspend', 400);
  }

  ensureOptionalString(body.reason, 'reason', { min: 2, max: 500 });
});

export const archiveTenantValidator = createValidator((req) => {
  ensureOptionalString(req.body.reason, 'reason', { min: 2, max: 500 });
});

export const updateTenantBrandingValidator = createValidator((req) => {
  const { body } = req;
  ensureAtLeastOneField(
    body,
    ['themeConfig', 'brandingAssets'],
    'themeConfig or brandingAssets is required'
  );
  ensureThemeConfig(body.themeConfig);
  ensureBrandingAssets(body.brandingAssets);
});

export const uploadTenantBrandingAssetsValidator = createValidator((req) => {
  const { body } = req;
  ensureAtLeastOneField(body, BRANDING_ASSET_KEYS, 'at least one asset payload is required');

  for (const assetKey of BRANDING_ASSET_KEYS) {
    const assetPayload = body[assetKey];
    if (assetPayload === undefined) continue;

    ensurePlainObject(assetPayload, assetKey);

    if (typeof assetPayload.base64 !== 'string' || !assetPayload.base64.trim()) {
      throw new AppError(`${assetKey}.base64 is required`, 400);
    }

    if (assetPayload.base64.length > MAX_BASE64_LENGTH) {
      throw new AppError(`${assetKey} file size exceeds the 5MB limit`, 400);
    }

    if (assetPayload.mimeType !== undefined) {
      ensureOptionalString(assetPayload.mimeType, `${assetKey}.mimeType`);
    }

    if (assetPayload.fileName !== undefined) {
      ensureOptionalString(assetPayload.fileName, `${assetKey}.fileName`);
    }
  }
});

export const listTenantsValidator = createValidator((req) => {
  const { page, limit } = req.query;

  if (page !== undefined && (!Number.isInteger(Number(page)) || Number(page) < 1)) {
    throw new AppError('page must be a positive integer', 400);
  }

  if (
    limit !== undefined &&
    (!Number.isInteger(Number(limit)) || Number(limit) < 1 || Number(limit) > 100)
  ) {
    throw new AppError('limit must be an integer between 1 and 100', 400);
  }

  if (req.query.status !== undefined && !TENANT_STATUSES.includes(req.query.status)) {
    throw new AppError('status filter is invalid', 400);
  }

  if (
    req.query.organizationType !== undefined &&
    !ORGANIZATION_TYPES.includes(req.query.organizationType)
  ) {
    throw new AppError('organizationType filter is invalid', 400);
  }
});

export const retryTenantProvisioningValidator = createValidator((req) => {
  const { steps } = req.body;

  if (steps === undefined) return;

  if (!Array.isArray(steps) || steps.length === 0) {
    throw new AppError('steps must be a non-empty array', 400);
  }

  for (const step of steps) {
    if (!PROVISIONING_STEPS.includes(step)) {
      throw new AppError(`unsupported provisioning step: ${step}`, 400);
    }
  }
});
