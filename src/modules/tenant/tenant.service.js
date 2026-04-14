import fs from 'fs/promises';
import path from 'path';
import sequelize from '../../config/db.js';
import { AppError } from '../../utils/AppError.js';

const PROVISIONING_STEPS = ['schema_created', 'seeded', 'dns_provisioned'];
const ALLOWED_IMAGE_MIME_TYPES = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/webp': 'webp',
  'image/svg+xml': 'svg',
  'image/x-icon': 'ico',
  'image/vnd.microsoft.icon': 'ico',
};
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const MAX_ASSET_BYTES = 5 * 1024 * 1024;

const slugify = (value) =>
  String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50);

const buildPortalUrl = (subdomain) => {
  const protocol = process.env.TENANT_PORTAL_PROTOCOL || 'https';
  const baseDomain = process.env.TENANT_BASE_DOMAIN || 'saas.com';
  return `${protocol}://${subdomain}.${baseDomain}`;
};

const isPlainObject = (value) =>
  Boolean(value) &&
  typeof value === 'object' &&
  !Array.isArray(value) &&
  Object.getPrototypeOf(value) === Object.prototype;

const mergeObjects = (currentValue, nextValue) => {
  if (!isPlainObject(currentValue) || !isPlainObject(nextValue)) {
    return nextValue ?? currentValue ?? {};
  }

  const merged = { ...currentValue };

  for (const [key, value] of Object.entries(nextValue)) {
    merged[key] =
      isPlainObject(value) && isPlainObject(currentValue[key])
        ? mergeObjects(currentValue[key], value)
        : value;
  }

  return merged;
};

export class TenantService {
  constructor({ tenantRepository }) {
    this.repo = tenantRepository;
  }

  async registerTenant(data) {
    const planIdentifier = data.plan ?? data.planId ?? data.planSlug;
    const plan = await this.repo.findPlan(planIdentifier);

    if (!plan) {
      throw new AppError('Selected plan was not found', 404);
    }

    const normalizedEmail = data.officialEmail.trim().toLowerCase();
    const emailOwner = await this.repo.findByOfficialEmail(normalizedEmail);
    if (emailOwner) {
      throw new AppError('This official email is already registered', 400);
    }

    const subdomain = await this.generateUniqueSubdomain(data.subdomain || data.name);

    const trialDays = data.trialDays ?? 14;
    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + trialDays);

    const transaction = await sequelize.transaction();
    let tenant;

    try {
      tenant = await this.repo.create(
        {
          name: data.name.trim(),
          organizationType: data.organizationType || 'school',
          officialEmail: normalizedEmail,
          subdomain,
          registrationNumber: data.registrationNumber?.trim() || null,
          settings: data.settings || undefined,
          address: data.address || undefined,
          contactInfo: data.contactInfo || undefined,
          themeConfig: data.themeConfig || undefined,
          brandingAssets: data.brandingAssets || undefined,
          customFields: data.customFields || undefined,
          metadata: mergeObjects(data.metadata, {
            provisioning: { status: 'pending' },
          }),
          status: 'onboarding',
        },
        { transaction }
      );

      await this.repo.createSubscription(
        {
          tenantId: tenant.id,
          planId: plan.id,
          status: 'trialing',
          billingCycle: data.billingCycle || 'monthly',
          startDate,
          endDate,
          nextBillingDate: endDate,
          amountPaid: data.amountPaid ?? 0,
        },
        { transaction }
      );

      await this.repo.createProvisioningSteps(
        PROVISIONING_STEPS.map((stepKey) => ({
          tenantId: tenant.id,
          stepKey,
          status: 'pending',
          metadata: {},
        })),
        { transaction }
      );

      await transaction.commit();
    } catch (error) {
      if (!transaction.finished) {
        await transaction.rollback();
      }
      throw error;
    }

    let provisioningSucceeded = true;

    try {
      await this.runProvisioning(tenant.id);
    } catch (error) {
      provisioningSucceeded = false;
    }

    const tenantDetails = await this.getTenantDetails(tenant.id);

