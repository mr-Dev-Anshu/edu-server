import { ProductRepository } from "../repositories/product.repository.js";
import { AppError } from "../utils/AppError.js";

const productRepo = new ProductRepository();

export class ProductService {
  async createProduct(payload, options = {}) {
    const productData = {
      name: payload.name?.trim(),
      price: payload.price,
      description: payload.description?.trim() || null,
      category: payload.category?.trim() || null,
      stock: payload.stock || 0,
      isActive: payload.isActive ?? true,
      tenantId: options.tenantId,
    };

    return await productRepo.create(productData, options);
  }

  async getAllProducts(filter = {}, tenantId) {
    return await productRepo.findAll(tenantId, filter);
  }

  async getProductById(id, tenantId) {
    return await productRepo.findById(id, tenantId);
  }

  async updateProduct(id, payload, tenantId) {
    const updateData = {};
    if (payload.name !== undefined) updateData.name = payload.name.trim();
    if (payload.price !== undefined) updateData.price = payload.price;
    if (payload.description !== undefined) updateData.description = payload.description?.trim() || null;
    if (payload.category !== undefined) updateData.category = payload.category?.trim() || null;
    if (payload.stock !== undefined) updateData.stock = payload.stock;
    if (payload.isActive !== undefined) updateData.isActive = payload.isActive;

    return await productRepo.update(id, tenantId, updateData);
  }

  async deleteProduct(id, tenantId) {
    return await productRepo.delete(id, tenantId);
  }
}
