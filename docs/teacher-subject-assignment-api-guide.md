# TeacherSubjectAssignment API Guide

This guide documents the current `TeacherSubjectAssignment` APIs in `edu-server`, including request/response formats, permissions, important behavior, and edge cases.

## Base Path

All routes are mounted under:

```http
/api/v1/teacher-subject-assignments
```

## What This API Does

`TeacherSubjectAssignment` maps a `staff` member to a `subject`, `section`, and `academic year`.

It supports:
- Create assignment
- List assignments
- Search/filter assignments
- Get assignment by ID
- Update assignment
- Soft delete assignment

## Authentication

These routes use `identifyUser` middleware.

### Required Header

```http
Authorization: Bearer <JWT_TOKEN>
```

### Tenant Behavior

- Tenant context comes from the JWT payload.
- The JWT must contain a valid `tenantId`.
- The tenant must exist and be active.
- All create/update/read/delete operations are tenant-scoped.

> Note: `x-tenant-id` is used in some other parts of the repo, but for these routes the primary tenant context comes from the JWT via `identifyUser`.

## Permissions

Current route protection:

- `POST /` → `create:teacher-subject-assignment`
- `PATCH /:id` → `update:teacher-subject-assignment`
- `DELETE /:id` → `delete:teacher-subject-assignment`
- `GET /`, `GET /search`, `GET /:id` → authenticated only (`identifyUser`), no extra read permission currently required

## Model Summary

A record contains:
- `id`
- `tenantId`
- `staffId`
- `subjectId`
- `sectionId`
- `academicYearId`
- `isPrimaryTeacher`
- timestamps

Soft delete is enabled through Sequelize paranoid mode.

## Important Business Rules

### Primary Teacher Rule

If `isPrimaryTeacher: true` is sent on create or update:
- existing primary assignment(s) for the same
  - `tenantId`
  - `subjectId`
  - `sectionId`
  - `academicYearId`
  are demoted automatically
- only one primary teacher should remain active for the same composite key

### Tenant Safety

The following linked records must exist in the same tenant:
- `staff`
- `subject`
- `section`
- `academicYear`

If any of them is missing or belongs to another tenant, the request fails with `404`.

### Pagination Safety

`page` and `limit` are clamped safely:
- minimum `page = 1`
- minimum `limit = 1`
- maximum `limit = 100`

## Endpoints

---

## 1) Create Assignment

### `POST /api/v1/teacher-subject-assignments`

Creates a new teacher-subject assignment.

### Permission
- `create:teacher-subject-assignment`

### Headers
```http
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

### Request Body
```json
{
  "staffId": "550e8400-e29b-41d4-a716-446655440001",
  "subjectId": "550e8400-e29b-41d4-a716-446655440002",
  "sectionId": "550e8400-e29b-41d4-a716-446655440003",
  "academicYearId": "550e8400-e29b-41d4-a716-446655440004",
  "isPrimaryTeacher": true
}
```

### Response: `201 Created`
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440005",
    "tenantId": "tenant-uuid",
    "staffId": "550e8400-e29b-41d4-a716-446655440001",
    "subjectId": "550e8400-e29b-41d4-a716-446655440002",
    "sectionId": "550e8400-e29b-41d4-a716-446655440003",
    "academicYearId": "550e8400-e29b-41d4-a716-446655440004",
    "isPrimaryTeacher": true,
    "createdAt": "2026-05-03T10:00:00.000Z",
    "updatedAt": "2026-05-03T10:00:00.000Z",
    "staff": {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "user": {
        "id": "user-uuid",
        "firstName": "Sarah",
        "lastName": "Teacher",
        "email": "teacher@testschool.com",
        "phone": "+91-9876543212",
        "status": "active"
      }
    },
    "subject": {
      "id": "550e8400-e29b-41d4-a716-446655440002"
    },
    "section": {
      "id": "550e8400-e29b-41d4-a716-446655440003"
    },
    "academicYear": {
      "id": "550e8400-e29b-41d4-a716-446655440004"
    }
  }
}
```

### Validation / Edge Cases
- Invalid UUID → `400`
- Missing required field → `400`
- `isPrimaryTeacher` not boolean → `400`
- Missing/invalid JWT → `401`
- Tenant not found or inactive → `404`
- Linked staff/subject/section/year not found in tenant → `404`
- Missing permission → `403`
- Concurrent primary assignment conflict → `409`

---

## 2) Get All Assignments

### `GET /api/v1/teacher-subject-assignments`

Returns a paginated list of assignments.

### Headers
```http
Authorization: Bearer <JWT_TOKEN>
```

### Query Params
- `page` (optional, default `1`)
- `limit` (optional, default `10`, max `100`)
- `staffId` (optional)
- `subjectId` (optional)
- `sectionId` (optional)
- `academicYearId` (optional)

### Example
```http
GET /api/v1/teacher-subject-assignments?page=1&limit=10&staffId=550e8400-e29b-41d4-a716-446655440001
```

### Response: `200 OK`
```json
{
  "success": true,
  "results": 1,
  "total": 1,
  "page": 1,
  "limit": 10,
  "pages": 1,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440005",
      "tenantId": "tenant-uuid",
      "staffId": "550e8400-e29b-41d4-a716-446655440001",
      "subjectId": "550e8400-e29b-41d4-a716-446655440002",
      "sectionId": "550e8400-e29b-41d4-a716-446655440003",
      "academicYearId": "550e8400-e29b-41d4-a716-446655440004",
      "isPrimaryTeacher": true,
      "staff": {
        "user": {
          "id": "user-uuid",
          "firstName": "Sarah",
          "lastName": "Teacher",
          "email": "teacher@testschool.com"
        }
      },
      "subject": { "id": "550e8400-e29b-41d4-a716-446655440002" },
      "section": { "id": "550e8400-e29b-41d4-a716-446655440003" },
      "academicYear": { "id": "550e8400-e29b-41d4-a716-446655440004" }
    }
  ]
}
```

