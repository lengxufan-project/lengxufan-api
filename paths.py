import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
FRONTEND_DIR = os.path.join(BASE_DIR, "frontend")
BACKEND_DIR = os.path.join(BASE_DIR, "backend")
DATA_DIR = os.path.join(BASE_DIR, "data")
RUNTIME_DIR = os.path.join(DATA_DIR, "runtime")
CHARACTERS_DIR = os.path.join(BACKEND_DIR, "characters")
SAVE_DIR = os.path.join(RUNTIME_DIR, "save")
CHROMA_DIR = os.path.join(RUNTIME_DIR, "chroma_db")
LOGS_DIR = os.path.join(RUNTIME_DIR, "logs")