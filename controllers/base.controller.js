export class BaseController {
  constructor(service) {
    this.service = service;
  }

  getAll = catchAsync(async (req, res) => {
    const data = await this.service.getAll(req.tenantId, req.query);
    res.status(200).json({ success: true, results: data.length, data });
  });

  getOne = catchAsync(async (req, res) => {
    const data = await this.service.getOne(req.params.id, req.tenantId);
    res.status(200).json({ success: true, data });
  });

  create = catchAsync(async (req, res) => {
    // Principal's Move: Auto-inject tenantId from request context
    const data = await this.service.create({ ...req.body, tenantId: req.tenantId });
    res.status(201).json({ success: true, data });
  });
}