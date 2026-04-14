import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';
import permissionRouter from './router/permission.router.js';
import roleRouter from './router/role.router.js';
import tenantRouter from './router/tenant.router.js';
import userRouter from './router/user.router.js';
import userRoleRouter from './router/user-role.router.js';
import { globalErrorHandler } from './middlewares/error/error.middleware.js';
import { tenantIdMiddleware } from './middlewares/tenant.middleware.js'


const app = express();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsRoot = path.join(__dirname, 'storage');
const allowedOrigins = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const corsOptions = {
  origin: allowedOrigins.length
    ? (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
          return callback(null, true);
        }

        return callback(new Error('Not allowed by CORS'));
      }
    : true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-tenant-id']
};

app.use(helmet()); 
app.use(cors(corsOptions));

// 2. Utility Middleware
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use('/uploads', express.static(uploadsRoot));

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'UP', timestamp: new Date().toISOString() });
});

app.use(tenantIdMiddleware);

app.use('/api/v1/tenants', tenantRouter);
app.use('/api/v1/roles', roleRouter);
app.use('/api/v1/permissions', permissionRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/user-roles', userRoleRouter);

app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.originalUrl} not found` });
});
app.use(globalErrorHandler);
export default app;