import os, sys
from flask import Flask, send_from_directory
from flask_cors import CORS
from config import Config
from models import db
from routes import register_routes

def create_app():
    app = Flask(__name__,
                static_folder='frontend',
                static_url_path='')
    app.config.from_object(Config)

    CORS(app, supports_credentials=True)
    db.init_app(app)

    # 确保 data 目录存在
    os.makedirs(os.path.join(Config.BASE_DIR, 'data'), exist_ok=True)

    with app.app_context():
        db.create_all()

    # 注册 API 路由
    register_routes(app)

    # 前端页面路由
    @app.route('/')
    def index():
        return send_from_directory('frontend', 'index.html')

    @app.route('/demo')
    def demo():
        return send_from_directory('frontend', 'demo.html')

    @app.route('/dev')
    def dev():
        return send_from_directory('frontend', 'dev.html')

    return app
