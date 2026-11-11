require("dotenv").config();

const config = {
  env: process.env.NODE_ENV || "development",
  port: parseInt(process.env.PORT, 10) || 8000,
  mongoUri: process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/secure_notes_db",
  jwt: {
    secret: process.env.JWT_SECRET || "super_secure_jwt_secret_key_care_guide_interview_2026_note_app",
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  },
  corsOrigin: process.env.CORS_ORIGIN || "*",
};

module.exports = config;

