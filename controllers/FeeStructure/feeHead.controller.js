import { FeeHeadService } from "../../services/FeeStructure/feeHead.service.js";
import { catchAsync } from "../../utils/catchAsync.js";

const feeHeadService = new FeeHeadService();

export class FeeHeadController {
  create = catchAsync(async (req, res) => {
    const data = await feeHeadService.createFeeHead(req.tenantId, req.body);
    res.status(201).json({ success: true, data });
  });

  getAll = catchAsync(async (req, res) => {
    const result = await feeHeadService.getAllFeeHeads(req.tenantId, req.query);
    res.status(200).json({ success: true, ...result });
  });

  getOne = catchAsync(async (req, res) => {
    const data = await feeHeadService.getFeeHeadById(req.params.id, req.tenantId);
    res.status(200).json({ success: true, data });
  });

  update = catchAsync(async (req, res) => {
    const data = await feeHeadService.updateFeeHead(req.params.id, req.tenantId, req.body);
    res.status(200).json({ success: true, data });
  });

  delete = catchAsync(async (req, res) => {
    const data = await feeHeadService.deleteFeeHead(req.params.id, req.tenantId);
    res.status(200).json({ success: true, ...data });
  });
}
