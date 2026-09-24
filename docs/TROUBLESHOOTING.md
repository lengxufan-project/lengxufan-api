# 踩坑记录表

> 报错 | 原因 | 解法。新坑按时间追加在表尾。

| # | 报错 | 原因 | 解法 |
|---|---|---|---|
| 1 | `ModuleNotFoundError: flask_cors` | Python 环境装错，依赖装到了别的解释器 | 确认虚拟环境已激活，用 `pip list` 核对，在正确环境重装 `flask-cors` |
| 2 | ComfyUI 报 `CUDA out of memory / CUDA not available` | 显卡显存不足，CUDA 初始化失败 | 关闭占显存的程序，换更低显存模型或降低分辨率/批大小 |
| 3 | Godot 报 `Inference on Variant` 错误 | 把推断类型警告设为了错误，GDScript 类型不明确触发 | 在编辑器设置中把该警告降级为警告或忽略，或补全类型标注 |
| 4 | pip 报 `UnicodeDecodeError` | 存在 GBK 编码的 egg-link 文件，pip 按 UTF-8 读取失败 | 删除/转存对应 `.egg-link` 为 UTF-8，或设 `PYTHONUTF8=1` |
| 5 | `git clone` 连接被 reset | GitHub 直连被墙 | 使用 ghproxy 镜像：`git clone https://ghproxy.com/https://github.com/xxx` |
| 6 | 修改 `character.json` 后角色没变 | 后端启动时加载并缓存了角色数据 | 重启后端进程使配置生效 |
| 7 | 前端页面访问 404 | 页面被归档到 `_archived/` 目录，原路径已失效 | 到 `_archived/` 找回页面，或改用现役页面路径 |
| 8 | SSE 流式接口无输出 | 请求库未开流式，响应一次性返回 | 检查 `requests` 调用是否设置 `stream=True`，并逐块迭代读取 |
