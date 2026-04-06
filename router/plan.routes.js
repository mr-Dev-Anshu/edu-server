import express from 'express';
import { PlanController } from '../controllers/plan.controller.js';
import { createPlanValidator, updatePlanValidator } from '../middlewares/validators/plan.validator.js';
// import { authenticate, isSuperAdmin } from '../middlewares/auth.middleware.js';

const router = express.Router();
const ctrl = new PlanController();

// router.use(authenticate, isSuperAdmin);

// ─── Routes ───────────────────────────────

router.post('/', createPlanValidator, ctrl.create);

router.get('/', ctrl.getAll);

router.patch('/:id/status', ctrl.updateStatus);

router.patch('/:id', updatePlanValidator, ctrl.update);

router.get('/:id', ctrl.getOne);

export default router;
