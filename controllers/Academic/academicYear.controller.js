import { AcademicYearService } from "../../services/Academic/academicYear.service.js";
import { catchAsync } from "../../utils/catchAsync.js";

const academicYearService = new AcademicYearService();

export class AcademicYearController {
  create = catchAsync(async (req, res) => {
    const data = await academicYearService.createAcademicYear(req.tenantId, req.body);
    res.status(201).json({ success: true, data });
  });

  getAll = catchAsync(async (req, res) => {
    const result = await academicYearService.getAllAcademicYears(req.tenantId, req.query);
    res.status(200).json({ success: true, ...result });
  });

  getOne = catchAsync(async (req, res) => {
    const data = await academicYearService.getAcademicYearById(req.params.id, req.tenantId);
    res.status(200).json({ success: true, data });
  });

  getCurrent = catchAsync(async (req, res) => {
    const data = await academicYearService.getCurrentYear(req.tenantId);
    res.status(200).json({ success: true, data });
  });

  update = catchAsync(async (req, res) => {
    const data = await academicYearService.updateAcademicYear(req.params.id, req.tenantId, req.body);
    res.status(200).json({ success: true, data });
  });

  delete = catchAsync(async (req, res) => {
    const data = await academicYearService.deleteAcademicYear(req.params.id, req.tenantId);
    res.status(200).json({ success: true, ...data });
  });

  setCurrent = catchAsync(async (req, res) => {
    const data = await academicYearService.setCurrentYear(req.params.id, req.tenantId);
    res.status(200).json({ success: true, message: "Academic year set as current", data });
  });

  lock = catchAsync(async (req, res) => {
    const data = await academicYearService.lockAcademicYear(req.params.id, req.tenantId);
    res.status(200).json({ success: true, message: "Academic year locked", data });
  });

  unlock = catchAsync(async (req, res) => {
    const data = await academicYearService.unlockAcademicYear(req.params.id, req.tenantId);
    res.status(200).json({ success: true, message: "Academic year unlocked", data });
  });
}
