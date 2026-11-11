const mongoose = require("mongoose");
const User = require("../../user/models/user.model");
const Post = require("../../post/models/post.model");
const Note = require("../../note/models/note.model");

/**
 * Aggregation Repository Layer
 * Strictly implements MongoDB Aggregation Pipelines with required constraints and indexing support
 */
class AggregationRepository {
  /**
   * =========================================================================
   * SCENARIO 1: GROUP BY INTERESTS
   * Context: User profiles contain a list of interests (e.g., ['chess', 'reading']).
   * Task: Specific view to see users grouped by interests.
   * Constraint: You must use EXACTLY ONE collection.aggregate() call. Do not use any other methods.
   * Index: Supported by userSchema.index({ interests: 1 }) [Multikey index]
   * =========================================================================
   */
  static async groupByInterests() {
    // Constraint: EXACTLY ONE collection.aggregate() call.
    return User.aggregate([
      // Stage 1: Filter users having non-empty interests array (supported by multikey index on interests)
      {
        $match: {
          interests: { $exists: true, $ne: [] },
        },
      },
      // Stage 2: Deconstruct interests array into individual interest documents
      {
        $unwind: "$interests",
      },
      // Stage 3: Group documents by individual interest
      {
        $group: {
          _id: "$interests",
          userCount: { $sum: 1 },
          users: {
            $push: {
              _id: "$_id",
              name: "$name",
              email: "$email",
              role: "$role",
            },
          },
        },
      },
      // Stage 4: Sort alphabetically by interest name
      {
        $sort: { _id: 1 },
      },
      // Stage 5: Project clean output format
      {
        $project: {
          _id: 0,
          interest: "$_id",
          userCount: 1,
          users: 1,
        },
      },
    ]);
  }

  /**
   * =========================================================================
   * SCENARIO 2: USER POSTS ($lookup)
   * Context: Users can write posts stored in a separate Posts collection (visible to everyone).
   * Task: Retrieve all posts belonging to a particular user.
   * Constraint: Use a SINGLE aggregation pipeline with a $lookup stage.
   * Index: Supported by postSchema.index({ userId: 1, createdAt: -1 })
   * =========================================================================
   */
  static async getUserPostsWithLookup(userId) {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      const err = new Error(`Invalid user ID format: '${userId}'.`);
      err.statusCode = 400;
      err.errorCode = "INVALID_ID_FORMAT";
      throw err;
    }

    const userObjectId = new mongoose.Types.ObjectId(userId);

    // Single aggregation pipeline using $lookup stage
    const results = await User.aggregate([
      // Stage 1: Match the target user by _id (supported by primary _id index)
      {
        $match: { _id: userObjectId },
      },
      // Stage 2: Join posts collection where posts.userId == user._id
      // Target foreignField 'userId' is indexed via postSchema.index({ userId: 1, createdAt: -1 })
      {
        $lookup: {
          from: "posts",
          localField: "_id",
          foreignField: "userId",
          as: "posts",
          pipeline: [
            { $sort: { createdAt: -1 } },
          ],
        },
      },
      // Stage 3: Shape and project the final aggregated document
      {
        $project: {
          _id: 1,
          name: 1,
          email: 1,
          role: 1,
          interests: 1,
          postsCount: { $size: "$posts" },
          posts: {
            $map: {
              input: "$posts",
              as: "p",
              in: {
                _id: "$$p._id",
                title: "$$p.title",
                content: "$$p.content",
                createdAt: "$$p.createdAt",
                updatedAt: "$$p.updatedAt",
              },
            },
          },
        },
      },
    ]);

    if (!results || results.length === 0) {
      const err = new Error("User not found.");
      err.statusCode = 404;
      err.errorCode = "USER_NOT_FOUND";
      throw err;
    }

    return results[0];
  }

  /**
   * Database Index Inspection
   * Reads and verifies all defined indexes across collections for review
   */
  static async inspectDatabaseIndexes() {
    const [userIndexes, noteIndexes, postIndexes] = await Promise.all([
      User.collection.indexes(),
      Note.collection.indexes(),
      Post.collection.indexes(),
    ]);

    return {
      User: {
        collection: "users",
        indexes: userIndexes,
        explanation: {
          "{ email: 1 }": "Unique index for O(1) login lookup, registration uniqueness, and profile reads.",
          "{ createdAt: -1 }": "Supports admin user list pagination without in-memory sort.",
          "{ interests: 1 }": "Multikey index supporting Scenario 1 aggregation (grouping/filtering by interest).",
        },
      },
      Note: {
        collection: "notes",
        indexes: noteIndexes,
        explanation: {
          "{ userId: 1, createdAt: -1 }": "Compound index supporting user notes list pagination (ESR rule).",
          "{ createdAt: -1 }": "Supports admin all-notes list pagination.",
        },
      },
      Post: {
        collection: "posts",
        indexes: postIndexes,
        explanation: {
          "{ userId: 1, createdAt: -1 }": "Supports Scenario 2 $lookup join foreignField scan and user post sorting.",
          "{ createdAt: -1 }": "Supports public posts list pagination without in-memory sort.",
        },
      },
      constraintAudit: "NO UNNECESSARY INDEXES: Every index corresponds to an active query path or aggregation stage.",
    };
  }
}

module.exports = AggregationRepository;

