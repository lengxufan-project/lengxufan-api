import sys, os, json, re

def parse_md_to_character(md_path, output_base):
    with open(md_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # 简单规则：提取 "## 一、角色人设档案" 等区块，这里演示极简解析，实际可根据你的模板扩充
    data = {
        "persona": {},
        "autobiographical_memories": [],
        "relationship_milestones": [],
        "scheduled_memories": [],
        "fallback_actions": {},
        "feeling_translations": {},
        "memory_rules": [],
        "intent_templates": [],
        "event_templates": {},
        "context_patterns": {},
        "monologue_styles": {},
        "trust_rules": {},
        "relationship_stages": [],
        "scene_templates": {}
    }

    # 提取姓名和代号
    name_match = re.search(r'真实姓名[：:]\s*([^\n]+)', content)
    code_match = re.search(r'代号[：:]\s*([^\n]+)', content)
    if name_match:
        data['persona']['name'] = name_match.group(1).strip()
    if code_match:
        data['persona']['code'] = code_match.group(1).strip()

    # 提取年龄、学院、房间
    age_match = re.search(r'年龄[：:]\s*([^\n]+)', content)
    if age_match:
        data['persona']['age'] = age_match.group(1).strip()
    data['persona']['academy'] = '潜龙学院'
    data['persona']['room'] = '307室'

    # system_prompt 简化
    data['persona']['system_prompt'] = f"你是{data['persona'].get('name','')}，代号{data['persona'].get('code','')}。"

    # 这里省略完整解析，仅生成骨架
    char_name = data['persona'].get('name', 'unknown')
    char_id = char_name  # 可自定义 id，例如拼音
    char_dir = os.path.join(output_base, char_id, 'data')
    os.makedirs(char_dir, exist_ok=True)
    json_path = os.path.join(char_dir, 'character.json')
    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"已生成 {json_path}")

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("用法: python import_character_md.py <markdown文件路径>")
        sys.exit(1)
    md_file = sys.argv[1]
    base = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    chars_base = os.path.join(base, 'characters')
    parse_md_to_character(md_file, chars_base)