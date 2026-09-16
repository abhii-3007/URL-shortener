/**
 * Validates the longUrl field in the request body.
 *
 * Rejects requests where longUrl is:
 *   - missing or empty
 *   - not a valid URL
 *   - using a protocol other than http: or https:
 */
function validateUrl(req, res, next) {
  if (req.body.expiresIn === undefined) {
    req.body.expiresIn = 86400;
  }
  const { longUrl, customCode, expiresIn } = req.body;

  // Must be present and non-empty
  if (!longUrl || typeof longUrl !== 'string' || longUrl.trim().length === 0) {
    return res.status(400).json({ error: 'longUrl is required' });
  }

  // Must parse as a valid URL
  let parsed;
  try {
    parsed = new URL(longUrl);
  } catch {
    return res.status(400).json({ error: 'longUrl is not a valid URL' });
  }

  // Only allow http and https protocols
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return res.status(400).json({ error: 'Only http and https URLs are allowed' });
  }

  // Validate optional customCode
  if (customCode !== undefined) {
    if (typeof customCode !== 'string') {
      return res.status(400).json({ error: 'customCode must be a string' });
    }
    if (customCode.length < 3 || customCode.length > 20) {
      return res.status(400).json({ error: 'customCode must be between 3 and 20 characters' });
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(customCode)) {
      return res.status(400).json({ error: 'customCode must match ^[a-zA-Z0-9_-]+$' });
    }

    const reservedAliases = ['health', 'urls'];
    if (reservedAliases.includes(customCode.toLowerCase())) {
      return res.status(400).json({ error: 'That custom alias is reserved' });
    }
  }

  const allowedExpirations = [3600, 21600, 43200, 86400, 259200];
  if (!allowedExpirations.includes(expiresIn)) {
    return res.status(400).json({ error: 'Invalid expiration duration' });
  }

  next();
}

module.exports = validateUrl;
