import sys, os, json, importlib.util

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

def load_module(path, name):
    spec = importlib.util.spec_from_file_location(name, path)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod

def convert_character(char_dir, char_id):
    data_dir = os.path.join(char_dir, 'data')
    if not os.path.isdir(data_dir):
        print(f"跳过 {char_id}: 没有 data 目录")
        return
    json_path = os.path.join(data_dir, 'character.json')
    if os.path.exists(json_path):
        print(f"{char_id} 已有 character.json，跳过")
        return

    result = {}
    # 定义文件到字段的映射
    file_map = {
        'persona.py': 'persona',
        'autobiographical.py': 'autobiographical_memories',
        'milestones.py': 'relationship_milestones',
        'scheduled_memories.py': 'scheduled_memories',
        'fallback_actions.py': 'fallback_actions',
        'feeling_translations.py': 'feeling_translations',
        'memory_rules.py': 'memory_rules',
        'intent_templates.py': 'intent_templates',
        'event_templates.py': 'event_templates',
        'context_patterns.py': 'context_patterns',
        'monologue_styles.py': 'monologue_styles',
        'trust_rules.py': 'trust_rules',
        'relationship_stages.py': 'relationship_stages',
        'scene_templates.py': 'scene_templates',
    }

    for filename, key in file_map.items():
        path = os.path.join(data_dir, filename)
        if os.path.exists(path):
            mod = load_module(path, f'char_{char_id}_{filename[:-3]}')
            # 只提取模块级的大写变量
            extracted = {}
            for name in dir(mod):
                if name.isupper():
                    value = getattr(mod, name)
                    # 只保留 JSON 可序列化的数据
                    try:
                        json.dumps(value, ensure_ascii=False)
                        extracted[name] = value
                    except:
                        pass
            if extracted:
                # 将某个变量存入对应 key
                # 根据映射，我们取最常见的变量名
                if key == 'persona':
                    result[key] = extracted.get('PERSONA', {})
                elif key == 'autobiographical_memories':
                    result[key] = extracted.get('AUTOBIOGRAPHICAL_MEMORIES', [])
                elif key == 'relationship_milestones':
                    result[key] = extracted.get('RELATIONSHIP_MILESTONES', [])
                elif key == 'scheduled_memories':
                    result[key] = extracted.get('SCHEDULED_MEMORIES', [])
                elif key == 'fallback_actions':
                    result[key] = extracted.get('FALLBACK_ACTIONS', {})
                    result['status_overlay_actions'] = extracted.get('STATUS_OVERLAY_ACTIONS', {})
                elif key == 'feeling_translations':
                    result[key] = extracted.get('FEELING_TRANSLATIONS', {})
                elif key == 'memory_rules':
                    result[key] = extracted.get('MEMORY_RULES', [])
                    result['identity_evidence_rules'] = extracted.get('IDENTITY_EVIDENCE_RULES', [])
                elif key == 'intent_templates':
                    result[key] = extracted.get('INTENT_TEMPLATES', [])
                elif key == 'event_templates':
                    result[key] = extracted.get('EVENT_TEMPLATES', {})
                    result['causal_chains'] = extracted.get('CAUSAL_CHAIN', {})
                elif key == 'context_patterns':
                    result[key] = extracted
                elif key == 'monologue_styles':
                    result[key] = extracted
                elif key == 'trust_rules':
                    result[key] = extracted
                elif key == 'relationship_stages':
                    result[key] = extracted.get('RELATIONSHIP_STAGES', [])
                elif key == 'scene_templates':
                    result[key] = extracted

    # 保存
    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(result, f, ensure_ascii=False, indent=2)
    print(f"已生成 {json_path}")

if __name__ == '__main__':
    base = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    chars_base = os.path.join(base, 'characters')
    for item in os.listdir(chars_base):
        item_path = os.path.join(chars_base, item)
        if os.path.isdir(item_path) and not item.startswith('__'):
            convert_character(item_path, item)