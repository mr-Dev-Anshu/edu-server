import express from 'express';
import { ProductController } from '../controllers/product.controller.js';
import { createProductValidator, updateProductValidator } from '../middlewares/validators/Product.validator.js';
import { identifyUser } from '../middlewares/security/index.js';

const router = express.Router();
const productController = new ProductController();

// All product routes
router.post('/', identifyUser, createProductValidator, productController.create);
router.get('/', identifyUser, productController.getAll);
router.get('/:id', identifyUser, productController.getById);
router.put('/:id', identifyUser, updateProductValidator, productController.update);
router.delete('/:id', identifyUser, productController.delete);

export default router;