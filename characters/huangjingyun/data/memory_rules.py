MEMORY_RULES = [
    (["奶奶", "阿嫲"], "user_mentioned_grandma", 10),
    (["叶清辞", "清辞"], "user_mentioned_qingci", 15),
    (["冷旭帆", "旭帆", "冰刃"], "user_mentioned_lxf", 5),
    (["陆华望", "华望", "望仔"], "user_mentioned_wang", 10),
    (["方言", "语言", "粤语", "客家话"], "user_asked_about_dialects", 8),
    (["糖", "糖纸", "糖果"], "user_mentioned_candy", 12),
    (["录音笔", "录音"], "user_mentioned_recorder", 10),
    (["归墟", "任务"], "user_asked_about_guixu", -5),
    (["阵亡", "身份", "档案"], "user_asked_about_death", -10),
]

IDENTITY_EVIDENCE_RULES = [
    # 黄景云不需要身份验证，保留空列表以兼容引擎
]
