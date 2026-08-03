"""用户认证API"""
from flask import Blueprint, request, jsonify, session
from models import db, User

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/api/register', methods=['POST'])
def register():
    data = request.get_json()
    username = data.get('username', '').strip()
    password = data.get('password', '').strip()
    if not username or len(username) < 2:
        return jsonify({"error": "用户名至少2个字符"}), 400
    if not password or len(password) < 3:
        return jsonify({"error": "密码至少3个字符"}), 400
    existing = User.query.filter_by(username=username).first()
    if existing:
        return jsonify({"error": "用户名已存在"}), 400
    user = User(username=username, is_guest=False)
    user.set_password(password)
    db.session.add(user)
    db.session.commit()
    session['user_id'] = user.id
    session['username'] = user.username
    return jsonify({"message": "注册成功", "user_id": user.id, "username": user.username})

@auth_bp.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username', '').strip()
    password = data.get('password', '').strip()
    user = User.query.filter_by(username=username).first()
    if not user or not user.check_password(password):
        return jsonify({"error": "用户名或密码错误"}), 401
    session['user_id'] = user.id
    session['username'] = user.username
    return jsonify({"message": "登录成功", "user_id": user.id, "username": user.username})

@auth_bp.route('/api/guest', methods=['POST'])
def guest():
    import uuid
    guest_name = f"游客_{uuid.uuid4().hex[:6]}"
    user = User(username=guest_name, is_guest=True)
    db.session.add(user)
    db.session.commit()
    session['user_id'] = user.id
    session['username'] = user.username
    return jsonify({"message": "游客登录成功", "user_id": user.id, "username": user.username})

@auth_bp.route('/api/logout', methods=['POST'])
def logout():
    session.clear()
    return jsonify({"message": "已退出"})

@auth_bp.route('/api/me', methods=['GET'])
def me():
    if 'user_id' not in session:
        return jsonify({"error": "未登录"}), 401
    return jsonify({"user_id": session['user_id'], "username": session['username']})
