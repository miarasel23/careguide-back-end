const mongoose = require("mongoose");
const User = require("../modules/user/models/user.model");
const Note = require("../modules/note/models/note.model");
const Post = require("../modules/post/models/post.model");
const HashService = require("../services/hash.service");
const { connectDB, disconnectDB } = require("../core/database");

/**
 * Database Seeder
 * Mirrors TripBackend/seeds/users_seed.py
 */
async function runSeeder({ silent = false } = {}) {
  const log = silent ? () => {} : console.log;

  try {
    log("[Seeder] Checking database connection...");
    if (mongoose.connection.readyState === 0) {
      await connectDB();
    }

    log("[Seeder] Ensuring indexes are synchronized via schema.index definitions...");
    await Promise.all([
      User.syncIndexes(),
      Note.syncIndexes(),
      Post.syncIndexes(),
    ]);

    // Check if admin already exists
    const adminExists = await User.findOne({ email: "admin@example.com" });
    if (adminExists) {
      log("[Seeder] Admin user already exists. Seeding skipped.");
      return;
    }

    log("[Seeder] Seeding initial users, notes, and posts...");

    // Password hashes matching demo quick-fill
    const adminPassword = await HashService.hash("Admin@123");
    const userPassword = await HashService.hash("User@123");

    // 1. Seed Admin
    const admin = await User.create({
      name: "Platform Administrator",
      email: "admin@example.com",
      password: adminPassword,
      role: "admin",
      interests: ["chess", "reading", "travel", "technology"],
    });

    // 2. Seed Regular Users with rich interests for Scenario 1
    const alice = await User.create({
      name: "Standard User Alice",
      email: "user@example.com",
      password: userPassword,
      role: "user",
      interests: ["reading", "coding", "photography"],
    });

    const bob = await User.create({
      name: "Bob Smith",
      email: "bob@example.com",
      password: userPassword,
      role: "user",
      interests: ["reading", "hiking", "gaming"],
    });

    const charlie = await User.create({
      name: "Charlie Brown",
      email: "charlie@example.com",
      password: userPassword,
      role: "user",
      interests: ["chess", "coding", "gaming"],
    });

    const david = await User.create({
      name: "David Miller",
      email: "david@example.com",
      password: userPassword,
      role: "user",
      interests: ["travel", "photography"],
    });

    // 3. Seed Notes for each user
    await Note.create([
      // Admin notes
      {
        title: "Sprint Planning Notes",
        content: "Review MongoDB aggregation pipelines, indexing performance, and RBAC policies.",
        userId: admin._id,
      },
      {
        title: "Security Audit Checklist",
        content: "Ensure JWT secrets are rotated and bcrypt salt rounds are set to minimum 10.",
        userId: admin._id,
      },

      // Alice's notes
      {
        title: "Chess Opening Strategies",
        content: "Study Queen's Gambit Declined and Sicilian Defense Najdorf Variation.",
        userId: alice._id,
      },
      {
        title: "Book Recommendations 2026",
        content: "Read 'Designing Data-Intensive Applications' by Martin Kleppmann.",
        userId: alice._id,
      },
      {
        title: "Travel Packing Checklist",
        content: "Passport, power adapter, noise-canceling headphones, comfortable shoes.",
        userId: alice._id,
      },

      // Bob's notes
      {
        title: "Weekend Hiking Trail",
        content: "Explore Mount Baldy trail, starting at 6:00 AM sharp with 3L water.",
        userId: bob._id,
      },
      {
        title: "Gaming Backlog",
        content: "Complete Baldur's Gate 3 Act 3 and finish Elden Ring DLC.",
        userId: bob._id,
      },

      // Charlie's notes
      {
        title: "System Design - Caching Patterns",
        content: "Compare Write-Through, Write-Behind, and Cache-Aside patterns with Redis.",
        userId: charlie._id,
      },

      // David's notes
      {
        title: "Photography Gear Maintenance",
        content: "Clean Sony A7IV sensor, inspect 24-70mm GM lens, backup SD cards to NAS.",
        userId: david._id,
      },
    ]);

    // 4. Seed Posts for Scenario 2 ($lookup demonstration)
    await Post.create([
      {
        title: "Mastering MongoDB Aggregation Pipelines",
        content: "Aggregation pipelines allow developers to transform, filter, and join documents with high efficiency.",
        userId: alice._id,
      },
      {
        title: "Why Compound Indexes Matter for Sorting",
        content: "Using { userId: 1, createdAt: -1 } allows MongoDB to satisfy both equality filters and sorting without in-memory SORT.",
        userId: alice._id,
      },
      {
        title: "Trail Review: High Sierra Escarpment",
        content: "An incredible 14-mile loop with 3,500 ft of elevation gain and pristine alpine lakes.",
        userId: bob._id,
      },
      {
        title: "Microservices vs Modular Monoliths",
        content: "Modular monoliths with clear repository and domain boundaries offer the best balance for most teams.",
        userId: charlie._id,
      },
      {
        title: "Golden Hour Photography in Kyoto",
        content: "Tips for capturing dramatic light across ancient temples during sunset.",
        userId: david._id,
      },
    ]);

    log("[Seeder] Database successfully seeded!");
    log("------------------------------------------------------------------");
    log("Default Admin Account: email='admin@example.com', password='Admin@123'");
    log("Default User Account:  email='user@example.com', password='User@123'");
    log("------------------------------------------------------------------");
  } catch (error) {
    console.error("[Seeder] Error during seeding:", error);
    throw error;
  }
}

// Allow standalone CLI execution: node src/seeds/seeder.js
if (require.main === module) {
  runSeeder()
    .then(async () => {
      await disconnectDB();
      process.exit(0);
    })
    .catch(async (err) => {
      console.error(err);
      await disconnectDB();
      process.exit(1);
    });
}

module.exports = runSeeder;

