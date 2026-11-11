# Secure Note-Taking REST API (Node.js + Express.js + Mongoose)

> **Technical Interview Task Submission**  
> **Candidate / Author:** Md Rasel Mia  
> **Phone:** 01997709990  
> **Email:** eng.rasel1994@gmail.com  
> **Runtime:** Node.js (v20+)  
> **Framework:** Express.js  
> **ODM:** Mongoose  
> **Architecture:** Care Guide Interview Modular Domain Pattern  

---

## 1. Project Overview & Architecture

This backend implements a full-featured, secure note-taking REST API strictly adhering to all technical interview specifications:
- **MongoDB with Mongoose**
- **Explicit `schema.index` Definitions** for review
- **Strict Role-Based Access Control (RBAC)**: `user` and `admin`
- **Zero Unnecessary Indexes**: Exactly 7 custom indexes across 3 collections
- **MongoDB Aggregation Pipelines**:
  - **Scenario 1**: Group users by interests using exactly one `User.aggregate()` call.
  - **Scenario 2**: Retrieve all posts belonging to a particular user using a single aggregation pipeline with a `$lookup` stage.

### Project Layout

```
interview-back-end-node/
├── package.json                     # Dependencies (express, mongoose, bcryptjs, jsonwebtoken, cors, dotenv)
├── package-lock.json
├── .env.example                     # Environment template
├── src/
│   ├── app.js                       # Express application, CORS, routers & global error handling
│   ├── server.js                    # Server startup, graceful shutdown, database connection
│   ├── core/
│   │   ├── config.js                # Environment variables loader
│   │   └── database.js              # Mongoose connection with embedded memory fallback
│   ├── middlewares/
│   │   ├── auth.middleware.js       # JWT verification & req.user extraction
│   │   ├── role.middleware.js       # Role check (requireAdmin / authorizeRoles)
│   │   └── validate.middleware.js   # Request body schema validator
│   ├── modules/
│   │   ├── apiResponse/             # Unified response & error envelope
│   │   │   ├── apiResponseCode.js   # Standard HTTP status code dictionary
│   │   │   ├── customResponse.js    # customResponse() envelope helper
│   │   │   └── errorHandler.js      # Global error handler (Mongoose validation, duplicate key, CastError)
│   │   ├── auth/                    # Authentication Domain (Register, Login, Me)
│   │   ├── user/                    # User Domain & Mongoose schema with schema.index()
│   │   ├── note/                    # Note Domain & Mongoose schema with compound ESR index
│   │   ├── post/                    # Post Domain (Scenario 2 collection)
│   │   └── aggregation/             # Aggregation Pipelines (Scenario 1 & Scenario 2)
│   ├── services/
│   │   ├── cors.service.js          # Production CORS configuration
│   │   ├── hash.service.js          # Native bcrypt password hashing
│   │   └── jwt.service.js           # JWT sign & verify
│   └── seeds/
│       └── seeder.js                # Database seeder (Admin, Alice, Bob, notes, posts)
└── tests/
    └── api.test.js                  # Comprehensive Jest + Supertest suite (14/14 automated tests)
```

---

## 2. Roles & Permissions (RBAC)

| Capability | `user` Role | `admin` Role |
| :--- | :---: | :---: |
| **Create, Update, Delete own notes** | ✅ Yes | ✅ Yes (Inherited) |
| **View paginated list of own notes** | ✅ Yes | ✅ Yes (Inherited) |
| **View everyone's notes across the system** | ❌ Forbidden (403) | ✅ Yes |
| **Manage users (Add, Update, Delete, List)** | ❌ Forbidden (403) | ✅ Yes |
| **Publish community posts** | ✅ Yes | ✅ Yes |
| **Execute Aggregation Pipelines** | ✅ Yes | ✅ Yes |

---

## 3. Database Indexing Strategy (ESR Rule Compliance)

> **Critical Constraint Audit:**  
> **"DO NOT MAKE ANY UNNECESSARY INDEXES. You will be evaluated on the efficiency of your indexing strategy."**  
> All indexes are explicitly created in code using the **`schema.index()`** method as required.

### 1. `users` Collection (`src/modules/user/models/user.model.js`)
```javascript
// 1. O(1) read during login authentication and registration conflict check
userSchema.index({ email: 1 }, { unique: true });

// 2. Admin user list pagination sorted chronologically descending
userSchema.index({ createdAt: -1 });

// 3. Scenario 1 Aggregation: multikey index for grouping users by interest
userSchema.index({ interests: 1 });
```

### 2. `notes` Collection (`src/modules/note/models/note.model.js`)
```javascript
// 1. Compound Index following the ESR Rule (Equality on userId, Sort on createdAt)
// Supports user listing their own notes with pagination without in-memory sort
noteSchema.index({ userId: 1, createdAt: -1 });

// 2. Admin global notes list view across all users with pagination
noteSchema.index({ createdAt: -1 });
```

### 3. `posts` Collection (`src/modules/post/models/post.model.js`)
```javascript
// 1. Compound Index: optimizes Scenario 2 $lookup join on foreignField: "userId" & sorts posts
postSchema.index({ userId: 1, createdAt: -1 });

// 2. Public community posts list with pagination sorted descending
postSchema.index({ createdAt: -1 });
```

**Total Custom Indexes:** Exactly 7 across all 3 collections.

---

## 4. Aggregation Pipelines

### Scenario 1: Group Users by Interests (Single `User.aggregate()` call)
```javascript
User.aggregate([
  { $match: { interests: { $exists: true, $ne: [] } } },
  { $unwind: "$interests" },
  {
    $group: {
      _id: "$interests",
      userCount: { $sum: 1 },
      users: {
        $push: { _id: "$_id", name: "$name", email: "$email", role: "$role" }
      }
    }
  },
  { $sort: { _id: 1 } },
  {
    $project: {
      _id: 0,
      interest: "$_id",
      userCount: 1,
      users: 1
    }
  }
]);
```

### Scenario 2: User Posts ($lookup Stage)
```javascript
User.aggregate([
  { $match: { _id: userObjectId } },
  {
    $lookup: {
      from: "posts",
      localField: "_id",
      foreignField: "userId",
      as: "posts",
      pipeline: [{ $sort: { createdAt: -1 } }]
    }
  },
  {
    $project: {
      _id: 1,
      name: 1,
      email: 1,
      role: 1,
      interests: 1,
      postsCount: { $size: "$posts" },
      posts: 1
    }
  }
]);
```

---

## 5. Pre-Seeded Accounts

| Account | Email | Password | Role |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@example.com` | `Admin@123` | `admin` |
| **Standard User (Alice)** | `user@example.com` | `User@123` | `user` |
| **Test User (Bob)** | `bob@example.com` | `User@123` | `user` |

---

## 6. How to Run

### Install Dependencies
```bash
npm install
```

### Start Server
```bash
npm start
# or for development:
npm run dev
```
- Server URL: `http://localhost:8000`
- Health check: `http://localhost:8000/health`
- The server will automatically connect to local MongoDB, or seamlessly spawn an embedded in-memory MongoDB server if local daemon is unreachable!

### Run Automated Tests
```bash
npm test
```
Runs the 14/14 automated test suite verifying all routes, RBAC boundaries, aggregations, and indexes.

