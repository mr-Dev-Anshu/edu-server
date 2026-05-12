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

    // Reload with full associations
    const fullEnrollment = await enrollmentRepo.findWithDetails(enrollment.id, tenantId);
    return this.formatResponse(fullEnrollment);
  }

  // Get All
  async getAllEnrollments(tenantId, query) {
    const page = parseInt(query.page, 10) || 1;
    const limit = parseInt(query.limit, 10) || 10;

    const filters = {};
    if (query.classId) filters.classId = query.classId;
    if (query.sectionId) filters.sectionId = query.sectionId;
    if (query.studentId) filters.studentId = query.studentId;
    if (query.academicYearId) filters.academicYearId = query.academicYearId;
  if (query.enrollmentStatus) filters.enrollmentStatus = query.enrollmentStatus;
  if (query.search && query.search.trim() !== "") filters.search = query.search.trim();

    const result = await enrollmentRepo.findWithPagination(
      tenantId,
      filters,
      page,
      limit,
    );

    return {
      total: result.total,
      page: result.page,
      limit: result.limit,
      pages: result.pages,
      data: result.data.map((enrollment) => this.formatResponse(enrollment)),
    };
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

    // Reload with full associations
    const fullEnrollment = await enrollmentRepo.findWithDetails(id, tenantId);
    return this.formatResponse(fullEnrollment);
  }

  // Delete
  async deleteEnrollment(id, tenantId) {
    const data = await enrollmentRepo.findWithDetails(id, tenantId);

    await enrollmentRepo.delete(id, tenantId);

    return {
      message: "Enrollment deleted successfully",
      data: this.formatResponse(data),
    };
  }

  // Clean Response
  formatResponse(data) {
    const student = data.student?.get
      ? data.student.get({ plain: true })
      : data.student;

    return {
      id: data.id,
      rollNumber: data.rollNumber,
      enrollmentStatus: data.enrollmentStatus,
      isCurrent: data.isCurrent,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      student: student
        ? {
            id: student.id,
            admissionNumber: student.admissionNumber,
            rollNumber: student.rollNumber,
            firstName: student.firstName,
            middleName: student.middleName,
            lastName: student.lastName,
            dateOfBirth: student.dateOfBirth,
            gender: student.gender,
            bloodGroup: student.bloodGroup,
            nationality: student.nationality,
            religion: student.religion,
            caste: student.caste,
            category: student.category,
            aadharNumber: student.aadharNumber,
            photoUrl: student.photoUrl,
            enrollmentDate: student.enrollmentDate,
            previousSchool: student.previousSchool,
            previousClass: student.previousClass,
            tcNumber: student.tcNumber,
            siblingId: student.siblingId,
            isStaffWard: student.isStaffWard,
            status: student.status,
            transportRequired: student.transportRequired,
            hostelRequired: student.hostelRequired,
            medicalConditions: student.medicalConditions,
            emergencyContactName: student.emergencyContactName,
            emergencyContactPhone: student.emergencyContactPhone,
            address: student.address,
            city: student.city,
            pincode: student.pincode,
            customFields: student.customFields,
            metadata: student.metadata,
            createdAt: student.createdAt,
            updatedAt: student.updatedAt,
            user: student.user
              ? {
                  id: student.user.id,
                  firstName: student.user.firstName,
                  lastName: student.user.lastName,
                  email: student.user.email,
                  phone: student.user.phone,
                  status: student.user.status,
                }
              : undefined,
            tenant: student.organization
              ? {
                  id: student.organization.id,
                  name: student.organization.name,
                  organizationType: student.organization.organizationType,
                  officialEmail: student.organization.officialEmail,
                  subdomain: student.organization.subdomain,
                }
              : undefined,
            guardians: Array.isArray(student.guardians)
              ? student.guardians.map((guardian) => ({
                  id: guardian.id,
                  tenantId: guardian.tenantId,
                  userId: guardian.userId,
                  relation: guardian.relation,
                  phone: guardian.phone,
                  occupation: guardian.occupation,
                  isPrimaryContact: guardian.isPrimaryContact,
                  relationType: guardian.relationType ?? guardian.StudentGuardianMap?.relationType,
                  isPrimary: guardian.isPrimary ?? guardian.StudentGuardianMap?.isPrimary,
                  canPickup: guardian.canPickup ?? guardian.StudentGuardianMap?.canPickup,
                  user: guardian.user
                    ? {
                        id: guardian.user.id,
                        firstName: guardian.user.firstName,
                        lastName: guardian.user.lastName,
                        email: guardian.user.email,
                        phone: guardian.user.phone,
                      }
                    : undefined,
                  map: guardian.StudentGuardianMap
                    ? {
                        id: guardian.StudentGuardianMap.id,
                        relationType: guardian.StudentGuardianMap.relationType,
                        isPrimary: guardian.StudentGuardianMap.isPrimary,
                        canPickup: guardian.StudentGuardianMap.canPickup,
                      }
                    : undefined,
                }))
              : [],
          }
        : undefined,
      section: data.section
        ? {
            id: data.section.id,
            name: data.section.name,
            capacity: data.section.capacity,
            class: data.section.class
              ? {
                  id: data.section.class.id,
                  name: data.section.class.name,
                  numericLevel: data.section.class.numericLevel,
                }
              : undefined,
          }
        : undefined,
      academicYear: data.academicYear
        ? {
            id: data.academicYear.id,
            name: data.academicYear.name,
            isCurrent: data.academicYear.isCurrent,
            startDate: data.academicYear.startDate,
            endDate: data.academicYear.endDate,
          }
        : undefined,
    };
  }
}
