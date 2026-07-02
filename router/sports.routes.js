import express from "express";
import sportController from "../controllers/sports.controller.js";

const router = express.Router();

// Create Sport
router.post("/", sportController.createSport);

// Get All Sports
router.get("/", sportController.getAllSports);

// Search Sports
router.get("/search", sportController.searchSports);

// Get Sports By Status
router.get("/status/:status", sportController.getSportsByStatus);

// Get Sport By Id
router.get("/:id", sportController.getSportById);

// Update Sport
router.put("/:id", sportController.updateSport);

// Delete Sport
router.delete("/:id", sportController.deleteSport);

export default router;
