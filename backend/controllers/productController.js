// const Product = require('../models/Product');
import Product from '../models/Products.js'

// @desc    Create a new product
// @route   POST /api/products
// @access  Admin only
// @access  Admin only
export const createProduct = async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      category,
      scent,
      size,
      burnTime,
      stockQuantity,
    } = req.body;

    // ✅ FIX: Make sure we're getting the user ID correctly
    const createdBy = req.user?.user_id || req.user?.userId;

    if (!createdBy) {
      return res.status(400).json({
        message: 'User ID not found in request'
      });
    }

    let images = [];
    if (req.files && req.files.length > 0) {
      images = req.files.map(file => file.path);
    }

    // Support URL strings (if files failed or user provided URLs)
    if (req.body.images) {
      const bodyImages = Array.isArray(req.body.images) ? req.body.images : [req.body.images];
      // Combine unique
      images = [...new Set([...images, ...bodyImages])];
    }

    const product = await Product.create({
      name,
      description,
      price,
      category,
      scent,
      size,
      burnTime,
      stockQuantity,
      images,
      createdBy: createdBy // ✅ This should now work
    });

    res.status(201).json({
      message: 'Product created successfully',
      product
    });

  } catch (error) {
    console.error('❌ Product creation error:', error);
    res.status(500).json({
      message: 'Error creating product',
      error: error.message
    });
  }
};

// @desc    Get all products
// @route   GET /api/products
// @access  Public
export const getAllProducts = async (req, res) => {
  try {
    const products = await Product.find({ inStock: true })
      .populate('createdBy', 'username')
      .sort({ createdAt: -1 });

    res.json({
      count: products.length,
      products
    });

  } catch (error) {
    res.status(500).json({
      message: 'Error fetching products',
      error: error.message
    });
  }
};

// @desc    Get single product
// @route   GET /api/products/:id
// @access  Public
export const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('createdBy', 'username');

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json({ product });

  } catch (error) {
    res.status(500).json({
      message: 'Error fetching product',
      error: error.message
    });
  }
};

// @desc    Update product
// @route   PUT /api/products/:id
// @access  Admin only
export const updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    res.json({
      message: 'Product updated successfully',
      product: updatedProduct
    });

  } catch (error) {
    res.status(500).json({
      message: 'Error updating product',
      error: error.message
    });
  }
};

// @desc    Delete product
// @route   DELETE /api/products/:id
// @access  Admin only 
export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    await Product.findByIdAndDelete(req.params.id);

    res.json({ message: 'Product deleted successfully' });

  } catch (error) {
    res.status(500).json({
      message: 'Error deleting product',
      error: error.message
    });
  }
};


