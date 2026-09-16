// Base62 encoding/decoding utility
// Alphabet: digits (0-9) + lowercase (a-z) + uppercase (A-Z) = 62 characters
const ALPHABET = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
const BASE = ALPHABET.length; // 62

// Build a reverse lookup map: character → numeric value
// e.g. '0' → 0, 'a' → 10, 'A' → 36
const CHAR_TO_VALUE = {};
for (let i = 0; i < BASE; i++) {
  CHAR_TO_VALUE[ALPHABET[i]] = i;
}

/**
 * Encode a non-negative integer into a Base62 string.
 *
 * Works like any base conversion: repeatedly divide by 62,
 * take the remainder as the next digit (least-significant first),
 * then reverse to get most-significant first.
 *
 * @param {number} num - A non-negative integer.
 * @returns {string} The Base62-encoded string.
 */
function encode(num) {
  if (typeof num !== 'number' || !Number.isInteger(num) || num < 0) {
    throw new Error('encode() expects a non-negative integer');
  }

  // Special case: zero maps to the first character in the alphabet
  if (num === 0) return ALPHABET[0];

  let result = '';

  while (num > 0) {
    // remainder gives the index into the alphabet for this digit
    result = ALPHABET[num % BASE] + result;
    // integer-divide to shift to the next digit
    num = Math.floor(num / BASE);
  }

  return result;
}

/**
 * Decode a Base62 string back to its original non-negative integer.
 *
 * Works like any base conversion in reverse: walk left-to-right,
 * multiply the running total by 62 and add the current digit's value.
 *
 * @param {string} str - A valid Base62 string.
 * @returns {number} The decoded non-negative integer.
 */
function decode(str) {
  if (typeof str !== 'string' || str.length === 0) {
    throw new Error('decode() expects a non-empty string');
  }

  let num = 0;

  for (const char of str) {
    const value = CHAR_TO_VALUE[char];
    if (value === undefined) {
      throw new Error(`Invalid Base62 character: "${char}"`);
    }
    // Shift existing digits left by one base-62 place, then add current digit
    num = num * BASE + value;
  }

  return num;
}

module.exports = { encode, decode };
