/**
 * Validates the longUrl field in the request body.
 *
 * Rejects requests where longUrl is:
 *   - missing or empty
 *   - not a valid URL
 *   - using a protocol other than http: or https:
 */
function validateUrl(req, res, next) {
  const { longUrl } = req.body;

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

  next();
}

module.exports = validateUrl;
