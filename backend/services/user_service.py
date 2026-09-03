"""用户服务：注册/登录/游客逻辑"""
from models import db
from models import User
from config import Config
import uuid

class UserService:
    @staticmethod
    def get_by_id(user_id):
        return User.query.get(user_id)

    @staticmethod
    def register(username, password):
        if User.query.filter_by(username=username).first():
            raise ValueError("用户名已存在")
        role = 'developer' if username == Config.DEV_USERNAME else 'user'
        user = User(username=username, is_guest=False, role=role)
        user.set_password(password)
        db.session.add(user)
        db.session.commit()
        return user

    @staticmethod
    def login(username, password):
        user = User.query.filter_by(username=username).first()
        if not user or not user.check_password(password):
            raise ValueError("用户名或密码错误")
        # 登录时检查开发者身份，确保已有用户也能获得 developer 角色
        if username == Config.DEV_USERNAME and user.role != 'developer':
            user.role = 'developer'
            db.session.commit()
        return user

    @staticmethod
    def create_guest():
        guest_name = f"游客_{uuid.uuid4().hex[:6]}"
        user = User(username=guest_name, is_guest=True, role='user')
        db.session.add(user)
        db.session.commit()
        return user
