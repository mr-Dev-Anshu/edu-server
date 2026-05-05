import { SubjectService } from "../../services/Academic/subject.service.js";
import { catchAsync } from "../../utils/catchAsync.js";

const subjectService = new SubjectService();

export class SubjectController {
  create = catchAsync(async (req, res) => {
    const data = await subjectService.createSubject(req.tenantId, req.body);
    res.status(201).json({ success: true, data });
  });

  getAll = catchAsync(async (req, res) => {
    const result = await subjectService.getAllSubjects(req.tenantId, req.query);
    res.status(200).json({ success: true, ...result });
  });

  getOne = catchAsync(async (req, res) => {
    const data = await subjectService.getSubjectById(
      req.params.id,
      req.tenantId,
    );
    res.status(200).json({ success: true, data });
  });

  update = catchAsync(async (req, res) => {
    const data = await subjectService.updateSubject(
      req.params.id,
      req.tenantId,
      req.body,
    );
    res.status(200).json({ success: true, data });
  });

  delete = catchAsync(async (req, res) => {
    const data = await subjectService.deleteSubject(
      req.params.id,
      req.tenantId,
    );
    res.status(200).json({ success: true, ...data });
  });

  search = catchAsync(async (req, res) => {
    const result = await subjectService.searchSubjects(req.tenantId, req.query);
    res.status(200).json({
      success: true,
      results: result.total,
      ...result,
    });
  });

  getByClass = catchAsync(async (req, res) => {
    const result = await subjectService.getSubjectsByClass(
      req.params.classId,
      req.tenantId,
      req.query,
    );
    res.status(200).json({ success: true, ...result });
  });
}
