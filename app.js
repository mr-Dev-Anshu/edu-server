import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import planRoutes from './router/plan.routes.js';
import { superAdminSubscriptionRouter, schoolOwnerSubscriptionRouter } from './router/subscription.routes.js';

const app = express();

app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// 2. Utility Middleware
app.use(morgan('dev'));
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'UP', timestamp: new Date().toISOString() });
});

app.use('/api/v1/super-admin/plans', planRoutes);
app.use('/api/v1/super-admin/subscriptions', superAdminSubscriptionRouter);
app.use('/api/v1/school-owner/subscriptions', schoolOwnerSubscriptionRouter);


app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.originalUrl} not found` });
});


app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  console.error(`[ERROR] ${err.message}`);

  res.status(statusCode).json({
    status: 'error',
    message: process.env.NODE_ENV === 'production'
      ? 'Internal Server Error'
      : err.message
  });
});

export default app;