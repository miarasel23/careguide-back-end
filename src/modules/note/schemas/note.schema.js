/**
 * Validation rules for Note requests
 */
function validateCreateNote(req) {
  const { title, content } = req.body || {};

  if (!title || typeof title !== "string" || title.trim().length === 0) {
    return "Field 'title' is required and must be a non-empty string.";
  }

  if (!content || typeof content !== "string" || content.trim().length === 0) {
    return "Field 'content' is required and must be a non-empty string.";
  }

  return null;
}

function validateUpdateNote(req) {
  const { title, content } = req.body || {};

  if (title === undefined && content === undefined) {
    return "At least one of 'title' or 'content' must be provided for update.";
  }

  if (title !== undefined && (typeof title !== "string" || title.trim().length === 0)) {
    return "Field 'title' cannot be empty.";
  }

  if (content !== undefined && (typeof content !== "string" || content.trim().length === 0)) {
    return "Field 'content' cannot be empty.";
  }

  return null;
}

module.exports = {
  validateCreateNote,
  validateUpdateNote,
};

