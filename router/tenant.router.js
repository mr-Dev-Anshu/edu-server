import express from "express";
import {
  archiveTenantValidator,
  createTenantValidator,
  listTenantsValidator,
  retryTenantProvisioningValidator,
  updateTenantBrandingValidator,
  updateTenantProfileValidator,
  updateTenantStatusValidator,
  uploadTenantBrandingAssetsValidator,
} from "../middlewares/validators/tenant.validator.js";
import { TenantController } from "../controllers/tenant.controller.js";

const router = express.Router();
const ctrl = new TenantController();

router
  .route("/")
  .get(listTenantsValidator, ctrl.getAll)
  .post(createTenantValidator, ctrl.create);


router.route("/:id").get(ctrl.getOne);

router.patch("/:id/profile", updateTenantProfileValidator, ctrl.updateProfile);
router.patch("/:id/status", updateTenantStatusValidator, ctrl.updateStatus);
router.patch("/:id/archive", archiveTenantValidator, ctrl.archive);
router.patch("/:id/branding", updateTenantBrandingValidator, ctrl.updateBranding);
router.post("/:id/branding/assets", uploadTenantBrandingAssetsValidator, ctrl.uploadBrandingAssets);
router.get("/:id/provisioning", ctrl.getProvisioning);
router.post("/:id/provisioning/retry", retryTenantProvisioningValidator, ctrl.retryProvisioning);

export default router;
