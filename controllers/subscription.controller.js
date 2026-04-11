import { validationResult } from 'express-validator';
import { AppError } from '../utils/AppError.js';
import { subscriptionService } from '../services/subscription.service.js';

export class SubscriptionController {
    create = async (req, res, next) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) return next(new AppError(errors.array()[0].msg, 422));

            const data = await subscriptionService.createSubscription({
                ...req.body,
                tenantId: req.tenantId,
            });
            res.status(201).json({ success: true, data });
        } catch (error) {
            next(error);
        }
    };

    getAll = async (req, res, next) => {
        try {
            const data = await subscriptionService.listSubscriptions(req.query);
            res.status(200).json({ success: true, results: data.length, data });
        } catch (error) {
            next(error);
        }
    };

    getOne = async (req, res, next) => {
        try {
            const data = await subscriptionService.getSubscription(req.params.id);
            res.status(200).json({ success: true, data });
        } catch (error) {
            next(error);
        }
    };

    getByTenant = async (req, res, next) => {
        try {
            const data = await subscriptionService.listByTenant(req.params.tenantId, req.query);
            res.status(200).json({ success: true, results: data.length, data });
        } catch (error) {
            next(error);
        }
    };

    update = async (req, res, next) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) return next(new AppError(errors.array()[0].msg, 422));

            const data = await subscriptionService.updateSubscription(req.params.id, req.body);
            res.status(200).json({ success: true, data });
        } catch (error) {
            next(error);
        }
    };

    upgrade = async (req, res, next) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) return next(new AppError(errors.array()[0].msg, 422));

            const data = await subscriptionService.upgradeSubscription(req.params.id, req.body);
            res.status(201).json({ success: true, data });
        } catch (error) {
            next(error);
        }
    };

    toggleStatus = async (req, res, next) => {
        try {
            const data = await subscriptionService.toggleStatus(req.params.id);
            res.status(200).json({ success: true, data });
        } catch (error) {
            next(error);
        }
    };
}

export const subscriptionController = new SubscriptionController();