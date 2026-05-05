import { Op } from 'sequelize';
import { BaseRepository } from './base.repository.js';
import { Subscription } from '../models/index.js';
import Plan from '../models/Plan.js';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export class SubscriptionRepository extends BaseRepository {
    constructor() {
        super(Subscription);
    }

    async findById(id) {
        return Subscription.findOne({ where: { id } });
    }

    async findAll(options = {}) {
        return Subscription.findAll({
            order: [['createdAt', 'DESC']],
            ...options,
        });
    }

    async findByTenant(tenantId, options = {}) {
        return Subscription.findAll({
            ...options,
            order: [['createdAt', 'DESC']],
            where: {
                ...options.where,
                tenantId,  // always last — cannot be overwritten
            },
        });
    }

    async findActiveByTenant(tenantId) {
        return Subscription.findOne({
            where: {
                tenantId,
                status: { [Op.in]: ['active', 'trialing'] },
            },
            order: [['createdAt', 'DESC']],
        });
    }

    async findPlan(identifier) {
        const normalized = String(identifier).trim();
        if (UUID_REGEX.test(normalized)) {
            return Plan.findOne({
                where: { [Op.or]: [{ id: normalized }, { slug: normalized }] },
            });
        }
        return Plan.findOne({ where: { slug: normalized } });
    }

    async findPlansByIds(ids) {
        return Plan.findAll({
            where: { id: { [Op.in]: ids } },
        });
    }

    async update(id, data, options = {}) {
        const record = await this.findById(id);
        return record.update(data, options);
    }

    async expireById(id, options = {}) {
        const record = await this.findById(id);
        return record.update({ status: 'expired' }, options);
    }

    async toggleStatus(id) {
        const record = await this.findById(id);
        if (!record) return null;
        return record.update({ status: record.status === 'active' ? 'paused' : 'active' });
    }
}