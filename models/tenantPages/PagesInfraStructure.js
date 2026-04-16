import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";
import { withTenant } from "../utils/model-helper.js";

export const Page = sequelize.define(
  "Page",
 {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    slug: { type: DataTypes.STRING(100), allowNull: false },
    title: { type: DataTypes.STRING(200), allowNull: false },
    pageType: {
      type: DataTypes.ENUM("home", "about", "academics", "campus"),
      allowNull: false,
    },
    isPublished: { type: DataTypes.BOOLEAN, defaultValue: false },
  },
  { timestamps: true, paranoid: true, underscored: true, tableName: "pages" },
);

export const PageSection = sequelize.define(
  "PageSection",
  withTenant({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    pageId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "pages", key: "id" },
    },
    sectionKey: { type: DataTypes.STRING(100), allowNull: false },
    sortOrder: { type: DataTypes.INTEGER, defaultValue: 0 },
    isVisible: { type: DataTypes.BOOLEAN, defaultValue: true },
    content: { type: DataTypes.JSONB, defaultValue: {} },
  }),
  {
    timestamps: true,
    paranoid: true,
    underscored: true,
    tableName: "page_sections",
  },
);

export const SeoMeta = sequelize.define(
  "SeoMeta",
  withTenant({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    pageId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "pages", key: "id" },
    },
    metaTitle: { type: DataTypes.STRING(200), allowNull: true },
    metaDescription: { type: DataTypes.TEXT, allowNull: true },
    ogImageUrl: { type: DataTypes.STRING, allowNull: true },
  }),
  {
    timestamps: true,
    paranoid: true,
    underscored: true,
    tableName: "seo_meta",
  },
);

export const SectionMedia = sequelize.define(
  "SectionMedia",
  withTenant({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    sectionId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "page_sections", key: "id" },
    },
    url: { type: DataTypes.STRING, allowNull: false },
    altText: { type: DataTypes.STRING(300), allowNull: true },
    mediaKey: { type: DataTypes.STRING(100), allowNull: false },
    mediaType: {
      type: DataTypes.ENUM("image", "video", "document"),
      defaultValue: "image",
    },
    sortOrder: { type: DataTypes.INTEGER, defaultValue: 0 },
  }),
  {
    timestamps: true,
    paranoid: true,
    underscored: true,
    tableName: "section_media",
  },
);
