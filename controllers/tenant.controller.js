import { TenantService } from "../services/tenant.service.js";
import { catchAsync } from "../utils/catchAsync.js";

const tenantService = new TenantService();

export class TenantController {
  getAll = catchAsync(async (req, res) => {
    const data = await tenantService.listTenants(req.query);
    res.status(200).json({ success: true, ...data });
  });

  create = catchAsync(async (req, res) => {
    const data = await tenantService.registerTenant(req.body);
    res.status(201).json({ success: true, data });
  });

  getOne = catchAsync(async (req, res) => {
    const data = await tenantService.getTenantDetails(req.params.id);
    res.status(200).json({ success: true, data });
  });

  updateProfile = catchAsync(async (req, res) => {
    const data = await tenantService.updateProfile(req.params.id, req.body);
    res.status(200).json({ success: true, data });
  });

  updateStatus = catchAsync(async (req, res) => {
    const data = await tenantService.updateStatus(req.params.id, req.body);
    res.status(200).json({ success: true, data });
  });

  archive = catchAsync(async (req, res) => {
    const data = await tenantService.archiveTenant(req.params.id, req.body);
    res.status(200).json({ success: true, data });
  });

  updateBranding = catchAsync(async (req, res) => {
    const data = await tenantService.updateBranding(req.params.id, req.body);
    res.status(200).json({ success: true, data });
  });

  uploadBrandingAssets = catchAsync(async (req, res) => {
    const data = await tenantService.uploadBrandingAssets(req.params.id, req.body);
    res.status(200).json({ success: true, data });
  });

  getProvisioning = catchAsync(async (req, res) => {
    const data = await tenantService.getProvisioningStatus(req.params.id);
    res.status(200).json({ success: true, data });
  });

  retryProvisioning = catchAsync(async (req, res) => {
    const data = await tenantService.retryProvisioning(req.params.id, req.body);
    res.status(200).json({ success: true, data });
  });
}
