require('dotenv').config();

const express = require('express');
const cors = require('cors');

const pool = require('./db/pool');
const { encode } = require('./utils/base62');
const validateUrl = require('./middleware/validateUrl');
const createUrlLimiter = require('./middleware/rateLimiter');
const redis = require('./lib/redisClient');

const app = express();

// ---------------------------------------------------------------------------
// Middleware
// ---------------------------------------------------------------------------
app.use(cors());
app.use(express.json());

// ---------------------------------------------------------------------------
// Health check
// ---------------------------------------------------------------------------
app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// ---------------------------------------------------------------------------
// Start server
// ---------------------------------------------------------------------------
const PORT = process.env.PORT || 3000;

app.post('/urls', createUrlLimiter, validateUrl, async (req, res) => {
  const { longUrl } = req.body;

  let connection;

  try {
    connection = await pool.getConnection();

    await connection.beginTransaction();

    // 1. Insert the long URL and let MySQL generate the ID.
    const [result] = await connection.execute(
      'INSERT INTO urls (long_url) VALUES (?)',
      [longUrl]
    );

    const id = result.insertId;

    // 2. Convert the generated ID into a Base62 short code.
    const shortCode = encode(id);

    // 3. Store the short code in the same transaction.
    await connection.execute(
      'UPDATE urls SET short_code = ? WHERE id = ?',
      [shortCode, id]
    );

    // 4. Commit both operations together.
    await connection.commit();

    const shortUrl = `${req.protocol}://${req.get('host')}/${shortCode}`;

    return res.status(201).json({
      shortCode,
      shortUrl,
    });
  } catch (error) {
    if (connection) {
      try {
        await connection.rollback();
      } catch (rollbackError) {
        console.error('Rollback failed:', rollbackError);
      }
    }

    console.error('Error creating short URL:', error);

    return res.status(500).json({
      error: 'Failed to create short URL',
    });
  } finally {
    if (connection) {
      connection.release();
    }
  }
});

app.get('/:code', async (req, res) => {
  const { code } = req.params;

  try {
    // 1. Check Redis first
    const cachedUrl = await redis.get(code);

    if (cachedUrl) {
      console.log(`Cache HIT for code: ${code}`);
      return res.redirect(302, cachedUrl);
    }

    console.log(`Cache MISS for code: ${code}`);

    // 2. Redis miss → check MySQL
    const [rows] = await pool.execute(
      'SELECT long_url FROM urls WHERE short_code = ?',
      [code]
    );

    // 3. Short code doesn't exist
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Short URL not found' });
    }

    const longUrl = rows[0].long_url;

    // 4. Store it in Redis for future requests
    await redis.set(code, longUrl);

    // 5. Redirect the user
    return res.redirect(302, longUrl);
  } catch (error) {
    console.error('Error resolving short URL:', error);
    return res.status(500).json({ error: 'Failed to resolve short URL' });
  }
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
