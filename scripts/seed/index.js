import 'dotenv/config';
import crypto from 'crypto';
import sequelize, { connectWithRetry } from '../../config/db.js';
import User from '../../models/Users.js';

 export const createSuperAdmin = async () => {
    try {
        console.log("Connecting to the database...");
        await connectWithRetry();
        await sequelize.sync({ alter: true });
        console.log("✅ Tables synced successfully.");
        
        const superAdminEmail = 'superadmin@edu-server.com';
        
        const existingAdmin = await User.findOne({ where: { email: superAdminEmail } });
        if (existingAdmin) {
            console.log(`\n⚠️ Super Admin already exists with email: ${superAdminEmail}`);
            process.exit(0);
        }

        console.log("Creating Super Admin...");
        const superAdmin = await User.create({
            firstName: 'System',
            lastName: 'Super Admin',
            email: superAdminEmail,
            userType: 'super_admin',
            status: 'active',
            emailVerified: true,
            cognitoSub: crypto.randomUUID(),
        });

        console.log('\n✅ Super Admin created successfully!');
        console.log('ID:', superAdmin.id);
        console.log('Email:', superAdmin.email);
        console.log('Role:', superAdmin.userType);
        
        process.exit(0);
    } catch (error) {
        console.error('\n❌ Failed to create Super Admin:', error);
        process.exit(1);
    }
};

createSuperAdmin();