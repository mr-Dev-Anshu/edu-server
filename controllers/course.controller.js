import { CourseService } from "../services/course.service.js";
import { catchAsync } from "../utils/catchAsync.js";

const service = new CourseService();

export class CourseController {

  // ✅ Course banao
  create = catchAsync(async (req, res) => {
    // Step 1 — req.body se data variable mein store karo
    const { name, description } = req.body;
    const { tenantId } = req;

    // Step 2 — Service ko call karo
    const data = await service.createCourse({ name, description, tenantId });

    // Step 3 — Response bhejo
    res.status(201).json({
      success: true,
      message: "Course created successfully",
      data,
    });
  });

  // ✅ Sab courses laao
  getAll = catchAsync(async (req, res) => {
    // Step 1 — tenantId variable mein store karo
    const { tenantId } = req;

    // Step 2 — Service ko call karo
    const data = await service.getCourses(tenantId);

    // Step 3 — Response bhejo
    res.status(200).json({
      success: true,
      message: "Courses fetched successfully",
      data,
    });
  });

  // ✅ Ek course laao
  getById = catchAsync(async (req, res) => {
    // Step 1 — params aur tenantId variable mein store karo
    const { id } = req.params;
    const { tenantId } = req;

    // Step 2 — Service ko call karo
    const data = await service.getCourse(id, tenantId);

    // Step 3 — Response bhejo
    res.status(200).json({
      success: true,
      message: "Course fetched successfully",
      data,
    });
  });

  // ✅ Course update karo
  update = catchAsync(async (req, res) => {
    // Step 1 — params, body, tenantId variable mein store karo
    const { id } = req.params;
    const { tenantId } = req;
    const { name, description } = req.body;

    // Step 2 — Service ko call karo
    const data = await service.updateCourse(id, tenantId, { name, description });

    // Step 3 — Response bhejo
    res.status(200).json({
      success: true,
      message: "Course updated successfully",
      data,
    });
  });

  // ✅ Course delete karo
  delete = catchAsync(async (req, res) => {
    // Step 1 — params aur tenantId variable mein store karo
    const { id } = req.params;
    const { tenantId } = req;

    // Step 2 — Service ko call karo
    await service.deleteCourse(id, tenantId);

    // Step 3 — Response bhejo
    res.status(200).json({
      success: true,
      message: "Course deleted successfully",
    });
  });
}