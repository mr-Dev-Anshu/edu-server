import { AttendancePeriodRepository } from "../repositories/attendancePeriod.repository.js";
import { StudentRepository } from "../repositories/student.repository.js";
import { AppError } from "../utils/AppError.js";
import sequelize from "../config/db.js";
import { BaseService } from "./base.service.js";
import { Op } from "sequelize";

const attendancePeriodRepo = new AttendancePeriodRepository();
const studentRepo = new StudentRepository();

export class AttendancePeriodService extends BaseService {
  constructor() {
    super(attendancePeriodRepo);
  }

  /**
   * CREATE ATTENDANCE PERIOD: Mark student attendance for a specific period/slot
   */
  async createAttendancePeriod(tenantId, payload) {
    const { studentId, timetableSlotId, date, status, markedById, remarks } = payload;

    // Validate required fields
    if (!studentId) throw new AppError("Student ID is required", 400);
    if (!timetableSlotId) throw new AppError("Timetable Slot ID is required", 400);
    if (!date) throw new AppError("Date is required", 400);
    if (!status) throw new AppError("Status is required", 400);

    // Validate status enum
    const validStatuses = ["present", "absent", "late"];
    if (!validStatuses.includes(status)) {
      throw new AppError(`Status must be one of: ${validStatuses.join(", ")}`, 400);
    }

    // Validate student exists
    const student = await studentRepo.findById(studentId, tenantId);
    if (!student) throw new AppError("Student not found", 404);

    // Check if period attendance already exists for this student, slot, and date
    const existing = await attendancePeriodRepo.findByStudentSlotAndDate(
      studentId,
      timetableSlotId,
      date,
      tenantId
    );
    if (existing) {
      throw new AppError(
        "Period attendance already marked for this student and slot on this date",
        400
      );
    }

    // Create attendance period record
    const attendancePeriod = await attendancePeriodRepo.create({
      tenantId,
      studentId,
      timetableSlotId,
      date,
      status,
      markedById,
      remarks: remarks?.trim() || null,
    });

    return this.formatAttendancePeriodResponse(attendancePeriod);
  }

  /**
   * GET ALL ATTENDANCE PERIODS: Retrieve with pagination and filters
   */
  async getAllAttendancePeriods(tenantId, query) {
    const page = Number.parseInt(query.page, 10) > 0 ? Number.parseInt(query.page, 10) : 1;
    const limit = Number.parseInt(query.limit, 10) > 0 ? Number.parseInt(query.limit, 10) : 10;

    const filters = { tenantId };

    if (query.studentId) filters.studentId = query.studentId;
    if (query.timetableSlotId) filters.timetableSlotId = query.timetableSlotId;
    if (query.status) filters.status = query.status;

    // Date range filter
    if (query.startDate && query.endDate) {
      filters.date = { [Op.between]: [query.startDate, query.endDate] };
    } else if (query.date) {
      filters.date = query.date;
    }

    const result = await attendancePeriodRepo.findWithPagination(tenantId, filters, page, limit);

    return {
      total: result.total,
      page: result.page,
      limit: result.limit,
      pages: result.pages,
      data: result.data.map((item) => this.formatAttendancePeriodResponse(item)),
    };
  }

  /**
   * GET SINGLE ATTENDANCE PERIOD: Get specific record
   */
  async getAttendancePeriodById(id, tenantId) {
    const attendancePeriod = await attendancePeriodRepo.findById(id, tenantId, {
      include: attendancePeriodRepo.getDefaultIncludes(),
    });

    if (!attendancePeriod) throw new AppError("Attendance period record not found", 404);

    return this.formatAttendancePeriodResponse(attendancePeriod);
  }

