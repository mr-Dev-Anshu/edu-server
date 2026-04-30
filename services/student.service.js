import sequelize from "../config/db.js";
import { GuardianService } from "./guardian.service.js";
import { StudentRepository } from "../repositories/student.repository.js";
import { GuardianRepository } from "../repositories/guardian.repository.js";
import { AppError } from "../utils/AppError.js";
import { RoleService } from "./role.service.js";
import { UserRoleService } from "./user-role.service.js";
import { UserService } from "./user.service.js";
import { StudentGuardianMap } from "../models/index.js";

const studentRepo = new StudentRepository();
const guardianRepo = new GuardianRepository();
const guardianService = new GuardianService();
const userService = new UserService();
const userRoleService = new UserRoleService();
const roleService = new RoleService();

export class StudentService {
  async createStudent(tenantId, payload) {
    const {
      email,
      password,
      firstName,
      lastName,
      admissionNumber,
      guardians = [],
      requestedBy,
      ...studentFields
    } = payload;

    // 1. Admission Number check (Before transaction)
    const existingAdmission = await studentRepo.findByAdmissionNumber(
      admissionNumber,
      tenantId,
    );
    if (existingAdmission) {
      throw new AppError("Admission number already exists", 400);
    }

    const transaction = await sequelize.transaction();

    try {
      // 2. Create User Account
      const user = await userService.createUser(
        {
          email,
          password,
          firstName,
          lastName,
          tenantId,
          status: "active",
          emailVerified: true,
        },
        { transaction },
      );

      // 3. Resolve 'student' Role
      const roles = await roleService.getAllRoles(tenantId, {
        slug: "student",
      });
      const studentRole = roles[0];

      if (!studentRole) {
        throw new AppError(
          "Student (Portal) role not found for this tenant",
          404,
        );
      }

      // 4. Assign Role (Isse user ko 'portal' type permissions mil jayengi)
      await userRoleService.assignRoleToUser(
        {
          userId: user.id,
          roleId: studentRole.id,
          tenantId,
          assignedById: requestedBy,
        },
        { transaction },
      );

      // 5. Create Student Profile
      const student = await studentRepo.create(
        {
          ...studentFields,
          firstName: firstName?.trim(),
          middleName: payload.middleName?.trim() || null,
          lastName: lastName?.trim(),
          tenantId,
          userId: user.id,
          admissionNumber: admissionNumber.trim(),
        },
        { transaction },
      );

      const createdGuardians = [];

      for (const guardianInput of guardians) {
        const {
          email: guardianEmail,
          password: guardianPassword,
          firstName: guardianFirstName,
          lastName: guardianLastName,
          relation,
          relationType,
          phone,
          occupation,
          isPrimaryContact,
          isPrimary,
          canPickup,
        } = guardianInput;

        const normalizedRelationType =
          relationType ??
          (relation === "father" || relation === "mother" || relation === "guardian"
            ? relation
            : "other");

        const guardian = await guardianService.resolveGuardian(
          tenantId,
          {
            email: guardianEmail,
            password: guardianPassword,
            firstName: guardianFirstName,
            lastName: guardianLastName,
            relation,
            phone,
            occupation,
            isPrimaryContact,
            requestedBy,
          },
          { transaction },
        );

        await guardianService.attachStudents(
          guardian.id,
          tenantId,
          {
            studentIds: [student.id],
            relationType: normalizedRelationType,
            isPrimary: isPrimary ?? false,
            canPickup: canPickup ?? true,
          },
          { transaction },
        );

        // Format guardian response with all fields (handles both new and reused guardians)
        createdGuardians.push({
          id: guardian.id,
          tenantId: guardian.tenantId,
          userId: guardian.userId,
          relation: guardian.relation,
          phone: guardian.phone,
          occupation: guardian.occupation,
          isPrimaryContact: guardian.isPrimaryContact,
          relationType: normalizedRelationType,
          isPrimary: isPrimary ?? false,
          canPickup: canPickup ?? true,
          createdAt: guardian.createdAt,
          updatedAt: guardian.updatedAt,
          firstName: guardianFirstName,
          lastName: guardianLastName,
          email: guardianEmail,
        });
      }

      await transaction.commit();
      
      // Convert Sequelize instance to plain object
      const studentData = student.get({ plain: true });
      
      return this.formatStudentResponse({
        ...studentData,
        guardians: createdGuardians,
      });
    } catch (error) {
      if (!transaction.finished) await transaction.rollback();
      throw error;
    }
  }

  async getAllStudents(tenantId, query) {
    const page = parseInt(query.page, 10) || 1;
    const limit = parseInt(query.limit, 10) || 10;

    const filters = {};
    if (query.status) filters.status = query.status;
    if (query.admissionNumber) filters.admissionNumber = query.admissionNumber;
    if (query.userId) filters.userId = query.userId;
    if (query.name) filters.name = query.name;

    const result = await studentRepo.findWithPagination(tenantId, filters, page, limit);
    
    // Format each student's guardians properly
    return {
      ...result,
      data: result.data.map(student => {
        const studentData = student.get ? student.get({ plain: true }) : student;
        return this.formatStudentResponse(studentData);
      }),
    };
  }

