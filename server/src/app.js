require('dotenv').config();

const crypto = require('crypto');
const express = require('express');
const cors = require('cors');

const pool = require('./db/pool');
const { encode } = require('./utils/base62');
const validateUrl = require('./middleware/validateUrl');
const createUrlLimiter = require('./middleware/rateLimiter');
const redis = require('./lib/redisClient');

const app = express();
app.set('trust proxy', 1);

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
  const { longUrl, customCode, expiresIn } = req.body;

  const expiresAt = new Date(Date.now() + expiresIn * 1000);

  let connection;
  let shortCode;

  try {
    connection = await pool.getConnection();

    await connection.beginTransaction();

    if (customCode) {
      // MODE 2: Custom short code
      await connection.execute(
        'INSERT INTO urls (long_url, short_code, expires_at) VALUES (?, ?, ?)',
        [longUrl, customCode, expiresAt]
      );
      shortCode = customCode;
    } else {
      // MODE 1: Automatic short code
      // 1. Generate a temporary short_code to satisfy NOT NULL during INSERT.
      //    Uses 8 random hex bytes → 16-char string, well within VARCHAR(30).
      //    This value is never returned; it gets overwritten before commit.
      const tempCode = crypto.randomBytes(8).toString('hex');

      // 2. Insert with the temporary placeholder so the row is created
      //    and MySQL assigns the auto-increment ID.
      const [result] = await connection.execute(
        'INSERT INTO urls (long_url, short_code, expires_at) VALUES (?, ?, ?)',
        [longUrl, tempCode, expiresAt]
      );

      const id = result.insertId;

      // 3. Convert the generated ID into the real Base62 short code.
      shortCode = encode(id);

      // 4. Overwrite the temporary placeholder with the real code,
      //    still within the same transaction.
      await connection.execute(
        'UPDATE urls SET short_code = ? WHERE id = ?',
        [shortCode, id]
      );
    }

    // 4. Commit operations.
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

    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'That alias is already taken' });
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
      let targetUrl = cachedUrl;
      let isExpired = false;

      // Verify cached entry has not expired if metadata was stored
      if (typeof cachedUrl === 'string' && cachedUrl.startsWith('{')) {
        try {
          const parsed = JSON.parse(cachedUrl);
          if (parsed && parsed.expiresAt && new Date(parsed.expiresAt) <= new Date()) {
            isExpired = true;
          }
          if (parsed && parsed.longUrl) {
            targetUrl = parsed.longUrl;
          }
        } catch {
          // Plain URL string
        }
      }

      if (isExpired) {
        // Remove stale Redis entry and return 410
        await redis.del(code);
        return res.status(410).json({ error: 'This short URL has expired' });
      }

      console.log(`Cache HIT for code: ${code}`);
      return res.redirect(302, targetUrl);
    }

    console.log(`Cache MISS for code: ${code}`);

    // 2. Redis miss → check MySQL
    const [rows] = await pool.execute(
      'SELECT long_url, expires_at FROM urls WHERE short_code = ?',
      [code]
    );

    // 3. Short code doesn't exist
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Short URL not found' });
    }

    const { long_url: longUrl, expires_at } = rows[0];

    // Check expiration against MySQL expires_at
    if (expires_at && new Date(expires_at) <= new Date()) {
      // It has expired: remove any stale Redis entry and return 410 Gone
      await redis.del(code);
      return res.status(410).json({ error: 'This short URL has expired' });
    }

    // 4. Store it in Redis for future requests with remaining lifetime TTL
    if (expires_at) {
      const remainingSeconds = Math.floor((new Date(expires_at).getTime() - Date.now()) / 1000);
      if (remainingSeconds > 0) {
        await redis.set(code, longUrl, 'EX', remainingSeconds);
      }
    } else {
      await redis.set(code, longUrl);
    }

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
