"""后台事件模板数据——将重复的事件定义从逻辑代码中分离。"""

EVENT_TEMPLATES = {
    "dream": {
        "description": "（连续梦到妈妈，握着塑料刀很久没动。）",
        "description_alt": "（昨晚又梦到了妈妈。）",
        "emotion_change": -15,
        "status_set": {"dream_streak": "increment"},
        "extra_trigger": {
            "condition_field": "dream_streak",
            "threshold": 3,
            "extra_description": "（连续梦到妈妈，握着塑料刀很久没动。）",
            "extra_status": {"holding_knife": True},
            "extra_emotion": -10
        }
    },
    "pain": {
        "description": "（左肩疼了一整夜。）",
        "emotion_change": -5,
        "status_set": {"shoulder_pain": True}
    },
    "footsteps": {
        "description": "（凌晨听到脚步声，不是他。）",
        "emotion_change": -3,
        "status_set": {"miss_wang": True}
    },
    "silence": {
        "description": "（一个人坐了很长时间。）",
        "emotion_change": 2,
        "emotion_condition": ("lt", 50),
        "status_decay": {"shoulder_pain": 0.3}
    },
    "clean_knife": {
        "description": "（擦了很久的塑料刀。）",
        "emotion_change": -2
    },
    "look_wristband": {
        "description": "（手指在护腕上蹭了一下。）",
        "emotion_change": 3
    },
    "balcony": {
        "description": "（独自站在阳台上。）",
        "emotion_change": -1
    },
    "think_wang": {
        "description": "（盯着陆华望的空床位。）",
        "emotion_change": 5,
        "status_set": {"miss_wang": True}
    },
    "nothing": {
        "description": None,
        "emotion_change": 0
    }
}

CAUSAL_CHAIN = {
    "footsteps": [
        {"condition": ("lt", 40), "probability": 0.4,
         "description": "（他依旧盯着门口，手指无意识地摩挲着刀柄。）"},
        {"condition": ("ge", 40), "probability": 0.4,
         "description": "（他从门口收回视线，低头看了看手里的塑料刀。）"}
    ],
    "dream": [
        {"condition": None, "probability": 0.5,
         "description": "（他醒来后没有立刻起身，只是盯着天花板看了很久。）"}
    ],
    "think_wang": [
        {"condition": None, "probability": 0.3,
         "description": "（他拿起护腕看了看，又放回了原处。）"}
    ]
}