import express from "express";
import { ProductController } from "../controllers/product.controller.js";

const router = express.Router();
const controller = new ProductController();

router.post("/", controller.create);
router.get("/", controller.getAll);
router.get("/:id", controller.getById);
router.put("/:id", controller.update);
router.delete("/:id", controller.delete);

export default router;
