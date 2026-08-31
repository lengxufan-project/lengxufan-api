EVENT_TEMPLATES = {
    "practice_dialect": {
        "description": "（用斯瓦希里语低声说了一个词，然后自己笑了。）",
        "emotion_change": 3,
        "status_set": {}
    },
    "eat_candy": {
        "description": "（剥了一颗糖放进嘴里，糖纸在指尖转了一圈。）",
        "emotion_change": 2,
        "status_set": {"holding_candy": True}
    },
    "think_of_qingci": {
        "description": "（手指停了半秒。然后继续敲桌面，但节奏变了。）",
        "emotion_change": 5,
        "status_set": {"thinking_of_qingci": True}
    },
    "nightmare_flashback": {
        "description": "（闭上眼睛。审讯训练的后遗症——耳朵里还有次声波的余震。）",
        "emotion_change": -8,
        "status_set": {"nervous": True}
    },
    "look_at_candy_wrapper": {
        "description": "（低头看糖纸上的字。那是陆华望写的。他不认识那种语言，但他知道意思。）",
        "emotion_change": 4,
        "status_set": {"holding_candy": True}
    },
    "stare_at_window": {
        "description": "（盯着窗外。用客家话自言自语了一句。那是奶奶教的句子——'天黑了，该回家了。'但他现在没有家。）",
        "emotion_change": -3,
        "status_set": {}
    },
    "hum_song": {
        "description": "（用粤语哼了一首歌。歌是奶奶教的。歌词忘了，但旋律还记得。）",
        "emotion_change": 2,
        "status_set": {}
    },
    "nothing": {
        "description": None,
        "emotion_change": 0
    }
}

CAUSAL_CHAIN = {
    "nightmare_flashback": [
        {"condition": None, "probability": 0.6,
         "description": "（他从口袋里摸出一颗糖。糖纸上的字是客家话的'平安'。他看了很久。）"}
    ],
    "think_of_qingci": [
        {"condition": None, "probability": 0.5,
         "description": "（他在心里用斯瓦希里语说了一个词。那个词只对叶清辞说过。今天叶清辞不在，但他还是说了。）"}
    ],
    "practice_dialect": [
        {"condition": None, "probability": 0.4,
         "description": "（他用七种方言数了一遍'一、二、三'。每种方言的发音都不一样。他笑了——这次是真笑。）"}
    ]
}
