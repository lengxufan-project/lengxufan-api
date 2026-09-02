from flask import Blueprint, jsonify, session
from models import db, Conversation

achievement_bp = Blueprint('achievement', __name__)

@achievement_bp.route('/achievements', methods=['GET'])
def get_achievements():
    """返回当前用户的成就列表（初版：仅占位结构，后续可扩展真实成就系统）"""
    # 目前没有真实成就系统，返回空列表
    achievements = []
    # 如果未来需要，可以从用户统计对话轮次生成成就
    return jsonify({"achievements": achievements})