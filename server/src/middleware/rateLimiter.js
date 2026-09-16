const rateLimit = require('express-rate-limit');

/**
 * Rate limiter for the URL-creation endpoint.
 *
 * Uses the default in-memory store — suitable for single-process local
 * development. A Redis-backed store can replace this later for production
 * or multi-instance deployments.
 */
const createUrlLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15-minute window
  limit: 100,               // max 100 requests per window per IP
  standardHeaders: 'draft-8', // RateLimit-* headers (IETF draft standard)
  legacyHeaders: false,      // disable X-RateLimit-* headers
  message: { error: 'Too many requests, please try again later' },
});

module.exports = createUrlLimiter;
