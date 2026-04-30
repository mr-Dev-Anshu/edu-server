import { Permission, Role, Tenant, User } from "../../models/index.js";
import { JwtHelper } from "../../utils/jwt.js";

export const identifyUser = async (req, res, next) => {
  try {
    const bearerToken = req.headers.authorization?.startsWith("Bearer ")
      ? req.headers.authorization.split(" ")[1]
      : null;
    const token = bearerToken || req.cookies.token;
    if (!token) return res.status(401).json({ message: "Login required" });

    const decoded = JwtHelper.verifyToken(token);
    req.user = decoded;

    const tenant_id = decoded.tenantId;
    console.log("this is tenantId --> ", tenant_id, "and ", decoded);
    let tenant = null;
    if (tenant_id) {
      tenant = await Tenant.findOne({
        where: { id: tenant_id, status: "active" },
      });
      if (!tenant)
        return res.status(404).json({ message: "Institute not found" });
      req.tenantId = tenant.id;
    }
    const isSuperAdmin = req.user.roleId == process.env.SUPER_ADMIN_ROLE_ID;
    if (!isSuperAdmin) {
      if (!tenant) {
        return res.status(400).json({ message: "Tenant context required" });
      }

      if (req.user.tenantId !== tenant.id) {
        return res.status(403).json({ message: "Wrong request" });
      }
    }
        console.log(req.user , 
          "this is user data "
        )
    if (isSuperAdmin) {
      req.user.permissions = ["*"];
    } else {
      const userWithRoles = await User.findOne({
        where: { id: req.user.id, tenantId: tenant.id },
        include: [{
          model: Role,
          as: "roles",
          where: { tenantId: tenant.id },
          required: false,
          attributes: ["id"],
          through: { attributes: [] },
          include: [{ model: Permission, as: "permissions", attributes: ["name"], through: { attributes: [] } }],
        }],
      });
      const roles = userWithRoles?.roles || [];
      const permissionNames = roles.flatMap((role) =>
        (role.permissions || []).map((permission) => permission.name),
      );
      req.user.permissions = [...new Set(permissionNames)];
    }

    next();
  } catch (err) {
    console.log(err);
    return res.status(401).json({ message: "Session invalid" });
  }
};

export const checkPermission = (requiredPermission) => {
  return (req, res, next) => {
    next();
  };
};


