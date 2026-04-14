import { catchAsync } from '../../utils/catchAsync.js';

export class TenantController {
  constructor({ tenantService }) {
    this.tenantService = tenantService;
  }

  getAll = catchAsync(async (req, res) => {
    const data = await this.tenantService.listTenants(req.query);
    res.status(200).json({ success: true, ...data });
  });

  create = catchAsync(async (req, res) => {
    const data = await this.tenantService.registerTenant(req.body);

    const { _provisioningSucceeded, ...responseData } = data;

    res.status(_provisioningSucceeded ? 201 : 202).json({
      success: true,
      provisioningStatus: _provisioningSucceeded ? 'completed' : 'failed',
      data: responseData,
    });
  });

  getOne = catchAsync(async (req, res) => {
    const data = await this.tenantService.getTenantDetails(req.params.id);
    res.status(200).json({ success: true, data });
  });

  updateProfile = catchAsync(async (req, res) => {
    const data = await this.tenantService.updateProfile(req.params.id, req.body);
    res.status(200).json({ success: true, data });
  });

  updateStatus = catchAsync(async (req, res) => {
    const data = await this.tenantService.updateStatus(req.params.id, req.body);
    res.status(200).json({ success: true, data });
  });

  archive = catchAsync(async (req, res) => {
    const data = await this.tenantService.archiveTenant(req.params.id, req.body);
    res.status(200).json({ success: true, data });
  });

  updateBranding = catchAsync(async (req, res) => {
    const data = await this.tenantService.updateBranding(req.params.id, req.body);
    res.status(200).json({ success: true, data });
  });

  uploadBrandingAssets = catchAsync(async (req, res) => {
    const data = await this.tenantService.uploadBrandingAssets(req.params.id, req.body);
    res.status(200).json({ success: true, data });
  });

  getProvisioning = catchAsync(async (req, res) => {
    const data = await this.tenantService.getProvisioningStatus(req.params.id);
    res.status(200).json({ success: true, data });
  });

  retryProvisioning = catchAsync(async (req, res) => {
    const data = await this.tenantService.retryProvisioning(req.params.id, req.body);
    res.status(200).json({ success: true, data });
  });
}
