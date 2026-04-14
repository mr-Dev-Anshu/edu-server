import { Router } from 'express';
// import { authenticate } from '../middlewares/authenticate.js';
// import { isSuperAdmin } from '../middlewares/isSuperAdmin.js';
import { tenantIdMiddleware, requireTenantId } from '../middlewares/tenant.middleware.js';

import {
    createSubscriptionValidator,
    updateSubscriptionValidator,
    upgradeValidator,
    validateSubscriptionId,
    validateTenantId,
    validateListFilters,
} from '../middlewares/validators/subscription.validator.js';
import { subscriptionController } from '../controllers/subscription.controller.js';

const router = Router();

// router.use(authenticate, isSuperAdmin);

router.post('/',
    tenantIdMiddleware,
    requireTenantId,
    createSubscriptionValidator,
    subscriptionController.create
);

router.get('/',
    validateListFilters,
    subscriptionController.getAll
);

// Static segment must come before /:id to avoid route collision
router.get('/tenant/:tenantId',
    validateTenantId,
    validateListFilters,
    subscriptionController.getByTenant
);

router.get('/:id',
    validateSubscriptionId,
    subscriptionController.getOne
);

// ✅ specific first
router.patch('/:id/upgrade',
    validateSubscriptionId,
    upgradeValidator,
    subscriptionController.upgrade
);

router.patch('/:id/status',
    validateSubscriptionId,
    subscriptionController.toggleStatus
);

// ✅ generic last
router.patch('/:id',
    validateSubscriptionId,
    updateSubscriptionValidator,
    subscriptionController.update
);

export default router;