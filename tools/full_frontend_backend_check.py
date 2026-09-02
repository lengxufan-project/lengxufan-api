import os, sys, json, requests, subprocess, re

base = r"C:\Users\25497\Desktop\创世记\PositiveCharacter\lengxufan-flask-mvp"
os.chdir(base)
sys.path.insert(0, base)

print("=" * 60)
print("前后端一致性全方面审查")
print("=" * 60)

# 1. Python 语法检查
print("\n[1] Python 语法检查")
py_files = []
for dirpath, dirnames, filenames in os.walk(base):
    dirnames[:] = [d for d in dirnames if d not in ["__pycache__", ".git", "chroma_db"]]
    for f in filenames:
        if f.endswith(".py"):
            py_files.append(os.path.join(dirpath, f))
syntax_errors = []
for py_file in py_files:
    result = subprocess.run([sys.executable, "-m", "py_compile", py_file], capture_output=True, text=True)
    if result.returncode != 0:
        syntax_errors.append((py_file, result.stderr.strip()[:200]))
if syntax_errors:
    print(f"❌ {len(syntax_errors)} 个语法错误")
    for f, e in syntax_errors:
        print(f"  - {f}: {e}")
else:
    print("✅ 所有 Python 文件语法正确")

# 2. 核心模块导入检查
print("\n[2] 核心模块导入检查")
modules = [
    "app", "run", "models", "config", "event_bus", "world_state",
    "api.router", "api.model_registry", "api.siliconflow_adapter",
    "infra.logger", "infra.persistence", "infra.time_utils",
    "lengxufan_core", "lengxufan_core.dialogue_engine", "lengxufan_core.perception",
    "lengxufan_core.memory", "lengxufan_core.identity", "lengxufan_core.behavior",
    "lengxufan_core.prompt_builder", "lengxufan_core.character_context",
    "lengxufan_core.social_network", "lengxufan_core.user_state", "lengxufan_core.working_memory",
    "lengxufan_core.character_state.body_state", "lengxufan_core.character_state.mind_state",
    "lengxufan_core.character_state.relationship_dynamics",
    "lengxufan_core.cognition.scene_engine", "lengxufan_core.cognition.context_analyzer",
    "lengxufan_core.cognition.inner_monologue", "lengxufan_core.cognition.thought_chain",
    "lengxufan_core.cognition.trust_suspicion", "lengxufan_core.cognition.trust_sync",
    "lengxufan_core.group_chat",
    "characters", "characters.roster",
    "routes", "routes.auth_routes", "routes.chat_routes", "routes.state_routes",
    "routes.history_routes", "routes.character_routes",
    "services.engine_service", "services.user_service"
]
import_errors = []
for mod in modules:
    try:
        __import__(mod)
    except Exception as e:
        import_errors.append((mod, str(e)))
if import_errors:
    print(f"❌ {len(import_errors)} 个导入错误")
    for mod, err in import_errors:
        print(f"  - {mod}: {err[:200]}")
else:
    print("✅ 所有核心模块导入成功")

# 3. 前端文件引用完整性检查
print("\n[3] 前端文件引用完整性检查")
frontend_dir = os.path.join(base, "frontend")
html_files = [f for f in os.listdir(frontend_dir) if f.endswith(".html")]
missing_refs = []
for html_file in html_files:
    html_path = os.path.join(frontend_dir, html_file)
    with open(html_path, "r", encoding="utf-8") as f:
        content = f.read()
    # 提取 <link href="css/xxx.css"> 和 <script src="js/xxx.js">
    css_refs = re.findall(r'<link[^>]+href="css/([^"]+\.css)"', content)
    js_refs = re.findall(r'<script[^>]+src="js/([^"]+\.js)"', content)
    for css in css_refs:
        path = os.path.join(frontend_dir, "css", css)
        if not os.path.exists(path):
            missing_refs.append((html_file, "css/" + css))
    for js in js_refs:
        path = os.path.join(frontend_dir, "js", js)
        if not os.path.exists(path):
            missing_refs.append((html_file, "js/" + js))
if missing_refs:
    print(f"❌ {len(missing_refs)} 个缺失引用")
    for h, ref in missing_refs:
        print(f"  - {h}: {ref}")
else:
    print("✅ 所有 HTML 引用的 CSS/JS 文件均存在")

# 4. 前端 JS 中 API 调用检查
print("\n[4] 前端 API 调用检查")
api_endpoints = set()
for root_dir, dirs, files in os.walk(os.path.join(frontend_dir, "js")):
    for file in files:
        if file.endswith(".js"):
            path = os.path.join(root_dir, file)
            with open(path, "r", encoding="utf-8") as f:
                content = f.read()
            found = re.findall(r'["\'](/api/[^"\']+)["\']', content)
            for ep in found:
                api_endpoints.add(ep)
print(f"前端 JS 中发现的 API 端点（共 {len(api_endpoints)} 个）：")
for ep in sorted(api_endpoints):
    print(f"  {ep}")

# 5. 后端实际注册的路由检查
print("\n[5] 后端实际注册的路由检查")
try:
    from app import create_app
    app = create_app()
    routes = sorted([rule.rule for rule in app.url_map.iter_rules() if rule.rule.startswith('/api')])
    print(f"后端实际注册的 API 路由（共 {len(routes)} 个）：")
    for r in routes:
        print(f"  {r}")
except Exception as e:
    print(f"❌ 无法创建 Flask 应用: {e}")

print("=" * 60)
print("审查完成")
print("=" * 60)