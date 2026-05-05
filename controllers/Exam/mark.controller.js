import { AppError } from "../../utils/AppError.js";
import { MarkService } from "../../services/Exam/mark.service.js";
import { catchAsync } from "../../utils/catchAsync.js";

const markService = new MarkService();

export class MarkController {
  create = catchAsync(async (req, res) => {
    if (!req.user?.id) {
      throw new AppError("User identity could not be resolved", 401);
    }

    const data = await markService.createMark(
      req.tenantId,
      req.body,
      req.user.id
    );

    res.status(201).json({ success: true, data });
  });

  bulkCreate = catchAsync(async (req, res) => {
    if (!req.user?.id) {
      throw new AppError("User identity could not be resolved", 401);
    }

    const data = await markService.bulkCreateMarks(
      req.tenantId,
      req.body.marks,
      req.user.id
    );

    res.status(201).json({ success: true, data });
  });

  getAll = catchAsync(async (req, res) => {
    const result = await markService.getAllMarks(
      req.tenantId,
      req.query
    );

    res.status(200).json({ success: true, ...result });
  });

  getOne = catchAsync(async (req, res) => {
    const data = await markService.getMarkById(
      req.params.id,
      req.tenantId
    );

    res.status(200).json({ success: true, data });
  });

  update = catchAsync(async (req, res) => {
    if (!req.user?.id) {
      throw new AppError("User identity could not be resolved", 401);
    }

    const data = await markService.updateMark(
      req.params.id,
      req.tenantId,
      req.body,
      req.user.id
    );

    res.status(200).json({ success: true, data });
  });

  delete = catchAsync(async (req, res) => {
    const data = await markService.deleteMark(
      req.params.id,
      req.tenantId
    );

    res.status(200).json({ success: true, ...data });
  });
}