import { DataTypes } from "sequelize";
import sequelize from "../../config/db.js";
import { withTenant, tenantIndex } from "../../utils/withTenant.js";

export const Invoice = sequelize.define(
  "Invoice",
  withTenant({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    studentId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "students", key: "id" },
    },
    academicYearId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "academic_years", key: "id" },
    },
    invoiceNumber: { type: DataTypes.STRING(50), allowNull: false },
    invoiceDate: { type: DataTypes.DATEONLY, allowNull: false },
    dueDate: { type: DataTypes.DATEONLY, allowNull: false },
    status: {
      type: DataTypes.ENUM(
        "draft",
        "sent",
        "partially_paid",
        "paid",
        "overdue",
        "canceled",
        "waived",
      ),
      defaultValue: "draft",
    },
    totalRaw: { type: DataTypes.BIGINT, allowNull: false, defaultValue: 0 },
    balanceRaw: { type: DataTypes.BIGINT, defaultValue: 0 },
  }),
  {
    timestamps: true,
    underscored: true,
    tableName: "invoices",
    indexes: [
      { unique: true, fields: ["tenant_id", "invoice_number"] },
      ...tenantIndex(["status"]),
    ],
  },
);

export const InvoiceLineItem = sequelize.define(
  "InvoiceLineItem",
  withTenant({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    invoiceId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "invoices", key: "id" },
      onDelete: "CASCADE",
    },
    description: { type: DataTypes.STRING(255), allowNull: false },
    amountRaw: { type: DataTypes.BIGINT, allowNull: false },
    netAmountRaw: { type: DataTypes.BIGINT, allowNull: false },
  }),
  { timestamps: false, underscored: true, tableName: "invoice_line_items" },
);

export const Payment = sequelize.define(
  "Payment",
  withTenant({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    invoiceId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "invoices", key: "id" },
    },
    studentId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "students", key: "id" },
    },
    receiptNumber: { type: DataTypes.STRING(50), allowNull: false },
    paymentDate: { type: DataTypes.DATEONLY, allowNull: false },
    amountRaw: { type: DataTypes.BIGINT, allowNull: false },
    paymentMode: {
      type: DataTypes.ENUM(
        "cash",
        "cheque",
        "online",
        "upi",
        "neft",
        "rtgs",
        "card",
      ),
      allowNull: false,
    },
    paymentStatus: {
      type: DataTypes.ENUM("pending", "completed", "failed", "refunded"),
      defaultValue: "pending",
    },
    gatewayPaymentId: { type: DataTypes.STRING, allowNull: true },
  }),
  {
    timestamps: true,
    underscored: true,
    tableName: "payments",
    indexes: [
      { unique: true, fields: ["tenant_id", "receipt_number"] },
      ...tenantIndex(["payment_status"]),
    ],
  },
);
