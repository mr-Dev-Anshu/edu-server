import { ExamScheduleService } from "../../services/Exam/examSchedule.service.js";
import { catchAsync } from "../../utils/catchAsync.js";

const examScheduleService = new ExamScheduleService();

export class ExamScheduleController {
  create = catchAsync(async (req, res) => {
    const data = await examScheduleService.createExamSchedule(req.tenantId, req.body);
    res.status(201).json({ success: true, data });
  });

  getAll = catchAsync(async (req, res) => {
    const result = await examScheduleService.getAllExamSchedules(req.tenantId, req.query);
    res.status(200).json({ success: true, ...result });
  });

  getOne = catchAsync(async (req, res) => {
    const data = await examScheduleService.getExamScheduleById(req.params.id, req.tenantId);
    res.status(200).json({ success: true, data });
  });

  update = catchAsync(async (req, res) => {
    const data = await examScheduleService.updateExamSchedule(req.params.id, req.tenantId, req.body);
    res.status(200).json({ success: true, data });
  });

  delete = catchAsync(async (req, res) => {
    const data = await examScheduleService.deleteExamSchedule(req.params.id, req.tenantId);
    res.status(200).json({ success: true, ...data });
  });
}