import { ProductRepository } from "../repositories/product.repository.js";
import { AppError } from "../utils/AppError.js";

const productRepo = new ProductRepository();

export class ProductService {
  async createProduct(payload) {
    if (!payload.productName || !payload.price) {
      throw new AppError("Product name and price required", 400);
    }

    return await productRepo.create(payload);
  }

  async getAllProducts() {
    // const data = await productRepo.findAll(null, {}, { paranoid: false });
    const data = await productRepo.findAll();
    return data;
  }

  async getProductById(id) {
    return await productRepo.findById(id);
  }

  async updateProduct(id, payload) {
    return await productRepo.update(id, null, payload);
  }

  async deleteProduct(id) {
    return await productRepo.delete(id, null);
  }
}
