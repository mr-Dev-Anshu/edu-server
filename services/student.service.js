import { StudentRepository } from "../repositories/student.repository.js";
import { AppError } from "../utils/AppError.js";

const studentRepo = new StudentRepository();

export class StudentService {
  async createStudent(tenantId, payload) {
    const { userId, admissionNumber } = payload;

    const existingUser = await studentRepo.findByUserId(userId, tenantId);
    if (existingUser) {
      throw new AppError("A student profile already exists for this user", 400);
    }

    const existingAdmission = await studentRepo.findByAdmissionNumber(
      admissionNumber,
      tenantId,
    );
    if (existingAdmission) {
      throw new AppError("Admission number already exists for this tenant", 400);
    }

    const student = await studentRepo.create({
      tenantId,
      ...payload,
    });

    return this.formatStudentResponse(student);
  }

  async getAllStudents(tenantId, query) {
    const page = parseInt(query.page, 10) || 1;
    const limit = parseInt(query.limit, 10) || 10;

    const filters = {};
    if (query.status) filters.status = query.status;
    if (query.admissionNumber) filters.admissionNumber = query.admissionNumber;
    if (query.userId) filters.userId = query.userId;
    if (query.name) filters.name = query.name;

    return await studentRepo.findWithPagination(tenantId, filters, page, limit);
  }

  async getStudentById(id, tenantId) {
    const student = await studentRepo.findWithDetails(id, tenantId);
    if (!student) {
      throw new AppError("Student not found", 404);
    }

    return this.formatStudentResponse(student);
  }

  async updateStudent(id, tenantId, updateData) {
    if (updateData.userId !== undefined) {
      throw new AppError("userId cannot be updated", 400);
    }

    if (updateData.admissionNumber !== undefined) {
      const existingAdmission = await studentRepo.findByAdmissionNumber(
        updateData.admissionNumber,
        tenantId,
      );
      if (existingAdmission && existingAdmission.id !== id) {
        throw new AppError("Admission number already exists for this tenant", 400);
      }
    }

    const updated = await studentRepo.update(id, tenantId, {
      ...(updateData.admissionNumber !== undefined
        ? { admissionNumber: updateData.admissionNumber }
        : {}),
      ...(updateData.rollNumber !== undefined ? { rollNumber: updateData.rollNumber } : {}),
      ...(updateData.firstName !== undefined ? { firstName: updateData.firstName } : {}),
      ...(updateData.middleName !== undefined ? { middleName: updateData.middleName } : {}),
      ...(updateData.lastName !== undefined ? { lastName: updateData.lastName } : {}),
      ...(updateData.dateOfBirth !== undefined ? { dateOfBirth: updateData.dateOfBirth } : {}),
      ...(updateData.gender !== undefined ? { gender: updateData.gender } : {}),
      ...(updateData.bloodGroup !== undefined ? { bloodGroup: updateData.bloodGroup } : {}),
      ...(updateData.nationality !== undefined ? { nationality: updateData.nationality } : {}),
      ...(updateData.religion !== undefined ? { religion: updateData.religion } : {}),
      ...(updateData.caste !== undefined ? { caste: updateData.caste } : {}),
      ...(updateData.category !== undefined ? { category: updateData.category } : {}),
      ...(updateData.aadharNumber !== undefined ? { aadharNumber: updateData.aadharNumber } : {}),
      ...(updateData.photoUrl !== undefined ? { photoUrl: updateData.photoUrl } : {}),
      ...(updateData.enrollmentDate !== undefined ? { enrollmentDate: updateData.enrollmentDate } : {}),
      ...(updateData.previousSchool !== undefined ? { previousSchool: updateData.previousSchool } : {}),
      ...(updateData.previousClass !== undefined ? { previousClass: updateData.previousClass } : {}),
      ...(updateData.tcNumber !== undefined ? { tcNumber: updateData.tcNumber } : {}),
      ...(updateData.siblingId !== undefined ? { siblingId: updateData.siblingId } : {}),
      ...(updateData.isStaffWard !== undefined ? { isStaffWard: updateData.isStaffWard } : {}),
      ...(updateData.status !== undefined ? { status: updateData.status } : {}),
      ...(updateData.transportRequired !== undefined
        ? { transportRequired: updateData.transportRequired }
        : {}),
      ...(updateData.hostelRequired !== undefined
        ? { hostelRequired: updateData.hostelRequired }
        : {}),
      ...(updateData.medicalConditions !== undefined
        ? { medicalConditions: updateData.medicalConditions }
        : {}),
      ...(updateData.emergencyContactName !== undefined
        ? { emergencyContactName: updateData.emergencyContactName }
        : {}),
      ...(updateData.emergencyContactPhone !== undefined
        ? { emergencyContactPhone: updateData.emergencyContactPhone }
        : {}),
      ...(updateData.address !== undefined ? { address: updateData.address } : {}),
      ...(updateData.city !== undefined ? { city: updateData.city } : {}),
      ...(updateData.pincode !== undefined ? { pincode: updateData.pincode } : {}),
    });

    return this.formatStudentResponse(updated);
  }

  async deleteStudent(id, tenantId) {
    const student = await studentRepo.findById(id, tenantId);
    await studentRepo.delete(id, tenantId);

    return {
      message: "Student deleted successfully",
      data: this.formatStudentResponse(student),
    };
  }

  formatStudentResponse(student) {
    return {
      id: student.id,
      tenantId: student.tenantId,
      userId: student.userId,
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
      user: student.user || undefined,
      enrollments: student.enrollments || undefined,
    };
  }
}
