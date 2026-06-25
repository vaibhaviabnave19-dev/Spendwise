import os
from flask import Flask, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager

from config.config import Config
from database.db import db

# Import routes
from routes.auth_routes import auth_bp
from routes.expense_routes import expense_bp
from routes.ai_routes import ai_bp

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)
    
    # Enable CORS for frontend communication
    CORS(app, resources={r"/api/*": {"origins": "*"}}, supports_credentials=True)
    
    # Initialize DB
    db.init_app(app)
    
    # Initialize JWT
    jwt = JWTManager(app)
    
    # JWT error handlers
    @jwt.unauthorized_loader
    def unauthorized_response(callback):
        return jsonify({
            "error": "Missing authorization token",
            "message": "Please log in to access this page."
        }), 401

    @jwt.expired_token_loader
    def expired_token_response(jwt_header, jwt_payload):
        return jsonify({
            "error": "Token has expired",
            "message": "Your session has expired. Please log in again."
        }), 401

    @jwt.invalid_token_loader
    def invalid_token_response(callback):
        return jsonify({
            "error": "Invalid token",
            "message": "Session is corrupted. Please log in again."
        }), 401
    
    # Register blueprints
    app.register_blueprint(auth_bp, url_prefix='/api')
    app.register_blueprint(expense_bp, url_prefix='/api/expense')
    app.register_blueprint(ai_bp, url_prefix='/api/ai')
    
    @app.route('/health', methods=['GET'])
    def health_check():
        return jsonify({"status": "healthy", "service": "spendwise-backend"}), 200
        
    # Create tables
    with app.app_context():
        db.create_all()
        print("Database tables initialized successfully.")
        
    return app

if __name__ == '__main__':
    app = create_app()
    port = int(os.getenv("PORT", 5000))
    # Run the application
    app.run(host='0.0.0.0', port=port, debug=True)
