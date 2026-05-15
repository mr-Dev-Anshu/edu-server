import { ClassSubjectService } from "../../../services/Academic/subject/ClassSubject.service.js";
import { catchAsync } from "../../../utils/catchAsync.js";

const classSubjectService = new ClassSubjectService();

export class ClassSubjectController {
  /**
   * Assign multiple subjects to a class (bulk operation)
   */
  assignSubjects = catchAsync(async (req, res) => {
    const result = await classSubjectService.assignSubjectsToClass(req.tenantId, req.body);
    res.status(201).json({ success: true, data: result });
  });

  /**
   * Get all subjects for a specific class
   */
  getSubjectsByClass = catchAsync(async (req, res) => {
    const result = await classSubjectService.getSubjectsByClassId(
      req.params.classId,
      req.tenantId,
      req.query
    );
    res.status(200).json({ success: true, data: result });
  });

  /**
   * Get all classes that have a specific subject
   */
  getClassesBySubject = catchAsync(async (req, res) => {
    const result = await classSubjectService.getClassesBySubjectId(
      req.params.subjectId,
      req.tenantId,
      req.query
    );
    res.status(200).json({ success: true, data: result });
  });

  /**
   * Get single class-subject mapping
   */
  getOne = catchAsync(async (req, res) => {
    const data = await classSubjectService.getClassSubjectById(req.params.id, req.tenantId);
    res.status(200).json({ success: true, data });
  });

  /**
   * Update class-subject mapping details
   */
  update = catchAsync(async (req, res) => {
    const data = await classSubjectService.updateClassSubject(
      req.params.id,
      req.tenantId,
      req.body
    );
    res.status(200).json({ success: true, data });
  });

  /**
   * Delete specific class-subject mapping
   */
  delete = catchAsync(async (req, res) => {
    const result = await classSubjectService.deleteClassSubject(req.params.id, req.tenantId);
    res.status(200).json({ success: true, data: result });
  });

  /**
   * Remove all subjects from a class
   */
  removeAllFromClass = catchAsync(async (req, res) => {
    const result = await classSubjectService.removeAllSubjectsFromClass(
      req.params.classId,
      req.tenantId
    );
    res.status(200).json({ success: true, data: result });
  });

  /**
   * Search class subjects
   */
  search = catchAsync(async (req, res) => {
    const result = await classSubjectService.searchClassSubjects(req.tenantId, req.query);
    res.status(200).json({
      success: true,
      data: result,
    });
  });
}
