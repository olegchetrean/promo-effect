// FIX: Explicitly import Request, Response, and NextFunction to avoid type collisions with other libraries (e.g., DOM types).
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import authRoutes from './modules/auth/auth.routes';
import bookingsRoutes from './modules/bookings/bookings.routes';
import clientRoutes from './modules/clients/client.routes';
import invoiceRoutes from './modules/invoices/invoice.routes';
import calculatorRoutes from './modules/calculator/calculator.controller';
import emailRoutes from './modules/emails/email.controller';

const app = express();

// Middlewares
app.use(helmet());
app.use(cors({
  origin: (origin, callback) => {
    // Allow non-browser tools (curl/postman) with no Origin
    if (!origin) return callback(null, true);

    const allowed = [
      process.env.FRONTEND_URL, // optional explicit allow
      'http://localhost:5173',
      'http://127.0.0.1:5173',
      'http://localhost:3002',
      'http://127.0.0.1:3002',
    ].filter(Boolean) as string[];

    // Allow same-LAN/dev origins (e.g. http://192.168.x.x:3002)
    const isLanDevOrigin = /^http:\/\/(192\.168\.|10\.|172\.(1[6-9]|2\d|3[0-1])\.)[0-9.]+(?::\d+)?$/.test(origin);

    if (allowed.includes(origin) || isLanDevOrigin) {
      return callback(null, true);
    }

    return callback(new Error(`CORS blocked origin: ${origin}`));
  },
  credentials: true,
}));
// FIX: The errors on app.use were likely due to a cascading type resolution issue.
// Explicitly typing route handlers below should resolve this.
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check Route
// FIX: Explicitly type req and res to ensure correct type resolution for res.status.
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'UP', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/bookings', bookingsRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/calculator', calculatorRoutes);
app.use('/api/admin', emailRoutes);   // Email processing (admin only)
app.use('/api/emails', emailRoutes);  // Email parsing endpoints

// TODO: Implement a proper error handling middleware
// FIX: Using explicitly imported Request, Response, and NextFunction types to fix 'status' property not found error.
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Something went wrong!' });
});

export default app;
