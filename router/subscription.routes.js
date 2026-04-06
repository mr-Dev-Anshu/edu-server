import { Router } from 'express';
import SubscriptionController from '../controllers/subscription.controller.js';
// import { authenticate, isSuperAdmin, isSchoolOwner } from '../middlewares/auth.middleware.js';
import {
    createSubscriptionValidator,
    updateSubscriptionValidator,
    upgradeSubscriptionValidator,
} from '../middlewares/validators/subscription.validator.js';

const subscriptionController = new SubscriptionController();

// ─────────────────────────────────────────────────────────────────
// SUPER ADMIN ROUTES — /api/v1/super-admin/subscriptions
// ─────────────────────────────────────────────────────────────────
export const superAdminSubscriptionRouter = Router();

// superAdminSubscriptionRouter.use(authenticate, isSuperAdmin);

// POST   /api/v1/super-admin/subscriptions          → Assign plan to tenant
superAdminSubscriptionRouter.post(
    '/',
    createSubscriptionValidator,
    subscriptionController.assignPlan
);

// GET    /api/v1/super-admin/subscriptions           → Get all (filter: ?status=&tenantId=)
superAdminSubscriptionRouter.get('/', subscriptionController.getAllSubscriptions);

// GET    /api/v1/super-admin/subscriptions/tenant/:tenantId  → All subs of a tenant
superAdminSubscriptionRouter.get(
    '/tenant/:tenantId',
    subscriptionController.getTenantSubscriptions
);

// GET    /api/v1/super-admin/subscriptions/:id       → Get single subscription
superAdminSubscriptionRouter.get('/:id', subscriptionController.getSubscriptionById);

// PATCH  /api/v1/super-admin/subscriptions/:id       → Update subscription
superAdminSubscriptionRouter.patch(
    '/:id',
    updateSubscriptionValidator,
    subscriptionController.updateSubscription
);

// PATCH  /api/v1/super-admin/subscriptions/:id/status → Toggle status only
superAdminSubscriptionRouter.patch('/:id/status', subscriptionController.toggleStatus);


// ─────────────────────────────────────────────────────────────────
// SCHOOL OWNER ROUTES — /api/v1/school-owner/subscriptions
// ─────────────────────────────────────────────────────────────────
export const schoolOwnerSubscriptionRouter = Router();

// schoolOwnerSubscriptionRouter.use(authenticate, isSchoolOwner);

// POST   /api/v1/school-owner/subscriptions/upgrade  → Upgrade own plan
schoolOwnerSubscriptionRouter.post(
    '/upgrade',
    upgradeSubscriptionValidator,
    subscriptionController.upgradeMyPlan
);

// GET    /api/v1/school-owner/subscriptions/active   → View own active subscription
schoolOwnerSubscriptionRouter.get('/active', subscriptionController.getMyActiveSubscription);
