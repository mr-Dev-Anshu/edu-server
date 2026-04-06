import SubscriptionRepository from '../repositories/subscription.repository.js';
import {AppError} from '../utils/AppError.js';

// Instantiate repository at top — NOT extending BaseService (Super Admin rule)
const subscriptionRepo = new SubscriptionRepository();

class SubscriptionService {
    /**
     * Super Admin assigns a plan to a tenant
     * If subscription already exists → update it
     * startDate = today, endDate = today + plan.durationDays
     */
    async assignPlanToTenant(data, planModel, tenantModel) {
        const { tenantId, planId, billingCycle, amountPaid, status, nextBillingDate } = data;

        // Validate tenant exists
        const tenant = await tenantModel.findOne({ where: { id: tenantId } });
        if (!tenant) {
            throw new AppError('Tenant not found with the provided tenantId', 404);
        }

        // Validate plan exists
        const plan = await planModel.findOne({ where: { id: planId } });
        if (!plan) {
            throw new AppError('Plan not found with the provided planId', 404);
        }

        // Calculate startDate and endDate from plan.durationDays
        const startDate = new Date();
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + (plan.durationDays || 30));

        // Check if subscription already exists for this tenant
        const existingSubscription = await subscriptionRepo.findByTenantId(tenantId);

        if (existingSubscription) {
            // Update existing subscription
            const updated = await subscriptionRepo.updateById(existingSubscription.id, {
                planId,
                billingCycle,
                amountPaid,
                status: status || 'active',
                startDate,
                endDate,
                nextBillingDate: nextBillingDate || endDate,
            });

            return { subscription: updated, isNew: false };
        }

        // Create new subscription
        const newSubscription = await subscriptionRepo.create({
            tenantId,
            planId,
            billingCycle,
            amountPaid,
            status: status || 'active',
            startDate,
            endDate,
            nextBillingDate: nextBillingDate || endDate,
        });

        return { subscription: newSubscription, isNew: true };
    }

    /**
     * School Owner upgrades their own plan
     * tenantId is taken from req.user (authenticated school owner's JWT)
     */
    async upgradeMyPlan(tenantId, data, planModel) {
        const { planId, billingCycle, amountPaid } = data;

        // Validate plan exists
        const plan = await planModel.findOne({ where: { id: planId } });
        if (!plan) {
            throw new AppError('Plan not found with the provided planId', 404);
        }

        // Calculate startDate and endDate
        const startDate = new Date();
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + (plan.durationDays || 30));

        // Check existing subscription
        const existingSubscription = await subscriptionRepo.findByTenantId(tenantId);

        if (existingSubscription) {
            const updated = await subscriptionRepo.updateById(existingSubscription.id, {
                planId,
                billingCycle,
                amountPaid,
                status: 'active',
                startDate,
                endDate,
                nextBillingDate: endDate,
            });

            return { subscription: updated, isNew: false };
        }

        // Create new subscription
        const newSubscription = await subscriptionRepo.create({
            tenantId,
            planId,
            billingCycle,
            amountPaid,
            status: 'active',
            startDate,
            endDate,
            nextBillingDate: endDate,
        });

        return { subscription: newSubscription, isNew: true };
    }

    /**
     * Get all subscriptions (Super Admin) with optional filters
     */
    async getAllSubscriptions(filters = {}) {
        return await subscriptionRepo.findAll(filters);
    }

    /**
     * Get subscription by ID
     */
    async getSubscriptionById(id) {
        const subscription = await subscriptionRepo.findById(id);
        if (!subscription) {
            throw new AppError('Subscription not found', 404);
        }
        return subscription;
    }

    /**
     * Get all subscriptions for a specific tenant
     */
    async getTenantSubscriptions(tenantId) {
        return await subscriptionRepo.findAllByTenantId(tenantId);
    }

    /**
     * Get active subscription for a tenant
     */
    async getActiveSubscription(tenantId) {
        const subscription = await subscriptionRepo.findActiveByTenantId(tenantId);
        if (!subscription) {
            throw new AppError('No active subscription found for this tenant', 404);
        }
        return subscription;
    }

    /**
     * Update subscription details (Super Admin only)
     */
    async updateSubscription(id, data) {
        const existing = await subscriptionRepo.findById(id);
        if (!existing) {
            throw new AppError('Subscription not found', 404);
        }

        return await subscriptionRepo.updateById(id, data);
    }

    /**
     * Toggle subscription status (cancel / reactivate / expire etc.)
     */
    async toggleSubscriptionStatus(id, newStatus) {
        const existing = await subscriptionRepo.findById(id);
        if (!existing) {
            throw new AppError('Subscription not found', 404);
        }

        const validStatuses = ['active', 'past_due', 'canceled', 'trialing', 'expired'];
        if (!validStatuses.includes(newStatus)) {
            throw new AppError(
                `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
                400
            );
        }

        return await subscriptionRepo.toggleStatus(id, newStatus);
    }
}

export default SubscriptionService;