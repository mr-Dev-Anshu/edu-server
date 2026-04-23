import { FeeStructureService } from "../../services/FeeStructure/feeStructure.service.js";
import { catchAsync } from "../../utils/catchAsync.js";

const feeStructureService = new FeeStructureService();

export class FeeStructureController {
  create = catchAsync(async (req, res) => {
    const data = await feeStructureService.createFeeStructure(req.tenantId, req.body);
    res.status(201).json({ success: true, data });
  });

  getAll = catchAsync(async (req, res) => {
    const result = await feeStructureService.getAllFeeStructures(req.tenantId, req.query);
    res.status(200).json({ success: true, ...result });
  });

  getOne = catchAsync(async (req, res) => {
    const data = await feeStructureService.getFeeStructureById(req.params.id, req.tenantId);
    res.status(200).json({ success: true, data });
  });

  update = catchAsync(async (req, res) => {
    const data = await feeStructureService.updateFeeStructure(req.params.id, req.tenantId, req.body);
    res.status(200).json({ success: true, data });
  });

  delete = catchAsync(async (req, res) => {
    const data = await feeStructureService.deleteFeeStructure(req.params.id, req.tenantId);
    res.status(200).json({ success: true, ...data });
  });
}
