import express from 'express';
import { PlanController } from '../controllers/plan.controller.js';
import { createPlanValidator, updatePlanValidator, validatePlanId, updatePlanStatusValidator } from '../middlewares/validators/plan.validator.js';
import { identifyUser, checkPermission } from '../middlewares/security/index.js';

const router = express.Router();
const ctrl = new PlanController();

// ─── Mutating Routes (SuperAdmin only) ────────────────────────────────────────

// NOTE: '/:id/status' must come BEFORE '/:id' to avoid route collision
router.post('/',
    identifyUser,
    checkPermission('create:plan'),
    createPlanValidator,
    ctrl.create
);

router.patch('/:id/status',
    identifyUser,
    checkPermission('update:plan'),
    updatePlanStatusValidator,
    ctrl.updateStatus
);

router.patch('/:id',
    identifyUser,
    checkPermission('update:plan'),
    validatePlanId,
    updatePlanValidator,
    ctrl.update
);

// ─── Read Routes (Public — tenants need to browse plans before subscribing) ───

router.get('/', ctrl.getAll);

router.get('/:id', validatePlanId, ctrl.getOne);

export default router;