  async getStudentById(id, tenantId) {
    const student = await studentRepo.findWithDetails(id, tenantId);
    if (!student) {
      throw new AppError("Student not found", 404);
    }

    const studentData = student.get ? student.get({ plain: true }) : student;
    return this.formatStudentResponse(studentData);
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
        throw new AppError(
          "Admission number already exists for this tenant",
          400,
        );
      }
    }

    const updated = await studentRepo.update(id, tenantId, {
      ...(updateData.admissionNumber !== undefined
        ? { admissionNumber: updateData.admissionNumber }
        : {}),
      ...(updateData.rollNumber !== undefined
        ? { rollNumber: updateData.rollNumber }
        : {}),
      ...(updateData.firstName !== undefined
        ? { firstName: updateData.firstName }
        : {}),
      ...(updateData.middleName !== undefined
        ? { middleName: updateData.middleName }
        : {}),
      ...(updateData.lastName !== undefined
        ? { lastName: updateData.lastName }
        : {}),
      ...(updateData.dateOfBirth !== undefined
        ? { dateOfBirth: updateData.dateOfBirth }
        : {}),
      ...(updateData.gender !== undefined ? { gender: updateData.gender } : {}),
      ...(updateData.bloodGroup !== undefined
        ? { bloodGroup: updateData.bloodGroup }
        : {}),
      ...(updateData.nationality !== undefined
        ? { nationality: updateData.nationality }
        : {}),
      ...(updateData.religion !== undefined
        ? { religion: updateData.religion }
        : {}),
      ...(updateData.caste !== undefined ? { caste: updateData.caste } : {}),
      ...(updateData.category !== undefined
        ? { category: updateData.category }
        : {}),
      ...(updateData.aadharNumber !== undefined
        ? { aadharNumber: updateData.aadharNumber }
        : {}),
      ...(updateData.photoUrl !== undefined
        ? { photoUrl: updateData.photoUrl }
        : {}),
      ...(updateData.enrollmentDate !== undefined
        ? { enrollmentDate: updateData.enrollmentDate }
        : {}),
      ...(updateData.previousSchool !== undefined
        ? { previousSchool: updateData.previousSchool }
        : {}),
      ...(updateData.previousClass !== undefined
        ? { previousClass: updateData.previousClass }
        : {}),
      ...(updateData.tcNumber !== undefined
        ? { tcNumber: updateData.tcNumber }
        : {}),
      ...(updateData.siblingId !== undefined
        ? { siblingId: updateData.siblingId }
        : {}),
      ...(updateData.isStaffWard !== undefined
        ? { isStaffWard: updateData.isStaffWard }
        : {}),
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
      ...(updateData.address !== undefined
        ? { address: updateData.address }
        : {}),
      ...(updateData.city !== undefined ? { city: updateData.city } : {}),
      ...(updateData.pincode !== undefined
        ? { pincode: updateData.pincode }
        : {}),
    });

    // Fetch updated record with all details (guardians, user, enrollments)
    const updatedWithDetails = await studentRepo.findWithDetails(id, tenantId);
    const updatedData = updatedWithDetails.get ? updatedWithDetails.get({ plain: true }) : updatedWithDetails;
    return this.formatStudentResponse(updatedData);
  }

  async deleteStudent(id, tenantId) {
    const transaction = await sequelize.transaction();

    try {
      // Fetch student with guardian IDs only (lightweight)
      const student = await studentRepo.findWithDetails(id, tenantId);
      if (!student) {
        throw new AppError("Student not found", 404);
      }
      
      const guardianIds = student.guardians?.map(g => g.id) || [];
      
      // Explicitly delete StudentGuardianMap entries first
      await StudentGuardianMap.destroy({ 
        where: { studentId: id, tenantId },
        transaction
      });
      
      // Delete student
      await studentRepo.delete(id, tenantId, { transaction });

      // Find orphaned guardians in single query (with transaction for consistency)
      if (guardianIds.length > 0) {
        const orphanedGuardianIds = await guardianRepo.findOrphanedGuardians(guardianIds, tenantId, { transaction });
        
        // Batch delete orphaned guardians
        if (orphanedGuardianIds.length > 0) {
          await guardianRepo.deleteMultiple(orphanedGuardianIds, tenantId, { transaction });
        }
      }

      await transaction.commit();
      
      const studentData = student.get ? student.get({ plain: true }) : student;
      return {
        message: "Student deleted successfully",
        data: this.formatStudentResponse(studentData),
      };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
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
      guardians: student.guardians?.map((guardian) => ({
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
        firstName: guardian.firstName ?? guardian.user?.firstName,
        lastName: guardian.lastName ?? guardian.user?.lastName,
        email: guardian.email ?? guardian.user?.email,
        createdAt: guardian.createdAt,
        updatedAt: guardian.updatedAt,
      })),
    };
  }
}
