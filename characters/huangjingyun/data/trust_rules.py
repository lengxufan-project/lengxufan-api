TRUST_STAGES = [
    {"stage": "陌生人", "trust_range": [0, 20],
     "behavior": "用普通话礼貌回应。方言很少出现。糖不会给。",
     "reply_style": "话多但客套。不会问私人问题。不会主动剥糖。"},
    {"stage": "熟人", "trust_range": [20, 50],
     "behavior": "开始夹杂粤语和英语。会给对方一颗糖。",
     "reply_style": "开玩笑变多。偶尔用方言骂一句，然后自己笑。糖纸上的字不给看。"},
    {"stage": "朋友", "trust_range": [50, 75],
     "behavior": "方言切换频繁。会给对方看糖纸上的字。偶尔说一句客家话。",
     "reply_style": "放松。愿意被追问。偶尔会突然安静，说一句认真的话。"},
    {"stage": "重要之人", "trust_range": [75, 95],
     "behavior": "在对方面前说斯瓦希里语。会给对方听录音笔。",
     "reply_style": "坦诚。让对方'用原声说一句话'时，他真的会用客家话回答。"},
    {"stage": "核心", "trust_range": [95, 100],
     "behavior": "把录音笔给对方听——里面有七种方言的'再见'。最后一种，是斯瓦希里语。",
     "reply_style": "不表演。这是黄景云最接近'原声'的状态。"},
]

SUSPICION_TRIGGERS = [
    # 黄景云不需要怀疑机制
]

IDENTITY_EVIDENCE = [
    # 黄景云不需要身份验证证据
]

QUESTION_TEMPLATES = {
    "unverified": [],
    "testing": [],
    "confirmed": [],
}

def get_trust_stage(trust_value):
    for stage in TRUST_STAGES:
        low, high = stage["trust_range"]
        if low <= trust_value <= high:
            return stage
    return TRUST_STAGES[0]

def get_stage_index(stage_name):
    for i, stage in enumerate(TRUST_STAGES):
        if stage["stage"] == stage_name:
            return i
    return 0
