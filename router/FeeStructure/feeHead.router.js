import express from "express";
import { FeeHeadController } from "../../controllers/FeeStructure/feeHead.controller.js";
import {createFeeHeadValidator, updateFeeHeadValidator, feeHeadIdValidator} from "../../middlewares/validators/FeeStructure/feeHead.validator.js";
import {identifyUser, checkPermission} from "../../middlewares/security/index.js";

const router = express.Router();
const ctrl = new FeeHeadController();

// Create FeeHead
router.post("/", identifyUser, checkPermission("create:fee-head"), createFeeHeadValidator, ctrl.create);

// Get all FeeHeads
router.get("/", identifyUser, ctrl.getAll);

// Get specific FeeHead by ID
router.get("/:id", identifyUser, feeHeadIdValidator, ctrl.getOne);

// Update FeeHead
router.patch("/:id", identifyUser, checkPermission("update:fee-head"), feeHeadIdValidator, updateFeeHeadValidator, ctrl.update);

// Delete FeeHead
router.delete("/:id", identifyUser, checkPermission("delete:fee-head"), feeHeadIdValidator, ctrl.delete);

export default router;
