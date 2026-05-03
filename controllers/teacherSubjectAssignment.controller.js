import { teacherSubjectAssignmentService } from "../services/teacherSubjectAssignment.service.js";
import { catchAsync } from "../utils/catchAsync.js";

export class TeacherSubjectAssignmentController {
  create = catchAsync(async (req, res) => {
    const data = await teacherSubjectAssignmentService.createAssignment(req.tenantId, {
      ...req.body,
      requestedBy: req.user?.id,
    });
    res.status(201).json({ success: true, data });
  });

  getAll = catchAsync(async (req, res) => {
    const result = await teacherSubjectAssignmentService.getAllAssignments(req.tenantId, req.query);
    res.status(200).json({ success: true, results: result.total, ...result });
  });

  getOne = catchAsync(async (req, res) => {
    const data = await teacherSubjectAssignmentService.getAssignmentById(req.params.id, req.tenantId);
    res.status(200).json({ success: true, data });
  });

  update = catchAsync(async (req, res) => {
    const data = await teacherSubjectAssignmentService.updateAssignment(req.params.id, req.tenantId, req.body);
    res.status(200).json({ success: true, data });
  });

  delete = catchAsync(async (req, res) => {
    const data = await teacherSubjectAssignmentService.deleteAssignment(req.params.id, req.tenantId);
    res.status(200).json({ success: true, ...data });
  });

  search = catchAsync(async (req, res) => {
    const result = await teacherSubjectAssignmentService.searchAssignments(req.tenantId, req.query);
    res.status(200).json({ success: true, results: result.total, ...result });
  });
}

export default TeacherSubjectAssignmentController;
