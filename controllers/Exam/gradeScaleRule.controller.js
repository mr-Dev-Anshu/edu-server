import { GradeScaleRuleService } from "../../services/Exam/gradeScaleRule.service.js";
import { catchAsync } from "../../utils/catchAsync.js";

const gradeScaleRuleService = new GradeScaleRuleService();

export class GradeScaleRuleController {
  create = catchAsync(async (req, res) => {
    const data = await gradeScaleRuleService.createGradeScaleRule(req.tenantId, req.body);
    res.status(201).json({ success: true, data });
  });

  getAll = catchAsync(async (req, res) => {
    const result = await gradeScaleRuleService.getAllGradeScaleRules(req.tenantId, req.query);
    res.status(200).json({ success: true, ...result });
  });

  getOne = catchAsync(async (req, res) => {
    const data = await gradeScaleRuleService.getGradeScaleRuleById(req.params.id, req.tenantId);
    res.status(200).json({ success: true, data });
  });

  update = catchAsync(async (req, res) => {
    const data = await gradeScaleRuleService.updateGradeScaleRule(req.params.id, req.tenantId, req.body);
    res.status(200).json({ success: true, data });
  });

  delete = catchAsync(async (req, res) => {
    const data = await gradeScaleRuleService.deleteGradeScaleRule(req.params.id, req.tenantId);
    res.status(200).json({ success: true, ...data });
  });
}