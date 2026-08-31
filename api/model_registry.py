"""妯″瀷娉ㄥ唽琛?- 浠?.env 鏂囦欢璇诲彇 API Key"""
import os
from pathlib import Path

# 鍔犺浇 .env 鏂囦欢
def _load_env_file():
    env_path = Path(__file__).parent.parent / '.env'
    if env_path.exists():
        with open(env_path, 'r', encoding='utf-8') as f:
            for line in f:
                line = line.strip()
                if not line or line.startswith('#') or '=' not in line:
                    continue
                key, _, value = line.partition('=')
                os.environ[key.strip()] = value.strip()

_load_env_file()

MODEL_REGISTRY = [
    {
        "name": "qwen-plus",
        "provider": "alibaba",
        "api_url": "https://llm-nkzjsjz37mnu8tdm.cn-beijing.maas.aliyuncs.com/compatible-mode/v1/chat/completions",
        "key_env": "ALIBABA_API_KEY",
        "default_key": "",
        "model": "qwen-plus",
        "priority": 1,
        "max_tokens": 120,
        "temperature": 0.7,
        "description": "闃块噷浜戠櫨鐐?qwen-plus",
    },
    {
        "name": "glm-free",
        "provider": "zhipu",
        "api_url": "https://open.bigmodel.cn/api/paas/v4/chat/completions",
        "key_env": "GLM_API_KEY",
        "default_key": "",
        "model": "glm-4-flash",
        "priority": 2,
        "max_tokens": 120,
        "temperature": 0.7,
        "description": "鏅鸿氨 GLM-4-Flash 鍏嶈垂",
    },
    {
        "name": "deepseek-chat",
        "provider": "deepseek",
        "api_url": "https://api.deepseek.com/v1/chat/completions",
        "key_env": "DEEPSEEK_API_KEY",
        "default_key": "",
        "model": "deepseek-chat",
        "priority": 3,
        "max_tokens": 120,
        "temperature": 0.7,
        "description": "DeepSeek V3",
    },
    {
        "name": "ollama-local",
        "provider": "ollama",
        "api_url": "http://localhost:11434/v1/chat/completions",
        "key_env": "OLLAMA_API_KEY",
        "default_key": "ollama",
        "model": "qwen2.5:1.5b",
        "priority": 4,
        "max_tokens": 120,
        "temperature": 0.7,
        "description": "Ollama鏈湴",
    },
    {
        "name": "siliconflow",
        "provider": "siliconflow",
        "api_url": "https://api.siliconflow.cn/v1/chat/completions",
        "key_env": "SILICONFLOW_API_KEY",
        "default_key": "",
        "model": "Qwen/Qwen2.5-7B-Instruct",
        "priority": 5,
        "max_tokens": 120,
        "temperature": 0.7,
        "description": "纭呭熀娴佸姩",
    },
]
