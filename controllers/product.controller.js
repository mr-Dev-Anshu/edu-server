import { ProductService } from "../services/product.service.js";
import { catchAsync } from "../utils/catchAsync.js";

const productService = new ProductService();

export class ProductController {
    create = catchAsync(async (req, res) => {
        const data = await productService.createProduct(req.body);
        res.status(201).json({ success: true, data });
    });

    getAll = catchAsync(async (req, res) => {
        const data = await productService.getAllProducts();
        res.status(200).json({ success: true, data });
    });

    getById = catchAsync(async (req, res) => {
        const data = await productService.getProductById(req.params.id);
        res.status(200).json({ success: true, data });
    });

    update = catchAsync(async (req, res) => {
        const data = await productService.updateProduct(req.params.id, req.body);
        res.status(200).json({ success: true, data });
    });

    delete = catchAsync(async (req, res) => {
        await productService.deleteProduct(req.params.id);
        res.status(200).json({ success: true, message: "Deleted successfully" });
    });
}