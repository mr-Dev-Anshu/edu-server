import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const Subscription = sequelize.define('Subscription', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    tenantId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'tenants', key: 'id' }
    },
    planId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'plans', key: 'id' }
    },
    status: {
        type: DataTypes.ENUM('active', 'past_due', 'canceled', 'trialing', 'expired'),
        defaultValue: 'trialing'
    },
    billingCycle: {
        type: DataTypes.ENUM('monthly', 'yearly'),
        allowNull: false
    },
    startDate: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    endDate: {
        type: DataTypes.DATE,
        allowNull: false 
    },
    nextBillingDate: {
        type: DataTypes.DATE
    },
    amountPaid: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    }
}, {
    timestamps: true,
    paranoid: true,
    underscored: true,
    tableName: 'subscriptions',
    indexes: [
        { fields: ['tenant_id'] },
        { fields: ['plan_id'] },
        { fields: ['status'] },
        { fields: ['end_date'] }
    ]
});

export default Subscription;