### Notes
- This endpoint only requires authentication currently.
- `page`/`limit` values are sanitized internally.

---

## 3) Search Assignments

### `GET /api/v1/teacher-subject-assignments/search`

Searches assignments using the same filters as list.

### Headers
```http
Authorization: Bearer <JWT_TOKEN>
```

### Query Params
- `page`
- `limit`
- `staffId`
- `subjectId`
- `sectionId`
- `academicYearId`

### Example
```http
GET /api/v1/teacher-subject-assignments/search?staffId=550e8400-e29b-41d4-a716-446655440001&subjectId=550e8400-e29b-41d4-a716-446655440002&page=1&limit=10
```

### Response: `200 OK`
```json
{
  "success": true,
  "results": 1,
  "total": 1,
  "page": 1,
  "limit": 10,
  "pages": 1,
  "data": []
}
```

---

## 4) Get Assignment by ID

### `GET /api/v1/teacher-subject-assignments/:id`

Gets one assignment by UUID.

### Headers
```http
Authorization: Bearer <JWT_TOKEN>
```

### Example
```http
GET /api/v1/teacher-subject-assignments/550e8400-e29b-41d4-a716-446655440005
```

### Response: `200 OK`
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440005",
    "tenantId": "tenant-uuid",
    "staffId": "550e8400-e29b-41d4-a716-446655440001",
    "subjectId": "550e8400-e29b-41d4-a716-446655440002",
    "sectionId": "550e8400-e29b-41d4-a716-446655440003",
    "academicYearId": "550e8400-e29b-41d4-a716-446655440004",
    "isPrimaryTeacher": true,
    "staff": {
      "user": {
        "id": "user-uuid",
        "firstName": "Sarah",
        "lastName": "Teacher",
        "email": "teacher@testschool.com"
      }
    },
    "subject": { "id": "550e8400-e29b-41d4-a716-446655440002" },
    "section": { "id": "550e8400-e29b-41d4-a716-446655440003" },
    "academicYear": { "id": "550e8400-e29b-41d4-a716-446655440004" }
  }
}
```

### Edge Cases
- Invalid UUID → `400`
- Not found / wrong tenant / soft-deleted → `404`

---

## 5) Update Assignment

### `PATCH /api/v1/teacher-subject-assignments/:id`

Updates assignment fields.

### Permission
- `update:teacher-subject-assignment`

### Headers
```http
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

### Example Request Body
```json
{
  "isPrimaryTeacher": false
}
```

### Another Example
```json
{
  "subjectId": "550e8400-e29b-41d4-a716-446655440006",
  "isPrimaryTeacher": true
}
```

### Response: `200 OK`
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440005",
    "isPrimaryTeacher": false
  }
}
```

### Edge Cases
- Empty body → `400`
- Invalid UUID in body → `400`
- Missing linked record in tenant → `404`
- Missing permission → `403`
- Concurrent primary conflict → `409`

### Important Behavior
If `isPrimaryTeacher: true` is sent, the API automatically demotes any existing primary assignment for the same composite key.

---

## 6) Delete Assignment

### `DELETE /api/v1/teacher-subject-assignments/:id`

Soft deletes the assignment.

### Permission
- `delete:teacher-subject-assignment`

### Headers
```http
Authorization: Bearer <JWT_TOKEN>
```

### Response: `200 OK`
```json
{
  "success": true
}
```

### Edge Cases
- Invalid UUID → `400`
- Not found / wrong tenant / already deleted → `404`
- Missing permission → `403`

### Important Behavior
- Delete is **soft delete** because Sequelize paranoid mode is enabled.
- Deleted rows are excluded from normal GET queries.

---

## Common Error Responses

### `400 Bad Request`
```json
{
  "message": "staffId must be a valid UUID"
}
```

### `401 Unauthorized`
```json
{
  "message": "Login required"
}
```

### `403 Forbidden`
```json
{
  "message": "Forbidden: You do not have the 'create:teacher-subject-assignment' permission"
}
```

### `404 Not Found`
```json
{
  "message": "TeacherSubjectAssignment not found"
}
```

### `409 Conflict`
```json
{
  "message": "Another primary teacher is already assigned to this subject+section+year combination. Please try again."
}
```

## Postman Setup

The collection file is:

```text
postman/teacherSubjectAssignment-routes.postman_collection.json
```

Required environment variables:
- `baseUrl`
- `tenantId`
- `orgAdminToken`
- `staffId`
- `subjectId`
- `sectionId`
- `academicYearId`
- `teacherSubjectAssignmentId`

## Suggested Test Order

1. Login and get `orgAdminToken`
2. Ensure `staffId`, `subjectId`, `sectionId`, `academicYearId` exist in the same tenant
3. Run **Create Teacher Subject Assignment**
4. Run **Get All Teacher Subject Assignments**
5. Run **Search Teacher Subject Assignments**
6. Run **Get Teacher Subject Assignment by ID**
7. Run **Update Teacher Subject Assignment**
8. Run **Delete Teacher Subject Assignment**

## Minimum Data Needed to Test Success Paths

You need:
- 1 active tenant
- 1 authenticated user with valid JWT
- 1 staff record in that tenant
- 1 subject record in that tenant
- 1 section record in that tenant
- 1 academic year record in that tenant
- role permissions for create/update/delete routes

## Final Notes

- The APIs are tenant-scoped and transaction-safe.
- The primary teacher rule is enforced in service logic.
- GET routes currently require authentication only.
- If you test without tenant/user/permission seeds, expect negative responses only.
