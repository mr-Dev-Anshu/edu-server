import { AppError } from '../utils/AppError.js';
import { withTransaction } from '../utils/withTransaction.js';
import { SubscriptionRepository } from '../repositories/subscription.repository.js';

const subscriptionRepo = new SubscriptionRepository();

function computePrice(plan, billingCycle) {
    return billingCycle === 'yearly'
        ? parseFloat(plan.yearlyPrice)
        : parseFloat(plan.monthlyPrice);
}

function calculateEndDate(startDate, billingCycle) {
    const end = new Date(startDate);

    if (billingCycle === 'yearly') {
        end.setDate(end.getDate() + 365);
        return end;
    }

    if (billingCycle === 'monthly') {
        end.setDate(end.getDate() + 30);
        return end;
    }

    return end;
}

export function formatSubscriptionResponse({ subscription, plan }) {
    return {
        id: subscription.id,
        tenantId: subscription.tenantId,
        status: subscription.status,
        billingCycle: subscription.billingCycle,
        startDate: subscription.startDate,
        endDate: subscription.endDate,
        nextBillingDate: subscription.nextBillingDate,
        amountPaid: subscription.amountPaid,
        plan: plan
            ? {
                id: plan.id,
                name: plan.name,
                slug: plan.slug,
                currency: plan.currency,
                features: plan.features,
                price: computePrice(plan, subscription.billingCycle),
            }
            : null,
        isExpired: subscription.status === 'expired',
        isTrialing: subscription.status === 'trialing',
        isActive: ['active', 'trialing'].includes(subscription.status),
        createdAt: subscription.createdAt,
        updatedAt: subscription.updatedAt,
    };
}

export class SubscriptionService {
    async createSubscription(data) {
        const plan = await subscriptionRepo.findPlan(data.planId);
        if (!plan) throw new AppError('Plan not found', 404);

        if (!plan.isActive) {
            throw new AppError('This plan is no longer available for new subscriptions', 422);
        }

        const existingActive = await subscriptionRepo.findActiveByTenant(data.tenantId);
        if (existingActive) {
            throw new AppError('Tenant already has an active or trialing subscription', 409);
        }

        const startDate = data.startDate ? new Date(data.startDate) : new Date();
        const endDate = calculateEndDate(startDate, data.billingCycle);
        const amountPaid = computePrice(plan, data.billingCycle);

        const subscription = await withTransaction(async (t) => {
            return subscriptionRepo.create(
                {
                    tenantId: data.tenantId,
                    planId: plan.id,
                    status: data.status ?? 'trialing',
                    billingCycle: data.billingCycle,
                    startDate,
                    endDate,
                    nextBillingDate: endDate,
                    amountPaid,
                },
                { transaction: t }
            );
        });

        return formatSubscriptionResponse({ subscription, plan });
    }

    async getSubscription(id) {
        const subscription = await subscriptionRepo.findById(id);
        const plan = await subscriptionRepo.findPlan(subscription.planId);
        return formatSubscriptionResponse({ subscription, plan });
    }

    async _populatePlans(subscriptions) {
        const planIds = [...new Set(subscriptions.map(s => s.planId))];
        const plans = await Promise.all(planIds.map(id => subscriptionRepo.findPlan(id)));
        const planMap = plans.reduce((acc, plan) => {
            if (plan) acc[plan.id] = plan;
            return acc;
        }, {});
        return subscriptions.map(s => formatSubscriptionResponse({ subscription: s, plan: planMap[s.planId] || null }));
    }

    async listSubscriptions(filters = {}) {
        const where = {};
        const limit = parseInt(filters.limit ?? 20, 10);
        const offset = parseInt(filters.offset ?? 0, 10);

        if (filters.status) where.status = filters.status;
        if (filters.billingCycle) where.billingCycle = filters.billingCycle;
        if (filters.tenantId) where.tenantId = filters.tenantId;

        const subscriptions = await subscriptionRepo.findAll({ where, limit, offset });
        return this._populatePlans(subscriptions);
    }

    async listByTenant(tenantId, filters = {}) {
        const where = {};
        const limit = parseInt(filters.limit ?? 20, 10);
        const offset = parseInt(filters.offset ?? 0, 10);

        if (filters.status) where.status = filters.status;
        if (filters.billingCycle) where.billingCycle = filters.billingCycle;

        const subscriptions = await subscriptionRepo.findByTenant(tenantId, { where, limit, offset });
        return this._populatePlans(subscriptions);
    }

    async updateSubscription(id, data) {
        const subscription = await subscriptionRepo.update(id, {
            ...(data.status !== undefined && { status: data.status }),
            ...(data.billingCycle !== undefined && { billingCycle: data.billingCycle }),
            ...(data.endDate !== undefined && { endDate: new Date(data.endDate) }),
            ...(data.nextBillingDate !== undefined && { nextBillingDate: new Date(data.nextBillingDate) }),
        });

        const plan = await subscriptionRepo.findPlan(subscription.planId);
        return formatSubscriptionResponse({ subscription, plan });
    }

    async upgradeSubscription(existingId, data) {
        const [existing, newPlan] = await Promise.all([
            subscriptionRepo.findById(existingId),
            subscriptionRepo.findPlan(data.newPlanId),
        ]);

        if (!newPlan) throw new AppError('Plan not found', 404);

        if (!newPlan.isActive) {
            throw new AppError('Cannot upgrade to an inactive plan', 422);
        }

        const billingCycle = data.billingCycle ?? existing.billingCycle;
        const startDate = new Date();
        const endDate = calculateEndDate(startDate, billingCycle);
        const amountPaid = computePrice(newPlan, billingCycle);

        const newSubscription = await withTransaction(async (t) => {
            await subscriptionRepo.expireById(existingId, { transaction: t });

            return subscriptionRepo.create(
                {
                    tenantId: existing.tenantId,
                    planId: newPlan.id,
                    status: 'active',
                    billingCycle,
                    startDate,
                    endDate,
                    nextBillingDate: endDate,
                    amountPaid,
                },
                { transaction: t }
            );
        });

        return formatSubscriptionResponse({ subscription: newSubscription, plan: newPlan });
    }

    async toggleStatus(id) {
        const updated = await subscriptionRepo.toggleStatus(id);
        const plan = await subscriptionRepo.findPlan(updated.planId);
        return formatSubscriptionResponse({ subscription: updated, plan });
    }
}

export const subscriptionService = new SubscriptionService();