    return {
      ...tenantDetails,
      _provisioningSucceeded: provisioningSucceeded,
    };
  }

  async listTenants(query) {
    return await this.repo.listWithMetrics(query);
  }

  async getTenantDetails(id) {
    const [tenant, subscription, provisioningSteps, metricSnapshot] = await Promise.all([
      this.repo.findById(id),
      this.repo.findLatestSubscription(id),
      this.repo.findProvisioningSteps(id),
      this.repo.listWithMetrics({ id, page: 1, limit: 1 }),
    ]);

    const plan = subscription ? await this.repo.findPlanById(subscription.planId) : null;

    const metrics = metricSnapshot.data[0] || null;

    return this.formatTenantResponse({
      tenant,
      subscription,
      plan,
      provisioningSteps,
      metrics,
    });
  }

  async updateProfile(id, updateData) {
    const tenant = await this.repo.findById(id);

    if (
      updateData.officialEmail &&
      updateData.officialEmail.trim().toLowerCase() !== tenant.officialEmail
    ) {
      const emailOwner = await this.repo.findByOfficialEmail(
        updateData.officialEmail.trim().toLowerCase()
      );
      if (emailOwner && emailOwner.id !== tenant.id) {
        throw new AppError('This official email is already registered', 400);
      }
    }

    await tenant.update({
      ...(updateData.name !== undefined ? { name: updateData.name.trim() } : {}),
      ...(updateData.officialEmail !== undefined
        ? { officialEmail: updateData.officialEmail.trim().toLowerCase() }
        : {}),
      ...(updateData.registrationNumber !== undefined
        ? { registrationNumber: updateData.registrationNumber?.trim() || null }
        : {}),
      ...(updateData.address !== undefined
        ? { address: mergeObjects(tenant.address, updateData.address) }
        : {}),
      ...(updateData.contactInfo !== undefined
        ? { contactInfo: mergeObjects(tenant.contactInfo, updateData.contactInfo) }
        : {}),
      ...(updateData.settings !== undefined
        ? { settings: mergeObjects(tenant.settings, updateData.settings) }
        : {}),
      ...(updateData.customFields !== undefined
        ? { customFields: mergeObjects(tenant.customFields, updateData.customFields) }
        : {}),
      ...(updateData.metadata !== undefined
        ? { metadata: mergeObjects(tenant.metadata, updateData.metadata) }
        : {}),
    });

    return await this.getTenantDetails(id);
  }

  async updateStatus(id, statusData) {
    const tenant = await this.repo.findById(id);
    const nextStatus = this.resolveTenantStatus(tenant.status, statusData);

    if (tenant.status === 'archived' && nextStatus !== 'archived') {
      throw new AppError('Archived tenants cannot be reactivated through the status endpoint', 400);
    }

    await tenant.update({
      status: nextStatus,
      metadata: mergeObjects(tenant.metadata, {
        lifecycle: {
          ...(tenant.metadata?.lifecycle || {}),
          lastStatus: nextStatus,
          lastStatusChangedAt: new Date().toISOString(),
          reason: statusData.reason || null,
        },
      }),
    });

    return await this.getTenantDetails(id);
  }

  async archiveTenant(id, payload = {}) {
    const tenant = await this.repo.findById(id);

    await tenant.update({
      status: 'archived',
      metadata: mergeObjects(tenant.metadata, {
        lifecycle: {
          ...(tenant.metadata?.lifecycle || {}),
          archivedAt: new Date().toISOString(),
          archivedReason: payload.reason || null,
        },
      }),
    });

    return await this.getTenantDetails(id);
  }

  async updateBranding(id, updateData) {
    const tenant = await this.repo.findById(id);

    await tenant.update({
      ...(updateData.themeConfig !== undefined
        ? { themeConfig: mergeObjects(tenant.themeConfig, updateData.themeConfig) }
        : {}),
      ...(updateData.brandingAssets !== undefined
        ? { brandingAssets: mergeObjects(tenant.brandingAssets, updateData.brandingAssets) }
        : {}),
    });

    return await this.getTenantDetails(id);
  }

  async uploadBrandingAssets(id, assets) {
    const tenant = await this.repo.findById(id);
    const brandingAssets = { ...(tenant.brandingAssets || {}) };

    if (assets.logo) {
      brandingAssets.logoUrl = await this.persistBrandingAsset(id, 'logo', assets.logo);
    }

    if (assets.favicon) {
      brandingAssets.faviconUrl = await this.persistBrandingAsset(id, 'favicon', assets.favicon);
    }

    if (assets.coverImage) {
      brandingAssets.coverImageUrl = await this.persistBrandingAsset(
        id,
        'cover-image',
        assets.coverImage
      );
    }

    await tenant.update({ brandingAssets });
    return await this.getTenantDetails(id);
  }

  async getProvisioningStatus(id) {
    const tenant = await this.repo.findById(id);
    const provisioningSteps = await this.repo.findProvisioningSteps(id);

    return {
      tenantId: tenant.id,
      tenantStatus: tenant.status,
      portalUrl: tenant.portalUrl,
      provisioning: this.summarizeProvisioning(provisioningSteps),
    };
  }

  async retryProvisioning(id, payload = {}) {
    const tenant = await this.repo.findById(id);

    if (tenant.status === 'archived') {
      throw new AppError('Archived tenants cannot be re-provisioned', 400);
    }

    const existingSteps = await this.repo.findProvisioningSteps(id);
    const stepsToRetry = payload.steps?.length
      ? payload.steps
      : existingSteps
          .filter((step) => ['pending', 'failed'].includes(step.status))
          .map((step) => step.stepKey);

    if (!stepsToRetry.length) {
      return await this.getProvisioningStatus(id);
    }

    await this.runProvisioning(id, stepsToRetry);
    return await this.getProvisioningStatus(id);
  }

  async generateUniqueSubdomain(sourceValue) {
    const baseSubdomain = slugify(sourceValue) || 'tenant';
    const existingSubdomains = new Set(await this.repo.findSubdomainsStartingWith(baseSubdomain));

    if (!existingSubdomains.has(baseSubdomain)) {
      return baseSubdomain;
    }

    let attempt = 1;
    let candidate = baseSubdomain;

    do {
      const suffix = '-' + attempt;
      const maxBaseLength = 63 - suffix.length;
      candidate = baseSubdomain.slice(0, maxBaseLength) + suffix;
      attempt += 1;
    } while (existingSubdomains.has(candidate));

    return candidate;
  }

  async runProvisioning(tenantId, requestedSteps = PROVISIONING_STEPS) {
    let tenant = await this.repo.findById(tenantId);

    for (const stepKey of requestedSteps) {
      await this.ensureProvisioningStepRecord(tenant.id, stepKey);
      tenant = await this.runProvisioningStep(tenant, stepKey);
    }

    const steps = await this.repo.findProvisioningSteps(tenant.id);
    const allCompleted = steps.every((step) => step.status === 'completed');

    if (allCompleted && tenant.status === 'onboarding') {
      await tenant.update({
        status: 'active',
        metadata: mergeObjects(tenant.metadata, {
          provisioning: {
            ...(tenant.metadata?.provisioning || {}),
            status: 'completed',
            completedAt: new Date().toISOString(),
          },
        }),
      });
    }
  }

  async ensureProvisioningStepRecord(tenantId, stepKey) {
    const step = await this.repo.findProvisioningStep(tenantId, stepKey);

    if (!step) {
      await this.repo.upsertProvisioningStep({
        tenantId,
        stepKey,
        status: 'pending',
        metadata: {},
      });
    }
  }

  async runProvisioningStep(tenant, stepKey) {
    const existingStep = await this.repo.findProvisioningStep(tenant.id, stepKey);

    await this.repo.updateProvisioningStep(tenant.id, stepKey, {
      status: 'in_progress',
      attemptCount: (existingStep?.attemptCount || 0) + 1,
      lastAttemptAt: new Date(),
      errorDetails: null,
      message: null,
    });

    try {
      const executionResult = await this.executeProvisioningStep(tenant, stepKey);

      await this.repo.updateProvisioningStep(tenant.id, stepKey, {
        status: 'completed',
        completedAt: new Date(),
        message: executionResult.message,
        metadata: executionResult.metadata || {},
        errorDetails: null,
      });

      return await this.repo.findById(tenant.id);
    } catch (error) {
      await this.repo.updateProvisioningStep(tenant.id, stepKey, {
        status: 'failed',
        message: error.message,
        errorDetails: {
          stepKey,
          failedAt: new Date().toISOString(),
        },
      });

      await tenant.update({
        metadata: mergeObjects(tenant.metadata, {
          provisioning: {
            ...(tenant.metadata?.provisioning || {}),
            status: 'failed',
            failedStep: stepKey,
            failedAt: new Date().toISOString(),
          },
        }),
      });

      throw error;
    }
  }

  async executeProvisioningStep(tenant, stepKey) {
    if (stepKey === 'schema_created') {
      const tenantWorkspacePath = path.join(process.cwd(), 'storage', 'tenants', tenant.id);
      await fs.mkdir(path.join(tenantWorkspacePath, 'branding'), { recursive: true });

      return {
        message: 'Tenant workspace initialized',
        metadata: {
          workspaceMode: 'shared-schema',
          workspacePath: `/uploads/tenants/${tenant.id}`,
        },
      };
    }

    if (stepKey === 'seeded') {
      await tenant.update({
        metadata: mergeObjects(tenant.metadata, {
          provisioning: {
            ...(tenant.metadata?.provisioning || {}),
            seededAt: new Date().toISOString(),
            seededModules: ['branding', 'settings', 'subscription'],
          },
        }),
      });

      return {
        message: 'Default tenant configuration seeded',
        metadata: {
          seededModules: ['branding', 'settings', 'subscription'],
        },
      };
    }

    if (stepKey === 'dns_provisioned') {
      const portalUrl = buildPortalUrl(tenant.subdomain);
      await tenant.update({
        portalUrl,
        metadata: mergeObjects(tenant.metadata, {
          provisioning: {
            ...(tenant.metadata?.provisioning || {}),
            dnsProvisionedAt: new Date().toISOString(),
            portalUrl,
          },
        }),
      });

      return {
        message: 'Tenant portal URL provisioned',
        metadata: {
          portalUrl,
        },
      };
    }

    throw new AppError(`Unsupported provisioning step: ${stepKey}`, 400);
  }

  async persistBrandingAsset(tenantId, assetPrefix, assetPayload) {
    if (!UUID_REGEX.test(tenantId)) {
      throw new AppError('Invalid tenant identifier', 400);
    }

    const mimeType = this.resolveMimeType(assetPayload);
    const extension = ALLOWED_IMAGE_MIME_TYPES[mimeType];

    if (!extension) {
      throw new AppError(`Unsupported asset type for ${assetPrefix}`, 400);
    }

    const normalizedBase64 = assetPayload.base64.includes(',')
      ? assetPayload.base64.split(',').pop()
      : assetPayload.base64;

    const assetBuffer = Buffer.from(normalizedBase64, 'base64');

    if (assetBuffer.length > MAX_ASSET_BYTES) {
      throw new AppError(assetPrefix + ' file size exceeds the 5MB limit', 400);
    }

    const brandingDirectory = path.join(process.cwd(), 'storage', 'tenants', tenantId, 'branding');

    await fs.mkdir(brandingDirectory, { recursive: true });

    const fileName = `${assetPrefix}-${Date.now()}.${extension}`;
    await fs.writeFile(path.join(brandingDirectory, fileName), assetBuffer);

    return `/uploads/tenants/${tenantId}/branding/${fileName}`;
  }

  resolveMimeType(assetPayload) {
    if (assetPayload.mimeType && ALLOWED_IMAGE_MIME_TYPES[assetPayload.mimeType]) {
      return assetPayload.mimeType;
    }

    const dataUriMatch = /^data:(.+?);base64,/.exec(assetPayload.base64);
    if (dataUriMatch?.[1] && ALLOWED_IMAGE_MIME_TYPES[dataUriMatch[1]]) {
      return dataUriMatch[1];
    }

    const extension = assetPayload.fileName?.split('.').pop()?.toLowerCase();
    const matchedMimeType = Object.entries(ALLOWED_IMAGE_MIME_TYPES).find(
      ([, ext]) => ext === extension
    )?.[0];

    if (matchedMimeType) {
      return matchedMimeType;
    }

    throw new AppError('Unable to determine asset mime type', 400);
  }

  resolveTenantStatus(currentStatus, statusData) {
    if (statusData.status) {
      return statusData.status;
    }

    if (statusData.action === 'suspend') {
      return 'suspended';
    }

    if (statusData.action === 'activate' || statusData.action === 'unsuspend') {
      return 'active';
    }

    return currentStatus;
  }

  summarizeProvisioning(provisioningSteps) {
    const summary = provisioningSteps.reduce(
      (acc, step) => {
        acc.counts[step.status] = (acc.counts[step.status] || 0) + 1;
        acc.steps.push({
          stepKey: step.stepKey,
          status: step.status,
          message: step.message,
          attemptCount: step.attemptCount,
          lastAttemptAt: step.lastAttemptAt,
          completedAt: step.completedAt,
          metadata: step.metadata,
          errorDetails: step.errorDetails,
        });
        return acc;
      },
      {
        counts: {},
        steps: [],
      }
    );

    return {
      ...summary,
      isProvisioned:
        summary.steps.length > 0 && summary.steps.every((step) => step.status === 'completed'),
      canRetry: summary.steps.some((step) => ['failed', 'pending'].includes(step.status)),
    };
  }

  formatTenantResponse({ tenant, subscription, plan, provisioningSteps, metrics }) {
    return {
      id: tenant.id,
      name: tenant.name,
      organizationType: tenant.organizationType,
      officialEmail: tenant.officialEmail,
      subdomain: tenant.subdomain,
      portalUrl: tenant.portalUrl,
      registrationNumber: tenant.registrationNumber,
      status: tenant.status,
      settings: tenant.settings,
      address: tenant.address,
      contactInfo: tenant.contactInfo,
      themeConfig: tenant.themeConfig,
      brandingAssets: tenant.brandingAssets,
      customFields: tenant.customFields,
      metadata: tenant.metadata,
      createdAt: tenant.createdAt,
      updatedAt: tenant.updatedAt,
      plan: plan
        ? {
            id: plan.id,
            name: plan.name,
            slug: plan.slug,
          }
        : null,
      subscription: subscription
        ? {
            id: subscription.id,
            status: subscription.status,
            billingCycle: subscription.billingCycle,
            startDate: subscription.startDate,
            endDate: subscription.endDate,
            nextBillingDate: subscription.nextBillingDate,
            amountPaid: subscription.amountPaid,
          }
        : null,
      metrics: metrics
        ? {
            studentCount: Number(metrics.studentCount || 0),
            lastActiveDate: metrics.lastActiveDate,
          }
        : null,
      provisioning: this.summarizeProvisioning(provisioningSteps),
    };
  }
}
