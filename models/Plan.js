import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const Plan = sequelize.define('Plan', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false, 
    },
    slug: {
        type: DataTypes.STRING,
        unique: true, 
        allowNull: false,
    },
    description: {
        type: DataTypes.TEXT,
    },
    monthlyPrice: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.00
    },
    yearlyPrice: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.00
    },
    currency: {
        type: DataTypes.STRING(3),
        defaultValue: 'INR'
    },
    
    features: {
        type: DataTypes.JSONB,
        defaultValue: {
            maxStudents: 100,
            hasTransport: false,
            hasLMS: false,
            hasExams: true,
            storageLimitGb: 5
        }
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    }
}, {
    timestamps: true,
    underscored: true,
    tableName: 'plans'
});

export default Plan;