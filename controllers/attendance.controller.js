import { AttendanceService } from "../services/attendance.service.js";
import { catchAsync } from "../utils/catchAsync.js";

const attendanceService = new AttendanceService();

export class AttendanceController {
  /**
   * CREATE: Mark attendance for a student
   */
  create = catchAsync(async (req, res) => {
    const data = await attendanceService.createAttendance(req.tenantId, {
      ...req.body,
      markedById: req.user.id,
    });
    res.status(201).json({ success: true, data });
  });

  /**
   * GET ALL: Retrieve all attendance with pagination and filters
   */
  getAll = catchAsync(async (req, res) => {
    const result = await attendanceService.getAllAttendance(req.tenantId, req.query);
    res.status(200).json({ success: true, ...result });
  });

  /**
   * GET ONE: Get specific attendance record
   */
  getOne = catchAsync(async (req, res) => {
    const data = await attendanceService.getAttendanceById(req.params.id, req.tenantId);
    res.status(200).json({ success: true, data });
  });

  /**
   * UPDATE: Update attendance status or mark as corrected
   */
  update = catchAsync(async (req, res) => {
    const data = await attendanceService.updateAttendance(req.params.id, req.tenantId, req.body);
    res.status(200).json({ success: true, data });
  });

  /**
   * DELETE: Remove attendance record
   */
  delete = catchAsync(async (req, res) => {
    const data = await attendanceService.deleteAttendance(req.params.id, req.tenantId);
    res.status(200).json({ success: true, ...data });
  });

  /**
   * SEARCH: Search attendance records by student name or remarks
   */
  search = catchAsync(async (req, res) => {
    const result = await attendanceService.searchAttendance(req.tenantId, req.query);
    res.status(200).json({
      success: true,
      results: result.data.length,
      ...result,
    });
  });

  /**
   * GET SUMMARY: Get attendance summary for a student
   */
  getStudentSummary = catchAsync(async (req, res) => {
    const { studentId } = req.params;
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: "startDate and endDate are required",
      });
    }

    const data = await attendanceService.getStudentAttendanceSummary(
      studentId,
      startDate,
      endDate,
      req.tenantId
    );

    res.status(200).json({ success: true, data });
  });

  /**
   * GET SECTION SUMMARY: Get attendance summary for a section
   */
  getSectionSummary = catchAsync(async (req, res) => {
    const { sectionId } = req.params;
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: "startDate and endDate are required",
      });
    }

    const data = await attendanceService.getSectionAttendanceSummary(
      sectionId,
      startDate,
      endDate,
      req.tenantId
    );

    res.status(200).json({ success: true, data });
  });

  /**
   * GET DATE ATTENDANCE: Get all attendance for a specific date
   */
  getDateAttendance = catchAsync(async (req, res) => {
    const { date } = req.params;
    const page = req.query.page || 1;
    const limit = req.query.limit || 10;

    if (!date) {
      return res.status(400).json({
        success: false,
        message: "Date parameter is required",
      });
    }

    const data = await attendanceService.getAttendanceForDate(date, req.tenantId, page, limit);
    res.status(200).json({ success: true, ...data });
  });

  /**
   * GET UNCORRECTED: Get all attendance that needs correction
   */
  getUncorrected = catchAsync(async (req, res) => {
    const page = req.query.page || 1;
    const limit = req.query.limit || 10;

    const result = await attendanceService.getUncorrectedAttendance(req.tenantId, page, limit);
    res.status(200).json({ success: true, ...result });
  });

  /**
   * BULK MARK: Mark attendance for multiple students at once
   */
  bulkMark = catchAsync(async (req, res) => {
    const data = await attendanceService.bulkMarkAttendance(req.tenantId, {
      ...req.body,
      markedById: req.user.id,
    });

    res.status(201).json({ success: true, ...data });
  });
}
