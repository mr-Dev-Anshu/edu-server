import { DataTypes } from "sequelize";
import sequelize from "../../config/db.js";
import { withTenant } from "../withTenant.js";

export const StudentFeesLedger = sequelize.define(
  "StudentFeesLedger",
  withTenant({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    studentId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "student_section_enrollments", key: "id" },
      comment: "Target student enrollment receiving the financial charge",
    },
    feeStructureItemId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: "fee_structure_items", key: "id" },
      comment:
        "NULL for custom/waiver entries; holds parent template item reference for bulk-allocated rows",
    },
    feeHeadId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "fee_heads", key: "id" },
      comment: "Mandatory account classification category",
    },
    academicYearId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "academic_years", key: "id" },
    },
    amountDueRaw: {
      type: DataTypes.BIGINT,
      allowNull: false,
      comment:
        "Amount in lowest currency units (Paise/Cents). Negative values represent waivers/credit notes.",
    },
    amountPaidRaw: {
      type: DataTypes.BIGINT,
      defaultValue: 0,
      allowNull: false,
      comment: "Aggregated amount collected against this ledger line",
    },
    status: {
      type: DataTypes.ENUM("unpaid", "partially_paid", "paid"),
      defaultValue: "unpaid",
      allowNull: false,
    },
    notes: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: "Context log explaining the adjustment or charge details",
    },
  }),
  {
    tableName: "student_fees_ledgers",
    underscored: true,
    paranoid: true,
    indexes: [
      { fields: ["tenant_id", "student_id"] },
      { fields: ["tenant_id", "academic_year_id"] },
      {
        // Prevents double-allocation of the same fee-structure-item to the same student
        unique: true,
        fields: ["tenant_id", "student_id", "fee_structure_item_id"],
        where: { fee_structure_item_id: { [Symbol.for("ne")]: null } },
        name: "unique_student_fee_structure_item",
      },
    ],
  }
);
