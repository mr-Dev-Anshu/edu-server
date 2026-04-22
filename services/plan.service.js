import { PlanRepository } from '../repositories/plan.repository.js';
import { AppError } from '../utils/AppError.js';

const planRepo = new PlanRepository();

export class PlanService {

    // ─── Get All Plans ───────────────────────────
    async getAllPlans(query = {}) {
        const options = {};

        if (typeof query.isActive !== 'undefined') {
            options.isActive = query.isActive === 'true';
        }

        if (query.search) {
            options.search = query.search.trim();
        }

        return await planRepo.findAll(options);
    }


    // ─── Get Single Plan ─────────────────────────
    async getPlanDetails(id) {
        return await planRepo.findById(id);
    }

    // ─── Create Plan ─────────────────────────
    async createPlan(data) {
        const existingSlug = await planRepo.findBySlug(data.slug);
        if (existingSlug) {
            throw new AppError('A plan with this slug already exists', 409);
        }

        const existingName = await planRepo.findByName(data.name);
        if (existingName) {
            throw new AppError('A plan with this name already exists', 409);
        }

        return await planRepo.create(data);
    }

    // ─── Update Plan ─────────────────────────────────
    async updatePlan(id, data) {
        if (data.slug) {
            throw new AppError('Plan slug cannot be changed after creation', 400);
        }

        const plan = await planRepo.findById(id);

        if (data.name) {
            const existingName = await planRepo.findByName(data.name);

            if (existingName && existingName.id !== plan.id) {
                throw new AppError('A plan with this name already exists', 409);
            }
        }

        const updateData = {
            ...(data.name && { name: data.name }),
            ...(data.description !== undefined && { description: data.description }),
            ...(data.monthlyPrice !== undefined && { monthlyPrice: data.monthlyPrice }),
            ...(data.yearlyPrice !== undefined && { yearlyPrice: data.yearlyPrice }),
            ...(data.features && { features: data.features }),
            ...(data.isActive !== undefined && { isActive: data.isActive }),
        };

        await plan.update(updateData);
        return plan;
    }

    // ─── Toggle / Set Plan Status ──────────────────────────
    async updatePlanStatus(id, isActive) {
        const plan = await planRepo.findById(id);

        // Already in requested state — no-op with clear message
        if (plan.isActive === isActive) {
            throw new AppError(
                `Plan is already ${isActive ? 'active' : 'inactive'}`,
                409
            );
        }

        let activeSubscriberCount = 0;

        if (!isActive) {
            activeSubscriberCount = await planRepo.getActiveSubscriptionCount(id);
        }

        await plan.update({ isActive });
        await plan.reload();

        return {
            plan,
            message: isActive
                ? 'Plan activated successfully'
                : `Plan deactivated successfully. ${activeSubscriberCount} existing subscriber(s) are unaffected.`,
        };
    }
}