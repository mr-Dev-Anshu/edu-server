import { describe, it, expect, beforeEach, vi } from "vitest";
import { AppError } from "../../../utils/AppError.js";

// Define hoisted mock variables so they are available in vi.mock
const { mockRepoInstance } = vi.hoisted(() => {
  return {
    mockRepoInstance: {
      create: vi.fn(),
      findById: vi.fn(),
      findWithPagination: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      searchByTitle: vi.fn(),
    },
  };
});

// Mock the AnnouncementRepository class to return the mockRepoInstance
vi.mock("../../../repositories/announcement.repository.js", () => {
  return {
    AnnouncementRepository: class {
      constructor() {
        return mockRepoInstance;
      }
    },
  };
});

// Import the service after mocking
import { announcementService } from "../../../services/announcement.service.js";

describe("AnnouncementService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createAnnouncement", () => {
    it("should successfully create an announcement with default targetAudience and priority", async () => {
      const payload = {
        title: "Test Announcement",
        description: "Test Description",
      };
      const tenantId = "tenant-123";
      const createdAnnouncement = {
        id: "announcement-abc",
        tenantId,
        title: "Test Announcement",
        description: "Test Description",
        priority: "medium",
        targetAudience: "all",
        publishedAt: null,
        expiresAt: null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRepoInstance.create.mockResolvedValue(createdAnnouncement);

      const result = await announcementService.createAnnouncement(
        tenantId,
        payload,
      );

      expect(mockRepoInstance.create).toHaveBeenCalledWith({
        tenantId,
        title: "Test Announcement",
        description: "Test Description",
        priority: "medium",
        targetAudience: "all",
        publishedAt: null,
        expiresAt: null,
        isActive: true,
      });

      expect(result).toEqual({
        id: "announcement-abc",
        title: "Test Announcement",
        description: "Test Description",
        priority: "medium",
        targetAudience: "all",
        publishedAt: null,
        expiresAt: null,
        isActive: true,
        createdAt: createdAnnouncement.createdAt,
        updatedAt: createdAnnouncement.updatedAt,
      });
    });

    it("should throw AppError if title is missing", async () => {
      const payload = { description: "Test Description" };
      await expect(
        announcementService.createAnnouncement("tenant-123", payload),
      ).rejects.toThrowError(new AppError("Title is required", 400));
    });

    it("should throw AppError if description is missing", async () => {
      const payload = { title: "Test Title" };
      await expect(
        announcementService.createAnnouncement("tenant-123", payload),
      ).rejects.toThrowError(new AppError("Description is required", 400));
    });
  });

  describe("getAllAnnouncements", () => {
    it("should return paginated announcements", async () => {
      const tenantId = "tenant-123";
      const query = { page: "1", limit: "5", priority: "high" };
      const mockResult = {
        total: 1,
        page: 1,
        limit: 5,
        pages: 1,
        data: [
          {
            id: "ann-1",
            title: "Ann 1",
            description: "Desc 1",
            priority: "high",
            targetAudience: "all",
            isActive: true,
          },
        ],
      };

      mockRepoInstance.findWithPagination.mockResolvedValue(mockResult);

      const result = await announcementService.getAllAnnouncements(
        tenantId,
        query,
      );

      expect(mockRepoInstance.findWithPagination).toHaveBeenCalledWith(
        tenantId,
        { priority: "high" },
        1,
        5,
      );

      expect(result.total).toBe(1);
      expect(result.data[0].title).toBe("Ann 1");
    });
  });

  describe("getAnnouncementById", () => {
    it("should return announcement if found", async () => {
      const tenantId = "tenant-123";
      const id = "ann-1";
      const mockAnn = { id, title: "Title", description: "Desc", tenantId };

      mockRepoInstance.findById.mockResolvedValue(mockAnn);

      const result = await announcementService.getAnnouncementById(
        id,
        tenantId,
      );

      expect(mockRepoInstance.findById).toHaveBeenCalledWith(id, tenantId);
      expect(result.id).toBe(id);
    });

    it("should throw 404 AppError if not found", async () => {
      mockRepoInstance.findById.mockResolvedValue(null);

      await expect(
        announcementService.getAnnouncementById("nonexistent", "tenant-123"),
      ).rejects.toThrowError(new AppError("Announcement not found", 404));
    });
  });

  describe("updateAnnouncement", () => {
    it("should update and return updated announcement", async () => {
      const tenantId = "tenant-123";
      const id = "ann-1";
      const existing = {
        id,
        title: "Old Title",
        description: "Desc",
        tenantId,
      };
      const updated = { id, title: "New Title", description: "Desc", tenantId };

      mockRepoInstance.findById
        .mockResolvedValueOnce(existing)
        .mockResolvedValueOnce(updated);
      mockRepoInstance.update.mockResolvedValue([1]);

      const result = await announcementService.updateAnnouncement(
        id,
        tenantId,
        {
          title: "New Title",
        },
      );

      expect(mockRepoInstance.findById).toHaveBeenNthCalledWith(
        1,
        id,
        tenantId,
      );
      expect(mockRepoInstance.update).toHaveBeenCalledWith(id, tenantId, {
        title: "New Title",
      });
      expect(mockRepoInstance.findById).toHaveBeenNthCalledWith(
        2,
        id,
        tenantId,
      );
      expect(result.title).toBe("New Title");
    });

    it("should throw 404 AppError if updating nonexistent announcement", async () => {
      mockRepoInstance.findById.mockResolvedValue(null);

      await expect(
        announcementService.updateAnnouncement("nonexistent", "tenant-123", {
          title: "New",
        }),
      ).rejects.toThrowError(new AppError("Announcement not found", 404));
    });
  });

  describe("deleteAnnouncement", () => {
    it("should delete announcement if it exists", async () => {
      const tenantId = "tenant-123";
      const id = "ann-1";
      const existing = { id, title: "Title", description: "Desc", tenantId };

      mockRepoInstance.findById.mockResolvedValue(existing);
      mockRepoInstance.delete.mockResolvedValue(1);

      const result = await announcementService.deleteAnnouncement(id, tenantId);

      expect(mockRepoInstance.findById).toHaveBeenCalledWith(id, tenantId);
      expect(mockRepoInstance.delete).toHaveBeenCalledWith(id, tenantId);
      expect(result.deletedId).toBe(id);
    });

    it("should throw 404 AppError if deleting nonexistent announcement", async () => {
      mockRepoInstance.findById.mockResolvedValue(null);

      await expect(
        announcementService.deleteAnnouncement("nonexistent", "tenant-123"),
      ).rejects.toThrowError(new AppError("Announcement not found", 404));
    });
  });

  describe("searchAnnouncements", () => {
    it("should return search results", async () => {
      const tenantId = "tenant-123";
      const query = { q: "test", page: "1", limit: "10" };
      const mockResult = {
        total: 1,
        page: 1,
        limit: 10,
        pages: 1,
        data: [
          { id: "ann-1", title: "Test Announcement", description: "Desc" },
        ],
      };

      mockRepoInstance.searchByTitle.mockResolvedValue(mockResult);

      const result = await announcementService.searchAnnouncements(
        tenantId,
        query,
      );

      expect(mockRepoInstance.searchByTitle).toHaveBeenCalledWith(
        tenantId,
        "test",
        1,
        10,
      );
      expect(result.data[0].title).toBe("Test Announcement");
    });

    it("should throw 400 AppError if search term is less than 2 characters", async () => {
      const tenantId = "tenant-123";
      const query = { q: "a" };

      await expect(
        announcementService.searchAnnouncements(tenantId, query),
      ).rejects.toThrowError(
        new AppError("Search term must be at least 2 characters", 400),
      );
    });
  });
});
