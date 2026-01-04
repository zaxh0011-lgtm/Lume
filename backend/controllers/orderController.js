import Order from '../models/Order.js';
import OrderItem from '../models/OrderItem.js';

// Create new order
export const createOrder = async (req, res) => {
  try {
    const { items, shippingAddress, paymentMethod } = req.body;
    const userId = req.user.user_id;

    // Validate required fields
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Order must contain at least one item' });
    }

    if (!shippingAddress || !paymentMethod) {
      return res.status(400).json({ message: 'Shipping address and payment method are required' });
    }

    // Calculate total and create order items
    let total = 0;
    const orderItems = [];

    for (const item of items) {

      const orderItemData = {
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        isCustom: item.isCustom || false
      };

      // Add custom candle details if applicable
      if (item.isCustom) {
        orderItemData.color = item.color;
        orderItemData.scent = item.scent;
        orderItemData.size = item.size;
        orderItemData.colorName = item.colorName;
        orderItemData.scentName = item.scentName;
        orderItemData.sizeName = item.sizeName;
        orderItemData.shape = item.shape;
        orderItemData.shapeName = item.shapeName;
      } else {
        orderItemData.product = item._id;
      }

      const orderItem = await OrderItem.create(orderItemData);
      orderItems.push(orderItem._id);
      total += item.price * item.quantity;
    }

    // Generate order number first
    const orderNumber = await Order.generateOrderNumber();

    // Create order
    const orderData = {
      orderNumber, // ADD THIS - generate order number manually
      user: userId,
      items: orderItems,
      total,
      shippingAddress,
      paymentMethod,
      status: 'processing',
      paymentStatus: paymentMethod === 'cod' ? 'pending' : 'completed'
    };

    const order = await Order.create(orderData);

    // Populate the created order with items
    const populatedOrder = await Order.findById(order._id)
      .populate('items')
      .populate('user', 'name email');

    res.status(201).json({
      message: 'Order created successfully',
      order: populatedOrder
    });
  } catch (error) {
    console.error('❌ Error creating order:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      message: 'Error creating order',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Get user's orders
export const getUserOrders = async (req, res) => {
  try {
    const userId = req.user.user_id;

    const orders = await Order.find({ user: userId })
      .populate('items')
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (error) {
    console.error('Error fetching user orders:', error);
    res.status(500).json({ message: 'Error fetching orders', error: error.message });
  }
};

// Get all orders (admin)
export const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate('items')
      .populate('user', 'name email')
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (error) {
    console.error('Error fetching all orders:', error);
    res.status(500).json({ message: 'Error fetching orders', error: error.message });
  }
};

// Update order status (admin)
export const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const order = await Order.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    ).populate('items').populate('user', 'name email');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.json({
      message: 'Order status updated successfully',
      order
    });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ message: 'Error updating order status', error: error.message });
  }
};

// Get order by ID
export const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;

    const order = await Order.findById(id)
      .populate('items')
      .populate('user', 'name email');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Check if user owns the order or is admin
    if (order.user._id.toString() !== req.user.user_id && !req.user.isAdmin) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(order);
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ message: 'Error fetching order', error: error.message });
  }
};

// Delete order (Admin or Owner)
export const deleteOrder = async (req, res) => {
  try {
    const { id } = req.params;

    // Find first to check permissions
    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Check if user is owner or admin
    // Note: req.user is set by verifyAccessToken. Structure: { user_id, role, ... }
    const isOwner = order.user.toString() === req.user.user_id;
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'Access denied. You can only delete your own orders.' });
    }

    await Order.findByIdAndDelete(id);

    res.json({ message: 'Order deleted successfully' });
  } catch (error) {
    console.error('Error deleting order:', error);
    res.status(500).json({ message: 'Error deleting order', error: error.message });
  }
};