import express from "express";
import { DriverController } from "../../controllers/transport/driver.controller.js";
import { driverIdValidator, createDriverValidator, updateDriverValidator } from "../../middlewares/validators/transport/driver.validator.js";
import { identifyUser, checkPermission } from "../../middlewares/security/index.js";

const router = express.Router();
const ctrl = new DriverController();

// Create driver
router.post("/create", identifyUser, checkPermission("create:driver"), createDriverValidator, ctrl.create);

// Get all drivers
router.get("/", identifyUser, checkPermission("read:driver"), ctrl.getAll);

// Get specific driver by ID
router.get("/:id", identifyUser, checkPermission("read:driver"), driverIdValidator, ctrl.getOne);

// Update driver
router.patch("/:id", identifyUser, checkPermission("update:driver"), driverIdValidator, updateDriverValidator, ctrl.update);

// Delete driver
router.delete("/:id", identifyUser, checkPermission("delete:driver"), driverIdValidator, ctrl.delete);

export default router;
