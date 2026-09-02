import os, sys, json, requests, subprocess, re, time

base = r"C:\Users\25497\Desktop\创世记\PositiveCharacter\lengxufan-flask-mvp"
os.chdir(base)
sys.path.insert(0, base)

PASS = "✅"
FAIL = "❌"
WARN = "⚠️"

print("=" * 70)
print("冷旭帆项目 前后端全方面命令行验证")
print("=" * 70)

# ---------- 1. Python 语法检查 ----------
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
    print(FAIL, f"发现 {len(syntax_errors)} 个语法错误")
    for f, e in syntax_errors:
        print(f"  - {f}: {e}")
else:
    print(PASS, "所有 Python 文件语法正确")

# ---------- 2. 核心模块导入检查 ----------
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
    "routes.history_routes", "routes.character_routes", "routes.achievement_routes", "routes.dev_routes",
    "services.engine_service", "services.user_service"
]
import_errors = []
for mod in modules:
    try:
        __import__(mod)
    except Exception as e:
        import_errors.append((mod, str(e)))
if import_errors:
    print(FAIL, f"发现 {len(import_errors)} 个导入错误")
    for mod, err in import_errors:
        print(f"  - {mod}: {err[:200]}")
else:
    print(PASS, "所有核心模块导入成功")

# ---------- 3. 前端文件引用完整性 ----------
print("\n[3] 前端 HTML 引用完整性检查")
frontend_dir = os.path.join(base, "frontend")
html_files = [f for f in os.listdir(frontend_dir) if f.endswith(".html")]
missing_refs = []
for html_file in html_files:
    html_path = os.path.join(frontend_dir, html_file)
    with open(html_path, "r", encoding="utf-8") as f:
        content = f.read()
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
    print(FAIL, f"发现 {len(missing_refs)} 个缺失引用")
    for h, ref in missing_refs:
        print(f"  - {h}: {ref}")
else:
    print(PASS, "所有 HTML 引用的 CSS/JS 文件均存在")

# ---------- 4. 前端 JS 中 API 端点与后端路由一致性 ----------
print("\n[4] 前后端 API 契约一致性检查")
# 提取前端 JS 中实际调用的 API 路径（排除注释行）
api_endpoints = set()
for root_dir, dirs, files in os.walk(os.path.join(frontend_dir, "js")):
    for file in files:
        if file.endswith(".js"):
            path = os.path.join(root_dir, file)
            with open(path, "r", encoding="utf-8") as f:
                for line in f:
                    stripped = line.strip()
                    if stripped.startswith("//") or stripped.startswith("*") or stripped.startswith("/*"):
                        continue
                    found = re.findall(r'["\'](/api/[^"\']+)["\']', line)
                    for ep in found:
                        api_endpoints.add(ep)

# 获取后端注册的路由
from app import create_app
app = create_app()
backend_routes = set()
for rule in app.url_map.iter_rules():
    if rule.rule.startswith('/api'):
        # 去掉 <int:msg_id> 等参数，以便与前端字符串匹配
        simplified = re.sub(r'<[^>]+>', 'xxx', rule.rule)
        backend_routes.add(simplified)
        backend_routes.add(rule.rule)  # 也加入原始规则

missing_endpoints = []
for ep in api_endpoints:
    # 处理带查询参数的端点，如 /api/state?char_id=
    ep_path = ep.split('?')[0]
    if not any(ep_path in br or br in ep_path for br in backend_routes):
        missing_endpoints.append(ep)

if missing_endpoints:
    print(FAIL, "前端调用了后端不存在的端点：")
    for ep in missing_endpoints:
        print(f"  - {ep}")
else:
    print(PASS, "前端调用的所有 API 端点在后端均有对应路由")

# ---------- 5. 实际 HTTP 请求测试 ----------
print("\n[5] 关键 API 端点实际请求测试")
base_url = "http://127.0.0.1:5000"
test_cases = [
    ("GET", "/api/characters"),
    ("GET", "/api/state"),
    ("POST", "/api/chat", {"message": "你好", "char_id": "lengxufan"}),
    ("POST", "/api/group_chat", {"message": "今天天气怎么样？"}),
    ("GET", "/api/achievements"),
    ("GET", "/api/dev/stats"),
]
http_failures = []
for method, path, *body in test_cases:
    url = base_url + path
    try:
        if method == "GET":
            resp = requests.get(url, timeout=20)
        elif method == "POST":
            resp = requests.post(url, json=body[0] if body else {}, timeout=30)
        status = resp.status_code
        if status in (200, 201):
            print(PASS, f"{method} {path} -> {status}")
        else:
            print(FAIL, f"{method} {path} -> {status} ({resp.text[:100]})")
            http_failures.append(path)
    except Exception as e:
        print(FAIL, f"{method} {path} 请求失败: {e}")
        http_failures.append(path)

if not http_failures:
    print(PASS, "所有关键 API 端点请求成功")
else:
    print(FAIL, f"有 {len(http_failures)} 个端点请求失败")

print("\n" + "=" * 70)
print("验证完成")
print("=" * 70)