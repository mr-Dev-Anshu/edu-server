import express from 'express';
import { tenantValidator } from '../middlewares/validators/tenant.validator';
import { TenantController } from '../controllers/tenant.controller';

const router = express.Router();
const ctrl = new TenantController();

router.post('/register', tenantValidator, ctrl.create);

router.route('/:id')
  .get(ctrl.getOne)
  .patch(tenantValidator, ctrl.update)
  .delete(ctrl.delete);

export default router;