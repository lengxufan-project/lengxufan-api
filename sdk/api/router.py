"""多平台容错路由 - 精简日志 + 智能切换"""
import os, time
from infra.logger import info, warning, error
from .siliconflow_adapter import call_ai
from .model_registry import MODEL_REGISTRY

class ModelRouter:
    def __init__(self, registry=None):
        self.registry = sorted(registry or MODEL_REGISTRY, key=lambda x: x["priority"])
        self.failover_log = []
        self.call_count = {}
        self._current_model = ""
        self._failed_models = set()
        self._verified_model = ""

    def call(self, messages, max_retries=2):
        # 1. 如果有已验证的模型，先试它
        if self._verified_model and self._verified_model not in self._failed_models:
            name = self._verified_model
            cfg = next((c for c in self.registry if c["name"] == name), None)
            if cfg:
                try:
                    key = os.environ.get(cfg["key_env"], cfg.get("default_key",""))
                    if key and key != "":
                        res = call_ai(messages, key, cfg["api_url"], cfg["model"],
                                      cfg.get("max_tokens",120), cfg.get("temperature",0.7), max_retries)
                        if res and res.strip():
                            self.call_count[name] = self.call_count.get(name, 0) + 1
                            self._current_model = name
                            return res
                except Exception:
                    pass
            # 已验证模型失败了，清除标记，进入轮询
            self._failed_models.add(name)
            self._verified_model = ""
            warning(f"[API] 已验证模型 {name} 失败 -> 重新轮询")

        # 2. 按优先级尝试所有模型
        for cfg in self.registry:
            name = cfg["name"]
            if name in self._failed_models:
                continue
            key = os.environ.get(cfg["key_env"], cfg.get("default_key",""))
            if not key or key == "":
                self._failed_models.add(name)
                continue

            is_switch = (name != self._current_model)
            if is_switch:
                key_preview = key[:8] + "..." if len(key) > 8 else key
                info(f"[API] 使用 {name} | Key: {key_preview}")

            try:
                res = call_ai(messages, key, cfg["api_url"], cfg["model"],
                              cfg.get("max_tokens",120), cfg.get("temperature",0.7), max_retries)
                if res and res.strip():
                    self.call_count[name] = self.call_count.get(name, 0) + 1
                    self._current_model = name
                    self._verified_model = name
                    self._failed_models.discard(name)
                    return res
                else:
                    raise ConnectionError("空回复")
            except Exception as e:
                warning(f"[API] {name} 失败 -> 切换备选")
                self.failover_log.append(f"{name}: {type(e).__name__}")
                self._failed_models.add(name)
                continue

        # 3. 全部失败，重置失败列表，再试一次已验证过的
        self._failed_models.clear()
        error("[API] 全部平台调用失败")
        return "……（他沉默着，没有回答）"

    def get_status(self):
        return {
            "current_model": self._current_model,
            "verified_model": self._verified_model,
            "call_count": self.call_count,
            "failover_log": self.failover_log
        }

router = ModelRouter()