  /**
   * UPDATE ATTENDANCE PERIOD: Update status or remarks
   */
  async updateAttendancePeriod(id, tenantId, payload) {
    const attendancePeriod = await attendancePeriodRepo.findById(id, tenantId, {
      include: attendancePeriodRepo.getDefaultIncludes(),
    });

    if (!attendancePeriod) throw new AppError("Attendance period record not found", 404);

    const updates = {};

    if (payload.status) {
      const validStatuses = ["present", "absent", "late"];
      if (!validStatuses.includes(payload.status)) {
        throw new AppError(`Status must be one of: ${validStatuses.join(", ")}`, 400);
      }
      updates.status = payload.status;
    }

    if (payload.remarks !== undefined) {
      updates.remarks = payload.remarks?.trim() || null;
    }

    const updated = await attendancePeriodRepo.update(id, tenantId, updates);

    return this.formatAttendancePeriodResponse(updated);
  }

  /**
   * DELETE ATTENDANCE PERIOD: Remove record
   */
  async deleteAttendancePeriod(id, tenantId) {
    const attendancePeriod = await attendancePeriodRepo.findById(id, tenantId);
    if (!attendancePeriod) throw new AppError("Attendance period record not found", 404);

    await attendancePeriodRepo.delete(id, tenantId);

    return {
      message: "Attendance period record deleted successfully",
      deletedId: id,
    };
  }

  /**
   * SEARCH ATTENDANCE PERIOD: Search by student name or remarks
   */
  async searchAttendancePeriod(tenantId, query) {
    const page = Number.parseInt(query.page, 10) > 0 ? Number.parseInt(query.page, 10) : 1;
    const limit = Number.parseInt(query.limit, 10) > 0 ? Number.parseInt(query.limit, 10) : 10;
    const searchTerm = query.q || query.search || "";

    if (searchTerm.length < 2) {
      throw new AppError("Search term must be at least 2 characters", 400);
    }

    const result = await attendancePeriodRepo.searchAttendance(tenantId, searchTerm, page, limit);

    return {
      total: result.total,
      page: result.page,
      limit: result.limit,
      pages: result.pages,
      data: result.data.map((item) => this.formatAttendancePeriodResponse(item)),
    };
  }

  /**
   * GET ATTENDANCE PERIOD FOR DATE: Get all period attendance for a specific date
   */
  async getAttendancePeriodForDate(date, tenantId, page = 1, limit = 20) {
    const result = await attendancePeriodRepo.findAllForDate(date, tenantId, page, limit);

    return {
      total: result.total,
      page: result.page,
      limit: result.limit,
      pages: result.pages,
      date,
      data: result.data.map((item) => this.formatAttendancePeriodResponse(item)),
    };
  }

  /**
   * GET STUDENT ATTENDANCE PERIOD SUMMARY: Get stats for a student
   */
  async getStudentAttendancePeriodSummary(studentId, startDate, endDate, tenantId) {
    const student = await studentRepo.findById(studentId, tenantId);
    if (!student) throw new AppError("Student not found", 404);

    const records = await attendancePeriodRepo.findByStudentInPeriod(
      studentId,
      startDate,
      endDate,
      tenantId
    );

    const summary = await attendancePeriodRepo.getStudentAttendanceSummary(
      studentId,
      startDate,
      endDate,
      tenantId
    );

    const totalClasses = records.length;
    const presentClasses = summary.present || 0;
    const presentPercentage = totalClasses > 0 ? (presentClasses / totalClasses) * 100 : 0;

    return {
      studentId,
      period: { startDate, endDate },
      totalClasses,
      summary,
      presentPercentage: parseFloat(presentPercentage.toFixed(2)),
      records: records.map((r) => this.formatAttendancePeriodResponse(r)),
    };
  }

  /**
   * GET TIMETABLE SLOT ATTENDANCE SUMMARY: Get stats for a slot
   */
  async getTimetableSlotAttendanceSummary(timetableSlotId, startDate, endDate, tenantId) {
    const records = await attendancePeriodRepo.findByTimetableSlotInPeriod(
      timetableSlotId,
      startDate,
      endDate,
      tenantId
    );

    const summary = await attendancePeriodRepo.getTimetableSlotAttendanceSummary(
      timetableSlotId,
      startDate,
      endDate,
      tenantId
    );

    return {
      timetableSlotId,
      period: { startDate, endDate },
      summary,
      totalRecords: records.length,
      records: records.slice(0, 20).map((r) => this.formatAttendancePeriodResponse(r)),
    };
  }

