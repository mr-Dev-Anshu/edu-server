import { StudentSectionEnrollmentRepository } from "../repositories/studentSectionEnrollment.repository.js";
import { SectionRepository } from "../repositories/Academic/section.repository.js";
import { AcademicYearRepository } from "../repositories/Academic/academicYear.repository.js";
import { StudentRepository } from "../repositories/student.repository.js";
import { AppError } from "../utils/AppError.js";

const enrollmentRepo = new StudentSectionEnrollmentRepository();
const sectionRepo = new SectionRepository();
const academicYearRepo = new AcademicYearRepository();
const studentRepo = new StudentRepository();

export class StudentSectionEnrollmentService {
  // Enroll Student
  async enrollStudent(tenantId, payload) {
    const {
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

    // Ensure section belongs to the chosen academic year
    if (section.academicYearId !== academicYearId) {
      throw new AppError(
        "Section does not belong to the provided academic year",
        400,
      );
    }

    // Check Student exists in tenant
    await studentRepo.findById(studentId, tenantId);

    // UNIQUE RULE → already enrolled?
    const existing = await enrollmentRepo.findByStudentAndYear(
      studentId,
      academicYearId,
      tenantId,
    );

    if (existing) {
      throw new AppError("Student already enrolled in this academic year", 400);
    }

    // OPTIONAL (PRO): Capacity check
    const enrolledCount = await enrollmentRepo.countBySection(
      sectionId,
      tenantId,
    );
    if (enrolledCount >= section.capacity) {
      throw new AppError("Section capacity full", 400);
    }

    let finalRoll = rollNumber;
    if (finalRoll === undefined || finalRoll === null) {
      finalRoll = enrolledCount + 1;
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
      limit,
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

    // If changing section → check capacity and academic year consistency
    if (
      updateData.sectionId !== undefined &&
      updateData.sectionId !== existing.sectionId
    ) {
      const section = await sectionRepo.findById(
        updateData.sectionId,
        tenantId,
      );
      if (section.academicYearId !== existing.academicYearId) {
        throw new AppError(
          "Cannot move enrollment to a section from a different academic year",
          400,
        );
      }

      const enrolledCount = await enrollmentRepo.countBySection(
        updateData.sectionId,
        tenantId,
      );

      if (enrolledCount >= section.capacity) {
        throw new AppError("Target section is full", 400);
      }
    }

    const updated = await enrollmentRepo.update(id, tenantId, {
      ...(updateData.sectionId !== undefined && {
        sectionId: updateData.sectionId,
      }),
      ...(updateData.rollNumber !== undefined && {
        rollNumber: updateData.rollNumber,
      }),
      ...(updateData.enrollmentStatus !== undefined && {
        enrollmentStatus: updateData.enrollmentStatus,
      }),
      ...(updateData.isCurrent !== undefined && {
        isCurrent: updateData.isCurrent,
      }),
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
