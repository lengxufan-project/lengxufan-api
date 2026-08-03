from flask import Blueprint, request, jsonify, session
from models import db
from models.conversation import Conversation
import json

history_bp = Blueprint('history', __name__)

@history_bp.route('/conversations', methods=['GET'])
def get_conversations():
    if 'user_id' not in session:
        return jsonify({"error": "未登录"}), 401
    conversations = Conversation.query.filter_by(user_id=session['user_id']).order_by(Conversation.created_at.asc()).all()
    return jsonify([{
        "id": c.id, "role": c.role, "content": c.content,
        "annotation": c.annotation,
        "state_snapshot": json.loads(c.state_snapshot) if c.state_snapshot else None,
        "created_at": c.created_at.isoformat()
    } for c in conversations])

@history_bp.route('/conversations/<int:msg_id>/annotate', methods=['PUT'])
def annotate_message(msg_id):
    if 'user_id' not in session:
        return jsonify({"error": "未登录"}), 401
    conv = Conversation.query.filter_by(id=msg_id, user_id=session['user_id']).first()
    if not conv:
        return jsonify({"error": "消息不存在"}), 404
    data = request.get_json()
    conv.annotation = data.get('annotation', '')
    db.session.commit()
    return jsonify({"message": "标注已保存"})
