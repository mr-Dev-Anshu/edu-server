import { Op } from 'sequelize';
import { AppError } from '../utils/AppError.js';
import { BaseRepository } from './base.repository.js';
import { Subscription } from '../models/index.js';
import Plan from '../models/Plan.js';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export class SubscriptionRepository extends BaseRepository {
    async findById(id) {
        const record = await Subscription.findOne({ where: { id } });
        if (!record) throw new AppError('Subscription not found', 404);
        return record;
    }

    async findAll(options = {}) {
        return Subscription.findAll({
            order: [['createdAt', 'DESC']],
            ...options,
        });
    }

    async findByTenant(tenantId, options = {}) {
        return Subscription.findAll({
            where: { tenantId },
            order: [['createdAt', 'DESC']],
            ...options,
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

    async create(data, options = {}) {
        return Subscription.create(data, options);
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
        return record.update({
            status: record.status === 'active' ? 'canceled' : 'active',
        });
    }
}