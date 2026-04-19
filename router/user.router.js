import express from "express";
import { UserController } from "../controllers/user.controller.js";
import {
  createUserValidator,
  updateUserValidator,
  updateUserStatusValidator,
  assignUserRolesValidator,
  removeUserRolesValidator,
  loginValidator,
} from "../middlewares/validators/user.validator.js";
import { checkPermission, identifyUser } from "../middlewares/security/index.js";

const router = express.Router();
const ctrl = new UserController();

// ✅ Static routes FIRST
router.route("/").get(identifyUser, checkPermission("read:user"),ctrl.getAll);
router.route("/").post(identifyUser, createUserValidator, checkPermission("create:user"), ctrl.create);
router.route("/login").post(loginValidator, ctrl.login);
router.route("/refresh").post(ctrl.refreshToken);
router.route("/logout").post( identifyUser ,  ctrl.logout);
router.route("/active").get(identifyUser, ctrl.getActive);
router.route("/type/:userType").get(identifyUser, ctrl.getByType);

// ✅ Dynamic routes LAST
router.route("/:id").get(identifyUser, checkPermission("read:user"),ctrl.getById);
router.route("/:id").put(identifyUser, checkPermission("update:user"),updateUserValidator, ctrl.update);
router.route("/:id").delete(identifyUser, checkPermission("delete:user"),ctrl.delete);
router.route("/:id/restore").post(identifyUser, checkPermission("create:user"),ctrl.restore);
router.route("/:id/status").put(identifyUser, checkPermission("read:user"),updateUserStatusValidator, ctrl.updateStatus);
router.route("/:id/verify-email").post(identifyUser, ctrl.verifyEmail);


export default router;
