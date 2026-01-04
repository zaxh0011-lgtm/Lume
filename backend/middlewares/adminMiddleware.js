import User from '../models/User.js'

const adminMiddleware = async (req, res, next) => {
  try {
    // ✅ FIX: Change from userId to user_id
    if (!req.user || !req.user.user_id) {
      return res.status(401).json({
        message: 'User not authenticated - req.user is missing'
      });
    }

    // ✅ FIX: Change from userId to user_id
    const user = await User.findById(req.user.user_id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.role !== 'admin') {
      console.log(`Admin Access Denied: User ${user.email} is ${user.role}`);
      return res.status(403).json({ message: 'Admin access required' });
    }

    next();
  } catch (error) {
    console.error('❌ Admin middleware error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export default adminMiddleware