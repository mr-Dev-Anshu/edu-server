import express from "express";
import { AttendanceController } from "../controllers/attendance.controller.js";
import {
  createAttendanceValidator,
  updateAttendanceValidator,
  attendanceIdValidator,
  studentIdValidator,
  sectionIdValidator,
  dateParamValidator,
  bulkMarkAttendanceValidator,
  searchAttendanceValidator,
  dateRangeValidator,
} from "../middlewares/validators/attendance.validator.js";
import { identifyUser, checkPermission } from "../middlewares/security/index.js";

const router = express.Router();
const ctrl = new AttendanceController();

// ==========================================
// BASIC CRUD OPERATIONS
// ==========================================

/**
 * POST /api/attendance
 * Create: Mark attendance for a student
 * Permission: create:attendance
 */
router.post( "/", identifyUser, checkPermission("create:attendance"), createAttendanceValidator, ctrl.create);

/**
 * GET /api/attendance
 * Get All: Retrieve attendance with pagination and filters
 */
router.get( "/", identifyUser, ctrl.getAll);

/**
 * GET /api/attendance/search
 * Search: Search attendance records by student name or remarks
 */
router.get( "/search", identifyUser, searchAttendanceValidator, ctrl.search);

/**
 * GET /api/attendance/:id
 * Get One: Get specific attendance record
 */
router.get( "/:id", identifyUser, attendanceIdValidator, ctrl.getOne);

/**
 * PATCH /api/attendance/:id
 * Update: Update attendance status or mark as corrected
 * Permission: update:attendance
 */
router.patch( "/:id", identifyUser, checkPermission("update:attendance"), attendanceIdValidator, updateAttendanceValidator, ctrl.update);

/**
 * DELETE /api/attendance/:id
 * Delete: Remove attendance record
 * Permission: delete:attendance
 */
router.delete( "/:id", identifyUser, checkPermission("delete:attendance"), attendanceIdValidator, ctrl.delete);

// ==========================================
// BULK OPERATIONS
// ==========================================

/**
 * POST /api/attendance/bulk-mark
 * Bulk Mark: Mark attendance for multiple students at once
 * Permission: create:attendance
 */
router.post( "/bulk-mark", identifyUser, checkPermission("create:attendance"), bulkMarkAttendanceValidator, ctrl.bulkMark);

// ==========================================
// SUMMARY & ANALYTICS
// ==========================================

/**
 * GET /api/attendance/student/:studentId/summary
 * Get Student Summary: Attendance summary for a student in a date range
 * Query Params: startDate, endDate (required)
 */
router.get( "/student/:studentId/summary", identifyUser, studentIdValidator, dateRangeValidator, ctrl.getStudentSummary);

/**
 * GET /api/attendance/section/:sectionId/summary
 * Get Section Summary: Attendance summary for an entire section
 * Query Params: startDate, endDate (required)
 */
router.get( "/section/:sectionId/summary", identifyUser, sectionIdValidator, dateRangeValidator, ctrl.getSectionSummary);

/**
 * GET /api/attendance/date/:date
 * Get Date Attendance: Get all attendance marked on a specific date
 * Param: date (YYYY-MM-DD)
 */
router.get( "/date/:date", identifyUser, dateParamValidator, ctrl.getDateAttendance);

/**
 * GET /api/attendance/uncorrected
 * Get Uncorrected: Get all attendance records that need correction
 */
router.get( "/uncorrected", identifyUser, ctrl.getUncorrected);

export default router;
