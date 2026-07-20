"""多平台容错路由 - 自动切换、详细调试标注"""
import os, time
from infra.logger import info, warning, error
from .siliconflow_adapter import call_ai
from .model_registry import MODEL_REGISTRY

class ModelRouter:
    def __init__(self, registry=None):
        self.registry = sorted(registry or MODEL_REGISTRY, key=lambda x: x["priority"])
        self.failover_log = []
        self.call_count = {}

    def call(self, messages, max_retries=2):
        for cfg in self.registry:
            name = cfg["name"]
            key = os.environ.get(cfg["key_env"], cfg.get("default_key",""))
            if not key or key == "":
                warning(f"[API] 跳过 {name}：无密钥")
                self.failover_log.append(f"跳过 {name}：无密钥")
                continue

            key_preview = key[:8] + "..." if len(key) > 8 else key
            info(f"[API] 尝试 {name} | Key: {key_preview} | {cfg['description']}")
            try:
                res = call_ai(messages, key, cfg["api_url"], cfg["model"],
                              cfg.get("max_tokens",120), cfg.get("temperature",0.7), max_retries)
                if res and res.strip():
                    self.call_count[name] = self.call_count.get(name, 0) + 1
                    info(f"[API] {name} 成功调用 #{self.call_count[name]}")
                    return res
                else:
                    raise ConnectionError("空回复")
            except Exception as e:
                warning(f"[API] {name} 失败: {type(e).__name__}")
                self.failover_log.append(f"{name}: {type(e).__name__}")
                continue

        error("[API] 全部6个平台调用失败！")
        return "……（他沉默着，没有回答）"

    def get_status(self):
        return {
            "failover_log": self.failover_log,
            "call_count": self.call_count,
            "total_models": len(self.registry),
        }

router = ModelRouter()