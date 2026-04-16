import sequelize from '../config/db.js';
import '../models/index.js';
import User from '../models/Users.js';
import Role from '../models/Role.js';
import { Permission } from '../models/Permission.js';
import { RolePermission } from '../models/RolePermission.js';
import { UserRole } from '../models/UserRole.js';
import Tenant from '../models/Tenant.js';
import bcrypt from 'bcrypt';

const seedSuperAdmin = async () => {
  const transaction = await sequelize.transaction();
  
  try {
    console.log('🚀 Starting Super Admin seeding...');

    // Step 1: Get or create default tenant
    let tenant = await Tenant.findOne({
      where: { subdomain: 'default' },
      transaction,
    });

    if (!tenant) {
      console.log('📌 Creating default tenant...');
      tenant = await Tenant.create(
        {
          name: 'Default Organization',
          organizationType: 'school',
          officialEmail: 'admin@default.local',
          subdomain: 'default',
          status: 'active',
        },
        { transaction }
      );
      console.log('✅ Default tenant created:', tenant.id);
    } else {
      console.log('✅ Using existing default tenant:', tenant.id);
      // Update status to active if not already
      if (tenant.status !== 'active') {
        await tenant.update({ status: 'active' }, { transaction });
        console.log('✅ Default tenant status updated to active');
      }
    }

    // Step 2: Create or get "*" permission (all permissions)
    let superPermission = await Permission.findOne(
      {
        where: { name: '*' },
      },
      { transaction }
    );

    if (!superPermission) {
      console.log('📌 Creating "*" (super) permission...');
      superPermission = await Permission.create(
        {
          name: '*',
          action: 'manage',
          resource: '*',
          module: 'system',
          description: 'Super admin: All permissions across all modules and resources',
        },
        { transaction }
      );
      console.log('✅ "*" permission created:', superPermission.id);
    } else {
      console.log('✅ "*" permission already exists:', superPermission.id);
    }

    // Step 3: Create or get "Super Admin" role
    let superAdminRole = await Role.findOne(
      {
        where: { name: 'Super Admin', tenantId: tenant.id },
      },
      { transaction }
    );

    if (!superAdminRole) {
      console.log('📌 Creating "Super Admin" role...');
      superAdminRole = await Role.create(
        {
          name: 'Super Admin',
          roleType: 'admin',
          description: 'Super Admin - Has all permissions',
          tenantId: tenant.id,
          isSystem: true,
        },
        { transaction }
      );
      console.log('✅ "Super Admin" role created:', superAdminRole.id);
    } else {
      console.log('✅ "Super Admin" role already exists:', superAdminRole.id);
    }

    // Step 4: Link "*" permission to "Super Admin" role
    const rolePermissionExists = await RolePermission.findOne(
      {
        where: {
          roleId: superAdminRole.id,
          permissionId: superPermission.id,
        },
      },
      { transaction }
    );

    if (!rolePermissionExists) {
      console.log('📌 Linking "*" permission to "Super Admin" role...');
      await RolePermission.create(
        {
          roleId: superAdminRole.id,
          permissionId: superPermission.id,
        },
        { transaction }
      );
      console.log('✅ Permission linked to role');
    } else {
      console.log('✅ Permission already linked to role');
    }

    // Step 5: Create or get super admin user
    let superAdminUser = await User.findOne(
      {
        where: { email: 'superadmin@system.local' },
      },
      { transaction }
    );

    if (!superAdminUser) {
      console.log('📌 Creating super admin user...');
      const hashedPassword = await bcrypt.hash('SuperAdmin@123', 10);
      
      superAdminUser = await User.create(
        {
          email: 'superadmin@system.local',
          password: hashedPassword,
          firstName: 'Super',
          lastName: 'Admin',
          userType: 'super_admin',
          status: 'active',
          tenantId: tenant.id,
          phone: '+1-000-000-0000',
        },
        { transaction }
      );
      console.log('✅ Super admin user created:', superAdminUser.id);
      console.log('📧 Email: superadmin@system.local');
      console.log('🔑 Default Password: SuperAdmin@123');
    } else {
      console.log('✅ Super admin user already exists:', superAdminUser.id);
    }

    // Step 6: Link user to "Super Admin" role
    const userRoleExists = await UserRole.findOne(
      {
        where: {
          userId: superAdminUser.id,
          roleId: superAdminRole.id,
        },
      },
      { transaction }
    );

    if (!userRoleExists) {
      console.log('📌 Linking user to "Super Admin" role...');
      await UserRole.create(
        {
          userId: superAdminUser.id,
          roleId: superAdminRole.id,
        },
        { transaction }
      );
      console.log('✅ User linked to role');
    } else {
      console.log('✅ User already linked to role');
    }

    await transaction.commit();
    
    console.log('\n✨ Super Admin seeding completed successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 SUPER ADMIN DETAILS:');
    console.log(`  Email: superadmin@system.local`);
    console.log(`  Password: SuperAdmin@123`);
    console.log(`  Role: Super Admin`);
    console.log(`  Permission: * (All Permissions)`);
    console.log(`  Organization: ${tenant.name}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    process.exit(0);
  } catch (err) {
    await transaction.rollback();
    console.error('\n❌ Super Admin seeding failed:', err.message);
    console.error(err);
    process.exit(1);
  }
};

seedSuperAdmin();
