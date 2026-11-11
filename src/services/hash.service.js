const bcrypt = require("bcryptjs");

/**
 * Password Hashing & Verification Service
 * Mirrors TripBackend/modules/user/hashing.py
 */
class HashService {
  /**
   * Securely hash plain password with bcrypt
   * @param {string} plainPassword
   * @returns {Promise<string>}
   */
  static async hash(plainPassword) {
    const saltRounds = 10;
    return bcrypt.hash(plainPassword, saltRounds);
  }

  /**
   * Compare plain password with hashed password
   * @param {string} plainPassword
   * @param {string} hashedPassword
   * @returns {Promise<boolean>}
   */
  static async verify(plainPassword, hashedPassword) {
    if (!plainPassword || !hashedPassword) return false;
    return bcrypt.compare(plainPassword, hashedPassword);
  }
}

module.exports = HashService;

