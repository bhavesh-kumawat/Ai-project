/**
 * APPLICATION CONFIGURATION
 * 
 * Centralized Express app configuration
 * Applies all middleware, security, and routes
 * 
 * @module config/app.config
 */

require('dotenv').config();
const express = require('express');
const morgan = require('morgan');

// Middleware
const securityMiddleware = require('../middleware/security.middleware');
const requestMiddleware = require('../middleware/request.middleware');
const { globalLimiter, authLimiter } = require('../middleware/rateLimit.middleware');

// ============================================================================
// CONFIGURE APP
// ============================================================================

const configureApp = (app) => {
  // ========================================================================
  // 1. TRUST PROXY
  // ========================================================================
  if (process.env.TRUST_PROXY === 'true') {
    app.set('trust proxy', 1);
    console.log('✅ Trust proxy enabled');
  }

  // ========================================================================
  // 2. SECURITY & REQUEST MIDDLEWARE
  // ========================================================================
  securityMiddleware(app);
  requestMiddleware(app);

  // ========================================================================
  // 3. LOGGING
  // ========================================================================
  if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
    console.log('✅ Morgan logging (dev mode)');
  } else if (process.env.NODE_ENV === 'production') {
    app.use(morgan('combined', {
      skip: (req) => req.url === '/health' || req.url === '/api/health',
    }));
    console.log('✅ Morgan logging (production mode)');
  }

  // ========================================================================
  // 4. HEALTH CHECK ROUTES
  // ========================================================================
  app.get('/health', (req, res) => {
    res.status(200).json({
      status: 'UP',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV,
    });
  });

  app.get('/api/health', (req, res) => {
    const mongoose = require('mongoose');

    const health = {
      status: 'UP',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV,
      services: {
        database: mongoose.connection.readyState === 1 ? 'UP' : 'DOWN',
      },
      memory: {
        usage: process.memoryUsage(),
        percentage: (process.memoryUsage().heapUsed / process.memoryUsage().heapTotal * 100).toFixed(2) + '%',
      },
    };

    const allUp = Object.values(health.services).every(status => status === 'UP');
    res.status(allUp ? 200 : 503).json(health);
  });

  console.log('✅ Health check routes configured');

  // ========================================================================
  // 5. RATE LIMITING
  // ========================================================================
  app.use('/api/', globalLimiter);
  app.use('/api/auth/login', authLimiter);
  app.use('/api/auth/register', authLimiter);
  app.use('/api/auth/forgot-password', authLimiter);
  console.log('✅ Rate limiting configured');

  // ========================================================================
  // 6. STATIC FILES (if needed)
  // ========================================================================
  if (process.env.SERVE_STATIC !== 'false') {
    const staticDir = process.env.STATIC_DIR || 'Public';
    app.use(express.static(staticDir, {
      maxAge: '1d',
      etag: true,
    }));
    console.log('✅ Static file serving enabled');
  }

  console.log('✅ Express app configuration complete');
  console.log(`📝 Environment: ${process.env.NODE_ENV}`);

  return app;
};

// ============================================================================
// APP SETTINGS
// ============================================================================

const appSettings = {
  // Server settings
  port: process.env.PORT || 5000,
  host: process.env.HOST || '0.0.0.0',
  env: process.env.NODE_ENV || 'development',
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
};

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  configureApp,
  appSettings,
};
