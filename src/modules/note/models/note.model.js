const mongoose = require("mongoose");

const noteSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Note title is required"],
      trim: true,
      maxlength: [200, "Title cannot exceed 200 characters"],
    },
    content: {
      type: String,
      required: [true, "Note content is required"],
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
 * Supports: Primary user list view with pagination.
 * Query: Note.find({ userId: req.user._id }).sort({ createdAt: -1 }).skip(...).limit(...)
 * ESR compliant: Equality on userId, Sort on createdAt. Avoids in-memory sort stage.
 */
noteSchema.index({ userId: 1, createdAt: -1 });

/**
 * 2. Index on createdAt (Descending)
 * Supports: Admin global notes list view across all users with pagination.
 * Query: Note.find({}).sort({ createdAt: -1 }).skip(...).limit(...)
 */
noteSchema.index({ createdAt: -1 });

const Note = mongoose.model("Note", noteSchema);

module.exports = Note;

