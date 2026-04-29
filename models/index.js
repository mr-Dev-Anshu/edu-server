import sequelize from "../config/db.js";

// --- Core & Billing ---
import Tenant from "./Tenant.js";
import Plan from "./Plan.js";
import Subscription from "./Subscription.js";

// --- Auth & RBAC ---
import User from "./Users.js";
import Role from "./Role.js";
import { Student } from "./Students.js";
import { Permission } from "./Permission.js";
import { Staff } from "./Staff.js";
import { AcademicYear } from "./Academic/AcademicYear.js";
import { Class } from "./Academic/Class.js";
import { Section } from "./Academic/Section.js";
import StudentSectionEnrollment from "./StudentSectionEnrollment.js";
import TeacherSubjectAssignment from "./TeacherSubjectAssignment.js";
import { Guardian } from "./Guardian.js";
import { UserRole } from "./UserRole.js";
import { RolePermission } from "./RolePermission.js";
import StudentGuardianMap from "./StudentGaurdianMap.js";
// import UserRole from './UserRole.js';
// import RolePermission from './RolePermission.js';

// // --- Academic (Sub-folder) ---
// import AcademicYear from './Academic/AcademicYear.js';
// import Class from './Academic/Class.js';
// import Section from './Academic/Section.js';
import Subject from './Academic/Subject.js';

// // --- Users & Relationships ---
// import Student from './Students.js';
// import Staff from './Staff.js';
// import Guardian from './Guardian.js';
// import StudentSectionEnrollment from './StudentSectionEnro.js'; // Note: matches your screenshot
// import StudentGuardianMap from './StudentGaurdianMa.js'; // Note: matches your screenshot
// import TeacherSubjectAssignment from './TeacherSubjectAssi.js'; // Note: matches your screenshot

// // --- Infrastructure ---
import { Room, Timetable, TimetableSlot } from "./Infrastructure.js";
import { Attendance } from "./Attendance.js";
import { ExamGroup, ExamSchedule } from "./exams/Exams.js";

// ==========================================
// 1. TENANT & BILLING ASSOCIATIONS
// ==========================================
Tenant.hasMany(Subscription, { foreignKey: "tenantId", as: "subscriptions" });
Subscription.belongsTo(Tenant, { foreignKey: "tenantId", as: "organization" });

Plan.hasMany(Subscription, { foreignKey: "planId", as: "activeSubscriptions" });
Subscription.belongsTo(Plan, { foreignKey: "planId", as: "planDetails" });

// ==========================================
// 2. AUTH & RBAC (The Many-to-Many logic)
// ==========================================
User.belongsToMany(Role, {
  through: UserRole,
  foreignKey: "userId",
  as: "roles",
});
Role.belongsToMany(User, {
  through: UserRole,
  foreignKey: "roleId",
  as: "users",
});

Role.belongsToMany(Permission, {
  through: RolePermission,
  foreignKey: "roleId",
  as: "permissions",
});
Permission.belongsToMany(Role, {
  through: RolePermission,
  foreignKey: "permissionId",
  as: "roles",
});

// Linking users to tenants
Tenant.hasMany(User, { foreignKey: "tenantId", as: "members" });
User.belongsTo(Tenant, { foreignKey: "tenantId", as: "organization" });

// ==========================================
// USER-ROLE JUNCTION TABLE ASSOCIATIONS
// ==========================================
UserRole.belongsTo(User, { foreignKey: "userId", as: "user" });
UserRole.belongsTo(Role, { foreignKey: "roleId", as: "role" });
UserRole.belongsTo(AcademicYear, { foreignKey: "academicYearId", as: "academicYear" });
UserRole.belongsTo(User, { foreignKey: "assignedById", as: "assignedBy" });

// ==========================================
// 3. STUDENT & STAFF PROFILE LINKS
// ==========================================
User.hasOne(Student, { foreignKey: "userId", as: "studentProfile" });
Student.belongsTo(User, { foreignKey: "userId", as: "user" });

