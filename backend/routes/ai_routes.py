from flask import Blueprint, request, jsonify
from database.db import db
from models.models import AIInsight
from services.ai_service import RoommateAIService
from flask_jwt_extended import jwt_required, get_jwt_identity

ai_bp = Blueprint('ai', __name__)

@ai_bp.route('/chat', methods=['POST'])
@jwt_required()
def chat_with_roommate():
    user_id = get_jwt_identity()
    data = request.get_json() or {}
    message = data.get('message', '').strip()
    
    if not message:
        return jsonify({"error": "Message is required"}), 400
        
    try:
        response = RoommateAIService.generate_chat_response(int(user_id), message)
        return jsonify({"response": response}), 200
    except Exception as e:
        return jsonify({"error": f"AI service error: {str(e)}"}), 500

@ai_bp.route('/analyze', methods=['POST'])
@jwt_required()
def analyze_expenses():
    user_id = int(get_jwt_identity())
    try:
        # Generate the analysis
        analysis_text = RoommateAIService.analyze_spending(user_id)
        
        # Save it to the database as a new insight
        new_insight = AIInsight(user_id=user_id, insight_text=analysis_text)
        db.session.add(new_insight)
        db.session.commit()
        
        return jsonify({
            "analysis": analysis_text,
            "insight_id": new_insight.id,
            "created_at": new_insight.created_at.isoformat()
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"AI analysis error: {str(e)}"}), 500

@ai_bp.route('/insights', methods=['GET'])
@jwt_required()
def get_past_insights():
    user_id = int(get_jwt_identity())
    try:
        insights = AIInsight.query.filter_by(user_id=user_id).order_by(AIInsight.created_at.desc()).limit(10).all()
        return jsonify([ins.to_dict() for ins in insights]), 200
    except Exception as e:
        return jsonify({"error": f"Database error: {str(e)}"}), 500
