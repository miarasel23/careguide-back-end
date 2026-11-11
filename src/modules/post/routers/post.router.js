const express = require("express");
const router = express.Router();
const PostRepository = require("../repository/post.repository");
const customResponse = require("../../apiResponse/customResponse");
const ApiResponseCode = require("../../apiResponse/apiResponseCode");
const authenticate = require("../../../middlewares/auth.middleware");
const validateRequest = require("../../../middlewares/validate.middleware");
const { validateCreatePost } = require("../schemas/post.schema");

/**
 * @route   POST /api/v1/posts
 * @desc    Create a new post (visible to everyone)
 * @access  Private (User & Admin)
 */
router.post("/", authenticate, validateRequest(validateCreatePost), async (req, res, next) => {
  try {
    const post = await PostRepository.createPost({
      title: req.body.title,
      content: req.body.content,
      userId: req.user._id,
    });

    return customResponse(
      res,
      ApiResponseCode.ALLOWED_HTTP_COD.created,
      "Post created successfully.",
      post
    );
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/v1/posts
 * @desc    List all posts with pagination (visible to everyone)
 * @access  Public
 */
router.get("/", async (req, res, next) => {
  try {
    const { page, limit } = req.query;
    const { posts, pagination } = await PostRepository.listPosts({ page, limit });

    return customResponse(
      res,
      ApiResponseCode.ALLOWED_HTTP_COD.ok,
      "Posts retrieved successfully.",
      posts,
      null,
      { pagination }
    );
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/v1/posts/user/:userId
 * @desc    SCENARIO 2 AGGREGATION: Retrieve all posts belonging to a particular user
 *          Uses a single aggregation pipeline with a $lookup stage.
 * @access  Public
 */
router.get("/user/:userId", async (req, res, next) => {
  try {
    const userPostsAggregated = await PostRepository.getUserPostsAggregated(req.params.userId);

    return customResponse(
      res,
      ApiResponseCode.ALLOWED_HTTP_COD.ok,
      "User posts retrieved via single aggregation pipeline with $lookup.",
      userPostsAggregated
    );
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/v1/posts/:id
 * @desc    Get specific post by ID
 * @access  Public
 */
router.get("/:id", async (req, res, next) => {
  try {
    const post = await PostRepository.getPostById(req.params.id);
    return customResponse(
      res,
      ApiResponseCode.ALLOWED_HTTP_COD.ok,
      "Post retrieved successfully.",
      post
    );
  } catch (error) {
    next(error);
  }
});

module.exports = router;

