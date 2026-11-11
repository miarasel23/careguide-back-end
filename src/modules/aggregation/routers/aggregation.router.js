const express = require("express");
const router = express.Router();
const AggregationRepository = require("../repository/aggregation.repository");
const customResponse = require("../../apiResponse/customResponse");
const ApiResponseCode = require("../../apiResponse/apiResponseCode");
const authenticate = require("../../../middlewares/auth.middleware");

/**
 * @route   GET /api/v1/aggregations/group-by-interests
 * @desc    SCENARIO 1: View users grouped by interests
 *          Constraint: EXACTLY ONE collection.aggregate() call.
 * @access  Public / Authenticated
 */
router.get("/group-by-interests", async (req, res, next) => {
  try {
    const data = await AggregationRepository.groupByInterests();

    return customResponse(
      res,
      ApiResponseCode.ALLOWED_HTTP_COD.ok,
      "Users grouped by interests retrieved via single collection.aggregate() pipeline.",
      data
    );
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/v1/aggregations/user-posts/:userId
 * @desc    SCENARIO 2: Retrieve all posts belonging to a particular user
 *          Constraint: Single aggregation pipeline with a $lookup stage.
 * @access  Public / Authenticated
 */
router.get("/user-posts/:userId", async (req, res, next) => {
  try {
    const data = await AggregationRepository.getUserPostsWithLookup(req.params.userId);

    return customResponse(
      res,
      ApiResponseCode.ALLOWED_HTTP_COD.ok,
      "User posts retrieved via single aggregation pipeline with $lookup stage.",
      data
    );
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/v1/aggregations/indexes
 * @route   GET /api/v1/aggregations/indexes-review
 * @desc    Inspect and verify defined MongoDB indexes across collections
 * @access  Public (useful for interview reviewers)
 */
const handleIndexes = async (req, res, next) => {
  try {
    const indexReport = await AggregationRepository.inspectDatabaseIndexes();

    return customResponse(
      res,
      ApiResponseCode.ALLOWED_HTTP_COD.ok,
      "Database index audit report retrieved successfully.",
      indexReport
    );
  } catch (error) {
    next(error);
  }
};

router.get("/indexes", handleIndexes);
router.get("/indexes-review", handleIndexes);

module.exports = router;

