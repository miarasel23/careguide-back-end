const customResponse = require("./customResponse");
const ApiResponseCode = require("./apiResponseCode");

/**
 * Global Error Handler Middleware
 * Catches Mongoose validation errors, CastErrors, duplicate key errors, JWT errors, and unhandled exceptions.
 */
function errorHandler(err, req, res, next) {
  // eslint-disable-next-line no-console
  if (process.env.NODE_ENV !== "test") {
    console.error("[Global Error Handler]:", err);
  }

  // 1. Mongoose Duplicate Key Error (e.g. unique email violation)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || "field";
    return customResponse(
      res,
      ApiResponseCode.ALLOWED_HTTP_COD.conflict,
      `Duplicate value entered for ${field}. A record with this ${field} already exists.`,
      null,
      "DUPLICATE_KEY_ERROR",
      { field, value: err.keyValue ? err.keyValue[field] : undefined }
    );
  }

  // 2. Mongoose Validation Error
  if (err.name === "ValidationError") {
    const validationErrors = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));
    return customResponse(
      res,
      ApiResponseCode.ALLOWED_HTTP_COD.bad_request,
      "Validation failed for one or more fields.",
      null,
      "VALIDATION_ERROR",
      { validationErrors }
    );
  }

  // 3. Mongoose Invalid ObjectId Cast Error
  if (err.name === "CastError") {
    return customResponse(
      res,
      ApiResponseCode.ALLOWED_HTTP_COD.bad_request,
      `Invalid resource identifier format for '${err.path}': '${err.value}'.`,
      null,
      "INVALID_ID_FORMAT"
    );
  }

  // 4. JWT Verification Errors
  if (err.name === "JsonWebTokenError") {
    return customResponse(
      res,
      ApiResponseCode.ALLOWED_HTTP_COD.unauthorized,
      "Invalid authentication token.",
      null,
      "INVALID_TOKEN"
    );
  }

  if (err.name === "TokenExpiredError") {
    return customResponse(
      res,
      ApiResponseCode.ALLOWED_HTTP_COD.unauthorized,
      "Authentication token has expired. Please login again.",
      null,
      "TOKEN_EXPIRED"
    );
  }

  // 5. Custom application errors with status code
  const statusCode = err.statusCode || ApiResponseCode.ALLOWED_HTTP_COD.internal_server_error;
  const message = err.message || "An unexpected internal server error occurred.";
  const errorKey = err.errorCode || "INTERNAL_SERVER_ERROR";

  return customResponse(res, statusCode, message, null, errorKey);
}

module.exports = errorHandler;

