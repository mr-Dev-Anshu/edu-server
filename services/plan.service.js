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

        const allPlans = await planRepo.findAll({});
        const duplicateName = allPlans.find(
            p => p.name.toLowerCase() === data.name.toLowerCase()
        );
        if (duplicateName) {
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
            const allPlans = await planRepo.findAll({});
            const duplicate = allPlans.find(
                p => p.name.toLowerCase() === data.name.toLowerCase() && p.id !== id
            );
            if (duplicate) {
                throw new AppError('A plan with this name already exists', 409);
            }
        }

        return await plan.update(data);
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