import { BiometricPunchService } from "../services/biometric-punch.service.js";
import { BaseController } from "./base.controller.js";
import { catchAsync } from "../utils/catchAsync.js";

const biometricPunchService = new BiometricPunchService();

export class BiometricPunchController extends BaseController {
  constructor() {
    super(biometricPunchService);
  }

  create = catchAsync(async (req, res) => {
    const data = await biometricPunchService.createPunch({
      ...req.body,
      tenantId: req.tenantId,
    });
    res.status(201).json({ success: true, data });
  });

  bulkCreate = catchAsync(async (req, res) => {
    const data = await biometricPunchService.bulkCreatePunches(
      req.tenantId,
      req.body.punches
    );
    res.status(201).json({ success: true, results: data.length, data });
  });

  getAll = catchAsync(async (req, res) => {
    const data = await biometricPunchService.getAllPunches(req.tenantId, req.query);
    res.status(200).json({ success: true, results: data.length, data });
  });

  getOne = catchAsync(async (req, res) => {
    const data = await biometricPunchService.getPunchById(req.params.id, req.tenantId);
    res.status(200).json({ success: true, data });
  });

  update = catchAsync(async (req, res) => {
    const data = await biometricPunchService.updatePunch(req.params.id, req.tenantId, req.body);
    res.status(200).json({ success: true, data });
  });

  delete = catchAsync(async (req, res) => {
    await biometricPunchService.delete(req.params.id, req.tenantId);
    res.status(200).json({ success: true, message: "Biometric punch deleted successfully" });
  });
}
