import { DriverService } from "../../services/transport/driver.service.js";
import { BaseController } from "../base.controller.js";
import { catchAsync } from "../../utils/catchAsync.js";

const driverService = new DriverService();

export class DriverController extends BaseController {
  constructor() {
    super(driverService);
  }

  update = catchAsync(async (req, res) => {
    const data = await driverService.update(req.params.id, req.tenantId, req.body);
    res.status(200).json({ success: true, data });
  });

  delete = catchAsync(async (req, res) => {
    const data = await driverService.delete(req.params.id, req.tenantId);
    res.status(200).json({ success: true, data });
  });
}
