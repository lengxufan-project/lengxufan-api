"""上下文分析规则 - 意图分类、追问检测、情感词汇"""

# 意图分类规则
# 优先级从高到低排列，匹配到即停止
INTENT_PATTERNS = [
    {
        "intent": "质问",
        "label_cn": "质问",
        "patterns": [
            # 反问句式
            "你不.*吗",
            "你.*不.*吗",
            "难道",
            "凭什么",
            "为什么.*不",
            "谁说的",
            "关你.*事",
            "跟你.*关系",
        ],
        "example": "你怎么不说话？"
    },
    {
        "intent": "疑问",
        "label_cn": "疑问",
        "patterns": [
            r"\?$",           # 以问号结尾
            r"？$",           # 以中文问号结尾
            "为什么",
            "怎么",
            "什么",
            "谁",
            "哪里",
            "哪",
            "多久",
            "几点",
            "多少",
            "吗",
            "呢",
            "吧",
        ],
        "example": "你叫什么名字？"
    },
    {
        "intent": "陈述",
        "label_cn": "陈述",
        "patterns": [
            # 以句号结尾的长句
        ],
        "min_length": 5,  # 最短字符数才算陈述
        "example": "我今天心情不好。"
    },
    {
        "intent": "敷衍",
        "label_cn": "敷衍",
        "patterns": [
            "^哦$", "^嗯$", "^好$", "^行$", "^对$",
            "^好吧$", "^随便$", "^无所谓$",
            "^知道了$", "^懂了$", "^明白了$",
        ],
        "example": "哦"
    },
    {
        "intent": "语气助词",
        "label_cn": "语气助词",
        "patterns": [
            "^嗯$", "^啊$", "^呃$", "^唔$",
            "^哼$", "^唉$", "^喂$", "^嘶$",
        ],
        "example": "嗯"
    },
]

# 追问触发词
FOLLOWUP_TRIGGERS = [
    "什么意思", "为啥", "为什么这么说",
    "怎么了", "然后呢", "后来呢",
    "继续说", "详细点", "讲清楚",
    "你刚才说", "你之前说", "你上次说",
    "你说什么", "再说一遍", "没听懂",
]

# 情感词汇
EMOTIONAL_WORDS = {
    "正面": [
        "喜欢", "爱", "谢谢", "开心", "高兴",
        "好", "棒", "不错", "厉害", "酷",
        "温暖", "感动", "信任", "相信", "朋友",
        "草莓", "花", "礼物", "送你", "给你",
    ],
    "负面": [
        "讨厌", "恨", "烦", "气", "滚",
        "走开", "别管我", "不用你管",
        "难过", "伤心", "痛苦", "累", "压力",
        "吵架", "死了", "没用", "废物",
        "不想说", "别问了", "算了",
    ],
}

# 话题关键词映射
TOPIC_KEYWORDS = {
    "妈妈/母亲": ["妈妈", "母亲", "妈", "四月", "去世", "小时候"],
    "陆华望": ["陆华望", "华望", "望仔", "哥哥", "弟", "室友", "床位"],
    "塑料刀/护腕": ["塑料刀", "刀", "护腕", "刻字", "保护"],
    "名字/称呼": ["阿冷", "冰刃", "冷旭帆", "冰疙瘩", "冷面瘫", "旭帆", "叫"],
    "食物/草莓": ["草莓", "吃", "食堂", "早餐", "豆浆", "包子"],
    "307室/室友": ["307", "室友", "向云舟", "黄景云", "叶清辞", "秦狐戏", "冉昭然", "陆华希", "台灯", "床位"],
    "爸爸/冷锋": ["爸爸", "父亲", "冷锋", "当兵", "少管所"],
    "过去/学校": ["打架", "劝退", "学校", "以前", "过去"],
    "天气/环境": ["天气", "下雨", "太阳", "冷", "热", "月亮", "天黑", "天亮"],
    "音乐": ["海阔天空", "歌", "音乐", "听", "唱", "哼"],
}

def classify_intent(user_input: str) -> str:
    """根据规则分类用户输入意图"""
    text = user_input.strip()

    # 1. 先检查是否为追问
    for trigger in FOLLOWUP_TRIGGERS:
        if trigger in text:
            return "追问"

    # 2. 按优先级匹配意图模式
    for intent_rule in INTENT_PATTERNS:
        # 检查最小长度要求
        min_len = intent_rule.get("min_length", 0)
        if len(text) < min_len:
            continue

        # 检查模式匹配
        for pattern in intent_rule["patterns"]:
            # 正则表达式模式（以 ^ 或包含特殊字符的视为正则）
            if pattern.startswith("^") or pattern.startswith("\\") or pattern.startswith(r"\?"):
                import re
                if re.search(pattern, text):
                    return intent_rule["intent"]
            # 普通关键词匹配
            elif pattern in text:
                return intent_rule["intent"]

    # 3. 默认：短文本为敷衍，长文本为陈述
    if len(text) <= 3:
        return "敷衍"
    return "陈述"


def detect_emotion(user_input: str) -> dict:
    """检测用户输入的情感倾向"""
    text = user_input.strip()

    positive_count = sum(1 for w in EMOTIONAL_WORDS["正面"] if w in text)
    negative_count = sum(1 for w in EMOTIONAL_WORDS["负面"] if w in text)

    if positive_count > negative_count:
        valence = "正面"
    elif negative_count > positive_count:
        valence = "负面"
    else:
        valence = "中性"

    return {
        "is_emotional": positive_count > 0 or negative_count > 0,
        "emotional_valence": valence,
        "positive_count": positive_count,
        "negative_count": negative_count,
    }


def extract_topic(user_input: str) -> str:
    """从用户输入中提取话题"""
    text = user_input.strip()
    for topic, keywords in TOPIC_KEYWORDS.items():
        for kw in keywords:
            if kw in text:
                return topic
    return "一般对话"
