import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import { apiLimiter } from './middleware/rateLimiter';
import { notFound, errorHandler } from './middleware/errorHandler';
import config from './config/config';

// Import routes
import authRoutes from './routes/authRoutes';

// Initialize express app
const app = express();

// Apply global middleware
app.use(helmet()); // Security headers
app.use(cors({
  origin: '*', // Allow all origins for now
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(compression()); // Compress responses
app.use(express.json({ limit: '10mb' })); // Parse JSON bodies
app.use(express.urlencoded({ extended: true, limit: '10mb' })); // Parse URL-encoded bodies
app.use(cookieParser()); // Parse cookies
app.use(morgan(config.nodeEnv === 'development' ? 'dev' : 'combined')); // HTTP request logging

// Apply rate limiting to all API routes
app.use('/api', apiLimiter);

// API routes
app.use('/api/auth', authRoutes);

// Base route for API health check
app.get('/api', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Triptics API is running',
    version: '1.0.0'
  });
});

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

export default app; 