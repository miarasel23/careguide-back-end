const express = require("express");
const router = express.Router();
const NoteRepository = require("../repository/note.repository");
const customResponse = require("../../apiResponse/customResponse");
const ApiResponseCode = require("../../apiResponse/apiResponseCode");
const authenticate = require("../../../middlewares/auth.middleware");
const authorizeRoles = require("../../../middlewares/role.middleware");
const validateRequest = require("../../../middlewares/validate.middleware");
const { validateCreateNote, validateUpdateNote } = require("../schemas/note.schema");

// All note operations require authentication
router.use(authenticate);

/**
 * @route   GET /api/v1/notes/all
 * @desc    View everyone's notes with pagination (Admin only)
 * @access  Private (Admin)
 */
router.get("/all", authorizeRoles("admin"), async (req, res, next) => {
  try {
    const { page, limit } = req.query;
    const { notes, pagination } = await NoteRepository.listAllNotes({ page, limit });

    return customResponse(
      res,
      ApiResponseCode.ALLOWED_HTTP_COD.ok,
      "All notes retrieved successfully.",
      notes,
      null,
      { pagination }
    );
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/v1/notes
 * @desc    Create a new note
 * @access  Private (User & Admin)
 */
router.post("/", validateRequest(validateCreateNote), async (req, res, next) => {
  try {
    const note = await NoteRepository.createNote({
      title: req.body.title,
      content: req.body.content,
      userId: req.user._id,
    });

    return customResponse(
      res,
      ApiResponseCode.ALLOWED_HTTP_COD.created,
      "Note created successfully.",
      note
    );
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/v1/notes
 * @desc    View list of own notes with pagination (or all notes if admin and ?all=true)
 * @access  Private (User & Admin)
 */
router.get("/", async (req, res, next) => {
  try {
    const { page, limit, all } = req.query;

    // Admin option to view all notes via query param or default to own notes
    if (all === "true" && req.user.role === "admin") {
      const { notes, pagination } = await NoteRepository.listAllNotes({ page, limit });
      return customResponse(
        res,
        ApiResponseCode.ALLOWED_HTTP_COD.ok,
        "All notes retrieved successfully.",
        notes,
        null,
        { pagination }
      );
    }

    const { notes, pagination } = await NoteRepository.listUserNotes(req.user._id, {
      page,
      limit,
    });

    return customResponse(
      res,
      ApiResponseCode.ALLOWED_HTTP_COD.ok,
      "User notes retrieved successfully.",
      notes,
      null,
      { pagination }
    );
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/v1/notes/:id
 * @desc    View specific note by ID (User can view own; Admin can view any)
 * @access  Private (User & Admin)
 */
router.get("/:id", async (req, res, next) => {
  try {
    const note = await NoteRepository.getNoteById(req.params.id, req.user);
    return customResponse(
      res,
      ApiResponseCode.ALLOWED_HTTP_COD.ok,
      "Note details retrieved successfully.",
      note
    );
  } catch (error) {
    next(error);
  }
});

/**
 * @route   PUT /api/v1/notes/:id
 * @desc    Update a note (User can update own; Admin can update any)
 * @access  Private (User & Admin)
 */
router.put("/:id", validateRequest(validateUpdateNote), async (req, res, next) => {
  try {
    const updatedNote = await NoteRepository.updateNote(req.params.id, req.user, req.body);
    return customResponse(
      res,
      ApiResponseCode.ALLOWED_HTTP_COD.ok,
      "Note updated successfully.",
      updatedNote
    );
  } catch (error) {
    next(error);
  }
});

/**
 * @route   DELETE /api/v1/notes/:id
 * @desc    Delete a note (User can delete own; Admin can delete any)
 * @access  Private (User & Admin)
 */
router.delete("/:id", async (req, res, next) => {
  try {
    const result = await NoteRepository.deleteNote(req.params.id, req.user);
    return customResponse(
      res,
      ApiResponseCode.ALLOWED_HTTP_COD.ok,
      "Note deleted successfully.",
      result
    );
  } catch (error) {
    next(error);
  }
});

module.exports = router;

