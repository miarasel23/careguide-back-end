import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env file from project root
BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(os.path.join(BASE_DIR, ".env"))

class Settings:
    PROJECT_NAME: str = "Secure Note-Taking REST API"
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    PORT: int = int(os.getenv("PORT", "8000"))
    
    # MongoDB settings
    MONGODB_URI: str = os.getenv("MONGODB_URI", "mongodb://127.0.0.1:27017/secure_notes_db")
    MONGODB_DB_NAME: str = os.getenv("MONGODB_DB_NAME", "secure_notes_db")
    
    # JWT authentication settings
    JWT_SECRET: str = os.getenv("JWT_SECRET", "super_secure_jwt_secret_key_care_guide_interview_2026_note_app")
    JWT_ALGORITHM: str = os.getenv("JWT_ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "10800"))
    
    # CORS
    CORS_ORIGIN: str = os.getenv("CORS_ORIGIN", "*")

settings = Settings()

