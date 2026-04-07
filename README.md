# edu-server

`edu-server` is a Node.js/Express backend for a multi-tenant education SaaS product. The project is designed to support schools first, while keeping the tenant model flexible enough for colleges, universities, coaching centers, preschools, and similar organizations.

The codebase is organized around a classic layered backend structure:

- `router` handles HTTP route definitions
- `controllers` translate HTTP requests into service calls
- `services` contain business rules
- `repositories` encapsulate database access
- `models` define the Sequelize schema and associations
- `middlewares` contain validation and error handling helpers

## Product Intent

The current data model shows a platform meant to manage:

- tenant onboarding and subscription billing
- users, roles, and permissions
- student, staff, and guardian records
- academic years, classes, sections, and subjects
- student enrollments
- teacher-subject assignments
- rooms and timetable scheduling

In short, this is shaping up to be a school-management SaaS backend with a strong multi-tenant foundation and room to expand into a broader education ERP.

## Tech Stack

- Runtime: Node.js
- Framework: Express 5
- ORM: Sequelize 6
- Database: PostgreSQL
- Configuration: `dotenv`
- Security and API middleware: `helmet`, `cors`, `morgan`
- Development tooling: `nodemon`

## Application Startup Flow

### `index.js`

The entrypoint:

1. loads environment variables
2. imports the Express app
3. connects to PostgreSQL through Sequelize
4. syncs models with `sequelize.sync({ alter: true })` in development
5. starts the HTTP server
6. handles graceful shutdown on `SIGTERM`

### `config/db.js`

Database setup expects a `DATABASE_URL`. The Sequelize instance is configured with:

- PostgreSQL dialect
- SSL enabled
- connection pool settings
- retry matching for common connection failures
- global model defaults:
  - `underscored: true`
  - `timestamps: true`
  - `paranoid: true`

## Express App Flow

### `app.js`

The Express app currently includes:

- `helmet()` for basic security headers
- `cors()` with configurable origin
- `morgan('dev')` for logging
- JSON and URL-encoded body parsing
- `GET /health` for health checks
- a 404 fallback
- an inline error handler

Important current-state note:

- feature routers are not mounted in `app.js` yet
- the shared error middleware in `middlewares/error/error.middleware.js` is not wired into the app

That means the project has the beginnings of a modular architecture, but the final request wiring is still incomplete.

## Multi-Tenancy Design

Multi-tenancy is one of the core ideas in this project.

### `models/withTenant.js`

The helper injects these common fields into tenant-owned models:

- `tenantId`
- `customFields`
- `metadata`

This is intended to enforce tenant isolation while still allowing per-tenant customization and loosely structured extension data.

### Design pattern used

Most business entities are meant to be tenant-scoped:

- users
- roles
- staff
- students
- guardians
- academic structures
- timetable data

The `User` and `Role` models deliberately relax strict tenant ownership in some cases:

- `User` allows `tenantId = null` for platform-level `super_admin`
- `Role` allows `tenantId = null` for global system roles

This is a sensible SaaS pattern: global platform actors can exist outside a single tenant, while most operational records remain tenant-bound.

## Domain Model Overview

## 1. Tenant and Billing

### `Tenant`

Represents an organization using the platform.

Key fields:

- `organizationType`: school, college, university, coaching, preschool, other
- `name`
- `officialEmail`
- `subdomain`
- `settings` JSONB
- `themeConfig` JSONB
- `registrationNumber`
- `status`: onboarding, active, suspended, archived
- `customFields`
- `metadata`

This model is the heart of the platform. It stores organization identity, lifecycle state, and per-tenant configuration.

### `Plan`

Represents a subscription plan offered by the platform.

Key fields:

- `name`
- `slug`
- `description`
- `monthlyPrice`
- `yearlyPrice`
- `currency`
- `features` JSONB
- `isActive`

The `features` JSONB suggests the platform intends feature-based entitlements such as storage limits or optional modules.

### `Subscription`

Represents a tenant's active or historical subscription.

Key fields:

- tenant reference
- plan reference
- `status`
- `billingCycle`
- `startDate`
- `endDate`
- `nextBillingDate`
- `amountPaid`

Important note:

- the association layer uses `tenantId`
- the model currently defines `schoolId`

So the billing design is clear, but the implementation still needs consistency updates.

## 2. Authentication and RBAC

### `User`

Represents a platform or tenant user.

Key fields:

- `cognitoSub`
- `email`
- `firstName`
- `lastName`
- `phone`
- `avatarUrl`
- `userType`
- `status`
- `emailVerified`
- `twoFactorEnabled`
- `lastLoginAt`
- `preferences`

Supported `userType` values:

- `super_admin`
- `org_admin`
- `staff`
- `teacher`
- `student`
- `parent`
- `vendor`

