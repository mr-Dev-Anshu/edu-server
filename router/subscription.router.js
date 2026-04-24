import { Router } from 'express';
import { identifyUser, checkPermission } from '../middlewares/security/index.js';

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

router.post('/',
    identifyUser,
    checkPermission('create:subscription'),
    createSubscriptionValidator,
    subscriptionController.create
);

router.get('/',
    identifyUser,
    checkPermission('read:subscription'),
    validateListFilters,
    subscriptionController.getAll
);

// Static segment must come before /:id to avoid route collision
router.get('/tenant/:tenantId',
    identifyUser,
    validateTenantId,
    validateListFilters,
    subscriptionController.getByTenant
);

router.get('/:id',
    identifyUser,
    checkPermission('read:subscription'),
    validateSubscriptionId,
    subscriptionController.getOne
);

// ✅ specific first
router.patch('/:id/upgrade',
    identifyUser,
    checkPermission('update:subscription'),
    validateSubscriptionId,
    upgradeValidator,
    subscriptionController.upgrade
);

router.patch('/:id/status',
    identifyUser,
    checkPermission('update:subscription'),
    validateSubscriptionId,
    subscriptionController.toggleStatus
);

// ✅ generic last
router.patch('/:id',
    identifyUser,
    checkPermission('update:subscription'),
    validateSubscriptionId,
    updateSubscriptionValidator,
    subscriptionController.update
);

export default router;