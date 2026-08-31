"""日志系统 - 同时输出可读日志和 JSON 结构化日志"""
import logging, os, json
from datetime import datetime

LOG_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data")
os.makedirs(LOG_DIR, exist_ok=True)

# 可读日志文件
LOG_FILE = os.path.join(LOG_DIR, f"lengxufan_{datetime.now().strftime('%Y%m%d')}.log")
# JSON 事件日志文件
JSON_LOG_FILE = os.path.join(LOG_DIR, "events.jsonl")

_logger = None
_json_logger = None

def get_logger(name="lengxufan"):
    global _logger
    if _logger:
        return _logger
    _logger = logging.getLogger(name)
    _logger.setLevel(logging.DEBUG)
    if not _logger.handlers:
        fmt = logging.Formatter("%(asctime)s | %(levelname)-7s | %(module)-15s | %(message)s", datefmt="%Y-%m-%d %H:%M:%S")
        h1 = logging.StreamHandler()
        h1.setLevel(logging.INFO)
        h1.setFormatter(fmt)
        h2 = logging.FileHandler(LOG_FILE, encoding="utf-8")
        h2.setLevel(logging.DEBUG)
        h2.setFormatter(fmt)
        _logger.addHandler(h1)
        _logger.addHandler(h2)
    return _logger

def get_json_logger():
    global _json_logger
    if _json_logger:
        return _json_logger
    _json_logger = logging.getLogger("json_events")
    _json_logger.setLevel(logging.INFO)
    if not _json_logger.handlers:
        h = logging.FileHandler(JSON_LOG_FILE, encoding="utf-8")
        h.setLevel(logging.INFO)
        h.setFormatter(logging.Formatter('%(message)s'))  # 我们手动输出 JSON
        _json_logger.addHandler(h)
    return _json_logger

def info(msg):
    get_logger().info(msg)

def debug(msg):
    get_logger().debug(msg)

def warning(msg):
    get_logger().warning(msg)

def error(msg):
    get_logger().error(msg)

def json_event(event_type, **kwargs):
    """记录一条 JSON 事件"""
    event = {"timestamp": datetime.now().isoformat(), "type": event_type}
    event.update(kwargs)
    get_json_logger().info(json.dumps(event, ensure_ascii=False))