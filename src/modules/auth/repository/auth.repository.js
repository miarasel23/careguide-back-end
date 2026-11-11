const User = require("../../user/models/user.model");
const HashService = require("../../../services/hash.service");
const JwtService = require("../../../services/jwt.service");

/**
 * Authentication Repository Layer
 * Isolates data access and security logic for Auth
 */
class AuthRepository {
  /**
   * Register a new user
   */
  static async registerUser({ name, email, password, role = "user", interests = [] }) {
    const normalizedEmail = email.toLowerCase().trim();

    // Check existing user via email index (O(1))
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      const err = new Error("A user with this email already exists.");
      err.statusCode = 409;
      err.errorCode = "USER_ALREADY_EXISTS";
      throw err;
    }

    // Securely hash password
    const hashedPassword = await HashService.hash(password);

    // Create user document
    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role: role || "user",
      interests: Array.isArray(interests) ? interests.map((i) => String(i).trim()) : [],
    });

    // Generate JWT access token
    const token = JwtService.sign({
      id: user._id,
      email: user.email,
      role: user.role,
    });

    return {
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        interests: user.interests,
        createdAt: user.createdAt,
      },
    };
  }

  /**
   * Authenticate user credentials and issue JWT
   */
  static async loginUser({ email, password }) {
    const normalizedEmail = email.toLowerCase().trim();

    // Indexed lookup on email
    const user = await User.findOne({ email: normalizedEmail }).select("+password");
    if (!user) {
      const err = new Error("Invalid email or password credentials.");
      err.statusCode = 401;
      err.errorCode = "INVALID_CREDENTIALS";
      throw err;
    }

    // Compare passwords with bcrypt
    const isPasswordValid = await HashService.verify(password, user.password);
    if (!isPasswordValid) {
      const err = new Error("Invalid email or password credentials.");
      err.statusCode = 401;
      err.errorCode = "INVALID_CREDENTIALS";
      throw err;
    }

    // Generate JWT access token
    const token = JwtService.sign({
      id: user._id,
      email: user.email,
      role: user.role,
    });

    return {
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        interests: user.interests,
        createdAt: user.createdAt,
      },
    };
  }

  /**
   * Get user profile by ID (supported by primary _id index)
   */
  static async getUserProfile(userId) {
    const user = await User.findById(userId);
    if (!user) {
      const err = new Error("User not found.");
      err.statusCode = 404;
      err.errorCode = "USER_NOT_FOUND";
      throw err;
    }
    return user;
  }
}

module.exports = AuthRepository;

