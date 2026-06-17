import { GradeScaleService } from "../../services/Exam/gradeScale.service.js";
import { catchAsync } from "../../utils/catchAsync.js";

const gradeScaleService = new GradeScaleService();

export class GradeScaleController {
  create = catchAsync(async (req, res) => {
    const data = await gradeScaleService.createGradeScale(req.tenantId, req.body);
    res.status(201).json({ success: true, data });
  });

  getAll = catchAsync(async (req, res) => {
    const result = await gradeScaleService.getAllGradeScales(req.tenantId, req.query);
    res.status(200).json({ success: true, ...result });
  });

  getOne = catchAsync(async (req, res) => {
    const data = await gradeScaleService.getGradeScaleById(req.params.id, req.tenantId);
    res.status(200).json({ success: true, data });
  });

  getDefault = catchAsync(async (req, res) => {
    const data = await gradeScaleService.getDefaultGradeScale(req.tenantId);
    res.status(200).json({ success: true, data });
  });

  update = catchAsync(async (req, res) => {
    const data = await gradeScaleService.updateGradeScale(req.params.id, req.tenantId, req.body);
    res.status(200).json({ success: true, data });
  });

  delete = catchAsync(async (req, res) => {
    const data = await gradeScaleService.deleteGradeScale(req.params.id, req.tenantId);
    res.status(200).json({ success: true, ...data });
  });

  setDefault = catchAsync(async (req, res) => {
    const data = await gradeScaleService.setDefaultGradeScale(req.params.id, req.tenantId);
    res.status(200).json({ success: true, message: "Grade scale set as default", data });
  });
}