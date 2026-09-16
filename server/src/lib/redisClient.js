const Redis = require('ioredis');

// Create a single Redis client instance using the REDIS_URL from .env
const redis = new Redis(process.env.REDIS_URL, {
  // modest retry policy – enough for local dev, but not endless loops
  maxRetriesPerRequest: 3,
  lazyConnect: false,
});

// Emitted when the TCP socket is established
redis.on('connect', () => {
  console.log('Redis: TCP connection established');
});

// Emitted when the client is ready to accept commands (handshake completed)
redis.on('ready', () => {
  console.log('Redis: ready to accept commands');
});

// Any operational or network error bubbles here
redis.on('error', (err) => {
  console.error('Redis error:', err.message);
});

module.exports = redis;
