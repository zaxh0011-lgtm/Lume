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

// Debug request origin
app.use((req, res, next) => {
  console.log(`Incoming: ${req.method} ${req.path} Origin: ${req.headers.origin}`);
  next();
});

// Robust CORS with logging
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    // Explicitly allow the frontend
    const allowedOrigins = [
      'https://lume-peach.vercel.app',
      'http://localhost:5173'
    ];

    // Check if origin is allowed or if we want to allow all temporarily
    if (allowedOrigins.includes(origin) || true) { // FORCE allow all for debugging
      return callback(null, true);
    } else {
      console.log('Blocked by CORS:', origin);
      return callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
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