import { ProductService } from "../services/product.service.js";
import { catchAsync } from "../utils/catchAsync.js";

const productService = new ProductService();

export class ProductController {
  create = catchAsync(async (req, res) => {
    const data = await productService.createProduct(req.body, { tenantId: req.user.tenantId });
    res.status(201).json({ success: true, message: "Product created successfully", data });
  });

  getAll = catchAsync(async (req, res) => {
    const filter = req.query.filter ? JSON.parse(req.query.filter) : {};
    const data = await productService.getAllProducts(filter, req.user.tenantId);
    res.status(200).json({ success: true, data });
  });

  getById = catchAsync(async (req, res) => {
    const data = await productService.getProductById(req.params.id, req.user.tenantId);
    res.status(200).json({ success: true, data });
  });

  update = catchAsync(async (req, res) => {
    const data = await productService.updateProduct(req.params.id, req.body, req.user.tenantId);
    console.log("your data is",data)
    res.status(200).json({ success: true, message: "Product updated successfully", data });
  });

  delete = catchAsync(async (req, res) => {
    await productService.deleteProduct(req.params.id, req.user.tenantId);
    res.status(200).json({ success: true, message: "Product deleted successfully" });
  });
}