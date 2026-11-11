const User = require("../models/user.model");
const Note = require("../../note/models/note.model");
const Post = require("../../post/models/post.model");
const HashService = require("../../../services/hash.service");

/**
 * User Repository Layer
 * Manages database interactions for User entities
 */
class UserRepository {
  /**
   * List users with pagination supported by { createdAt: -1 } index
   */
  static async listUsers({ page = 1, limit = 10, role = null }) {
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
    const skip = (pageNum - 1) * limitNum;

    const filter = {};
    if (role) {
      filter.role = role;
    }

    // Supported by userSchema.index({ createdAt: -1 })
    const [users, total] = await Promise.all([
      User.find(filter)
        .select("-password")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      User.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(total / limitNum) || 1;

    return {
      users,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1,
      },
    };
  }

  /**
   * Get single user by ID supported by primary _id index
   */
  static async getUserById(userId) {
    const user = await User.findById(userId).lean();
    if (!user) {
      const err = new Error("User not found.");
      err.statusCode = 404;
      err.errorCode = "USER_NOT_FOUND";
      throw err;
    }
    delete user.password;
    return user;
  }

  /**
   * Create a new user (Admin capability)
   */
  static async createUser({ name, email, password, role = "user", interests = [] }) {
    const normalizedEmail = email.toLowerCase().trim();

    // Checked via { email: 1 } unique index
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      const err = new Error("User with this email already exists.");
      err.statusCode = 409;
      err.errorCode = "USER_ALREADY_EXISTS";
      throw err;
    }

    const hashedPassword = await HashService.hash(password);

    const newUser = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role: role || "user",
      interests: Array.isArray(interests) ? interests.map((i) => String(i).trim()) : [],
    });

    const userObj = newUser.toObject();
    delete userObj.password;
    return userObj;
  }

  /**
   * Update existing user details
   */
  static async updateUser(userId, updateData) {
    const user = await User.findById(userId);
    if (!user) {
      const err = new Error("User not found.");
      err.statusCode = 404;
      err.errorCode = "USER_NOT_FOUND";
      throw err;
    }

    if (updateData.email && updateData.email.toLowerCase().trim() !== user.email) {
      const emailExists = await User.findOne({ email: updateData.email.toLowerCase().trim() });
      if (emailExists) {
        const err = new Error("Email is already taken by another account.");
        err.statusCode = 409;
        err.errorCode = "EMAIL_ALREADY_EXISTS";
        throw err;
      }
      user.email = updateData.email.toLowerCase().trim();
    }

    if (updateData.name !== undefined) user.name = updateData.name.trim();
    if (updateData.role !== undefined) user.role = updateData.role;
    if (updateData.interests !== undefined) {
      user.interests = Array.isArray(updateData.interests)
        ? updateData.interests.map((i) => String(i).trim())
        : [];
    }
    if (updateData.password) {
      user.password = await HashService.hash(updateData.password);
    }

    await user.save();

    const result = user.toObject();
    delete result.password;
    return result;
  }

  /**
   * Delete user and associated notes/posts
   */
  static async deleteUser(userId) {
    const user = await User.findById(userId);
    if (!user) {
      const err = new Error("User not found.");
      err.statusCode = 404;
      err.errorCode = "USER_NOT_FOUND";
      throw err;
    }

    await Promise.all([
      User.findByIdAndDelete(userId),
      Note.deleteMany({ userId }),
      Post.deleteMany({ userId }),
    ]);

    return { deletedUserId: userId, message: "User and associated notes/posts deleted successfully." };
  }
}

module.exports = UserRepository;

