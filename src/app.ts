import express from 'express';
import helmet from 'helmet';
import { webhookRoutes, captureRawBody, logWebhookEvent } from './webhooks/index.js';
import webhookManagementRoutes from './routes/webhook-management.js';

const app = express();

// Security middleware
app.use(helmet());

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serverless-specific middleware for body parsing
app.use((req, _res, next) => {
  if (req.body && typeof req.body === 'string') {
    try {
      req.body = JSON.parse(req.body);
    } catch (e) {
      // If parsing fails, keep as string
    }
  }
  next();
});

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({ 
    status: 'OK', 
    service: 'shopify-event-processor',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});


// Webhook management API routes
app.use('/api/webhooks', webhookManagementRoutes);

// Webhook processing with HMAC verification
const webhookSecret = process.env['SHOPIFY_WEBHOOK_SECRET'];
if (!webhookSecret) {
  console.warn('⚠️  SHOPIFY_WEBHOOK_SECRET not set! Webhook verification will be disabled.');
}

app.use('/webhooks', 
  captureRawBody, 
  // verifyWebhookHMAC(webhookSecret || 'fallback-secret'), // Temporarily disabled for testing
  logWebhookEvent, 
  webhookRoutes
);


// 404 handler - catch all unmatched routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    path: req.path
  });
});

// Global error handler
app.use((error: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled error:', error);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: process.env['NODE_ENV'] === 'development' ? error.message : 'Something went wrong'
  });
});

// Start server only when not in serverless environment
if (process.env['NODE_ENV'] !== 'serverless' && !process.env['AWS_LAMBDA_FUNCTION_NAME']) {
  const PORT = process.env['PORT'] || 3001;
  app.listen(PORT, () => {
    console.log(`🚀 Shopify Event Processor running on port ${PORT}`);
    console.log(`🏥 Health check: http://localhost:${PORT}/health`);
    console.log(`🔗 Webhook endpoint: http://localhost:${PORT}/webhooks/{topic}`);
  });
}

export default app;
