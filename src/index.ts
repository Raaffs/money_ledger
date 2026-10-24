import express from 'express';
import cors from 'cors';
import { config } from './config/env.js';
import authRoutes from './modules/auth/auth.routes.js';
import userRoutes from './modules/user/user.routes.js';
import loanRoutes from './modules/loan/loan.routes.js';
import { errorHandler } from './middlewares/error.middleware.js';

const app = express();

app.use(
  cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);
app.use(express.json());

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/loans', loanRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.method} ${req.url} not found` });
});

// Global Error Handler
app.use(errorHandler);

app.listen(config.port, () => {
  console.log(`🚀 MiniLedger backend is running on http://localhost:${config.port}`);
  console.log(`📡 Environment: ${config.nodeEnv}`);
});
