import { Permission, Role, Tenant } from "../../models/index.js";
import { AppError } from "../../utils/AppError.js";
import { JwtHelper } from "../../utils/jwt.js";

export const identifyUser = async (req, res, next) => {
  try {
    const token = req.cookies.token || req.headers.authorization?.split(" ")[1];
    if (!token) return next(new AppError("Login required", 401));

    const decoded = JwtHelper.verifyToken(token);
    req.user = decoded;

    const tenant_id = decoded.tenantId;
    console.log("this is tenantId --> ", tenant_id, "and ", decoded);
    let tenant = null;
    if (tenant_id) {
      tenant = await Tenant.findOne({
        where: { id: tenant_id, status: "active" },
      });
      if (!tenant) return next(new AppError("Institute not found", 404));
      req.tenantId = tenant.id;
    }
    const isSuperAdmin = req.user.roleId == process.env.SUPER_ADMIN_ROLE_ID;
    if (!isSuperAdmin) {
      if (!tenant) {
        return next(new AppError("Tenant context required", 400));
      }

      if (req.user.tenantId !== tenant.id) {
        return next(new AppError("Wrong request", 403));
      }
    }
        console.log(req.user , 
          "this is user data "
        )
    if (isSuperAdmin) {
      req.user.permissions = ["*"];
    } else {
      const roleWithPermissions = await Role.findOne({
        where: { id: req.user.roleId, tenantId: tenant.id },
        include: [
          { model: Permission, as: "permissions", attributes: ["name"] },
        ],
      });
      req.user.permissions =
        roleWithPermissions?.permissions?.map((p) => p.name) || [];
    }

    next();
  } catch (err) {
    console.log(err);
    return next(new AppError("Session invalid", 401));
  }
};

export const checkPermission = (requiredPermission) => {
  return (req, res, next) => {
    if (!req.user || !req.user.permissions) {
      return next(new AppError("Internal Auth Error: Permissions not resolved", 500));
    }
    if (req.user.permissions.includes("*")) {
      return next();
    }
    console.log(req.user.permissions);
    console.log(requiredPermission);
    if (!req.user.permissions.includes(requiredPermission)) {
      return next(
        new AppError(`Forbidden: You do not have the '${requiredPermission}' permission`, 403),
      );
    }

    next();
  };
};


