const customResponse = require("../modules/apiResponse/customResponse");
const ApiResponseCode = require("../modules/apiResponse/apiResponseCode");

/**
 * Validation middleware factory
 * @param {Function} validatorFn - validator function returning { error, value } or boolean
 */
function validateRequest(validatorFn) {
  return (req, res, next) => {
    const error = validatorFn(req);
    if (error) {
      return customResponse(
        res,
        ApiResponseCode.ALLOWED_HTTP_COD.bad_request,
        error,
        null,
        "VALIDATION_ERROR"
      );
    }
    next();
  };
}

module.exports = validateRequest;

