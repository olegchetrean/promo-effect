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
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
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
