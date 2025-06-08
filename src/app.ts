import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import config from './config';
import authRoutes from './routes/auth.routes';
import errorMiddleware from './middleware/error.middleware';
import logger from './utils/logger';

const app = express();

// Middleware
app.use(cors());
app.use(helmet());
app.use(express.json());
app.use(morgan('combined', { stream: { write: (message) => logger.info(message.trim()) } }));

// Routes
app.use('/api/auth', authRoutes);

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy' });
});

// Error handling
app.use(errorMiddleware);

// Start server
app.listen(config.PORT, () => {
  logger.info(`Server running on port ${config.PORT}`);
});

export default app;