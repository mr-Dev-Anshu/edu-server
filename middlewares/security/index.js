import { Permission, Role, Tenant } from "../../models/index.js";
import jwt from 'jsonwebtoken'
export const identifyUser = async (req, res, next) => {
  try {
    const token = req.cookies.token || req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: "Login required" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; 

    const tenant_id = decoded.tenantId;
     console.log("this is tenantId --> "  , tenant_id , "and " , decoded)
    let tenant = null;
    if (tenant_id) {
      tenant = await Tenant.findOne({ where: { id:tenant_id, status: 'active' } });
      if (!tenant) return res.status(404).json({ message: "Institute not found" });
      req.tenantId = tenant.id;
    }
     const isSuperAdmin = req.user.roleId ==  process.env.SUPER_ADMIN_ROLE_ID ; 
    if (!isSuperAdmin ) {
      if (!tenant) {
        return res.status(400).json({ message: "Tenant context required" });
      }

      if (req.user.tenantId !== tenant.id) {
        return res.status(403).json({ message: "Wrong request" });
      }
    }

    if (isSuperAdmin) {
      req.user.permissions = ['*']; 
    } else {
      const roleWithPermissions = await Role.findOne({
        where: { roleType: req.user.userType, tenantId: tenant.id },
        include: [{ model: Permission, as: 'permissions', attributes: ['name'] }]
      });
      req.user.permissions = roleWithPermissions?.permissions?.map(p => p.name) || [];
    }

    next();
  } catch (err) {
    console.log(err)
    return res.status(401).json({ message: "Session invalid" });
  }
};



export const checkPermission = (requiredPermission) => {
  return (req, res, next) => {
    if (!req.user || !req.user.permissions) {
      return res.status(500).json({ message: "Internal Auth Error: Permissions not resolved" });
    }
    if (req.user.permissions.includes('*')) {
      return next();
    }
    if (!req.user.permissions.includes(requiredPermission)) {
      return res.status(403).json({ 
        message: `Forbidden: You do not have the '${requiredPermission}' permission` 
      });
    }

    next();
  };
};