import { LibraryBookIssuanceService } from "../services/libraryBookIssuance.service.js";
import { catchAsync } from "../utils/catchAsync.js";

const service = new LibraryBookIssuanceService();

export class LibraryBookIssuanceController {
  create = catchAsync(async (req, res) => {
    const data = await service.createIssuance(req.tenantId, {
      ...req.body,
      issuedById: req.user.id,
    });
    res.status(201).json({ success: true, data });
  });

  getAll = catchAsync(async (req, res) => {
    const result = await service.getAllIssuances(req.tenantId, req.query);
    res.status(200).json({ success: true, ...result });
  });

  getOne = catchAsync(async (req, res) => {
    const data = await service.getIssuanceById(req.params.id, req.tenantId);
    res.status(200).json({ success: true, data });
  });

  update = catchAsync(async (req, res) => {
    const data = await service.updateIssuance(req.params.id, req.tenantId, req.body);
    res.status(200).json({ success: true, data });
  });

  delete = catchAsync(async (req, res) => {
    const data = await service.deleteIssuance(req.params.id, req.tenantId);
    res.status(200).json({ success: true, ...data });
  });

  search = catchAsync(async (req, res) => {
    const result = await service.searchIssuances(req.tenantId, req.query);
    res.status(200).json({
      success: true,
      results: result.data.length,
      ...result,
    });
  });
}
