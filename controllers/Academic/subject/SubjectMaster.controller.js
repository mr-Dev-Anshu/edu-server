import { SubjectMasterService } from "../../../services/Academic/subject/SubjectMaster.service.js";
import { catchAsync } from "../../../utils/catchAsync.js";

const subjectService = new SubjectMasterService();

export class SubjectMasterController {
  create = catchAsync(async (req, res) => {
    const data = await subjectService.createSubjectMaster(req.tenantId, req.body);
    res.status(201).json({ success: true, data });
  });

  getAll = catchAsync(async (req, res) => {
    const result = await subjectService.getAllSubjects(req.tenantId, req.query);
    res.status(200).json({ success: true, data: result });
  });

  getOne = catchAsync(async (req, res) => {
    const data = await subjectService.getSubjectById(req.params.id, req.tenantId);
    res.status(200).json({ success: true, data });
  });

  getWithClasses = catchAsync(async (req, res) => {
    const data = await subjectService.getSubjectWithClasses(req.params.id, req.tenantId);
    res.status(200).json({ success: true, data });
  });

  update = catchAsync(async (req, res) => {
    const data = await subjectService.updateSubjectMaster(req.params.id, req.tenantId, req.body);
    res.status(200).json({ success: true, data });
  });

  delete = catchAsync(async (req, res) => {
    const result = await subjectService.deleteSubjectMaster(req.params.id, req.tenantId);
    res.status(200).json({ success: true, data: result });
  });

  search = catchAsync(async (req, res) => {
    const result = await subjectService.searchSubjects(req.tenantId, req.query);
    res.status(200).json({
      success: true,
      data: result,
    });
  });
}
