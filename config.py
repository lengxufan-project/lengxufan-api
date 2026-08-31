import os

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY', 'lengxufan-dev-secret-key-2024')
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))
    SQLALCHEMY_DATABASE_URI = f"sqlite:///{os.path.join(BASE_DIR, 'data', 'lengxufan.db')}"
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    JSON_AS_ASCII = False
