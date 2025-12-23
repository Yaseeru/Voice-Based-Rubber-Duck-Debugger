import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import debugRouter from './routes/debug';
import { initializeGeminiService } from './services/gemini';
import { validateEnvironment, logConfiguration, handleValidationErrors } from './utils/envValidator';

// Load environment variables from parent directory (root of project)
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// Validate environment variables
const validationResult = validateEnvironment();

if (!validationResult.isValid) {
     handleValidationErrors(validationResult.errors);
}

const config = validationResult.config!;

// Log configuration
logConfiguration(config);

// Initialize Gemini service with environment variables
initializeGeminiService({
     projectId: config.googleCloudProject,
     location: config.vertexAiLocation
});

const app = express();
const PORT = config.port;
const FRONTEND_URL = config.frontendUrl;

// Configure CORS for frontend origin
// In production, allow same-origin requests (frontend served from same server)
const corsOrigin = process.env.NODE_ENV === 'production' ? true : FRONTEND_URL;
app.use(cors({
     origin: corsOrigin,
     credentials: true,
     methods: ['GET', 'POST', 'OPTIONS'],
     allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parser for JSON and large payloads (10MB limit for audio)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files from the frontend build (for production)
if (process.env.NODE_ENV === 'production') {
     const publicPath = path.resolve(__dirname, '../public');
     app.use(express.static(publicPath));
     console.log(`[${new Date().toISOString()}] Serving static files from: ${publicPath}`);
}

// Request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
     const startTime = Date.now();

     // Log request
     console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);

     // Log response when finished
     res.on('finish', () => {
          const duration = Date.now() - startTime;
          console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`);
     });

     next();
});

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
     res.json({
          status: 'ok',
          timestamp: new Date().toISOString(),
          uptime: process.uptime()
     });
});

// Debug routes
app.use('/debug', debugRouter);

// Serve index.html for all other routes (SPA support in production)
if (process.env.NODE_ENV === 'production') {
     app.get('*', (_req: Request, res: Response) => {
          res.sendFile(path.resolve(__dirname, '../public/index.html'));
     });
}

// 404 handler for unknown routes (development only)
if (process.env.NODE_ENV !== 'production') {
     app.use((req: Request, res: Response, _next: NextFunction) => {
          res.status(404).json({
               error: 'NotFound',
               message: `Route ${req.method} ${req.path} not found`,
               statusCode: 404
          });
     });
}

// Error handling middleware
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
     // Log error
     console.error(`[${new Date().toISOString()}] Error:`, err);

     // Determine status code
     const statusCode = (err as any).statusCode || 500;

     // Send error response
     res.status(statusCode).json({
          error: err.name || 'InternalServerError',
          message: err.message || 'An unexpected error occurred',
          statusCode: statusCode,
          ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
     });
});

// Start server
const server = app.listen(PORT, () => {
     console.log(`[${new Date().toISOString()}] Server running on port ${PORT}`);
     console.log(`[${new Date().toISOString()}] Environment: ${process.env.NODE_ENV || 'development'}`);
     console.log(`[${new Date().toISOString()}] CORS enabled for: ${FRONTEND_URL}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
     console.log('[${new Date().toISOString()}] SIGTERM received, shutting down gracefully...');
     server.close(() => {
          console.log('[${new Date().toISOString()}] Server closed');
          process.exit(0);
     });
});

export default app;
