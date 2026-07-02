import { AnnouncementRepository } from "../repositories/announcement.repository.js";
import { AppError } from "../utils/AppError.js";
import { BaseService } from "./base.service.js";

const announcementRepo = new AnnouncementRepository();

export class AnnouncementService extends BaseService {
  constructor() {
    super(announcementRepo);
  }

  /**
   * CREATE ANNOUNCEMENT
   */
  async createAnnouncement(tenantId, payload) {
    const {
      title,
      description,
      priority,
      targetAudience,
      publishedAt,
      expiresAt,
      isActive,
    } = payload;

    if (!title?.trim()) {
      throw new AppError("Title is required", 400);
    }

    if (!description?.trim()) {
      throw new AppError("Description is required", 400);
    }

    const announcement = await announcementRepo.create({
      tenantId,
      title: title.trim(),
      description: description.trim(),
      priority: priority || "medium",
      targetAudience: targetAudience || "all",
      publishedAt: publishedAt || null,
      expiresAt: expiresAt || null,
      isActive: isActive ?? true,
    });

    return this.formatAnnouncementResponse(announcement);
  }

  /**
   * GET ALL ANNOUNCEMENTS
   */
  async getAllAnnouncements(tenantId, query) {
    const page =
      Number.parseInt(query.page, 10) > 0 ? Number.parseInt(query.page, 10) : 1;

    const limit =
      Number.parseInt(query.limit, 10) > 0
        ? Number.parseInt(query.limit, 10)
        : 10;

    const filters = {};

    if (query.priority) {
      filters.priority = query.priority;
    }

    if (query.targetAudience) {
      filters.targetAudience = query.targetAudience;
    }

    if (query.isActive !== undefined) {
      filters.isActive = query.isActive;
    }

    const result = await announcementRepo.findWithPagination(
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
      data: result.data.map((item) => this.formatAnnouncementResponse(item)),
    };
  }

  /**
   * GET ANNOUNCEMENT BY ID
   */
  async getAnnouncementById(id, tenantId) {
    const announcement = await announcementRepo.findById(id, tenantId);

    if (!announcement) {
      throw new AppError("Announcement not found", 404);
    }

    return this.formatAnnouncementResponse(announcement);
  }

  /**
   * UPDATE ANNOUNCEMENT
   */
  async updateAnnouncement(id, tenantId, payload) {
    const announcement = await announcementRepo.findById(id, tenantId);

    if (!announcement) {
      throw new AppError("Announcement not found", 404);
    }

    const updates = {};

    if (payload.title !== undefined) {
      updates.title = payload.title.trim();
    }

    if (payload.description !== undefined) {
      updates.description = payload.description.trim();
    }

    if (payload.priority !== undefined) {
      updates.priority = payload.priority;
    }

    if (payload.targetAudience !== undefined) {
      updates.targetAudience = payload.targetAudience;
    }

    if (payload.publishedAt !== undefined) {
      updates.publishedAt = payload.publishedAt;
    }

    if (payload.expiresAt !== undefined) {
      updates.expiresAt = payload.expiresAt;
    }

    if (payload.isActive !== undefined) {
      updates.isActive = payload.isActive;
    }

    await announcementRepo.update(id, tenantId, updates);

    const updatedAnnouncement = await announcementRepo.findById(id, tenantId);

    return this.formatAnnouncementResponse(updatedAnnouncement);
  }

  /**
   * DELETE ANNOUNCEMENT
   */
  async deleteAnnouncement(id, tenantId) {
    const announcement = await announcementRepo.findById(id, tenantId);

    if (!announcement) {
      throw new AppError("Announcement not found", 404);
    }

    await announcementRepo.delete(id, tenantId);

    return {
      message: "Announcement deleted successfully",
      deletedId: id,
    };
  }

  /**
   * SEARCH ANNOUNCEMENTS
   */
  async searchAnnouncements(tenantId, query) {
    const page =
      Number.parseInt(query.page, 10) > 0 ? Number.parseInt(query.page, 10) : 1;

    const limit =
      Number.parseInt(query.limit, 10) > 0
        ? Number.parseInt(query.limit, 10)
        : 10;

    const searchTerm = query.q || query.search || "";

    if (searchTerm.length < 2) {
      throw new AppError("Search term must be at least 2 characters", 400);
    }

    const result = await announcementRepo.searchByTitle(
      tenantId,
      searchTerm,
      page,
      limit,
    );

    return {
      total: result.total,
      page: result.page,
      limit: result.limit,
      pages: result.pages,
      data: result.data.map((item) => this.formatAnnouncementResponse(item)),
    };
  }

  /**
   * FORMAT RESPONSE
   */
  formatAnnouncementResponse(announcement) {
    if (!announcement) return null;

    return {
      id: announcement.id,
      title: announcement.title,
      description: announcement.description,
      priority: announcement.priority,
      targetAudience: announcement.targetAudience,
      publishedAt: announcement.publishedAt,
      expiresAt: announcement.expiresAt,
      isActive: announcement.isActive,
      createdAt: announcement.createdAt,
      updatedAt: announcement.updatedAt,
    };
  }
}

export const announcementService = new AnnouncementService();
