const rateLimit = require('express-rate-limit');



// =====================================================
// STRICT RATE LIMITING (for sensitive operations)
// =====================================================
// Purpose: Prevent brute force attacks on auth endpoints
// Limit: 5 attempts per 15 minutes
// Why: Attackers often target login/password endpoints
const authLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,  // 5 minutes
  max: 5,                     // Max 5 requests per window
  
  // Use client IP for rate limiting key (not the proxy)
  keyGenerator: (req, res) => {
    // X-Forwarded-For: IP from client (behind proxy)
    // X-Real-IP: Cloudflare/Nginx style
    return (
      req.headers['x-forwarded-for']?.split(',')[0].trim() ||
      req.headers['x-real-ip'] ||
      req.ip ||
      req.connection.remoteAddress
    );
  },
  
  // Custom response when rate limit exceeded
  handler: (req, res) => {
    console.log(`[rate-limit] Auth limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      error: 'Too many login attempts',
      message: 'Please try again after 15 minutes',
      retryAfter: req.rateLimit.resetTime,
    });
  },
  
  // Skip health checks from rate limiting
  skip: (req, res) => req.path === '/health',
  
  // Log rate limit hits for monitoring
  onLimitReached: (req, res, options) => {
    console.log(
      `[rate-limit] Auth limit reached: ${req.method} ${req.path} from IP ${req.ip}`
    );
  },
});

// =====================================================
// MODERATE RATE LIMITING (for API endpoints)
// =====================================================
// Purpose: Fair resource sharing, prevent accidental abuse
// Limit: 100 requests per minute
// Why: Typical user won't exceed this; attackers will
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,  // 1 minute
  max: 100,             // 100 requests per minute
  
  keyGenerator: (req, res) => {
    return (
      req.headers['x-forwarded-for']?.split(',')[0].trim() ||
      req.headers['x-real-ip'] ||
      req.ip ||
      req.connection.remoteAddress
    );
  },
  
  handler: (req, res) => {
    console.log(`[rate-limit] API limit exceeded: ${req.method} ${req.path} from IP ${req.ip}`);
    res.status(429).json({
      error: 'Rate limit exceeded',
      message: 'You have made too many requests. Please try again in 1 minute.',
      retryAfter: req.rateLimit.resetTime,
    });
  },
});

// =====================================================
// STRICT RATE LIMITING - WRITE OPERATIONS
// =====================================================
// Purpose: Protect expensive operations (payments, orders)
// Limit: 20 requests per minute
// Why: Creating orders/payments is resource-intensive
const strictLimiter = rateLimit({
  windowMs: 60 * 1000,  // 1 minute
  max: 20,              // 20 requests per minute
  
  keyGenerator: (req, res) => {
    return (
      req.headers['x-forwarded-for']?.split(',')[0].trim() ||
      req.headers['x-real-ip'] ||
      req.ip ||
      req.connection.remoteAddress
    );
  },
  
  handler: (req, res) => {
    console.log(`[rate-limit] Strict limit exceeded: ${req.method} ${req.path} from IP ${req.ip}`);
    res.status(429).json({
      error: 'Too many requests',
      message: 'Too many requests for this operation. Please try again later.',
      retryAfter: req.rateLimit.resetTime,
    });
  },
});

// =====================================================
// EXPORT LIMITERS
// =====================================================
module.exports = {
  authLimiter,      // For login/register/password reset
  apiLimiter,       // For general API endpoints (GET/POST)
  strictLimiter,    // For expensive operations (payments/orders)
};
