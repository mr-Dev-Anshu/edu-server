import { catchAsync } from '../../utils/catchAsync.js';

export class BaseController {
  constructor({ service }) {
    this.service = service;
  }

  getAll = catchAsync(async (req, res) => {
    const result = await this.service.getAll({
      tenantId: req.tenantId,
      query: req.query,
    });

    // supports both array + paginated response
    if (Array.isArray(result)) {
      return res.status(200).json({
        success: true,
        results: result.length,
        data: result,
      });
    }

    return res.status(200).json({
      success: true,
      ...result,
    });
  });

  getOne = catchAsync(async (req, res) => {
    const data = await this.service.getOne({
      id: req.params.id,
      tenantId: req.tenantId,
    });

    res.status(200).json({ success: true, data });
  });

  create = catchAsync(async (req, res) => {
    const data = await this.service.create({
      ...req.body,
      tenantId: req.tenantId,
    });

    res.status(201).json({ success: true, data });
  });

  update = catchAsync(async (req, res) => {
    const data = await this.service.update({
      id: req.params.id,
      tenantId: req.tenantId,
      data: req.body,
    });

    res.status(200).json({ success: true, data });
  });

  delete = catchAsync(async (req, res) => {
    await this.service.delete({
      id: req.params.id,
      tenantId: req.tenantId,
    });

    res.status(204).json({ success: true });
  });
}