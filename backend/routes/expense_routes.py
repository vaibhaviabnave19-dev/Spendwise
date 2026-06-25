from flask import Blueprint, request, jsonify
from database.db import db
from models.models import Expense
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, timedelta
from sqlalchemy import func

expense_bp = Blueprint('expense', __name__)

@expense_bp.route('/add', methods=['POST'])
@jwt_required()
def add_expense():
    user_id = get_jwt_identity()
    data = request.get_json() or {}
    
    amount = data.get('amount')
    category = data.get('category', '').strip()
    note = data.get('note', '').strip()
    date_str = data.get('date', '').strip()
    
    if amount is None or not category or not date_str:
        return jsonify({"error": "Amount, category, and date are required"}), 400
        
    try:
        amount = float(amount)
        if amount <= 0:
            return jsonify({"error": "Amount must be a positive number"}), 400
    except ValueError:
        return jsonify({"error": "Amount must be a valid number"}), 400
        
    # Validate date format (YYYY-MM-DD)
    try:
        datetime.strptime(date_str, '%Y-%m-%d')
    except ValueError:
        return jsonify({"error": "Date must be in YYYY-MM-DD format"}), 400
        
    try:
        new_expense = Expense(
            user_id=int(user_id),
            amount=amount,
            category=category,
            note=note,
            date=date_str
        )
        db.session.add(new_expense)
        db.session.commit()
        
        return jsonify({
            "message": "Expense added successfully",
            "expense": new_expense.to_dict()
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Database error: {str(e)}"}), 500

@expense_bp.route('/all', methods=['GET'])
@jwt_required()
def get_all_expenses():
    user_id = get_jwt_identity()
    try:
        expenses = Expense.query.filter_by(user_id=int(user_id)).order_by(Expense.date.desc(), Expense.id.desc()).all()
        return jsonify([exp.to_dict() for exp in expenses]), 200
    except Exception as e:
        return jsonify({"error": f"Database error: {str(e)}"}), 500

@expense_bp.route('/summary', methods=['GET'])
@jwt_required()
def get_expense_summary():
    user_id = int(get_jwt_identity())
    try:
        # Total spending
        total_spending = db.session.query(func.sum(Expense.amount)).filter_by(user_id=user_id).scalar() or 0.0
        
        # Category breakdown
        category_breakdown = db.session.query(
            Expense.category, 
            func.sum(Expense.amount)
        ).filter_by(user_id=user_id).group_by(Expense.category).all()
        
        categories = {}
        for cat, amt in category_breakdown:
            categories[cat] = float(amt)
            
        # Daily spending (last 30 days) for chart
        thirty_days_ago = (datetime.utcnow() - timedelta(days=30)).strftime('%Y-%m-%d')
        daily_breakdown = db.session.query(
            Expense.date,
            func.sum(Expense.amount)
        ).filter(
            Expense.user_id == user_id,
            Expense.date >= thirty_days_ago
        ).group_by(Expense.date).order_by(Expense.date.asc()).all()
        
        daily = []
        for dt, amt in daily_breakdown:
            daily.append({
                "date": dt,
                "amount": float(amt)
            })
            
        # Monthly spending
        current_month = datetime.utcnow().strftime('%Y-%m')
        monthly_spending = db.session.query(func.sum(Expense.amount)).filter(
            Expense.user_id == user_id,
            Expense.date.like(f"{current_month}%")
        ).scalar() or 0.0
        
        return jsonify({
            "total_spending": float(total_spending),
            "monthly_spending": float(monthly_spending),
            "category_breakdown": categories,
            "daily_breakdown": daily
        }), 200
    except Exception as e:
        return jsonify({"error": f"Database error: {str(e)}"}), 500

@expense_bp.route('/<int:expense_id>', methods=['DELETE'])
@jwt_required()
def delete_expense(expense_id):
    user_id = int(get_jwt_identity())
    try:
        expense = Expense.query.filter_by(id=expense_id, user_id=user_id).first()
        if not expense:
            return jsonify({"error": "Expense not found or unauthorized"}), 404
            
        db.session.delete(expense)
        db.session.commit()
        return jsonify({"message": "Expense deleted successfully"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Database error: {str(e)}"}), 500
