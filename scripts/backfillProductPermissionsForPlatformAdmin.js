import sequelize from "../config/db.js";
import "../models/index.js";
import { Op } from "sequelize";
import { Permission, Role, RolePermission } from "../models/index.js";

const PRODUCT_PERMISSION_DEFINITIONS = [
  { name: "create:product", action: "create", resource: "product", module: "product", description: "Create products" },
  { name: "read:product", action: "read", resource: "product", module: "product", description: "Read products" },
  { name: "update:product", action: "update", resource: "product", module: "product", description: "Update products" },
  { name: "delete:product", action: "delete", resource: "product", module: "product", description: "Delete products" },
];

const backfill = async () => {
  const transaction = await sequelize.transaction();

  try {
    const permissionNames = PRODUCT_PERMISSION_DEFINITIONS.map((item) => item.name);
    const existingPermissions = await Permission.findAll({
      where: { name: permissionNames },
      transaction,
    });

    const permissionByName = new Map(existingPermissions.map((permission) => [permission.name, permission]));
    const missingDefinitions = PRODUCT_PERMISSION_DEFINITIONS.filter(
      (definition) => !permissionByName.has(definition.name),
    );

    if (missingDefinitions.length) {
      const createdPermissions = await Permission.bulkCreate(missingDefinitions, { transaction });
      for (const permission of createdPermissions) {
        permissionByName.set(permission.name, permission);
      }
    }

    const productPermissionIds = [...permissionByName.values()].map((permission) => permission.id);
    if (!productPermissionIds.length) {
      throw new Error("No product permissions available for backfill");
    }

    const platformAdminRoles = await Role.findAll({
      where: {
        roleType: "platform",
        name: { [Op.iLike]: "platform admin" },
      },
      attributes: ["id", "tenantId", "name"],
      transaction,
    });

    let linksCreated = 0;
    for (const role of platformAdminRoles) {
      const existingLinks = await RolePermission.findAll({
        where: {
          roleId: role.id,
          permissionId: productPermissionIds,
        },
        attributes: ["permissionId"],
        transaction,
      });

      const existingIds = new Set(existingLinks.map((link) => link.permissionId));
      const missingIds = productPermissionIds.filter((permissionId) => !existingIds.has(permissionId));

      if (!missingIds.length) {
        continue;
      }

      await RolePermission.bulkCreate(
        missingIds.map((permissionId) => ({ roleId: role.id, permissionId })),
        { transaction },
      );
      linksCreated += missingIds.length;
    }

    await transaction.commit();

    console.log("Backfill completed.");
    console.log("Platform admin roles scanned:", platformAdminRoles.length);
    console.log("Role-permission links created:", linksCreated);
    process.exit(0);
  } catch (error) {
    if (!transaction.finished) {
      await transaction.rollback();
    }
    console.error("Backfill failed:", error.message);
    process.exit(1);
  }
};

backfill();
