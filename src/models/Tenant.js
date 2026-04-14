import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const Tenant = sequelize.define('Tenant', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    
    // --- Vertical Identification ---
    organizationType: {
        type: DataTypes.ENUM('school', 'college', 'university', 'coaching', 'preschool', 'other'),
        allowNull: false,
        defaultValue: 'school',
        // index: true
    },

    // --- Branding & Identity ---
    name: {
        type: DataTypes.STRING(255),
        allowNull: false,
        validate: { len: [3, 255] }
    },
    officialEmail: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: { isEmail: true }
    },
    subdomain: {
        type: DataTypes.STRING(63),
        allowNull: false,
        unique: true,
        validate: {
            is: /^[a-z0-9-]+$/i,
            notIn: [['admin', 'www', 'api', 'support', 'billing', 'master']]
        }
    },

    // --- Dynamic Configuration ---
    // This is where "College" vs "School" logic lives
    settings: {
        type: DataTypes.JSONB,
        defaultValue: {
            academicStructure: 'k12', // k12 for schools, semester for colleges
            hasHostel: false,
            hasTransport: false,
            gradingSystem: 'percentage', // cgpa, gpa, percentage
            timezone: 'Asia/Kolkata',
            currency: 'INR'
        }
    },

    address: {
        type: DataTypes.JSONB,
        defaultValue: {}
    },

    contactInfo: {
        type: DataTypes.JSONB,
        defaultValue: {}
    },

    themeConfig: {
        type: DataTypes.JSONB,
        defaultValue: {
            primaryColor: '#3B82F6',
            secondaryColor: '#1E40AF',
            accentColor: '#0F172A',
            fontFamily: 'Inter'
        }
    },

    brandingAssets: {
        type: DataTypes.JSONB,
        defaultValue: {
            logoUrl: null,
            faviconUrl: null,
            coverImageUrl: null
        }
    },

    portalUrl: {
        type: DataTypes.STRING,
        allowNull: true
    },

    // --- Compliance & Registration ---
    registrationNumber: {
        type: DataTypes.STRING,
        allowNull: true, // Government ID/License
    },

    // --- Lifecycle & Customization ---
    status: {
        type: DataTypes.ENUM('onboarding', 'active', 'suspended', 'archived'),
        defaultValue: 'onboarding'
    },
    customFields: {
        type: DataTypes.JSONB,
        defaultValue: {}
    },
    metadata: {
        type: DataTypes.JSONB,
        defaultValue: {}
    }
}, {
    timestamps: true,
    paranoid: true,
    underscored: true,
    tableName: 'tenants', // Renamed from schools to reflect the multi-vertical nature
    // indexes: [
    //     { unique: true, fields: ['subdomain'] },
    //     { unique: true, fields: ['official_email'] },
    //     { fields: ['organization_type'] },
    //     { fields: ['status'] },
    //     { fields: ['portal_url'] }
    // ]
});

export default Tenant;
