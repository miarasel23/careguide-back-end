const customResponse = require("../modules/apiResponse/customResponse");
const ApiResponseCode = require("../modules/apiResponse/apiResponseCode");

/**
 * Role-Based Access Control Middleware
 * @param  {...string} allowedRoles - e.g. 'admin' or ['admin', 'user']
 */
function authorizeRoles(...allowedRoles) {
  const roles = allowedRoles.flat();

  return (req, res, next) => {
    if (!req.user) {
      return customResponse(
        res,
        ApiResponseCode.ALLOWED_HTTP_COD.unauthorized,
        "Authentication required prior to permission check.",
        null,
        "UNAUTHENTICATED"
      );
    }

    if (!roles.includes(req.user.role)) {
      return customResponse(
        res,
        ApiResponseCode.ALLOWED_HTTP_COD.forbidden,
        `Access denied. Required role: [${roles.join(", ")}]. Current role: '${req.user.role}'.`,
        null,
        "FORBIDDEN"
      );
    }

    next();
  };
}

module.exports = authorizeRoles;

