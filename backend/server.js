import express from 'express';
import connectDB from './config/db.js'
import 'dotenv/config';
import authRoutes from './routes/authRoutes.js';
import cors from 'cors';
import productRoutes from './routes/productsRoutes.js'
import verifyAccessToken from './middlewares/authMiddleware.js'
import path from 'path'
import customizationRoutes from './routes/customizationRoutes.js';
import orderRoutes from './routes/orderRoutes.js'; // ADD THIS

const app = express();

connectDB();

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}));

app.use(express.json());



app.get('/', (req, res) => {
  res.send('API is running...');
});

app.get('/api/debug/orders-test', verifyAccessToken, (req, res) => {
  res.json({
    message: 'Orders API is working',
    user: req.user
  });
});

//routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/customizations', customizationRoutes);
app.use('/api/orders', orderRoutes);

app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));
import fs from 'fs';
const uploadsDir = path.join(process.cwd(), 'uploads');
try {
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
} catch (error) {
  console.log('Skipping uploads dir creation (read-only fs)');
}

app.get('/api/debug/test-auth', verifyAccessToken, (req, res) => {
  res.json({
    message: 'Token is valid',
    user: req.user
  });
});

const PORT = process.env.PORT || 5000;

if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log("Server is running successfully at PORT: ", PORT);
  });
}

export default app;