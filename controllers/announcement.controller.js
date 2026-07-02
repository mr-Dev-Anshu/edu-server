import { announcementService } from "../services/announcement.service.js";
import { catchAsync } from "../utils/catchAsync.js";

// Create Announcement
export const createAnnouncement = catchAsync(async (req, res) => {
  const announcement = await announcementService.createAnnouncement(
    req.tenantId,
    req.body,
  );

  return res.status(201).json({
    success: true,
    message: "Announcement created successfully.",
    data: announcement,
  });
});

// Get All Announcements
export const getAllAnnouncements = catchAsync(async (req, res) => {
  const announcements = await announcementService.getAllAnnouncements(
    req.tenantId,
    req.query || {},
  );

  return res.status(200).json({
    success: true,
    ...announcements,
  });
});

// Get Announcement By ID
export const getAnnouncementById = catchAsync(async (req, res) => {
  const { id } = req.params;
  const announcement = await announcementService.getAnnouncementById(
    id,
    req.tenantId,
  );

  return res.status(200).json({
    success: true,
    data: announcement,
  });
});

// Update Announcement
export const updateAnnouncement = catchAsync(async (req, res) => {
  const { id } = req.params;
  const announcement = await announcementService.updateAnnouncement(
    id,
    req.tenantId,
    req.body,
  );

  return res.status(200).json({
    success: true,
    message: "Announcement updated successfully.",
    data: announcement,
  });
});

// Delete Announcement
export const deleteAnnouncement = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await announcementService.deleteAnnouncement(id, req.tenantId);

  return res.status(200).json({
    success: true,
    ...result,
  });
});