User.hasOne(Staff, { foreignKey: "userId", as: "staffProfile" });
Staff.belongsTo(User, { foreignKey: "userId", as: "user" });
Staff.belongsTo(Tenant, { foreignKey: "tenantId", as: "organization" });

Student.belongsTo(Tenant, { foreignKey: "tenantId", as: "organization" });

// ==========================================
// 4. ACADEMIC & ENROLLMENT LOGIC
// ==========================================
// Tenant -> Academic Years
Tenant.hasMany(AcademicYear, { foreignKey: "tenantId" });
AcademicYear.belongsTo(Tenant, { foreignKey: "tenantId" });

// Class -> Section
Class.hasMany(Section, { foreignKey: "classId", as: "sections", cascade: true });
Section.belongsTo(Class, { foreignKey: "classId", as: "class" });

// Academic Year -> Section
Section.belongsTo(AcademicYear, { foreignKey: "academicYearId", as: "academicYear" });
AcademicYear.hasMany(Section, { foreignKey: "academicYearId", as: "sections", cascade: true });

// Student Enrollment (History)
Student.hasMany(StudentSectionEnrollment, { foreignKey: "studentId", as: "enrollments", cascade: true});
StudentSectionEnrollment.belongsTo(Student, { foreignKey: "studentId", as: "student"});
StudentSectionEnrollment.belongsTo(Section, { foreignKey: "sectionId", as: "section"});
StudentSectionEnrollment.belongsTo(AcademicYear, { foreignKey: "academicYearId", as: "academicYear"});

// Attendance - cascade delete when section is deleted
Section.hasMany(Attendance, {foreignKey: "sectionId", as: "attendanceRecords", cascade: true});
Attendance.belongsTo(Section, { foreignKey: "sectionId", as: "section" });
Attendance.belongsTo(Student, { foreignKey: "studentId", as: "student" });
Attendance.belongsTo(AcademicYear, { foreignKey: "academicYearId", as: "academicYear" });

// Timetable - cascade delete when section is deleted
Section.hasMany(Timetable, {foreignKey: "sectionId", as: "timetables", cascade: true});
Timetable.belongsTo(Section, { foreignKey: "sectionId", as: "section" });
Timetable.belongsTo(AcademicYear, { foreignKey: "academicYearId", as: "academicYear" });

// ExamSchedule - cascade delete when section is deleted
Section.hasMany(ExamSchedule, {foreignKey: "sectionId", as: "examSchedules", cascade: true});
ExamSchedule.belongsTo(Section, { foreignKey: "sectionId", as: "section" });
ExamSchedule.belongsTo(ExamGroup, { foreignKey: "examGroupId", as: "examGroup" });

// Teacher Assignments - cascade delete when section is deleted
Section.hasMany(TeacherSubjectAssignment, {foreignKey: "sectionId", as: "teacherAssignments",cascade: true});
TeacherSubjectAssignment.belongsTo(Section, { foreignKey: "sectionId", as: "section" });
TeacherSubjectAssignment.belongsTo(Staff, { foreignKey: "staffId", as: "teacher" });

// ==========================================
// 5. FAMILY TREE (Guardians)
// ==========================================
Student.belongsToMany(Guardian, {
  through: StudentGuardianMap,
  foreignKey: "studentId",
  as: "guardians",
});
Guardian.belongsToMany(Student, {
  through: StudentGuardianMap,
  foreignKey: "guardianId",
  as: "students",
});

Tenant.addScope("active", { where: { status: "active" } });

export {
  sequelize,
  Tenant,
  Plan,
  Subscription,
  User,
  Role,
  Permission,
  UserRole,
  RolePermission,
  AcademicYear,
  Class,
  Section,
  Subject,
  Student,
  Staff,
  Guardian,
  StudentSectionEnrollment,
  StudentGuardianMap,
  TeacherSubjectAssignment,
  Attendance,
  Room,
  Timetable,
  TimetableSlot,
  ExamGroup,
  ExamSchedule,
};
