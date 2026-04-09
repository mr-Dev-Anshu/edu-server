import { ClassService } from "../../services/Academic/class.service.js";
import { BaseController } from "../base.controller.js";
import { catchAsync } from "../../utils/catchAsync.js";

const classService = new ClassService();

export class ClassController extends BaseController {
  constructor() {
    super(classService);
  }

  // Override getAll (pagination support)
  getAll = catchAsync(async (req, res) => {
    const result = await classService.getAllClasses(req.tenantId, req.query);
    res.status(200).json({ success: true, ...result });
  });

  // Override getOne (formatted response)
  getOne = catchAsync(async (req, res) => {
    const data = await classService.getClassById(req.params.id, req.tenantId);
    res.status(200).json({ success: true, data });
  });

  // Override create (custom service method)
  create = catchAsync(async (req, res) => {
    const data = await classService.createClass({
      ...req.body,
      tenantId: req.tenantId,
    });
    res.status(201).json({ success: true, data });
  });

  // Update Class
  update = catchAsync(async (req, res) => {
    const data = await classService.updateClass(
      req.params.id,
      req.tenantId,
      req.body
    );
    res.status(200).json({ success: true, data });
  });

  // Delete Class
  delete = catchAsync(async (req, res) => {
    const data = await classService.deleteClass(
      req.params.id,
      req.tenantId
    );
    res.status(200).json({ success: true, ...data });
  });

  // Extra: Get Classes with Sections
  getWithSections = catchAsync(async (req, res) => {
    const data = await classService.getClassesWithSections(req.tenantId);
    res.status(200).json({ success: true, data });
  });
}