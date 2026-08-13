"""日志系统"""
import logging, os
from datetime import datetime

LOG_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data")
os.makedirs(LOG_DIR, exist_ok=True)
LOG_FILE = os.path.join(LOG_DIR, f"lengxufan_{datetime.now().strftime('%Y%m%d')}.log")
_logger = None

def get_logger(name="lengxufan"):
    global _logger
    if _logger: return _logger
    _logger = logging.getLogger(name)
    _logger.setLevel(logging.DEBUG)
    if not _logger.handlers:
        fmt = logging.Formatter("%(asctime)s | %(levelname)-7s | %(module)-15s | %(message)s", datefmt="%Y-%m-%d %H:%M:%S")
        h1 = logging.StreamHandler(); h1.setLevel(logging.INFO); h1.setFormatter(fmt)
        h2 = logging.FileHandler(LOG_FILE, encoding="utf-8"); h2.setLevel(logging.DEBUG); h2.setFormatter(fmt)
        _logger.addHandler(h1); _logger.addHandler(h2)
    return _logger

def info(msg): get_logger().info(msg)
def debug(msg): get_logger().debug(msg)
def warning(msg): get_logger().warning(msg)
def error(msg): get_logger().error(msg)