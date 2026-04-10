import { StaffService } from "../services/staff.service.js";
import { catchAsync } from "../utils/catchAsync.js";

const staffService = new StaffService();

export class StaffController {
  create = catchAsync(async (req, res) => {
    const data = await staffService.createStaff(req.tenantId, req.body);
    res.status(201).json({ success: true, data });
  });

  getAll = catchAsync(async (req, res) => {
    const result = await staffService.getAllStaff(req.tenantId, req.query);
    res.status(200).json({ success: true, ...result });
  });

  getOne = catchAsync(async (req, res) => {
    const data = await staffService.getStaffById(req.params.id, req.tenantId);
    res.status(200).json({ success: true, data });
  });

  update = catchAsync(async (req, res) => {
    const data = await staffService.updateStaff(req.params.id, req.tenantId, req.body);
    res.status(200).json({ success: true, data });
  });

  delete = catchAsync(async (req, res) => {
    const data = await staffService.deleteStaff(req.params.id, req.tenantId);
    res.status(200).json({ success: true, ...data });
  });

  search = catchAsync(async (req, res) => {
    const { q } = req.query;
    const data = await staffService.searchStaff(req.tenantId, q);
    res.status(200).json({ success: true, results: data.length, data });
  });
}
