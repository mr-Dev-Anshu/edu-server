import { Op, fn, col } from "sequelize";
import { Attendance, Student, Section, AcademicYear, User } from "../models/index.js";
import { BaseRepository } from "./base.repository.js";

export class AttendanceRepository extends BaseRepository {
  constructor() {
    super(Attendance);
  }

  async findByIdWithRelations(id, tenantId) {
    return await this.findById(id, tenantId, {
      include: this.getDefaultIncludes(),
    });
  }

  async findManyByIdsWithRelations(ids, tenantId) {
    if (!Array.isArray(ids) || ids.length === 0) {
      return [];
    }

    return await this.model.findAll({
      where: { tenantId, id: ids },
      include: this.getDefaultIncludes(),
      order: [["createdAt", "DESC"]],
    });
  }

  /**
   * Find attendance by student and date
   */
  async findByStudentAndDate(studentId, date, tenantId, options = {}) {
    return await this.model.findOne({
      where: { studentId, date, tenantId },
      include: this.getDefaultIncludes(),
      ...options,
    });
  }

  /**
   * Find attendance records for a student in a specific period
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
   * Find attendance for a section on a specific date
   */
  async findBySectionAndDate(sectionId, date, tenantId) {
    return await this.model.findAll({
      where: { sectionId, date, tenantId },
      include: this.getDefaultIncludes(),
      order: [["createdAt", "DESC"]],
    });
  }

  /**
   * Find attendance for a section in a date range
   */
  async findBySectionInPeriod(sectionId, startDate, endDate, tenantId) {
    return await this.model.findAll({
      where: {
        sectionId,
        tenantId,
        date: { [Op.between]: [startDate, endDate] },
      },
      include: this.getDefaultIncludes(),
      order: [["date", "ASC"]],
    });
  }

  /**
   * Find attendance for entire academic year
   */
  async findByAcademicYear(academicYearId, tenantId, page = 1, limit = 10) {
    const offset = (page - 1) * limit;

    const { count, rows } = await this.model.findAndCountAll({
      where: { academicYearId, tenantId },
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
   * Get attendance with pagination and filters
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
   * Find attendance records by status
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
   * Check if attendance already exists for a student on a date
   */
  async existsForStudentOnDate(studentId, date, tenantId) {
    const count = await this.model.count({
      where: { studentId, date, tenantId },
    });
    return count > 0;
  }

  /**
   * Get attendance summary for a section
   */
  async getSectionAttendanceSummary(sectionId, startDate, endDate, tenantId) {
    const attendanceRecords = await this.model.findAll({
      attributes: [
        "status",
        [fn("COUNT", col("id")), "count"],
      ],
      where: {
        sectionId,
        tenantId,
        date: { [Op.between]: [startDate, endDate] },
      },
      group: ["status"],
      raw: true,
    });

    return attendanceRecords.reduce(
      (acc, record) => {
        acc[record.status] = record.count;
        return acc;
      },
      {}
    );
  }

  /**
   * Get student attendance summary
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
      { present: 0, absent: 0, late: 0, half_day: 0, on_leave: 0, holiday: 0 }
    );
  }

  /**
   * Get uncorrected attendance records
   */
  async findUncorrected(tenantId, page = 1, limit = 10) {
    const offset = (page - 1) * limit;

    const { count, rows } = await this.model.findAndCountAll({
      where: { tenantId, isCorrected: false },
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
   * Search attendance records
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
   * Get default includes for attendance queries
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
        association: "section",
        attributes: ["id", "name", "classId"],
      },
      {
        association: "academicYear",
        attributes: ["id", "name", "startDate", "endDate"],
      },
      {
        association: "markedBy",
        attributes: ["id", "firstName", "lastName", "email"],
      },
      {
        association: "correctedBy",
        attributes: ["id", "firstName", "lastName", "email"],
      },
    ];
  }
}
