const mongoose = require("mongoose");
const Post = require("../models/post.model");
const User = require("../../user/models/user.model");

/**
 * Post Repository Layer
 * Manages Post database operations and Aggregation pipelines
 */
class PostRepository {
  /**
   * Create a new post
   */
  static async createPost({ title, content, userId }) {
    const post = await Post.create({
      title: title.trim(),
      content: content.trim(),
      userId,
    });
    return post.toObject();
  }

  /**
   * List all public posts with pagination
   * Optimized by index: { createdAt: -1 }
   */
  static async listPosts({ page = 1, limit = 10 }) {
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
    const skip = (pageNum - 1) * limitNum;

    // Supported by postSchema.index({ createdAt: -1 })
    const [posts, total] = await Promise.all([
      Post.find({})
        .populate("userId", "name email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Post.countDocuments({}),
    ]);

    const totalPages = Math.ceil(total / limitNum) || 1;

    return {
      posts,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1,
      },
    };
  }

  /**
   * Get single post by ID supported by primary _id index
   */
  static async getPostById(postId) {
    const post = await Post.findById(postId).populate("userId", "name email").lean();
    if (!post) {
      const err = new Error("Post not found.");
      err.statusCode = 404;
      err.errorCode = "POST_NOT_FOUND";
      throw err;
    }
    return post;
  }

  /**
   * =========================================================================
   * SCENARIO 2 AGGREGATION PIPELINE ($lookup)
   * Task: Retrieve all posts belonging to a particular user.
   * Constraint: Use a single aggregation pipeline with a $lookup stage.
   * Index: Supported by postSchema.index({ userId: 1, createdAt: -1 })
   * =========================================================================
   */
  static async getUserPostsAggregated(userId) {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      const err = new Error(`Invalid user ID format: '${userId}'.`);
      err.statusCode = 400;
      err.errorCode = "INVALID_ID_FORMAT";
      throw err;
    }

    const userObjectId = new mongoose.Types.ObjectId(userId);

    // Single aggregation pipeline on User with $lookup stage joining 'posts'
    // Target field 'foreignField: "userId"' in posts collection is indexed via postSchema.index({ userId: 1, createdAt: -1 })
    const pipeline = [
      {
        $match: { _id: userObjectId },
      },
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
              as: "item",
              in: {
                _id: "$$item._id",
                title: "$$item.title",
                content: "$$item.content",
                createdAt: "$$item.createdAt",
                updatedAt: "$$item.updatedAt",
              },
            },
          },
        },
      },
    ];

    const result = await User.aggregate(pipeline);

    if (!result || result.length === 0) {
      const err = new Error("User not found.");
      err.statusCode = 404;
      err.errorCode = "USER_NOT_FOUND";
      throw err;
    }

    return result[0];
  }

  /**
   * Alternative Single Aggregation Pipeline starting from Post with $lookup from User
   * Constraint: Single aggregation pipeline with a $lookup stage.
   */
  static async getPostsByAuthorAggregated(userId) {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      const err = new Error(`Invalid user ID format: '${userId}'.`);
      err.statusCode = 400;
      err.errorCode = "INVALID_ID_FORMAT";
      throw err;
    }

    const userObjectId = new mongoose.Types.ObjectId(userId);

    // Single aggregation pipeline starting from Post collection
    const pipeline = [
      {
        $match: { userId: userObjectId },
      },
      {
        $sort: { createdAt: -1 },
      },
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "author",
        },
      },
      {
        $unwind: "$author",
      },
      {
        $project: {
          _id: 1,
          title: 1,
          content: 1,
          createdAt: 1,
          updatedAt: 1,
          author: {
            _id: "$author._id",
            name: "$author.name",
            email: "$author.email",
          },
        },
      },
    ];

    return Post.aggregate(pipeline);
  }
}

module.exports = PostRepository;

