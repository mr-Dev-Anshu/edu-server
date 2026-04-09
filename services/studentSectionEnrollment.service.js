import { StudentSectionEnrollmentRepository } from "../repositories/studentSectionEnrollment.repository.js";
import { SectionRepository } from "../repositories/Academic/section.repository.js";
import { AcademicYearRepository } from "../repositories/Academic/academicYear.repository.js";
import { AppError } from "../utils/AppError.js";

const enrollmentRepo = new StudentSectionEnrollmentRepository();
const sectionRepo = new SectionRepository();
const academicYearRepo = new AcademicYearRepository();

export class StudentSectionEnrollmentService {

  // Enroll Student
  async enrollStudent(payload) {
    const {
      tenantId,
      studentId,
      sectionId,
      academicYearId,
      rollNumber,
      enrollmentStatus,
    } = payload;

    // Check Academic Year exists
    const year = await academicYearRepo.findById(academicYearId, tenantId);
    if (!year) throw new AppError("Academic year not found", 404);

    // Check Section exists
    const section = await sectionRepo.findById(sectionId, tenantId);
    if (!section) throw new AppError("Section not found", 404);

    // UNIQUE RULE → already enrolled?
    const existing = await enrollmentRepo.findByStudentAndYear(
      studentId,
      academicYearId,
      tenantId
    );

    if (existing) {
      throw new AppError("Student already enrolled in this academic year", 400);
    }

    // OPTIONAL (PRO): Capacity check
    const totalStudents = await enrollmentRepo.findBySection(sectionId, tenantId);
    if (totalStudents.length >= section.capacity) {
      throw new AppError("Section capacity full", 400);
    }

    // OPTIONAL (PRO): Auto roll number
    let finalRoll = rollNumber;
    if (!rollNumber) {
      finalRoll = totalStudents.length + 1;
    }

    const enrollment = await enrollmentRepo.create({
      tenantId,
      studentId,
      sectionId,
      academicYearId,
      rollNumber: finalRoll,
      enrollmentStatus: enrollmentStatus || "regular",
      isCurrent: true,
    });

    return this.formatResponse(enrollment);
  }

  // Get All
  async getAllEnrollments(tenantId, query) {
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 10;

    const filters = {};
    if (query.sectionId) filters.sectionId = query.sectionId;
    if (query.studentId) filters.studentId = query.studentId;
    if (query.academicYearId) filters.academicYearId = query.academicYearId;

    return await enrollmentRepo.findWithPagination(
      tenantId,
      filters,
      page,
      limit
    );
  }

  // Get One
  async getEnrollmentById(id, tenantId) {
    const data = await enrollmentRepo.findWithDetails(id, tenantId);
    if (!data) throw new AppError("Enrollment not found", 404);

    return this.formatResponse(data);
  }

  // Update (transfer / change section)
  async updateEnrollment(id, tenantId, updateData) {
    const existing = await enrollmentRepo.findById(id, tenantId);

    // If changing section → check capacity
    if (updateData.sectionId && updateData.sectionId !== existing.sectionId) {
      const section = await sectionRepo.findById(updateData.sectionId, tenantId);

      const students = await enrollmentRepo.findBySection(
        updateData.sectionId,
        tenantId
      );

      if (students.length >= section.capacity) {
        throw new AppError("Target section is full", 400);
      }
    }

    const updated = await enrollmentRepo.update(id, tenantId, {
      ...(updateData.sectionId && { sectionId: updateData.sectionId }),
      ...(updateData.rollNumber && { rollNumber: updateData.rollNumber }),
      ...(updateData.enrollmentStatus && { enrollmentStatus: updateData.enrollmentStatus }),
      ...(updateData.isCurrent !== undefined && { isCurrent: updateData.isCurrent }),
    });

    return this.formatResponse(updated);
  }

  // Delete
  async deleteEnrollment(id, tenantId) {
    const data = await enrollmentRepo.findById(id, tenantId);

    await enrollmentRepo.delete(id, tenantId);

    return {
      message: "Enrollment deleted successfully",
      data: this.formatResponse(data),
    };
  }

  // Clean Response
  formatResponse(data) {
    return {
      id: data.id,
      studentId: data.studentId,
      sectionId: data.sectionId,
      academicYearId: data.academicYearId,
      rollNumber: data.rollNumber,
      enrollmentStatus: data.enrollmentStatus,
      isCurrent: data.isCurrent,
      createdAt: data.createdAt,
    };
  }
}