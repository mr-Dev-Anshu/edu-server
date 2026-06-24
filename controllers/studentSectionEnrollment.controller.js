import { StudentSectionEnrollmentService } from "../services/studentSectionEnrollment.service.js";
import { BaseController } from "./base.controller.js";
import { catchAsync } from "../utils/catchAsync.js";

const enrollmentService = new StudentSectionEnrollmentService();

export class StudentSectionEnrollmentController extends BaseController {
  constructor() {
    super(enrollmentService);
  }

  // Enroll Student (handles both single and bulk)
  create = catchAsync(async (req, res) => {
    const data = await enrollmentService.enrollStudent(req.tenantId, req.body);

    // For bulk enrollments, return 207 Multi-Status if there are partial failures
    const hasErrors = data.errors && data.errors.length > 0;
    const statusCode = hasErrors && (data.enrolled?.length === 0 || !data.enrolled) ? 400 : hasErrors ? 207 : 201;
    const success = !hasErrors || (data.enrolled?.length > 0);

    res.status(statusCode).json({
      success,
      data,
    });
  });

  // Get All
  getAll = catchAsync(async (req, res) => {
    const result = await enrollmentService.getAllEnrollments(
      req.tenantId,
      req.query
    );

    res.status(200).json({
      success: true,
      ...result,
    });
  });

  // Get One
  getOne = catchAsync(async (req, res) => {
    const data = await enrollmentService.getEnrollmentById(
      req.params.id,
      req.tenantId
    );

    res.status(200).json({
      success: true,
      data,
    });
  });

  // Update (transfer)
  update = catchAsync(async (req, res) => {
    const data = await enrollmentService.updateEnrollment(
      req.params.id,
      req.tenantId,
      req.body
    );

    res.status(200).json({
      success: true,
      data,
    });
  });

  // Delete
  delete = catchAsync(async (req, res) => {
    const data = await enrollmentService.deleteEnrollment(
      req.params.id,
      req.tenantId
    );

    res.status(200).json({
      success: true,
      ...data,
    });
  });
}