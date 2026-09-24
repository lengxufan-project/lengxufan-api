"""多平台容错路由 - 精简日志 + 智能切换"""
import os, time
from infra.logger import info, warning, error
from .siliconflow_adapter import call_ai, call_ai_stream
from .model_registry import MODEL_REGISTRY

class ModelRouter:
    def __init__(self, registry=None):
        self.registry = sorted(registry or MODEL_REGISTRY, key=lambda x: x["priority"])
        self.failover_log = []
        self.call_count = {}
        self._current_model = ""
        self._failed_models = set()
        self._verified_model = ""

    def _ordered_configs(self):
        """返回本轮尝试的平台配置：已验证模型优先，其余按 priority 排序。"""
        ordered = []
        if self._verified_model and self._verified_model not in self._failed_models:
            verified = next((c for c in self.registry if c["name"] == self._verified_model), None)
            if verified:
                ordered.append(verified)
        for cfg in self.registry:
            if cfg not in ordered:
                ordered.append(cfg)
        return ordered

    def call(self, messages, max_retries=2):
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
            self._failed_models.add(name)
            self._verified_model = ""
            warning(f"[API] 已验证模型 {name} 失败 -> 重新轮询")

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

        self._failed_models.clear()
        error("[API] 全部平台调用失败")
        return "……（他沉默着，没有回答）"

    def call_stream(self, messages, max_retries=2):
        """流式多平台容错：按优先级逐平台尝试，yield 文本增量。

        - 某平台连接成功且产出过内容后中断：保留已产出内容，不再切换（避免重复）；
        - 某平台未产出任何内容即失败：自动切换下一个平台，行为与 call() 一致；
        - 所有平台均失败：yield 统一沉默兜底文案。
        """
        attempts = self._ordered_configs()
        for cfg in attempts:
            name = cfg["name"]
            if name in self._failed_models:
                continue
            key = os.environ.get(cfg["key_env"], cfg.get("default_key", ""))
            if not key or key == "":
                self._failed_models.add(name)
                continue

            is_switch = (name != self._current_model)
            if is_switch:
                key_preview = key[:8] + "..." if len(key) > 8 else key
                info(f"[API] 流式使用 {name} | Key: {key_preview}")

            produced = False
            try:
                for delta in call_ai_stream(
                    messages, key, cfg["api_url"], cfg["model"],
                    cfg.get("max_tokens", 120), cfg.get("temperature", 0.7),
                ):
                    produced = True
                    yield delta
            except Exception as e:
                # 理论上适配器内部已消化读取异常，这里再兜一层
                if produced:
                    return
                warning(f"[API] 流式 {name} 异常 -> 切换备选")
                self.failover_log.append(f"{name}(stream): {type(e).__name__}")
                self._failed_models.add(name)
                continue

            if produced:
                self.call_count[name] = self.call_count.get(name, 0) + 1
                self._current_model = name
                self._verified_model = name
                self._failed_models.discard(name)
                return

            # 未产出任何内容（连接失败 / 非 200 / 空流）-> 切换备选
            warning(f"[API] 流式 {name} 无内容 -> 切换备选")
            self.failover_log.append(f"{name}(stream): empty")
            self._failed_models.add(name)

        self._failed_models.clear()
        error("[API] 全部平台流式调用失败")
        yield "……（他沉默着，没有回答）"

    def get_status(self):
        return {
            "current_model": self._current_model,
            "verified_model": self._verified_model,
            "call_count": self.call_count,
            "failover_log": self.failover_log
        }

router = ModelRouter()
