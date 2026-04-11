import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';
import permissionRouter from './router/permission.router.js';
import roleRouter from './router/role.router.js';
import tenantRouter from './router/tenant.router.js';
import staffRouter from './router/staff.router.js';
import academicYearRouter from './router/Academic/academicYear.routes.js';
import classRouter from './router/Academic/class.routes.js';
import sectionRouter from "./router/Academic/section.routes.js";
import enrollmentRouter from "./router/studentSectionEnrollment.routes.js";
import { globalErrorHandler } from './middlewares/error/error.middleware.js';

const app = express();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsRoot = path.join(__dirname, 'storage');

app.use(helmet()); 
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*', 
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Tenant-Id'],
}));

// 2. Utility Middleware
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use('/uploads', express.static(uploadsRoot));

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'UP', timestamp: new Date().toISOString() });
});

app.use('/api/v1/tenants', tenantRouter);
app.use('/api/v1/roles', roleRouter);
app.use('/api/v1/permissions', permissionRouter);
app.use('/api/v1/staff', tenantIdMiddleware, staffRouter);
app.use('/api/v1/academic-years', tenantIdMiddleware, academicYearRouter);
app.use('/api/v1/classes', tenantIdMiddleware, classRouter);
app.use("/api/v1/sections", tenantIdMiddleware, sectionRouter);
app.use("/api/v1/enrollments", tenantIdMiddleware, enrollmentRouter);

app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.originalUrl} not found` });
});


app.use(globalErrorHandler);

export default app;
