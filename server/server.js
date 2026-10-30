
const express = require('express');
const cors = require('cors');

const config = require('./config');
const healthRoutes = require('./routes/health');
const issueRoutes = require('./routes/issues');
const aiRoutes = require('./routes/ai');
const errorHandler = require('./utils/error-handler');

const app = express();

// Middleware
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://127.0.0.1:5173',
    'https://waguri-5pxf.vercel.app'
  ],
}));

app.use(express.json());

// API routes
app.use('/api', healthRoutes);
app.use('/api/issues', issueRoutes);
app.use('/api/ai', aiRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Welcome to OpenSource Buddy API!',
  });
});

// Handle unknown routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.originalUrl}`,
  });
});

// Global error handler
app.use(errorHandler);

// Start server
app.listen(config.PORT, () => {
  console.log(`🚀 OpenSource Buddy running at http://localhost:${config.PORT}`);
  console.log(`✅ Health check: http://localhost:${config.PORT}/api/health`);
});
