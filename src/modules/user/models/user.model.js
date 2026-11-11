const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      maxlength: [100, "Name cannot exceed 100 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        "Please provide a valid email address",
      ],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
    },
    role: {
      type: String,
      enum: {
        values: ["user", "admin"],
        message: "Role must be either 'user' or 'admin'",
      },
      default: "user",
    },
    interests: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (doc, ret) {
        delete ret.password;
        delete ret.__v;
        return ret;
      },
    },
  }
);

/* ==========================================================================
   INDEXING STRATEGY (Explicitly defined via schema.index as per requirements)
   Constraint: DO NOT MAKE UNNECESSARY INDEXES.
   ========================================================================== */

/**
 * 1. Unique Index on Email
 * Supports: O(1) lookup during Login, Registration conflict check, and read by email.
 */
userSchema.index({ email: 1 }, { unique: true });

/**
 * 2. Index on createdAt (Descending)
 * Supports: Admin list view for users with pagination and date sorting without memory sort.
 * Query: User.find().sort({ createdAt: -1 }).skip(...).limit(...)
 */
userSchema.index({ createdAt: -1 });

/**
 * 3. Multikey Index on Interests
 * Supports: Scenario 1 Aggregation (Group by Interests) and queries filtering by interests.
 */
userSchema.index({ interests: 1 });

const User = mongoose.model("User", userSchema);

module.exports = User;

