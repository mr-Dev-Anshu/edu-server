import { ExamGroupService } from "../../services/Exam/examGroup.service.js";
import { catchAsync } from "../../utils/catchAsync.js";

const examGroupService = new ExamGroupService();

export class ExamGroupController {
  create = catchAsync(async (req, res) => {
    const data = await examGroupService.createExamGroup(req.tenantId, req.body);
    res.status(201).json({ success: true, data });
  });

  getAll = catchAsync(async (req, res) => {
    const result = await examGroupService.getAllExamGroups(req.tenantId, req.query);
    res.status(200).json({ success: true, ...result });
  });

  getOne = catchAsync(async (req, res) => {
    const data = await examGroupService.getExamGroupById(req.params.id, req.tenantId);
    res.status(200).json({ success: true, data });
  });

  update = catchAsync(async (req, res) => {
    const data = await examGroupService.updateExamGroup(req.params.id, req.tenantId, req.body);
    res.status(200).json({ success: true, data });
  });

  delete = catchAsync(async (req, res) => {
    const data = await examGroupService.deleteExamGroup(req.params.id, req.tenantId);
    res.status(200).json({ success: true, ...data });
  });

  publishResult = catchAsync(async (req, res) => {
    const data = await examGroupService.publishResult(req.params.id, req.tenantId);
    res.status(200).json({ success: true, message: "Result published", data });
  });

  unpublishResult = catchAsync(async (req, res) => {
    const data = await examGroupService.unpublishResult(req.params.id, req.tenantId);
    res.status(200).json({ success: true, message: "Result unpublished", data });
  });
}