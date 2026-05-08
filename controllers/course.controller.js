import { CourseService } from "../services/course.service.js";
import { catchAsync } from "../utils/catchAsync.js";

const service = new CourseService();

export class CourseController {
  create = catchAsync(async (req, res) => {
    const tenantId = req.tenantId;

    const data = await service.createCourse(req.body, tenantId);

    res.status(201).json({
      success: true,
      data,
    });
  });

  getAll = catchAsync(async (req, res) => {
    const tenantId = req.tenantId;

    const data = await service.getAllCourses(tenantId, req.query);

    res.json({
      success: true,
      data,
    });
  });

  getOne = catchAsync(async (req, res) => {
    const tenantId = req.tenantId;

    const data = await service.getCourseById(req.params.id, tenantId);

    res.json({
      success: true,
      data,
    });
  });

  update = catchAsync(async (req, res) => {
    const tenantId = req.tenantId;

    const data = await service.updateCourse(
      req.params.id,
      tenantId,
      req.body
    );

    res.json({
      success: true,
      data,
    });
  });

  delete = catchAsync(async (req, res) => {
    const tenantId = req.tenantId;

    const data = await service.deleteCourse(
      req.params.id,
      tenantId
    );

    res.json({
      success: true,
      data,
    });
  });
}