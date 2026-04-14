import { Op } from 'sequelize';
import { BaseRepository } from './base.repository.js';
import { AppError } from '../utils/AppError.js';
import { Plan } from '../models/index.js';

export class PlanRepository extends BaseRepository {
    constructor() {
        super(Plan);
    }

    // ─── Override: findById without tenantId ─────────────────────────────────
    async findById(id) {
        const plan = await this.model.findByPk(id);
        if (!plan) throw new AppError('Plan not found', 404);
        return plan;
    }

    // ─── Find Plan by Name ─────────────────────────
    async findByName(name) {
        return await this.model.findOne({
            where: sequelize.where(
                sequelize.fn('LOWER', sequelize.col('name')),
                name.toLowerCase()
            )
        });
    }
    // ─── Override: findAll — explicit where, ORDER BY createdAt DESC ──────────
    async findAll(options = {}) {
        const where = {};

        if (typeof options.isActive !== 'undefined') {
            where.isActive = options.isActive;
        }

        if (options.search) {
            where.name = { [Op.iLike]: `%${options.search}%` };
        }

        return await this.model.findAll({
            where,
            order: [['created_at', 'DESC']],
        });
    }

    // ─── Custom: findBySlug ───────────────────────────────────────────────────
    async findBySlug(slug) {
        return await this.model.findOne({ where: { slug } });
    }

    // ─── Custom: active subscription count for a plan ────────────────────────
    async getActiveSubscriptionCount(planId) {
        return await this.model.count({
            where: {
                planId,
                status: { [Op.in]: ['active', 'trialing', 'past_due'] },
            },
        });
    }
}