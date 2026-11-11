const Note = require("../models/note.model");

/**
 * Note Repository Layer
 * Manages Note database operations with role-based access checks and index-backed queries
 */
class NoteRepository {
  /**
   * List notes for a specific user with pagination
   * Optimized by compound index: { userId: 1, createdAt: -1 }
   */
  static async listUserNotes(userId, { page = 1, limit = 10 }) {
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
    const skip = (pageNum - 1) * limitNum;

    // Supported by noteSchema.index({ userId: 1, createdAt: -1 })
    const [notes, total] = await Promise.all([
      Note.find({ userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Note.countDocuments({ userId }),
    ]);

    const totalPages = Math.ceil(total / limitNum) || 1;

    return {
      notes,
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
   * List all notes across all users with pagination (Admin view)
   * Optimized by index: { createdAt: -1 }
   */
  static async listAllNotes({ page = 1, limit = 10 }) {
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
    const skip = (pageNum - 1) * limitNum;

    // Supported by noteSchema.index({ createdAt: -1 })
    const [notes, total] = await Promise.all([
      Note.find({})
        .populate("userId", "name email role")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Note.countDocuments({}),
    ]);

    const totalPages = Math.ceil(total / limitNum) || 1;

    return {
      notes,
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
   * Create a new note
   */
  static async createNote({ title, content, userId }) {
    const note = await Note.create({
      title: title.trim(),
      content: content.trim(),
      userId,
    });
    return note.toObject();
  }

  /**
   * Get specific note by ID with permission check
   * Supported by primary _id index
   */
  static async getNoteById(noteId, currentUser) {
    const note = await Note.findById(noteId).populate("userId", "name email role").lean();
    if (!note) {
      const err = new Error("Note not found.");
      err.statusCode = 404;
      err.errorCode = "NOTE_NOT_FOUND";
      throw err;
    }

    // Role check: Admin can view any note; regular user can only view their own
    const authorId = note.userId && (note.userId._id || note.userId).toString();
    if (currentUser.role !== "admin" && authorId !== currentUser._id.toString()) {
      const err = new Error("Access denied. You can only view your own notes.");
      err.statusCode = 403;
      err.errorCode = "FORBIDDEN";
      throw err;
    }

    return note;
  }

  /**
   * Update note with ownership / admin verification
   */
  static async updateNote(noteId, currentUser, { title, content }) {
    const note = await Note.findById(noteId);
    if (!note) {
      const err = new Error("Note not found.");
      err.statusCode = 404;
      err.errorCode = "NOTE_NOT_FOUND";
      throw err;
    }

    // Role check: Admin can update any note; regular user can only update their own
    if (currentUser.role !== "admin" && note.userId.toString() !== currentUser._id.toString()) {
      const err = new Error("Access denied. You can only update your own notes.");
      err.statusCode = 403;
      err.errorCode = "FORBIDDEN";
      throw err;
    }

    if (title !== undefined) note.title = title.trim();
    if (content !== undefined) note.content = content.trim();

    await note.save();
    return note.toObject();
  }

  /**
   * Delete note with ownership / admin verification
   */
  static async deleteNote(noteId, currentUser) {
    const note = await Note.findById(noteId);
    if (!note) {
      const err = new Error("Note not found.");
      err.statusCode = 404;
      err.errorCode = "NOTE_NOT_FOUND";
      throw err;
    }

    // Role check: Admin can delete any note; regular user can only delete their own
    if (currentUser.role !== "admin" && note.userId.toString() !== currentUser._id.toString()) {
      const err = new Error("Access denied. You can only delete your own notes.");
      err.statusCode = 403;
      err.errorCode = "FORBIDDEN";
      throw err;
    }

    await Note.findByIdAndDelete(noteId);
    return { deletedNoteId: noteId, message: "Note deleted successfully." };
  }
}

module.exports = NoteRepository;

