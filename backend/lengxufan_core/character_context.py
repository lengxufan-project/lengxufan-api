"""当前角色上下文管理 - 使用线程局部存储避免多线程串味"""
import threading

_thread_local = threading.local()

def set_current_character(config):
    """设置当前线程的角色配置"""
    _thread_local.character = config

def get_current_character():
    """获取当前线程的角色配置"""
    return getattr(_thread_local, 'character', None)

def get_character_data(key, default=None):
    """从当前线程的角色配置中获取数据"""
    config = get_current_character()
    if config is None:
        return default
    return getattr(config, key, default)