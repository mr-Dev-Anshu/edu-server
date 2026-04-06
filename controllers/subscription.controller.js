import { validationResult } from 'express-validator';
import SubscriptionService from '../services/subscription.service.js';
import {catchAsync} from '../utils/catchAsync.js';
import {AppError} from '../utils/AppError.js';

// Import models for service layer validation
import Plan from '../models/Plan.js';
import Tenant from '../models/Tenant.js';

// Instantiate service at top — NOT extending BaseController (Super Admin rule)
const subscriptionService = new SubscriptionService();

class SubscriptionController {
    /**
     * Super Admin assigns a plan to a tenant
     */
    assignPlan = catchAsync(async (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return next(new AppError(errors.array()[0].msg, 422));
        }

        const { subscription, isNew } = await subscriptionService.assignPlanToTenant(
            req.body,
            Plan,
            Tenant
        );

        res.status(isNew ? 201 : 200).json({
            success: true,
            message: isNew
                ? 'Plan assigned to tenant successfully'
                : 'Tenant subscription updated successfully',
            data: subscription,
        });
    });

    /**
     * School Owner upgrades their own plan
     */
    upgradeMyPlan = catchAsync(async (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return next(new AppError(errors.array()[0].msg, 422));
        }

        // tenantId comes from authenticated school owner's JWT
        const tenantId = req.user.tenantId;
        if (!tenantId) {
            return next(new AppError('Tenant ID not found in token. Access denied.', 403));
        }

        const { subscription, isNew } = await subscriptionService.upgradeMyPlan(
            tenantId,
            req.body,
            Plan
        );

        res.status(isNew ? 201 : 200).json({
            success: true,
            message: isNew
                ? 'Subscription created successfully'
                : 'Plan upgraded successfully',
            data: subscription,
        });
    });

    /**
     * Get all subscriptions with optional filters
     */
    getAllSubscriptions = catchAsync(async (req, res) => {
        const { status, tenantId } = req.query;
        const filters = {};
        if (status) filters.status = status;
        if (tenantId) filters.tenantId = tenantId;

        const subscriptions = await subscriptionService.getAllSubscriptions(filters);

        res.status(200).json({
            success: true,
            results: subscriptions.length,
            data: subscriptions,
        });
    });

    /**
     * Get a single subscription by ID
     */
    getSubscriptionById = catchAsync(async (req, res) => {
        const subscription = await subscriptionService.getSubscriptionById(req.params.id);

        res.status(200).json({
            success: true,
            data: subscription,
        });
    });

    /**
     * Get all subscriptions for a specific tenant
     */
    getTenantSubscriptions = catchAsync(async (req, res) => {
        const subscriptions = await subscriptionService.getTenantSubscriptions(
            req.params.tenantId
        );

        res.status(200).json({
            success: true,
            results: subscriptions.length,
            data: subscriptions,
        });
    });

    /**
     * School Owner sees their active subscription
     */
    getMyActiveSubscription = catchAsync(async (req, res, next) => {
        const tenantId = req.user.tenantId;
        if (!tenantId) {
            return next(new AppError('Tenant ID not found in token. Access denied.', 403));
        }

        const subscription = await subscriptionService.getActiveSubscription(tenantId);

        res.status(200).json({
            success: true,
            data: subscription,
        });
    });

    /**
     * Update subscription details (Super Admin only)
     */
    updateSubscription = catchAsync(async (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return next(new AppError(errors.array()[0].msg, 422));
        }

        const subscription = await subscriptionService.updateSubscription(
            req.params.id,
            req.body
        );

        res.status(200).json({
            success: true,
            message: 'Subscription updated successfully',
            data: subscription,
        });
    });

    /**
     * Toggle subscription status
     */
    toggleStatus = catchAsync(async (req, res, next) => {
        const { status } = req.body;
        if (!status) {
            return next(new AppError('status field is required', 400));
        }

        const subscription = await subscriptionService.toggleSubscriptionStatus(
            req.params.id,
            status
        );

        res.status(200).json({
            success: true,
            message: `Subscription status updated to '${status}'`,
            data: subscription,
        });
    });
}

export default SubscriptionController;