/**
 * Standardized API Response Helper
 * Faithfully mirrors TripBackend/modules/apiResponse/response.py
 *
 * Output format:
 * {
 *   "status": true | false,
 *   "message": "...",
 *   "data": [...],
 *   "error": "...",
 *   ...kwargs (e.g. pagination)
 * }
 */
function customResponse(res, statusCode, message, data = null, error = null, extra = {}) {
  // Normalize message (remove numeric prefix like "400: ...")
  let cleanMessage = message;
  if (typeof message === "string" && message.includes(":")) {
    const parts = message.split(":", 2);
    if (!isNaN(parts[0].trim())) {
      cleanMessage = parts[1].trim();
    }
  }

  const isSuccess = statusCode >= 200 && statusCode < 300;

  const responseBody = {
    status: isSuccess,
    message: cleanMessage,
  };

  // Add any extra root-level fields (like pagination metadata)
  if (extra && typeof extra === "object") {
    for (const [key, val] of Object.entries(extra)) {
      if (val !== undefined && val !== null) {
        responseBody[key] = val;
      }
    }
    if (extra.pagination && typeof extra.pagination === "object") {
      responseBody.page = extra.pagination.page;
      responseBody.limit = extra.pagination.limit;
      responseBody.total = extra.pagination.total;
      responseBody.totalPages = extra.pagination.totalPages;
    }
  }

  // Include error details if present
  if (error !== null && error !== undefined) {
    responseBody.error = error;
  }

  // Include data if provided
  if (data !== null && data !== undefined) {
    responseBody.data = data;
  }

  return res.status(statusCode).json(responseBody);
}

module.exports = customResponse;

