from flask import Blueprint, request, jsonify, session
from services.user_service import UserService

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    username = data.get('username', '').strip()
    password = data.get('password', '').strip()
    if not username or len(username) < 2:
        return jsonify({"error": "用户名至少2个字符"}), 400
    if not password or len(password) < 3:
        return jsonify({"error": "密码至少3个字符"}), 400
    try:
        user = UserService.register(username, password)
        session['user_id'] = user.id
        session['username'] = user.username
        return jsonify({"message": "注册成功", "user_id": user.id, "username": user.username})
    except ValueError as e:
        return jsonify({"error": str(e)}), 400

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username', '').strip()
    password = data.get('password', '').strip()
    try:
        user = UserService.login(username, password)
        session['user_id'] = user.id
        session['username'] = user.username
        return jsonify({"message": "登录成功", "user_id": user.id, "username": user.username})
    except ValueError as e:
        return jsonify({"error": str(e)}), 401

@auth_bp.route('/guest', methods=['POST'])
def guest():
    user = UserService.create_guest()
    session['user_id'] = user.id
    session['username'] = user.username
    return jsonify({"message": "游客登录成功", "user_id": user.id, "username": user.username})

@auth_bp.route('/logout', methods=['POST'])
def logout():
    session.clear()
    return jsonify({"message": "已退出"})

@auth_bp.route('/me', methods=['GET'])
def me():
    if 'user_id' not in session:
        return jsonify({"error": "未登录"}), 401
    return jsonify({"user_id": session['user_id'], "username": session['username']})
