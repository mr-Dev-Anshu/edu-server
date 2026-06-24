import express from "express";
import { FeeStructureItemController } from "../../controllers/FeeStructure/feeStructureItem.controller.js";
import {
  createFeeStructureItemValidator,
  updateFeeStructureItemValidator,
  feeStructureItemIdValidator,
  feeStructureIdValidator,
} from "../../middlewares/validators/FeeStructure/feeStructureItem.validator.js";
import { identifyUser, checkPermission } from "../../middlewares/security/index.js";

const router = express.Router();
const ctrl = new FeeStructureItemController();

// Create mapping (add FeeHead to FeeStructure)
router.post("/", identifyUser, checkPermission("create:fee-structure-item"), createFeeStructureItemValidator, ctrl.create);

// Get all items with pagination and filters
router.get("/", identifyUser, ctrl.getAll);

// Get all items for a specific FeeStructure
router.get("/by-structure/:feeStructureId", identifyUser, feeStructureIdValidator, ctrl.getByFeeStructure);

// Get specific item by ID
router.get("/:id", identifyUser, feeStructureItemIdValidator, ctrl.getOne);

// Update item (amount and isOptional)
router.patch("/:id", identifyUser, checkPermission("update:fee-structure-item"), feeStructureItemIdValidator, updateFeeStructureItemValidator, ctrl.update);

// Delete item
router.delete("/:id", identifyUser, checkPermission("delete:fee-structure-item"), feeStructureItemIdValidator, ctrl.delete);

// Delete all items for a FeeStructure
router.delete("/by-structure/:feeStructureId", identifyUser, checkPermission("delete:fee-structure-item"), feeStructureIdValidator, ctrl.deleteByFeeStructure);

export default router;
