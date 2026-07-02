import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from "vitest";

// 1. Hoist the mocks so they are registered before app is imported
const { mockServiceInstance } = vi.hoisted(() => {
  return {
    mockServiceInstance: {
      createAnnouncement: vi.fn(),
      getAllAnnouncements: vi.fn(),
      getAnnouncementById: vi.fn(),
      updateAnnouncement: vi.fn(),
      deleteAnnouncement: vi.fn(),
    },
  };
});

// Mock the services module to return our mocked instance
vi.mock("../../../services/announcement.service.js", () => {
  return {
    announcementService: mockServiceInstance,
  };
});

// Mock security middleware to inject test tenant context & bypass auth/permissions
vi.mock("../../../middlewares/security/index.js", () => {
  return {
    identifyUser: (req, res, next) => {
      req.tenantId = "test-tenant-123";
      req.user = {
        id: "test-user-123",
        roleId: "test-role-123",
        permissions: ["*"],
      };
      next();
    },
    checkPermission: (requiredPermission) => {
      return (req, res, next) => {
        next();
      };
    },
  };
});

// Import the express app
import app from "../../../app.js";

describe("Announcement API Endpoints", () => {
  let server;
  let baseUrl;

  beforeAll(async () => {
    // Start server on a dynamic port
    server = app.listen(0);
    const { port } = server.address();
    baseUrl = `http://localhost:${port}/api/v1/announcements`;
  });

  afterAll(async () => {
    await new Promise((resolve) => server.close(resolve));
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // 1. Create Announcement (POST /)
  describe("POST /", () => {
    it("should return 201 and created announcement data", async () => {
      const payload = { title: "New Announcement", description: "Hello world" };
      const createdObj = { id: "ann-123", ...payload, tenantId: "test-tenant-123" };
      
      mockServiceInstance.createAnnouncement.mockResolvedValue(createdObj);

      const response = await fetch(baseUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      expect(response.status).toBe(201);
      const body = await response.json();
      expect(body).toEqual({
        success: true,
        message: "Announcement created successfully.",
        data: createdObj,
      });
      expect(mockServiceInstance.createAnnouncement).toHaveBeenCalledWith(
        "test-tenant-123",
        payload
      );
    });
  });

  // 2. Get All Announcements (GET /)
  describe("GET /", () => {
    it("should return 200 and paginated announcements data", async () => {
      const mockResult = {
        total: 1,
        page: 1,
        limit: 10,
        pages: 1,
        data: [{ id: "ann-123", title: "New Announcement" }],
      };
      
      mockServiceInstance.getAllAnnouncements.mockResolvedValue(mockResult);

      const response = await fetch(`${baseUrl}?page=1&limit=10`);

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body).toEqual({
        success: true,
        ...mockResult,
      });
      expect(mockServiceInstance.getAllAnnouncements).toHaveBeenCalledWith(
        "test-tenant-123",
        { page: "1", limit: "10" }
      );
    });
  });

  // 3. Get Announcement By ID (GET /:id)
  describe("GET /:id", () => {
    it("should return 200 and announcement data", async () => {
      const mockAnnouncement = { id: "ann-123", title: "Test Title" };
      
      mockServiceInstance.getAnnouncementById.mockResolvedValue(mockAnnouncement);

      const response = await fetch(`${baseUrl}/ann-123`);

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body).toEqual({
        success: true,
        data: mockAnnouncement,
      });
      expect(mockServiceInstance.getAnnouncementById).toHaveBeenCalledWith(
        "ann-123",
        "test-tenant-123"
      );
    });
  });

  // 4. Update Announcement (PUT /:id)
  describe("PUT /:id", () => {
    it("should return 200 and updated announcement data", async () => {
      const payload = { title: "Updated Title" };
      const updatedObj = { id: "ann-123", title: "Updated Title" };
      
      mockServiceInstance.updateAnnouncement.mockResolvedValue(updatedObj);

      const response = await fetch(`${baseUrl}/ann-123`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body).toEqual({
        success: true,
        message: "Announcement updated successfully.",
        data: updatedObj,
      });
      expect(mockServiceInstance.updateAnnouncement).toHaveBeenCalledWith(
        "ann-123",
        "test-tenant-123",
        payload
      );
    });
  });

  // 5. Delete Announcement (DELETE /:id)
  describe("DELETE /:id", () => {
    it("should return 200 and delete status message", async () => {
      const mockResult = {
        message: "Announcement deleted successfully",
        deletedId: "ann-123",
      };
      
      mockServiceInstance.deleteAnnouncement.mockResolvedValue(mockResult);

      const response = await fetch(`${baseUrl}/ann-123`, {
        method: "DELETE",
      });

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body).toEqual({
        success: true,
        ...mockResult,
      });
      expect(mockServiceInstance.deleteAnnouncement).toHaveBeenCalledWith(
        "ann-123",
        "test-tenant-123"
      );
    });
  });
});
