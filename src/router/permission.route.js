import { Router } from 'express';
import { createPermissionValidator } from '../middlewares/validators/permission.validator.js';
import { initPermissionModule } from '../modules/permission/_index.js';

const router = Router();

const { permissionController } = initPermissionModule();

router.post('/', createPermissionValidator, permissionController.create);

export default router;
