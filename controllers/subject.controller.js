import { SubjectService } from "../services/subject.service.js";
import { catchAsync } from "../utils/catchAsync.js";

const subjectService = new SubjectService();

/**
 * Subject Controller
 * Handles HTTP requests for Subject CRUD operations
 * All methods use catchAsync for centralized error handling
 */
export class SubjectController {
  /**
   * Create a new subject
   * POST /api/v1/subjects
   */
  create = catchAsync(async (req, res) => {
    const data = await subjectService.createSubject(req.tenantId, req.body);
    res.status(201).json({ success: true, data });
  });

  /**
   * Get all subjects with pagination
   * GET /api/v1/subjects
   */
  getAll = catchAsync(async (req, res) => {
    const result = await subjectService.getAllSubjects(req.tenantId, req.query);
    res.status(200).json({ success: true, ...result });
  });

  /**
   * Get a single subject by ID
   * GET /api/v1/subjects/:id
   */
  getOne = catchAsync(async (req, res) => {
    const data = await subjectService.getSubjectById(req.params.id, req.tenantId);
    res.status(200).json({ success: true, data });
  });

  /**
   * Update a subject
   * PATCH /api/v1/subjects/:id
   */
  update = catchAsync(async (req, res) => {
    const data = await subjectService.updateSubject(req.params.id, req.tenantId, req.body);
    res.status(200).json({ success: true, data });
  });

  /**
   * Delete (soft delete) a subject
   * DELETE /api/v1/subjects/:id
   */
  delete = catchAsync(async (req, res) => {
    const data = await subjectService.deleteSubject(req.params.id, req.tenantId);
    res.status(200).json({ success: true, ...data });
  });

  /**
   * Search subjects with filters
   * GET /api/v1/subjects/search
   */
  search = catchAsync(async (req, res) => {
    const result = await subjectService.searchSubjects(req.tenantId, req.query);
    res.status(200).json({
      success: true,
      results: result.data.length,
      ...result,
    });
  });

  /**
   * Get subjects by class
   * GET /api/v1/subjects/by-class/:classId
   */
  getByClass = catchAsync(async (req, res) => {
    const result = await subjectService.getSubjectsByClass(req.params.classId, req.tenantId, req.query);
    res.status(200).json({ success: true, ...result });
  });
}
