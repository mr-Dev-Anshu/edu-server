import { Router } from 'express';
import {
  archiveTenantValidator,
  createTenantValidator,
  listTenantsValidator,
  retryTenantProvisioningValidator,
  updateTenantBrandingValidator,
  updateTenantProfileValidator,
  updateTenantStatusValidator,
  uploadTenantBrandingAssetsValidator,
} from '../middlewares/validators/tenant.validator.js';
import { initTenantModule } from '../modules/tenant/_index.js';

const router = Router();

const { tenantController } = initTenantModule();

router
  .route('/')
  .get(listTenantsValidator, tenantController.getAll)
  .post(createTenantValidator, tenantController.create);

router.get('/:id', tenantController.getOne);

router.patch('/:id/profile', updateTenantProfileValidator, tenantController.updateProfile);
router.patch('/:id/status', updateTenantStatusValidator, tenantController.updateStatus);
router.patch('/:id/archive', archiveTenantValidator, tenantController.archive);
router.patch('/:id/branding', updateTenantBrandingValidator, tenantController.updateBranding);
router.post(
  '/:id/branding/assets',
  uploadTenantBrandingAssetsValidator,
  tenantController.uploadBrandingAssets
);
router.get('/:id/provisioning', tenantController.getProvisioning);
router.post(
  '/:id/provisioning/retry',
  retryTenantProvisioningValidator,
  tenantController.retryProvisioning
);

export default router;
