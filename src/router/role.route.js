import { Router } from 'express';
import { createRoleValidator } from '../middlewares/validators/role.validator.js';
import { initRoleModule } from '../modules/role/_index.js';

const router = Router();

const { roleController } = initRoleModule();

router.post('/', createRoleValidator, roleController.create);

export default router;
