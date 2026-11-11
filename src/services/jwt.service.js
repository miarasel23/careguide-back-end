const jwt = require("jsonwebtoken");
const config = require("../core/config");

/**
 * JWT Authentication Token Service
 */
class JwtService {
  /**
   * Generate JWT Access Token
   * @param {object} payload - e.g. { id, email, role }
   * @param {string} [expiresIn]
   * @returns {string}
   */
  static sign(payload, expiresIn = config.jwt.expiresIn) {
    return jwt.sign(payload, config.jwt.secret, { expiresIn });
  }

  /**
   * Verify and decode JWT Access Token
   * @param {string} token
   * @returns {object} decoded payload
   */
  static verify(token) {
    return jwt.verify(token, config.jwt.secret);
  }
}

module.exports = JwtService;

