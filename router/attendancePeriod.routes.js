import express from "express";
import { AttendancePeriodController } from "../controllers/attendancePeriod.controller.js";
import {
  createAttendancePeriodValidator,
  updateAttendancePeriodValidator,
  attendancePeriodIdValidator,
  studentIdValidator,
  timetableSlotIdValidator,
  dateParamValidator,
  bulkMarkAttendancePeriodValidator,
  searchAttendancePeriodValidator,
  dateRangeValidator,
} from "../middlewares/validators/attendancePeriod.validator.js";
import {
  identifyUser,
  checkPermission,
} from "../middlewares/security/index.js";

const router = express.Router();
const ctrl = new AttendancePeriodController();

// ==========================================
// BASIC CRUD OPERATIONS
// ==========================================

/**
 * POST /api/attendance-periods
 * Create: Mark period attendance for a student
 * Permission: create:attendance-periods
 */
router.post( "/", identifyUser, checkPermission("create:attendance-periods"), createAttendancePeriodValidator, ctrl.create);

/**
 * GET /api/attendance-periods
 * Get All: Retrieve period attendance with pagination and filters
 */
router.get("/", identifyUser, ctrl.getAll);

/**
 * GET /api/attendance-periods/search
 * Search: Search period attendance records
 */
router.get( "/search", identifyUser, searchAttendancePeriodValidator, ctrl.search);

/**
 * GET /api/attendance-periods/:id
 * Get One: Get specific period attendance record
 */
router.get("/:id", identifyUser, attendancePeriodIdValidator, ctrl.getOne);

/**
 * PATCH /api/attendance-periods/:id
 * Update: Update period attendance status or remarks
 * Permission: update:attendance-periods
 */
router.patch( "/:id", identifyUser, checkPermission("update:attendance-periods"), attendancePeriodIdValidator, updateAttendancePeriodValidator, ctrl.update);

/**
 * DELETE /api/attendance-periods/:id
 * Delete: Remove period attendance record
 * Permission: delete:attendance-periods
 */
router.delete( "/:id", identifyUser, checkPermission("delete:attendance-periods"), attendancePeriodIdValidator, ctrl.delete);

// ==========================================
// BULK OPERATIONS
// ==========================================

/**
 * POST /api/attendance-periods/bulk-mark
 * Bulk Mark: Mark period attendance for multiple students at once
 * Permission: create:attendance-periods
 */
router.post( "/bulk-mark", identifyUser, checkPermission("create:attendance-periods"), bulkMarkAttendancePeriodValidator, ctrl.bulkMark);

// ==========================================
// DATE-BASED QUERIES
// ==========================================

/**
 * GET /api/attendance-periods/date/:date
 * Get Date Attendance: Get all period attendance for a specific date
 * Param: date (YYYY-MM-DD)
 */
router.get( "/date/:date", identifyUser, dateParamValidator, ctrl.getDateAttendance);

/**
 * GET /api/attendance-periods/date/:date/daily-summary
 * Get Daily Summary: Get all period attendance for a date grouped by slot
 * Param: date (YYYY-MM-DD)
 */
router.get( "/date/:date/daily-summary", identifyUser, dateParamValidator, ctrl.getDailySummary);

// ==========================================
// SUMMARY & ANALYTICS
// ==========================================

/**
 * GET /api/attendance-periods/student/:studentId/summary
 * Get Student Summary: Period attendance summary for a student
 * Query Params: startDate, endDate (required)
 */
router.get( "/student/:studentId/summary", identifyUser, studentIdValidator, dateRangeValidator, ctrl.getStudentSummary);

/**
 * GET /api/attendance-periods/timetable-slot/:timetableSlotId/summary
 * Get Timetable Slot Summary: Period attendance summary for a timetable slot
 * Query Params: startDate, endDate (required)
 */
router.get( "/timetable-slot/:timetableSlotId/summary", identifyUser, timetableSlotIdValidator, dateRangeValidator, ctrl.getTimetableSlotSummary);

export default router;
