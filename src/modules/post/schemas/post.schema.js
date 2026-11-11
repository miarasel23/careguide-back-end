/**
 * Validation rules for Post requests
 */
function validateCreatePost(req) {
  const { title, content } = req.body || {};

  if (!title || typeof title !== "string" || title.trim().length === 0) {
    return "Field 'title' is required and must be a non-empty string.";
  }

  if (!content || typeof content !== "string" || content.trim().length === 0) {
    return "Field 'content' is required and must be a non-empty string.";
  }

  return null;
}

module.exports = {
  validateCreatePost,
};

