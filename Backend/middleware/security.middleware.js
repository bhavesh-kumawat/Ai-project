const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const mongoSanitize = require('express-mongo-sanitize');
const hpp = require('hpp');

module.exports = function securityMiddleware(app) {
  // Helmet
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        scriptSrc: ["'self'"],
        imgSrc: [
          "'self'",
          "data:",
          "blob:",
          "https://res.cloudinary.com",
          "https://replicate.delivery",
        ],
        connectSrc: ["'self'", "https://api.openai.com"],
        frameSrc: ["'none'"],
        objectSrc: ["'none'"],
      },
    },
    crossOriginEmbedderPolicy: false,
  }));

  // CORS
  app.use(cors({
    origin: (origin, cb) => {
      const allowed = [
        process.env.FRONTEND_URL || 'http://localhost:5173',
        'http://localhost:3000',
        'http://127.0.0.1:5173',
      ];
      if (!origin || allowed.includes(origin)) return cb(null, true);
      cb(new Error('Not allowed by CORS'));
    },
    credentials: true,
  }));

  // Compression
  app.use(compression({ threshold: 1024 }));

  // Mongo sanitize (SAFE)
  app.use((req, res, next) => {
    if (req.body) mongoSanitize.sanitize(req.body);
    if (req.params) mongoSanitize.sanitize(req.params);
    next();
  });

  // HTTP parameter pollution
  app.use(hpp({
    whitelist: ['sort', 'fields', 'filter', 'tags'],
  }));
};
