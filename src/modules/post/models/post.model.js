const mongoose = require("mongoose");

const postSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Post title is required"],
      trim: true,
      maxlength: [200, "Title cannot exceed 200 characters"],
    },
    content: {
      type: String,
      required: [true, "Post content is required"],
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Author User ID is required"],
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (doc, ret) {
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
 * 1. Compound Index: { userId: 1, createdAt: -1 }
 * Supports: Scenario 2 Aggregation ($lookup on foreignField: 'userId') and user posts retrieval.
 * Optimizes foreign key lookups and prevents collection scans during $lookup aggregation stages.
 */
postSchema.index({ userId: 1, createdAt: -1 });

/**
 * 2. Index on createdAt (Descending)
 * Supports: Public posts list operation with pagination.
 * Query: Post.find({}).sort({ createdAt: -1 }).skip(...).limit(...)
 */
postSchema.index({ createdAt: -1 });

const Post = mongoose.model("Post", postSchema);

module.exports = Post;

