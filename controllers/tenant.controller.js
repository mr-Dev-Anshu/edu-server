import { TenantService } from "../services/tenant.service";
import { catchAsync } from "../utils/catchAsync";

const tenantService = new TenantService();

export class TenantController {
  // We don't extend BaseController here because the method signatures 
  // (req.tenantId) don't apply to the Tenant model itself.
  
  create = catchAsync(async (req, res) => {
    const data = await tenantService.registerTenant(req.body);
    res.status(201).json({ success: true, data });
  });

  getOne = catchAsync(async (req, res) => {
    const data = await tenantService.getTenantDetails(req.params.id);
    res.status(200).json({ success: true, data });
  });

  update = catchAsync(async (req, res) => {
    const data = await tenantService.updateSettings(req.params.id, req.body);
    res.status(200).json({ success: true, data });
  });

  delete = catchAsync(async (req, res) => {
    await tenantService.deleteTenant(req.params.id);
    res.status(204).send();
  });
}