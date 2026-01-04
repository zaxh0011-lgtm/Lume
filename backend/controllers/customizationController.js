import Customization from '../models/Customization.js';
import CustomizedProduct from '../models/CustomizedProduct.js';

// Get all customization options
export const getCustomizations = async (req, res) => {
  try {
    const customizations = await Customization.find({ inStock: true });

    // Group by type
    const grouped = {
      colors: customizations.filter(c => c.type === 'color'),
      scents: customizations.filter(c => c.type === 'scent'),
      sizes: customizations.filter(c => c.type === 'size'),
      shapes: customizations.filter(c => c.type === 'shape'),
      base: customizations.filter(c => c.type === 'base')
    };

    res.json(grouped);
  } catch (error) {
    console.error('❌ Error fetching customizations:', error);
    res.status(500).json({ message: 'Error fetching customizations', error: error.message });
  }
};

// Add customization option (admin)
export const addCustomization = async (req, res) => {
  try {
    const { type, name, value, price } = req.body;

    const customization = await Customization.create({
      type,
      name,
      value,
      price: price || 0
    });

    res.status(201).json({
      message: 'Customization option added successfully',
      customization
    });
  } catch (error) {
    console.error('❌ Error adding customization:', error);
    res.status(500).json({ message: 'Error adding customization', error: error.message });
  }
};

// Create customized candle
export const createCustomizedProduct = async (req, res) => {
  try {
    const { color, scent, size, shape } = req.body;

    // Calculate total price
    const customizations = await Customization.find({
      value: { $in: [color, scent, size, shape] }
    });

    const basePrice = 15.00; // Base price for custom candle
    const totalPrice = customizations.reduce((total, custom) => total + custom.price, basePrice);

    const customizedProduct = await CustomizedProduct.create({
      user: req.user.user_id,
      basePrice,
      color,
      scent,
      size,
      shape,
      totalPrice
    });

    res.status(201).json({
      message: 'Custom candle created successfully',
      customizedProduct
    });
  } catch (error) {
    res.status(500).json({ message: 'Error creating custom candle', error: error.message });
  }
};

// Update customization option
export const updateCustomization = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, value, price, inStock } = req.body;

    const customization = await Customization.findByIdAndUpdate(
      id,
      { name, value, price, inStock },
      { new: true }
    );

    if (!customization) {
      return res.status(404).json({ message: 'Customization option not found' });
    }

    res.json({
      message: 'Customization option updated successfully',
      customization
    });
  } catch (error) {
    res.status(500).json({ message: 'Error updating customization', error: error.message });
  }
};

// Delete customization option
export const deleteCustomization = async (req, res) => {
  try {
    const { id } = req.params;

    const customization = await Customization.findByIdAndDelete(id);

    if (!customization) {
      return res.status(404).json({ message: 'Customization option not found' });
    }

    res.json({ message: 'Customization option deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting customization', error: error.message });
  }
};