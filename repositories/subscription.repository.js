import { BaseRepository } from './base.repository.js';
import Subscription from '../models/Subscription.js';
import { Op } from 'sequelize';

class SubscriptionRepository extends BaseRepository {
    constructor() {
        super(Subscription);
    }

    /**
     * Override: findById without tenantId scope (Super Admin)
     */
    async findById(id) {
        return await Subscription.findOne({
            where: { id },
        });
    }

    /**
     * Override: findAll with ORDER BY createdAt DESC
     */
    async findAll(options = {}) {
        const { status, tenantId } = options;
        const where = {};

        if (status) where.status = status;
        if (tenantId) where.tenantId = tenantId;

        return await Subscription.findAll({
            where,
            order: [['createdAt', 'DESC']],
        });
    }

    /**
     * Find active subscription for a specific tenant
     */
    async findActiveByTenantId(tenantId) {
        return await Subscription.findOne({
            where: {
                tenantId,
                status: 'active',
                endDate: { [Op.gte]: new Date() },
            },
        });
    }

    /**
     * Find latest subscription for a tenant (any status)
     */
    async findByTenantId(tenantId) {
        return await Subscription.findOne({
            where: { tenantId },
            order: [['createdAt', 'DESC']],
        });
    }

    /**
     * Find all subscriptions for a specific tenant
     */
    async findAllByTenantId(tenantId) {
        return await Subscription.findAll({
            where: { tenantId },
            order: [['createdAt', 'DESC']],
        });
    }

    /**
     * Update subscription by id
     */
    async updateById(id, data) {
        const [affectedRows, [updated]] = await Subscription.update(data, {
            where: { id },
            returning: true,
        });
        return affectedRows > 0 ? updated : null;
    }

    /**
     * Toggle subscription status
     */
    async toggleStatus(id, newStatus) {
        const [affectedRows, [updated]] = await Subscription.update(
            { status: newStatus },
            { where: { id }, returning: true }
        );
        return affectedRows > 0 ? updated : null;
    }
}

export default SubscriptionRepository;