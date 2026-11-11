const express = require("express");
const router = express.Router();
const UserRepository = require("../repository/user.repository");
const customResponse = require("../../apiResponse/customResponse");
const ApiResponseCode = require("../../apiResponse/apiResponseCode");
const authenticate = require("../../../middlewares/auth.middleware");
const authorizeRoles = require("../../../middlewares/role.middleware");
const validateRequest = require("../../../middlewares/validate.middleware");
const { validateCreateUser, validateUpdateUser } = require("../schemas/user.schema");

// All admin user management routes require admin role
router.use(authenticate, authorizeRoles("admin"));

/**
 * @route   GET /api/v1/admin/users
 * @desc    List all users with pagination (Admin only)
 * @access  Private (Admin)
 */
router.get("/", async (req, res, next) => {
  try {
    const { page, limit, role } = req.query;
    const { users, pagination } = await UserRepository.listUsers({ page, limit, role });

    return customResponse(
      res,
      ApiResponseCode.ALLOWED_HTTP_COD.ok,
      "Users retrieved successfully.",
      users,
      null,
      { pagination }
    );
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/v1/admin/users
 * @desc    Add a new user (Admin only)
 * @access  Private (Admin)
 */
router.post("/", validateRequest(validateCreateUser), async (req, res, next) => {
  try {
    const newUser = await UserRepository.createUser(req.body);
    return customResponse(
      res,
      ApiResponseCode.ALLOWED_HTTP_COD.created,
      "User created successfully by admin.",
      newUser
    );
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/v1/admin/users/:id
 * @desc    Get specific user profile by ID (Admin only)
 * @access  Private (Admin)
 */
router.get("/:id", async (req, res, next) => {
  try {
    const user = await UserRepository.getUserById(req.params.id);
    return customResponse(
      res,
      ApiResponseCode.ALLOWED_HTTP_COD.ok,
      "User details retrieved successfully.",
      user
    );
  } catch (error) {
    next(error);
  }
});

/**
 * @route   PUT /api/v1/admin/users/:id
 * @desc    Update user details (Admin only)
 * @access  Private (Admin)
 */
router.put("/:id", validateRequest(validateUpdateUser), async (req, res, next) => {
  try {
    const updatedUser = await UserRepository.updateUser(req.params.id, req.body);
    return customResponse(
      res,
      ApiResponseCode.ALLOWED_HTTP_COD.ok,
      "User updated successfully.",
      updatedUser
    );
  } catch (error) {
    next(error);
  }
});

/**
 * @route   DELETE /api/v1/admin/users/:id
 * @desc    Remove a user and all their notes/posts (Admin only)
 * @access  Private (Admin)
 */
router.delete("/:id", async (req, res, next) => {
  try {
    const result = await UserRepository.deleteUser(req.params.id);
    return customResponse(
      res,
      ApiResponseCode.ALLOWED_HTTP_COD.ok,
      "User removed successfully.",
      result
    );
  } catch (error) {
    next(error);
  }
});

module.exports = router;

