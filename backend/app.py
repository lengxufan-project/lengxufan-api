import os, sys
from flask import Flask, send_from_directory
from flask_cors import CORS
from config import Config
from models import db
from routes import register_routes

# 将 backend/ 和项目根目录加入 sys.path
_BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, _BACKEND_DIR)
_ROOT = os.path.dirname(_BACKEND_DIR)
if _ROOT not in sys.path:
    sys.path.insert(0, _ROOT)

from paths import SAVE_DIR, LOGS_DIR

# 前端目录（项目根目录下的 frontend/）
_frontend_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'frontend')

def create_app():
    app = Flask(__name__,
                static_folder=None)  # 前端文件通过 send_from_directory 显式路由
    app.config.from_object(Config)

    CORS(app, supports_credentials=True)
    db.init_app(app)

    # 确保 runtime 目录存在
    os.makedirs(SAVE_DIR, exist_ok=True)
    os.makedirs(LOGS_DIR, exist_ok=True)

    with app.app_context():
        db.create_all()

    # 注册 API 路由
    register_routes(app)

    # 角色数据文件路由：提供 characters/<id>/data/character.json 的访问
    @app.route('/characters/<path:subpath>')
    def serve_character_data(subpath):
        characters_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'characters')
        return send_from_directory(characters_dir, subpath)

    # 前端页面路由
    @app.route('/')
    def index():
        return send_from_directory(_frontend_dir, 'index.html')

    # 前端静态文件路由（CSS/JS/图片等）— 放在最后，避免干扰 API 路由
    @app.route('/<path:filename>')
    def serve_frontend_static(filename):
        # 如果路径以 /api/ 开头，说明没有被 API 路由匹配，返回 404
        if filename.startswith('api/'):
            return 'Not Found', 404
        try:
            return send_from_directory(_frontend_dir, filename)
        except Exception:
            return 'Not Found', 404

    return app