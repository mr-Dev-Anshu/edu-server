import { catchAsync } from '../utils/catchAsync.js';
import { subscriptionService } from '../services/subscription.service.js';

export class SubscriptionController {
    create = catchAsync(async (req, res) => {
        const data = await subscriptionService.createSubscription({
            ...req.body,
            tenantId: req.body.tenantId ?? req.tenantId,
        });
        res.status(201).json({ success: true, data });
    });

    getAll = catchAsync(async (req, res) => {
        const data = await subscriptionService.listSubscriptions(req.query);
        res.status(200).json({ success: true, results: data.length, data });
    });

    getOne = catchAsync(async (req, res) => {
        const data = await subscriptionService.getSubscription(req.params.id);
        res.status(200).json({ success: true, data });
    });

    getByTenant = catchAsync(async (req, res) => {
        const data = await subscriptionService.listByTenant(req.params.tenantId, req.query);
        res.status(200).json({ success: true, results: data.length, data });
    });

    update = catchAsync(async (req, res) => {
        const data = await subscriptionService.updateSubscription(req.params.id, req.body);
        res.status(200).json({ success: true, data });
    });

    upgrade = catchAsync(async (req, res) => {
        const data = await subscriptionService.upgradeSubscription(req.params.id, req.body);
        res.status(201).json({ success: true, data });
    });

    toggleStatus = catchAsync(async (req, res) => {
        const data = await subscriptionService.toggleStatus(req.params.id);
        res.status(200).json({ success: true, data });
    });
}

export const subscriptionController = new SubscriptionController();