  /**
   * GET DAILY ATTENDANCE SUMMARY: Get all attendance for a date by slot/period
   */
  async getDailyAttendanceSummary(date, tenantId) {
    const records = await attendancePeriodRepo.model.findAll({
      where: { date, tenantId },
      include: attendancePeriodRepo.getDefaultIncludes(),
      order: [["createdAt", "ASC"]],
    });

    // Group by timetable slot
    const groupedBySlot = records.reduce((acc, record) => {
      const slotId = record.timetableSlotId;
      if (!acc[slotId]) {
        acc[slotId] = {
          slot: record.timetableSlot,
          records: [],
        };
      }
      acc[slotId].records.push(record);
      return acc;
    }, {});

    // Calculate summary
    const summary = Object.entries(groupedBySlot).map(([slotId, data]) => {
      const statuses = { present: 0, absent: 0, late: 0 };
      data.records.forEach((r) => {
        statuses[r.status]++;
      });
      return {
        slotId,
        slot: data.slot,
        total: data.records.length,
        statuses,
        records: data.records.map((r) => this.formatAttendancePeriodResponse(r)),
      };
    });

    return {
      date,
      totalRecords: records.length,
      summary,
    };
  }

  /**
   * BULK MARK ATTENDANCE PERIOD: Mark attendance for multiple students at once
   */
  async bulkMarkAttendancePeriod(tenantId, payload) {
    const { records, markedById } = payload;

    if (!Array.isArray(records) || records.length === 0) {
      throw new AppError("No attendance records provided", 400);
    }

    const transaction = await sequelize.transaction();

    try {
      const createdRecords = [];

      for (const record of records) {
        const { studentId, timetableSlotId, date, status, remarks } = record;

        // Validate student exists
        const student = await studentRepo.findById(studentId, tenantId);
        if (!student) continue; // Skip invalid student

        // Check if period attendance already exists
        const existing = await attendancePeriodRepo.findByStudentSlotAndDate(
          studentId,
          timetableSlotId,
          date,
          tenantId
        );

        if (!existing) {
          const created = await attendancePeriodRepo.create(
            {
              tenantId,
              studentId,
              timetableSlotId,
              date,
              status,
              markedById,
              remarks: remarks?.trim() || null,
            },
            { transaction }
          );

          createdRecords.push(created);
        }
      }

      await transaction.commit();

      return {
        created: createdRecords.length,
        total: records.length,
        data: createdRecords.map((r) => this.formatAttendancePeriodResponse(r)),
      };
    } catch (error) {
      if (!transaction.finished) await transaction.rollback();
      throw error;
    }
  }

  /**
   * Format attendance period response with populated relations
   */
  formatAttendancePeriodResponse(attendancePeriod) {
    if (!attendancePeriod) return null;

    const formatted = {
      id: attendancePeriod.id,
      student: attendancePeriod.student
        ? {
            id: attendancePeriod.student.id,
            name: `${attendancePeriod.student.user?.firstName || ""} ${attendancePeriod.student.user?.lastName || ""}`.trim(),
            email: attendancePeriod.student.user?.email,
          }
        : null,
      timetableSlot: attendancePeriod.timetableSlot
        ? {
            id: attendancePeriod.timetableSlot.id,
            period: attendancePeriod.timetableSlot.period,
            startTime: attendancePeriod.timetableSlot.startTime,
            endTime: attendancePeriod.timetableSlot.endTime,
          }
        : null,
      date: attendancePeriod.date,
      status: attendancePeriod.status,
      markedBy: attendancePeriod.markedBy
        ? {
            id: attendancePeriod.markedBy.id,
            name: `${attendancePeriod.markedBy.firstName} ${attendancePeriod.markedBy.lastName}`,
          }
        : null,
      remarks: attendancePeriod.remarks,
      createdAt: attendancePeriod.createdAt,
      updatedAt: attendancePeriod.updatedAt,
    };

    return formatted;
  }
}
