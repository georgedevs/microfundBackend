import express, { Application } from 'express';
import cors from 'cors';
import { requestLogger } from './middleware/requestLogger';
import { errorHandler } from './middleware/errorHandler';
import authRoutes from './routes/auth.routes';
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './config/swagger';
import walletRoutes from './routes/wallet.routes';
import webhookRoutes from './routes/webhook.routes';
import bankRoutes from './routes/bank.routes';
import savingsRoutes from './routes/savings.routes';
import businessRoutes from './routes/business.routes';
import educationRoutes from './routes/education.routes';

const app: Application = express();

// CORS configuration
app.use(cors({
    origin: process.env.NODE_ENV === 'production' 
      ? process.env.FRONTEND_URL 
      : ['http://localhost:3000', 'https://abc123.ngrok.io'],
    credentials: true
  }));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging in development
if (process.env.NODE_ENV === 'development') {
  app.use(requestLogger);
}


// Set up Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/banks', bankRoutes);
app.use('/api/webhooks', webhookRoutes);
app.use('/api/savings', savingsRoutes);
app.use('/api/business', businessRoutes);
app.use('/api/education', educationRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Error handling middleware (should be last)
app.use(errorHandler);

export default app;