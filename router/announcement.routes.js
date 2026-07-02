import express from "express";
import {
  createAnnouncement,
  getAllAnnouncements,
  getAnnouncementById,
  updateAnnouncement,
  deleteAnnouncement,
} from "../controllers/announcement.controller.js";
import {
  identifyUser,
  checkPermission,
} from "../middlewares/security/index.js";

const router = express.Router();

// Create
router.post(
  "/",
  identifyUser,
  checkPermission("create:announcements"),
  createAnnouncement,
);

// Read All
router.get(
  "/",
  identifyUser,
  checkPermission("read:announcements"),
  getAllAnnouncements,
);

// Read By ID
router.get(
  "/:id",
  identifyUser,
  checkPermission("read:announcements"),
  getAnnouncementById,
);

// Update
router.put(
  "/:id",
  identifyUser,
  checkPermission("update:announcements"),
  updateAnnouncement,
);

// Delete
router.delete(
  "/:id",
  identifyUser,
  checkPermission("delete:announcements"),
  deleteAnnouncement,
);

export default router;
