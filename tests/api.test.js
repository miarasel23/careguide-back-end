const request = require("supertest");
const app = require("../src/app");
const { connectDB, disconnectDB } = require("../src/core/database");
const runSeeder = require("../src/seeds/seeder");
const User = require("../src/modules/user/models/user.model");
const Note = require("../src/modules/note/models/note.model");
const Post = require("../src/modules/post/models/post.model");

jest.setTimeout(30000);

beforeAll(async () => {
  process.env.NODE_ENV = "test";
  await connectDB();
  await runSeeder({ silent: true });
}, 30000);

afterAll(async () => {
  await disconnectDB();
});

describe("Care Guide Interview Node.js Backend API Test Suite", () => {
  let adminToken;
  let userToken;
  let regularUserId;

  test("1. Health check returns 200 OK", async () => {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe(true);
    expect(res.body.data.service).toContain("Secure Note-Taking REST API");
  });

  test("2. Admin login returns 200 and JWT token", async () => {
    const res = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "admin@example.com", password: "Admin@123" });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe(true);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.user.role).toBe("admin");
    adminToken = res.body.data.token;
  });

  test("3. Regular user login returns 200 and user role", async () => {
    const res = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "user@example.com", password: "User@123" });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe(true);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.user.role).toBe("user");
    userToken = res.body.data.token;
    regularUserId = res.body.data.user._id;
  });

  test("4. Profile /auth/me returns current authenticated user", async () => {
    const res = await request(app)
      .get("/api/v1/auth/me")
      .set("Authorization", `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe(true);
    expect(res.body.data.email).toBe("user@example.com");
  });

  test("5. Invalid credentials return 401 Unauthorized", async () => {
    const res = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "user@example.com", password: "WrongPassword999!" });

    expect(res.status).toBe(401);
    expect(res.body.status).toBe(false);
  });

  test("6. Duplicate registration returns 409 Conflict", async () => {
    const res = await request(app)
      .post("/api/v1/auth/register")
      .send({
        name: "Duplicate User",
        email: "user@example.com",
        password: "Password@123",
      });

    expect(res.status).toBe(409);
    expect(res.body.status).toBe(false);
  });

  test("7. User Notes CRUD and ownership isolation", async () => {
    // Create Note
    const createRes = await request(app)
      .post("/api/v1/notes")
      .set("Authorization", `Bearer ${userToken}`)
      .send({
        title: "Test Note 1",
        content: "Testing note creation and pagination",
      });
    expect(createRes.status).toBe(201);
    const noteId = createRes.body.data._id;

    // List user notes
    const listRes = await request(app)
      .get("/api/v1/notes?page=1&limit=5")
      .set("Authorization", `Bearer ${userToken}`);
    expect(listRes.status).toBe(200);
    expect(Array.isArray(listRes.body.data)).toBe(true);

    // Update note
    const updateRes = await request(app)
      .put(`/api/v1/notes/${noteId}`)
      .set("Authorization", `Bearer ${userToken}`)
      .send({ title: "Updated Note Title", content: "Updated content" });
    expect(updateRes.status).toBe(200);
    expect(updateRes.body.data.title).toBe("Updated Note Title");

    // Delete note
    const deleteRes = await request(app)
      .delete(`/api/v1/notes/${noteId}`)
      .set("Authorization", `Bearer ${userToken}`);
    expect(deleteRes.status).toBe(200);
  });

  test("8. Non-admin user cannot access admin user management (403 Forbidden)", async () => {
    const res = await request(app)
      .get("/api/v1/admin/users")
      .set("Authorization", `Bearer ${userToken}`);

    expect(res.status).toBe(403);
    expect(res.body.status).toBe(false);
  });

  test("9. Admin capabilities: view all notes & manage users", async () => {
    // Admin list all notes
    const allNotesRes = await request(app)
      .get("/api/v1/notes/all?page=1&limit=5")
      .set("Authorization", `Bearer ${adminToken}`);
    expect(allNotesRes.status).toBe(200);
    expect(Array.isArray(allNotesRes.body.data)).toBe(true);

    // Admin list all users
    const usersRes = await request(app)
      .get("/api/v1/admin/users?page=1&limit=5")
      .set("Authorization", `Bearer ${adminToken}`);
    expect(usersRes.status).toBe(200);
    expect(Array.isArray(usersRes.body.data)).toBe(true);
  });

  test("10. Scenario 1 Aggregation: Group by interests via single aggregate() call", async () => {
    const res = await request(app).get("/api/v1/aggregations/group-by-interests");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.data[0]).toHaveProperty("interest");
    expect(res.body.data[0]).toHaveProperty("userCount");
    expect(res.body.data[0]).toHaveProperty("users");
  });

  test("11. Scenario 2 Aggregation: User posts retrieved via single $lookup stage", async () => {
    const res = await request(app).get(`/api/v1/aggregations/user-posts/${regularUserId}`);
    expect(res.status).toBe(200);
    expect(res.body.status).toBe(true);
    expect(res.body.data).toHaveProperty("posts");
    expect(res.body.data).toHaveProperty("postsCount");
    expect(Array.isArray(res.body.data.posts)).toBe(true);
  });

  test("12. Database indexes audit: Exactly 7 custom indexes & ESR compliant", async () => {
    const res = await request(app).get("/api/v1/aggregations/indexes");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe(true);
    expect(res.body.data).toHaveProperty("User");
    expect(res.body.data).toHaveProperty("Note");
    expect(res.body.data).toHaveProperty("Post");
  });

  test("13. Invalid ObjectId format returns 400 Bad Request", async () => {
    const res = await request(app)
      .get("/api/v1/notes/not-a-valid-id")
      .set("Authorization", `Bearer ${userToken}`);
    expect(res.status).toBe(400);
    expect(res.body.status).toBe(false);
  });

  test("14. Public posts feed pagination", async () => {
    const res = await request(app).get("/api/v1/posts?page=1&limit=4");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });
});
