"""当前角色上下文管理 - 让核心引擎从当前角色读取数据"""
_current_character = None

def set_current_character(config):
    """设置当前角色配置"""
    global _current_character
    _current_character = config

def get_current_character():
    """获取当前角色配置"""
    return _current_character

def get_character_data(key, default=None):
    """从当前角色配置中获取数据"""
    if _current_character is None:
        return default
    return getattr(_current_character, key, default)
