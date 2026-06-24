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

// Create: Mark period attendance
router.post("/", identifyUser, checkPermission("create:attendance-periods"), createAttendancePeriodValidator, ctrl.create);

// Get all period attendance records
router.get("/", identifyUser, ctrl.getAll);

// Search period attendance records
router.get("/search", identifyUser, searchAttendancePeriodValidator, ctrl.search);

// Bulk mark period attendance
router.post("/bulk-mark", identifyUser, checkPermission("create:attendance-periods"), bulkMarkAttendancePeriodValidator, ctrl.bulkMark);

// Get period attendance for a specific date
router.get("/date/:date", identifyUser, dateParamValidator, ctrl.getDateAttendance);

// Get period attendance daily summary for a date
router.get("/date/:date/daily-summary", identifyUser, dateParamValidator, ctrl.getDailySummary);

// Get student period attendance summary
router.get("/student/:studentId/summary", identifyUser, studentIdValidator, dateRangeValidator, ctrl.getStudentSummary);

// Get timetable slot period attendance summary
router.get("/timetable-slot/:timetableSlotId/summary", identifyUser, timetableSlotIdValidator, dateRangeValidator, ctrl.getTimetableSlotSummary);

// Get specific period attendance record by ID
router.get("/:id", identifyUser, attendancePeriodIdValidator, ctrl.getOne);

// Update period attendance record by ID
router.patch("/:id", identifyUser, checkPermission("update:attendance-periods"), attendancePeriodIdValidator, updateAttendancePeriodValidator, ctrl.update);

// Delete period attendance record by ID
router.delete("/:id", identifyUser, checkPermission("delete:attendance-periods"), attendancePeriodIdValidator, ctrl.delete);

export default router;
