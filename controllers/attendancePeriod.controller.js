import { AttendancePeriodService } from "../services/attendancePeriod.service.js";
import { catchAsync } from "../utils/catchAsync.js";

const attendancePeriodService = new AttendancePeriodService();

export class AttendancePeriodController {
  /**
   * CREATE: Mark attendance for a specific period/slot
   */
  create = catchAsync(async (req, res) => {
    const data = await attendancePeriodService.createAttendancePeriod(req.tenantId, req.body);
    res.status(201).json({ success: true, data });
  });

  /**
   * GET ALL: Retrieve all period attendance with pagination and filters
   */
  getAll = catchAsync(async (req, res) => {
    const result = await attendancePeriodService.getAllAttendancePeriods(req.tenantId, req.query);
    res.status(200).json({ success: true, ...result });
  });

  /**
   * GET ONE: Get specific period attendance record
   */
  getOne = catchAsync(async (req, res) => {
    const data = await attendancePeriodService.getAttendancePeriodById(
      req.params.id,
      req.tenantId
    );
    res.status(200).json({ success: true, data });
  });

  /**
   * UPDATE: Update period attendance status or remarks
   */
  update = catchAsync(async (req, res) => {
    const data = await attendancePeriodService.updateAttendancePeriod(
      req.params.id,
      req.tenantId,
      req.body
    );
    res.status(200).json({ success: true, data });
  });

  /**
   * DELETE: Remove period attendance record
   */
  delete = catchAsync(async (req, res) => {
    const data = await attendancePeriodService.deleteAttendancePeriod(req.params.id, req.tenantId);
    res.status(200).json({ success: true, ...data });
  });

  /**
   * SEARCH: Search period attendance records
   */
  search = catchAsync(async (req, res) => {
    const result = await attendancePeriodService.searchAttendancePeriod(req.tenantId, req.query);
    res.status(200).json({
      success: true,
      results: result.data.length,
      ...result,
    });
  });

  /**
   * GET DATE ATTENDANCE: Get all period attendance for a specific date
   */
  getDateAttendance = catchAsync(async (req, res) => {
    const { date } = req.params;
    const page = req.query.page || 1;
    const limit = req.query.limit || 20;

    if (!date) {
      return res.status(400).json({
        success: false,
        message: "Date parameter is required",
      });
    }

    const data = await attendancePeriodService.getAttendancePeriodForDate(
      date,
      req.tenantId,
      page,
      limit
    );
    res.status(200).json({ success: true, ...data });
  });

  /**
   * GET STUDENT SUMMARY: Get period attendance summary for a student
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

    const data = await attendancePeriodService.getStudentAttendancePeriodSummary(
      studentId,
      startDate,
      endDate,
      req.tenantId
    );

    res.status(200).json({ success: true, data });
  });

  /**
   * GET TIMETABLE SLOT SUMMARY: Get period attendance summary for a timetable slot
   */
  getTimetableSlotSummary = catchAsync(async (req, res) => {
    const { timetableSlotId } = req.params;
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: "startDate and endDate are required",
      });
    }

    const data = await attendancePeriodService.getTimetableSlotAttendanceSummary(
      timetableSlotId,
      startDate,
      endDate,
      req.tenantId
    );

    res.status(200).json({ success: true, data });
  });

  /**
   * GET DAILY SUMMARY: Get all period attendance for a date with grouping
   */
  getDailySummary = catchAsync(async (req, res) => {
    const { date } = req.params;

    if (!date) {
      return res.status(400).json({
        success: false,
        message: "Date parameter is required",
      });
    }

    const data = await attendancePeriodService.getDailyAttendanceSummary(date, req.tenantId);
    res.status(200).json({ success: true, data });
  });

  /**
   * BULK MARK: Mark period attendance for multiple students at once
   */
  bulkMark = catchAsync(async (req, res) => {
    const data = await attendancePeriodService.bulkMarkAttendancePeriod(req.tenantId, {
      ...req.body,
      markedById: req.user.id,
    });

    res.status(201).json({ success: true, ...data });
  });
}
