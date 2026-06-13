import { FeeStructureItemService } from "../../services/FeeStructure/feeStructureItem.service.js";
import { catchAsync } from "../../utils/catchAsync.js";

const feeStructureItemService = new FeeStructureItemService();

export class FeeStructureItemController {
  create = catchAsync(async (req, res) => {
    const data = await feeStructureItemService.createFeeStructureItem(
      req.tenantId,
      req.body,
    );
    res.status(201).json({ success: true, data });
  });

  getAll = catchAsync(async (req, res) => {
    const result = await feeStructureItemService.getAllFeeStructureItems(
      req.tenantId,
      req.query,
    );
    res.status(200).json({ success: true, ...result });
  });

  getOne = catchAsync(async (req, res) => {
    const data = await feeStructureItemService.getFeeStructureItemById(
      req.params.id,
      req.tenantId,
    );
    res.status(200).json({ success: true, data });
  });

  getByFeeStructure = catchAsync(async (req, res) => {
    const data = await feeStructureItemService.getFeeStructureItems(
      req.params.feeStructureId,
      req.tenantId,
    );
    res.status(200).json({ success: true, results: data.length, data });
  });

  update = catchAsync(async (req, res) => {
    const data = await feeStructureItemService.updateFeeStructureItem(
      req.params.id,
      req.tenantId,
      req.body,
    );
    res.status(200).json({ success: true, data });
  });

  delete = catchAsync(async (req, res) => {
    const data = await feeStructureItemService.deleteFeeStructureItem(
      req.params.id,
      req.tenantId,
    );
    res.status(200).json({ success: true, ...data });
  });

  deleteByFeeStructure = catchAsync(async (req, res) => {
    const data = await feeStructureItemService.deleteFeeStructureItems(
      req.params.feeStructureId,
      req.tenantId,
    );
    res.status(200).json({ success: true, ...data });
  });
}
