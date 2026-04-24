import _ from 'lodash'; // ✅ FIX (Critical): needed for _.merge
import { PlanRepository } from '../repositories/plan.repository.js';
import { AppError } from '../utils/AppError.js';

const planRepo = new PlanRepository();

// ✅ FIX (High): Sanitize raw Sequelize instances before returning to controller
export function formatPlanResponse(plan) {
    return {
        id: plan.id,
        name: plan.name,
        slug: plan.slug,
        description: plan.description,
        monthlyPrice: plan.monthlyPrice,
        yearlyPrice: plan.yearlyPrice,
        currency: plan.currency,
        features: plan.features,
        isActive: plan.isActive,
        createdAt: plan.createdAt,
        updatedAt: plan.updatedAt,
    };
}

export class PlanService {

    async getAllPlans(query = {}) {
        const options = {};
        if (typeof query.isActive !== 'undefined') options.isActive = query.isActive === 'true';
        if (query.search) options.search = query.search.trim();
        const plans = await planRepo.findAll(options);
        return plans.map(formatPlanResponse); // ✅ FIX (High)
    }

    async getPlanDetails(id) {
        // ✅ FIX (High): 404 is now thrown here, not in the repository
        const plan = await planRepo.findById(id);
        if (!plan) throw new AppError('Plan not found', 404);
        return formatPlanResponse(plan); // ✅ FIX (High)
    }

    async createPlan(data) {
        // ✅ FIX (Moderate): run independent queries in parallel
        const [existingSlug, existingName] = await Promise.all([
            planRepo.findBySlug(data.slug),
            planRepo.findByName(data.name),
        ]);
        if (existingSlug) throw new AppError('A plan with this slug already exists', 409);
        if (existingName) throw new AppError('A plan with this name already exists', 409);

        const plan = await planRepo.create(data);
        return formatPlanResponse(plan); // ✅ FIX (High)
    }

    async updatePlan(id, data) {
        if (data.slug) throw new AppError('Plan slug cannot be changed after creation', 400);

        // ✅ FIX (High): 404 thrown in service, not repository
        const plan = await planRepo.findById(id);
        if (!plan) throw new AppError('Plan not found', 404);

        if (data.name) {
            const existingName = await planRepo.findByName(data.name);
            if (existingName && existingName.id !== plan.id)
                throw new AppError('A plan with this name already exists', 409);
        }

        const updateData = {
            ...(data.name && { name: data.name }),
            ...(data.description !== undefined && { description: data.description }),
            ...(data.monthlyPrice !== undefined && { monthlyPrice: data.monthlyPrice }),
            ...(data.yearlyPrice !== undefined && { yearlyPrice: data.yearlyPrice }),
            // ✅ FIX (Critical): merge instead of replace — prevents key deletion
            ...(data.features && { features: _.merge({}, plan.features, data.features) }),
            ...(data.isActive !== undefined && { isActive: data.isActive }),
        };

        await plan.update(updateData);
        return formatPlanResponse(plan); // ✅ FIX (High)
    }

    async updatePlanStatus(id, isActive) {
        // ✅ FIX (High): 404 thrown in service
        const plan = await planRepo.findById(id);
        if (!plan) throw new AppError('Plan not found', 404);

        if (plan.isActive === isActive)
            throw new AppError(`Plan is already ${isActive ? 'active' : 'inactive'}`, 409);

        let activeSubscriberCount = 0;
        if (!isActive) activeSubscriberCount = await planRepo.getActiveSubscriptionCount(id);

        await plan.update({ isActive });
        await plan.reload();

        return {
            plan: formatPlanResponse(plan), // ✅ FIX (High)
            message: isActive
                ? 'Plan activated successfully'
                : `Plan deactivated successfully. ${activeSubscriberCount} existing subscriber(s) are unaffected.`,
        };
    }
}