This model mixes authentication identity, profile data, and user lifecycle state.

### `Role`

Represents a named role, either global or tenant-specific.

Key fields:

- `name`
- `slug`
- `description`
- `isSystem`
- `hierarchyLevel`

`hierarchyLevel` hints at future permission escalation rules, such as preventing lower-level users from managing higher-level ones.

### `Permission`

Represents a fine-grained permission.

Key fields:

- `name`
- `action`
- `resource`
- `module`
- `description`

The intended naming style is action/resource oriented, for example `read:students` or `manage:fees`.

### `UserRole`

Join table for assigning roles to users.

Key fields:

- `userId`
- `roleId`
- `academicYearId`
- `assignedById`
- `assignedAt`
- `expiresAt`

This is more advanced than a basic RBAC join table because it supports academic-year-scoped assignments and expiring role grants.

### `RolePermission`

Join table between roles and permissions.

Key fields:

- `roleId`
- `permissionId`

Together, `User`, `Role`, `Permission`, `UserRole`, and `RolePermission` form the platform's authorization layer.

## 3. Academic Structure

### `AcademicYear`

Represents an academic session for a tenant.

Key fields:

- `name`
- `startDate`
- `endDate`
- `isCurrent`
- `isLocked`

### `Class`

Represents an academic level or class grouping.

Key fields:

- `name`
- `numericLevel`
- `description`

### `Section`

Represents a subdivision of a class in a given academic year.

Key fields:

- `classId`
- `academicYearId`
- `name`
- `capacity`
- `classTeacherId`

### `Subject`

Represents a subject taught to a class.

Key fields:

- `classId`
- `name`
- `code`
- `subjectType`
- `isElective`
- `weeklyPeriods`

Together these models define the academic container structure:

- tenant -> academic year
- class -> section
- class -> subject

## 4. Student, Staff, and Guardian Profiles

### `Student`

Represents a student profile, optionally linked to a `User`.

Key fields include:

- `userId`
- `admissionNumber`
- `rollNumber`
- name fields
- `dateOfBirth`
- `gender`
- `bloodGroup`
- `nationality`
- `religion`
- `caste`
- `category`
- `aadharNumber`
- `photoUrl`
- `enrollmentDate`
- `previousSchool`
- `previousClass`
- `tcNumber`
- `siblingId`
- `isStaffWard`
- `status`
- `transportRequired`
- `hostelRequired`
- `medicalConditions`
- emergency contact data
- address data

This is a rich school ERP student profile model and suggests the backend is intended to support admissions, identity, transport, hostel, and compliance workflows.

### `Staff`

Represents staff profile data linked to a `User`.

Key fields:

- `userId`
- `employeeCode`
- `staffType`
- `designation`
- `department`
- `joiningDate`
- `employmentStatus`
- `panNumber`
- `bankAccountNumber`

### `Guardian`

Represents a parent or guardian entity, optionally linked to a `User`.

Key fields:

- `userId`
- `relation`
- `phone`
- `occupation`
- `isPrimaryContact`

### `StudentGuardianMap`

Join table between students and guardians.

Key fields:

- `studentId`
- `guardianId`
- `relationType`
- `isPrimary`
- `canPickup`

This structure supports many-to-many family relationships, which is useful when one guardian is linked to multiple students or a student has multiple guardians.

## 5. Enrollment and Teaching Assignment

### `StudentSectionEnrollment`

Represents student placement into a section for a specific academic year.

Key fields:

- `studentId`
- `sectionId`
- `academicYearId`
- `rollNumber`
- `isCurrent`
- `enrollmentStatus`

This is a good design choice because it preserves enrollment history instead of storing only a single "current section" on the student record.

### `TeacherSubjectAssignment`

Represents teacher allocation to a subject and section for an academic year.

Key fields:

- `staffId`
- `subjectId`
- `sectionId`
- `academicYearId`
- `isPrimaryTeacher`

This model is the foundation for timetable generation, workload planning, and subject ownership.

## 6. Infrastructure and Scheduling

### `Room`

Represents a physical space.

Key fields:

- `name`
- `roomType`
- `capacity`

### `Timetable`

Represents a timetable container for a section and academic year.

Key fields:

- `sectionId`
- `academicYearId`
- `name`
- `status`

### `TimetableSlot`

Represents a single period in a timetable.

Key fields:

- `timetableId`
- `subjectId`
- `teacherId`
- `roomId`
- `dayOfWeek`
- `periodNumber`
- `startTime`
- `endTime`

The unique indexes on teacher/time and room/time show that timetable collision prevention is already part of the design.

## Associations

Based on `models/index.js`, the intended relationships are:

