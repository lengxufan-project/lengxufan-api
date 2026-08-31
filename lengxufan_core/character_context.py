"""当前角色上下文管理 - 让核心引擎从当前角色读取数据"""
_current_character = None

def set_current_character(config):
    global _current_character
    _current_character = config

def get_current_character():
    return _current_character

def get_character_data(key, default=None):
    if _current_character is None:
        return default
    return getattr(_current_character, key, default)