import express from 'express';
import connectDB from './config/db.js'
import 'dotenv/config';
import authRoutes from './routes/authRoutes.js';
import productRoutes from './routes/productsRoutes.js'
import verifyAccessToken from './middlewares/authMiddleware.js'
import path from 'path'
import customizationRoutes from './routes/customizationRoutes.js';
import orderRoutes from './routes/orderRoutes.js'; // ADD THIS

const app = express();

connectDB();

// Debug logging
app.use((req, res, next) => {
  console.log(`Request: ${req.method} ${req.path}`);
  next();
});

// OPTIONS Handler (Headers are managed by Vercel edge)
app.use((req, res, next) => {
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});



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