const express = require('express');
const cookieParser = require('cookie-parser');

module.exports = function requestMiddleware(app) {
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  if (process.env.COOKIE_PARSER_ENABLED !== 'false') {
    app.use(cookieParser(process.env.COOKIE_SECRET));
  }

  // Request ID
  app.use((req, res, next) => {
    req.id = `req_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    res.setHeader('X-Request-ID', req.id);
    next();
  });

  // Response helpers
  app.use((req, res, next) => {
    res.success = (data, message = 'Success', status = 200) =>
      res.status(status).json({ success: true, message, data });

    res.error = (message, status = 500, errors = null) =>
      res.status(status).json({ success: false, message, errors });

    next();
  });
};
