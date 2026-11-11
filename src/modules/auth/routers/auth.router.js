const express = require("express");
const router = express.Router();
const AuthRepository = require("../repository/auth.repository");
const customResponse = require("../../apiResponse/customResponse");
const ApiResponseCode = require("../../apiResponse/apiResponseCode");
const validateRequest = require("../../../middlewares/validate.middleware");
const { validateRegister, validateLogin } = require("../schemas/auth.schema");
const authenticate = require("../../../middlewares/auth.middleware");

/**
 * @route   POST /api/v1/auth/register
 * @desc    Register a new user account
 * @access  Public
 */
router.post("/register", validateRequest(validateRegister), async (req, res, next) => {
  try {
    const authData = await AuthRepository.registerUser(req.body);
    return customResponse(
      res,
      ApiResponseCode.ALLOWED_HTTP_COD.created,
      "User registered successfully.",
      authData
    );
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/v1/auth/login
 * @desc    Authenticate user & return JWT token
 * @access  Public
 */
router.post("/login", validateRequest(validateLogin), async (req, res, next) => {
  try {
    const authData = await AuthRepository.loginUser(req.body);
    return customResponse(
      res,
      ApiResponseCode.ALLOWED_HTTP_COD.ok,
      "Login successful.",
      authData
    );
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/v1/auth/me
 * @desc    Get currently logged-in user profile
 * @access  Private
 */
router.get("/me", authenticate, async (req, res, next) => {
  try {
    const userProfile = await AuthRepository.getUserProfile(req.user._id);
    return customResponse(
      res,
      ApiResponseCode.ALLOWED_HTTP_COD.ok,
      "User profile retrieved successfully.",
      userProfile
    );
  } catch (error) {
    next(error);
  }
});

module.exports = router;