- `Tenant` has many `Subscription`
- `Plan` has many `Subscription`
- `Tenant` has many `User`
- `User` belongs to many `Role` through `UserRole`
- `Role` belongs to many `Permission` through `RolePermission`
- `User` has one `Student`
- `User` has one `Staff`
- `Tenant` has many `AcademicYear`
- `Class` has many `Section`
- `Student` has many `StudentSectionEnrollment`
- `Student` belongs to many `Guardian` through `StudentGuardianMap`
- `TeacherSubjectAssignment` belongs to `Staff`

There are still some missing or incomplete associations that would likely be needed later, such as:

- section -> academic year and tenant aliases
- subject -> class association aliases
- timetable -> slots
- timetable slot -> room, subject, teacher
- teacher subject assignment -> subject, section, academic year

## API Layer

The only concrete feature route currently present is for tenant management.

### `router/tenant.router.js`

Defined routes:

- `POST /register`
- `GET /:id`
- `PATCH /:id`
- `DELETE /:id`

### Request flow

The tenant feature follows this chain:

1. router
2. validator
3. controller
4. service
5. repository
6. Sequelize model

This is a clean foundation for scaling more features later.

### `middlewares/validators/tenant.validator.js`

The tenant validator currently validates:

- `name`
- `organizationType`
- `officialEmail`
- `subdomain`
- `registrationNumber`
- `settings`
- `themeConfig`
- `status`
- `customFields`
- `metadata`

However, the project currently imports `express-validator` without declaring it in `package.json`, so validation is designed but not yet install-ready.

## Base Abstractions

The codebase already includes generic abstractions:

- `BaseRepository`
- `BaseService`
- `BaseController`

These are intended for tenant-scoped CRUD patterns, where `req.tenantId` is injected and propagated through the stack.

This is a good direction for the project because most education entities are tenant-owned and share common CRUD needs.

## Error Handling

There are two error handling styles present right now:

- inline handler inside `app.js`
- reusable `globalErrorHandler` in `middlewares/error/error.middleware.js`

The reusable one is the better long-term direction, but it is not currently connected to the app.

`AppError` and `catchAsync` are already in place, which means the project is moving toward a consistent operational error strategy.

## Project Structure

```text
edu-server/
  app.js
  index.js
  config/
    db.js
  controllers/
  middlewares/
    error/
    validators/
  models/
    Academic/
  repositories/
  router/
  services/
  utils/
```

## Current Strengths

- strong multi-tenant intent in the schema design
- clear separation between router, controller, service, and repository layers
- rich education domain modeling
- flexible JSONB usage for tenant settings and feature configuration
- soft-delete support through Sequelize paranoid mode
- thoughtful indexing in several models
- support for both tenant-level and global platform actors

## Current Gaps and Inconsistencies

This section reflects the code exactly as it exists today.

### Wiring gaps

- `app.js` does not currently mount the tenant router
- `app.js` does not use the shared `globalErrorHandler`
- there is no visible middleware that sets `req.tenantId`

### Import and path issues

- several models import `../utils/model-helper.js`, but that file does not exist
- the actual helper present is `models/withTenant.js`
- some academic models import `../../config/db` without the `.js` extension
- `router/tenant.router.js` imports modules without `.js` extensions
- `controllers/base.controller.js` uses `catchAsync` without importing it

### Model-level consistency issues

- `Subscription` uses `schoolId` while associations expect `tenantId`
- `models/index.js` exports `Subject` but does not import it
- several academic models use `DataTypes` without importing it
- `Students.js` is incomplete or broken:
  - missing `DataTypes` import
  - inconsistent helper import path
  - references `tenantIndex`, which is not defined in the repository
  - does not export a default model even though `models/index.js` imports one

### Dependency issues

- `express-validator` is used but not listed in `package.json`

These issues do not erase the architecture. They just mean the project is still in a build-out stage rather than a fully runnable production baseline.

## What This Project Already Tells Us

Even in its unfinished state, the project communicates a clear product direction:

- platform-first multi-tenancy
- school operations and academic management
- RBAC and tenant-customizable configuration
- billing-aware SaaS architecture
- readiness for future modules like transport, hostel, exams, LMS, and reporting

## Recommended Next Steps

If you continue building this codebase, the highest-value next steps would be:

1. fix import paths and missing exports so the model layer boots cleanly
2. standardize `tenantId` usage across all tenant-owned models
3. mount routers in `app.js`
4. wire `globalErrorHandler` and request validation result handling
5. add a tenant-resolution middleware to populate `req.tenantId`
6. add the missing dependencies such as `express-validator`
7. complete association coverage for academic and timetable models
8. add migrations instead of relying on `sync({ alter: true })` for long-term stability

## Summary

This repository is a promising foundation for a multi-tenant school management SaaS backend. The architecture is already pointing in the right direction: layered services, tenant-aware models, RBAC, academic entities, and infrastructure scheduling. The main thing it needs now is consistency and wiring completion so the strong design becomes an executable system.
