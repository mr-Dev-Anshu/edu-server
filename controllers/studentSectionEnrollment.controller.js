import { StudentSectionEnrollmentService } from "../services/studentSectionEnrollment.service.js";
import { BaseController } from "./base.controller.js";
import { catchAsync } from "../utils/catchAsync.js";

const enrollmentService = new StudentSectionEnrollmentService();

export class StudentSectionEnrollmentController extends BaseController {
  constructor() {
    super(enrollmentService);
  }

  // ✅ Enroll Student
  create = catchAsync(async (req, res) => {
    const data = await enrollmentService.enrollStudent({
      ...req.body,
      tenantId: req.tenantId,
    });

    res.status(201).json({
      success: true,
      data,
    });
  });

  // ✅ Get All
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

  // ✅ Get One
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

  // ✅ Update (transfer)
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

  // ✅ Delete
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