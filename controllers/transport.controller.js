import { TransportServiceService } from "../services/transport.service.js";
import { BaseController } from "./base.controller.js"
import { catchAsync } from "../utils/catchAsync.js";
const transportService = new TransportServiceService();

export class TransportController extends BaseController {
  constructor() {
    super(transportService);
  }
    update = catchAsync(async (req, res) => {
    const data = await transportService.update(req.params.id, req.tenantId, req.body);
    res.status(200).json({ success: true, data });
  });
}
