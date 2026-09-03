from flask import Blueprint
from .achievement_routes import achievement_bp
from .dev_routes import dev_bp
from .auth_routes import auth_bp
from .chat_routes import chat_bp
from .state_routes import state_bp
from .history_routes import history_bp
from .character_routes import char_bp
from .notification_routes import notif_bp
from .events_routes import events_bp

def register_routes(app):
    app.register_blueprint(achievement_bp, url_prefix='/api')
    app.register_blueprint(dev_bp, url_prefix='/api')
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(chat_bp, url_prefix='/api')
    app.register_blueprint(state_bp, url_prefix='/api')
    app.register_blueprint(history_bp, url_prefix='/api')
    app.register_blueprint(char_bp, url_prefix='/api')
    app.register_blueprint(notif_bp, url_prefix='/api')
    app.register_blueprint(events_bp, url_prefix='/api')
