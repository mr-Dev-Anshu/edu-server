import Product from "../models/Product.js"

// CREATE
const createProduct = async (req, res) => {
    const { name, description, price, stock, category, image } = req.body;
    try {
        const product = await Product.create({
            name,
            description,
            price,
            stock,
            category,
        });
        res.status(201).json({
            message: 'Product created successfully',
            product,
        });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

// GET ALL
const getAllProducts = async (req, res) => {
    try {
        const products = await Product.findAll({
            where: { isActive: true },
            order: [['createdAt', 'DESC']],
        });
        res.json(products);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// GET ONE
const getProductById = async (req, res) => {
    try {
        const product = await Product.findByPk(req.params.id);
        if (!product) return res.status(404).json({ error: 'Product not found' });
        res.json(product);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// UPDATE
const updateProduct = async (req, res) => {
    const { name, description, price, stock, category, image } = req.body;
    try {
        const product = await Product.findByPk(req.params.id);
        if (!product) return res.status(404).json({ error: 'Product not found' });
        await product.update({
            name,
            description,
            price,
            stock,
            category,
            image,
        });
        res.json({
            message: 'Product updated successfully',
            product,
        });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

// DELETE
const deleteProduct = async (req, res) => {
    try {
        const product = await Product.findByPk(req.params.id);
        if (!product) return res.status(404).json({ error: 'Product not found' });
        await product.destroy();
        res.json({ message: 'Product deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export {
    createProduct,
    getAllProducts,
    getProductById,
    updateProduct,
    deleteProduct,
}