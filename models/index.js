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

User.hasOne(Guardian, { foreignKey: "userId", as: "guardianProfile" });
Guardian.belongsTo(User, { foreignKey: "userId", as: "user" });
Guardian.belongsTo(Tenant, { foreignKey: "tenantId", as: "organization" });

Student.belongsTo(Tenant, { foreignKey: "tenantId", as: "organization" });

// ==========================================
// 4. ACADEMIC & ENROLLMENT LOGIC
// ==========================================
// Tenant -> Academic Years
Tenant.hasMany(AcademicYear, { foreignKey: "tenantId" });
AcademicYear.belongsTo(Tenant, { foreignKey: "tenantId" });

// Class -> Section
Class.hasMany(Section, { foreignKey: "classId", as: "sections" });
Section.belongsTo(Class, { foreignKey: "classId", as: "class" });

// Academic Year -> Section
Section.belongsTo(AcademicYear, { foreignKey: "academicYearId", as: "academicYear" });
AcademicYear.hasMany(Section, { foreignKey: "academicYearId", as: "sections"});

// Student Enrollment (History)
Student.hasMany(StudentSectionEnrollment, { foreignKey: "studentId", as: "enrollments"});
StudentSectionEnrollment.belongsTo(Student, { foreignKey: "studentId", as: "student"});
StudentSectionEnrollment.belongsTo(Section, { foreignKey: "sectionId", as: "section"});
StudentSectionEnrollment.belongsTo(AcademicYear, { foreignKey: "academicYearId", as: "academicYear"});


// Teacher Assignments
TeacherSubjectAssignment.belongsTo(Staff, { foreignKey: "staffId" });

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
Guardian.hasMany(StudentGuardianMap, {
  foreignKey: 'guardianId',
  as: 'studentMappings',
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
  Room,
  Timetable,
  TimetableSlot,
};
