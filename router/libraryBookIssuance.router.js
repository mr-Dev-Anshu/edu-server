import express from "express";
import { LibraryBookIssuanceController } from "../controllers/libraryBookIssuance.controller.js";
import {
  libraryBookIssuanceIdValidator,
  createLibraryBookIssuanceValidator,
  updateLibraryBookIssuanceValidator,
} from "../middlewares/validators/libraryBookIssuance.validator.js";
import { identifyUser, checkPermission } from "../middlewares/security/index.js";

const router = express.Router();
const ctrl = new LibraryBookIssuanceController();

router.post("/", identifyUser, checkPermission("create:library-book-issuance"), createLibraryBookIssuanceValidator, ctrl.create);

router.get("/", identifyUser, checkPermission("read:library-book-issuance"), ctrl.getAll);

router.get("/search", identifyUser, checkPermission("read:library-book-issuance"), ctrl.search);

router.get("/:id", identifyUser, checkPermission("read:library-book-issuance"), libraryBookIssuanceIdValidator, ctrl.getOne);

router.patch("/:id", identifyUser, checkPermission("update:library-book-issuance"), libraryBookIssuanceIdValidator, updateLibraryBookIssuanceValidator, ctrl.update);

router.delete("/:id", identifyUser, checkPermission("delete:library-book-issuance"), libraryBookIssuanceIdValidator, ctrl.delete);

export default router;
