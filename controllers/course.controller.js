import { CourseService } from "../services/course.service.js";
import { catchAsync } from "../utils/catchAsync.js";

const courseService = new CourseService();

 export class CourseController {

  create = catchAsync(async (req, res) => {
    const tenantId = req.tenantId || "e9433fa7-0eb0-4b7d-8be8-5fcc57c27a54";

    const data = await courseService.createCourse(req.body, tenantId);

    res.status(201).json({
      success: true,
      data,
    });
  });

  getAll = catchAsync(async (req, res) => {
    const tenantId = req.tenantId || "e9433fa7-0eb0-4b7d-8be8-5fcc57c27a54";
    const filter = req.query.filter ? JSON.parse(req.query.filter) : {};

    const data = await courseService.getAllCourses(tenantId, filter);

    res.status(200).json({
      success: true,
      data,
    });
  });

  getById = catchAsync(async (req, res) => {
    const tenantId = req.tenantId || "e9433fa7-0eb0-4b7d-8be8-5fcc57c27a54";

    const data = await courseService.getCourseById(req.params.id, tenantId);

    res.status(200).json({
      success: true,
      data,
    });
  });

  update = catchAsync(async (req, res) => {
    const tenantId = req.tenantId || "e9433fa7-0eb0-4b7d-8be8-5fcc57c27a54";

    const data = await courseService.updateCourse(
      req.params.id,
      tenantId,
      req.body
    );

    res.status(200).json({
      success: true,
      data,
    });
  });

  delete = catchAsync(async (req, res) => {
    const tenantId = req.tenantId || "e9433fa7-0eb0-4b7d-8be8-5fcc57c27a54";

    await courseService.deleteCourse(req.params.id, tenantId);

    res.status(200).json({
      success: true,
      message: "Course deleted successfully",
    });
  });
}