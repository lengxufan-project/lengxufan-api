import os, sys

# 将项目根目录加入 sys.path，确保能导入 paths.py
_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if _ROOT not in sys.path:
    sys.path.insert(0, _ROOT)
from paths import RUNTIME_DIR

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY', 'lengxufan-dev-secret-key-2024')
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))
    SQLALCHEMY_DATABASE_URI = f"sqlite:///{os.path.join(RUNTIME_DIR, 'lengxufan.db')}"
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    JSON_AS_ASCII = False

    # 开发者识别：登录时若用户名匹配 DEV_USERNAME，自动赋予 developer 角色
    DEV_USERNAME = os.environ.get('DEV_USERNAME', 'yingying')
