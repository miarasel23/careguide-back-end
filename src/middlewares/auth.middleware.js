const JwtService = require("../services/jwt.service");
const User = require("../modules/user/models/user.model");
const customResponse = require("../modules/apiResponse/customResponse");
const ApiResponseCode = require("../modules/apiResponse/apiResponseCode");

/**
 * Authentication Middleware
 * Validates JWT in Authorization header and attaches the user to req.user
 */
async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return customResponse(
        res,
        ApiResponseCode.ALLOWED_HTTP_COD.unauthorized,
        "Authorization token required in 'Bearer <token>' format.",
        null,
        "UNAUTHORIZED"
      );
    }

    const token = authHeader.split(" ")[1];

    let decoded;
    try {
      decoded = JwtService.verify(token);
    } catch (jwtErr) {
      return customResponse(
        res,
        ApiResponseCode.ALLOWED_HTTP_COD.unauthorized,
        jwtErr.name === "TokenExpiredError"
          ? "Authentication token expired. Please login again."
          : "Invalid authentication token.",
        null,
        "INVALID_TOKEN"
      );
    }

    // Read user from database supported by primary _id index
    const user = await User.findById(decoded.id);

    if (!user) {
      return customResponse(
        res,
        ApiResponseCode.ALLOWED_HTTP_COD.unauthorized,
        "User associated with this token no longer exists.",
        null,
        "USER_NOT_FOUND"
      );
    }

    // Attach authenticated user to request
    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
}

module.exports = authenticate;

