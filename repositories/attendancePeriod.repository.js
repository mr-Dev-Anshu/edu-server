import { Op, fn, col } from "sequelize";
import { AttendancePeriod, Student, TimetableSlot, User } from "../models/index.js";
import { BaseRepository } from "./base.repository.js";

export class AttendancePeriodRepository extends BaseRepository {
  constructor() {
    super(AttendancePeriod);
  }

  /**
   * Find period attendance by student and date
   */
  async findByStudentAndDate(studentId, date, tenantId) {
    return await this.model.findAll({
      where: { studentId, date, tenantId },
      include: this.getDefaultIncludes(),
      order: [["createdAt", "ASC"]],
    });
  }

  /**
   * Find period attendance by student, slot, and date (unique check)
   */
  async findByStudentSlotAndDate(studentId, timetableSlotId, date, tenantId, options = {}) {
    return await this.model.findOne({
      where: { studentId, timetableSlotId, date, tenantId },
      include: this.getDefaultIncludes(),
      ...options,
    });
  }

  /**
   * Find period attendance for a student in a date range
   */
  async findByStudentInPeriod(studentId, startDate, endDate, tenantId) {
    return await this.model.findAll({
      where: {
        studentId,
        tenantId,
        date: { [Op.between]: [startDate, endDate] },
      },
      include: this.getDefaultIncludes(),
      order: [["date", "ASC"]],
    });
  }

  /**
   * Find period attendance for a timetable slot on a date
   */
  async findByTimetableSlotAndDate(timetableSlotId, date, tenantId) {
    return await this.model.findAll({
      where: { timetableSlotId, date, tenantId },
      include: this.getDefaultIncludes(),
      order: [["createdAt", "DESC"]],
    });
  }

  /**
   * Find period attendance for a timetable slot in a date range
   */
  async findByTimetableSlotInPeriod(timetableSlotId, startDate, endDate, tenantId) {
    return await this.model.findAll({
      where: {
        timetableSlotId,
        tenantId,
        date: { [Op.between]: [startDate, endDate] },
      },
      include: this.getDefaultIncludes(),
      order: [["date", "ASC"]],
    });
  }

  /**
   * Get period attendance with pagination and filters
   */
  async findWithPagination(tenantId, filters = {}, page = 1, limit = 10) {
    const offset = (page - 1) * limit;
    const where = { tenantId, ...filters };

    const { count, rows } = await this.model.findAndCountAll({
      where,
      include: this.getDefaultIncludes(),
      offset,
      limit,
      order: [["date", "DESC"]],
      distinct: true,
    });

    return {
      total: count,
      page,
      limit,
      pages: Math.ceil(count / limit),
      data: rows,
    };
  }

  /**
   * Find period attendance by status
   */
  async findByStatus(status, tenantId, page = 1, limit = 10) {
    const offset = (page - 1) * limit;

    const { count, rows } = await this.model.findAndCountAll({
      where: { status, tenantId },
      include: this.getDefaultIncludes(),
      offset,
      limit,
      order: [["date", "DESC"]],
      distinct: true,
    });

    return {
      total: count,
      page,
      limit,
      pages: Math.ceil(count / limit),
      data: rows,
    };
  }

  /**
   * Check if period attendance already exists for student on slot and date
   */
  async existsForStudentSlotOnDate(studentId, timetableSlotId, date, tenantId) {
    const count = await this.model.count({
      where: { studentId, timetableSlotId, date, tenantId },
    });
    return count > 0;
  }

  /**
   * Get student period attendance summary
   */
  async getStudentAttendanceSummary(studentId, startDate, endDate, tenantId) {
    const summary = await this.model.findAll({
      attributes: [
        "status",
        [fn("COUNT", col("id")), "count"],
      ],
      where: {
        studentId,
        tenantId,
        date: { [Op.between]: [startDate, endDate] },
      },
      group: ["status"],
      raw: true,
    });

    return summary.reduce(
      (acc, record) => {
        acc[record.status] = record.count;
        return acc;
      },
      { present: 0, absent: 0, late: 0 }
    );
  }

  /**
   * Get timetable slot attendance summary
   */
  async getTimetableSlotAttendanceSummary(timetableSlotId, startDate, endDate, tenantId) {
    const summary = await this.model.findAll({
      attributes: [
        "status",
        [fn("COUNT", col("id")), "count"],
      ],
      where: {
        timetableSlotId,
        tenantId,
        date: { [Op.between]: [startDate, endDate] },
      },
      group: ["status"],
      raw: true,
    });

    return summary.reduce(
      (acc, record) => {
        acc[record.status] = record.count;
        return acc;
      },
      { present: 0, absent: 0, late: 0 }
    );
  }

  /**
   * Get all period attendance for a date (for marking bulk)
   */
  async findAllForDate(date, tenantId, page = 1, limit = 20) {
    const offset = (page - 1) * limit;

    const { count, rows } = await this.model.findAndCountAll({
      where: { date, tenantId },
      include: this.getDefaultIncludes(),
      offset,
      limit,
      order: [["createdAt", "DESC"]],
      distinct: true,
    });

    return {
      total: count,
      page,
      limit,
      pages: Math.ceil(count / limit),
      data: rows,
    };
  }

  /**
   * Search period attendance records
   */
  async searchAttendance(tenantId, searchTerm, page = 1, limit = 10) {
    const offset = (page - 1) * limit;

    const { count, rows } = await this.model.findAndCountAll({
      where: {
        tenantId,
        [Op.or]: [
          { "$student.user.firstName$": { [Op.iLike]: `%${searchTerm}%` } },
          { "$student.user.lastName$": { [Op.iLike]: `%${searchTerm}%` } },
          { remarks: { [Op.iLike]: `%${searchTerm}%` } },
        ],
      },
      include: this.getDefaultIncludes(),
      subQuery: false,
      offset,
      limit,
      order: [["date", "DESC"]],
      distinct: true,
    });

    return {
      total: count,
      page,
      limit,
      pages: Math.ceil(count / limit),
      data: rows,
    };
  }

  /**
   * Get default includes for period attendance queries
   */
  getDefaultIncludes() {
    return [
      {
        association: "student",
        attributes: ["id", "userId"],
        include: [
          {
            association: "user",
            attributes: ["id", "firstName", "lastName", "email"],
          },
        ],
      },
      {
        association: "timetableSlot",
        attributes: ["id", "startTime", "endTime", "period"],
      },
      {
        association: "markedBy",
        attributes: ["id", "firstName", "lastName", "email"],
      },
    ];
  }
}
