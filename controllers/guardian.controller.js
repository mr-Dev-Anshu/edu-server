import { GuardianService } from "../services/guardian.service.js";
import { BaseController } from "./base.controller.js";
import { catchAsync } from "../utils/catchAsync.js";

const guardianService = new GuardianService();

export class GuardianController extends BaseController {
  constructor() {
    super(guardianService);
  }
  createGuardian = catchAsync(async (req, res) => {
    const data = await guardianService.createGuardian(req.tenantId, {
      ...req.body,
      requestedBy: req.user.id
    });
    res.status(201).json({ success: true, data });
  });

  getByStudent = catchAsync(async (req, res) => {
    const data = await guardianService.getByStudent(
      req.params.studentId,
      req.tenantId
    );
    res.status(200).json({ success: true, results: data.length, data });
  });
}