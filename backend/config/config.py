import os
from datetime import timedelta
from dotenv import load_dotenv

load_dotenv()

class Config:
    SECRET_KEY = os.getenv("SECRET_KEY", "spendwise-super-secret-key-12345")
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "spendwise-jwt-secret-key-67890")
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(days=7)
    
    # Database: SQLite for development, PostgreSQL ready
    database_url = os.getenv("DATABASE_URL")
    if database_url:
        # Resolve postgres:// vs postgresql:// compatibility
        if database_url.startswith("postgres://"):
            database_url = database_url.replace("postgres://", "postgresql://", 1)
        SQLALCHEMY_DATABASE_URI = database_url
    else:
        # Store SQLite database in the backend/database/ directory
        base_dir = os.path.abspath(os.path.dirname(os.path.dirname(__file__)))
        db_dir = os.path.join(base_dir, "database")
        if not os.path.exists(db_dir):
            os.makedirs(db_dir)
        SQLALCHEMY_DATABASE_URI = f"sqlite:///{os.path.join(db_dir, 'spendwise.db')}"
        
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # OpenAI key
    OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
