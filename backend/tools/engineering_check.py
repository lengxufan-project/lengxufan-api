import os, re, ast

base = os.getcwd()

# 需要扫描的目录
scan_dirs = [
    "lengxufan_core",
    "routes",
    "services",
    "api",
    "infra",
    "cognition",
    "characters",
]

report = []

def scan_py_files(directory):
    for dirpath, dirnames, filenames in os.walk(directory):
        # 跳过缓存和 data
        dirnames[:] = [d for d in dirnames if d not in ["__pycache__", "data"]]
        for fname in filenames:
            if fname.endswith(".py"):
                yield os.path.join(dirpath, fname)

# 1. 检查数据文件是否还包含函数定义
print("=" * 60)
print("1. 数据文件函数残留检查")
for path in scan_py_files(os.path.join(base, "characters")):
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()
    functions = re.findall(r"^\s*def\s+(\w+)\s*\(", content, re.MULTILINE)
    if functions:
        print(f"  [警告] {path} 包含函数: {functions}")

# 2. 检查逻辑代码中是否硬编码角色名
print("=" * 60)
print("2. 硬编码角色名检查")
hardcoded_names = ["冷旭帆", "黄景云", "叶清辞", "陆华望", "向云舟", "冉昭然", "秦狐戏", "陆华希"]
for dir in scan_dirs:
    for path in scan_py_files(os.path.join(base, dir)):
        with open(path, "r", encoding="utf-8") as f:
            content = f.read()
        for name in hardcoded_names:
            # 排除数据文件和 __init__.py 中的角色注册
            if name in content and "characters" not in path and "character_data" not in path:
                # 排除角色注册中心本身
                if path.endswith("characters\\__init__.py"):
                    continue
                count = content.count(name)
                if count > 0:
                    print(f"  [提醒] {path} 硬编码了 '{name}' {count} 次")

# 3. 检查核心引擎是否直接导入角色数据模块
print("=" * 60)
print("3. 核心引擎直接导入角色数据检查")
for path in scan_py_files(os.path.join(base, "lengxufan_core")):
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()
    if "from characters." in content or "import characters." in content:
        print(f"  [警告] {path} 直接导入了角色模块")

# 4. 检查是否有重复定义或未使用导入
print("=" * 60)
print("4. 重复函数/类定义检查")
all_defs = {}
for dir in scan_dirs:
    for path in scan_py_files(os.path.join(base, dir)):
        with open(path, "r", encoding="utf-8") as f:
            content = f.read()
        for match in re.finditer(r"^(?:def|class)\s+(\w+)", content, re.MULTILINE):
            name = match.group(1)
            if name in all_defs:
                print(f"  [提醒] {name} 在 {path} 与 {all_defs[name]} 可能重复")
            else:
                all_defs[name] = path

print("=" * 60)
print("审查完成。")