"""用户服务：注册/登录/游客逻辑"""
from models import db
from models.user import User
import uuid

class UserService:
    @staticmethod
    def register(username, password):
        if User.query.filter_by(username=username).first():
            raise ValueError("用户名已存在")
        user = User(username=username, is_guest=False)
        user.set_password(password)
        db.session.add(user)
        db.session.commit()
        return user

    @staticmethod
    def login(username, password):
        user = User.query.filter_by(username=username).first()
        if not user or not user.check_password(password):
            raise ValueError("用户名或密码错误")
        return user

    @staticmethod
    def create_guest():
        guest_name = f"游客_{uuid.uuid4().hex[:6]}"
        user = User(username=guest_name, is_guest=True)
        db.session.add(user)
        db.session.commit()
        return user
