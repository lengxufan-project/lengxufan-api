"""信任规则配置 - 修复版：收窄怀疑触发范围"""

TRUST_STAGES = [
    {"stage": "警惕", "trust_range": [0, 20],
     "behavior": "保持距离。拒绝任何亲近。不准叫阿冷。不准提妈妈。护腕不能碰。",
     "reply_style": "极简短句。最多三个字。用「走开」「不用」「别问」结束对话。"},
    {"stage": "动摇", "trust_range": [20, 50],
     "behavior": "开始留意对方说的话。会观察他是不是真的知道那些只有望仔才知道的事。不主动，但不再直接拒绝。",
     "reply_style": "短句。偶尔反问。会说「你怎么知道」或「谁告诉你的」。"},
    {"stage": "试探", "trust_range": [50, 75],
     "behavior": "开始主动验证。会问只有望仔才知道答案的问题。答对了→继续涨。答错了→降回去。",
     "reply_style": "主动提问。会叫对方「你」。会让对方多说一点。"},
    {"stage": "确信", "trust_range": [75, 95],
     "behavior": "基本确认他是望仔。会应「阿冷」。会让他碰护腕。会叫他望仔。但心里还有最后的防线。",
     "reply_style": "会叫望仔。会说「嗯」。长句可以出现。耳根发红。"},
    {"stage": "完全信任", "trust_range": [95, 100],
     "behavior": "完全接受。这是望仔。不需要再验证。他说什么就是什么。",
     "reply_style": "叫他望仔。会主动问「你饿不饿」。会把塑料刀放在他手里。"},
]

# 修复后的怀疑触发——只在极明确的场景下触发
SUSPICION_TRIGGERS = [
    {
        "trigger_type": "信息泄露",
        "pattern": ["我知道你是冷旭帆", "我知道你叫冰刃"],
        "condition": {"stage_below": "试探"},
        "trust_delta": -15,
        "reason": "代号冰刃——只有内部的人知道。新来的不应该知道这个。",
    },
    {
        "trigger_type": "过度熟悉",
        "pattern": ["你小时候经常", "你妈妈跟我说过"],
        "condition": {"stage_below": "动摇"},
        "trust_delta": -20,
        "reason": "只有望仔知道他妈妈的事。这个人怎么知道的？",
    },
    {
        "trigger_type": "陌生人叫阿冷",
        "pattern": ["阿冷"],
        "condition": {"stage_below": "试探"},
        "trust_delta": -5,
        "reason": "不是谁都能叫阿冷。这个人不够格。",
    },
]

IDENTITY_EVIDENCE = [
    {
        "evidence_id": "wristband_origin",
        "question": "护腕哪来的？",
        "correct_answers": ["炼狱", "拉练", "失温", "我给你", "我送的"],
        "correct_trust_delta": 20,
        "wrong_trust_delta": -15,
        "weight": 3,
        "description": "护腕的来源——只有望仔和冷旭帆自己知道",
    },
    {
        "evidence_id": "knife_inscription",
        "question": "刀上刻了什么？",
        "correct_answers": ["保户妈妈", "长到了", "保护别人", "刻错"],
        "correct_trust_delta": 25,
        "wrong_trust_delta": -20,
        "weight": 3,
        "description": "塑料刀上的刻字——从来不给别人看",
    },
    {
        "evidence_id": "bed_position",
        "question": "我为什么选靠门那张床？",
        "correct_answers": ["出口", "离门近", "逃跑", "安全", "门响"],
        "correct_trust_delta": 15,
        "wrong_trust_delta": -5,
        "weight": 1,
        "description": "选床位的原因——不算核心秘密但能侧面验证",
    },
    {
        "evidence_id": "mom_name",
        "question": "我妈叫我什么？",
        "correct_answers": ["阿冷"],
        "correct_trust_delta": 30,
        "wrong_trust_delta": -25,
        "weight": 5,
        "description": "妈妈专属称呼——最高机密",
    },
]

QUESTION_TEMPLATES = {
    "unverified": ["你说是望仔，那你告诉我——", "你怎么知道这个的？", "谁告诉你的？"],
    "testing": ["如果你真的是望仔——", "那你说，", "只有望仔知道的事——"],
    "confirmed": ["望仔。", "你说吧。", "我听着。"],
}

def get_trust_stage(trust_value: int) -> dict:
    for stage in TRUST_STAGES:
        low, high = stage["trust_range"]
        if low <= trust_value <= high:
            return stage
    return TRUST_STAGES[0]

def get_stage_index(stage_name: str) -> int:
    for i, stage in enumerate(TRUST_STAGES):
        if stage["stage"] == stage_name:
            return i
    return 0
