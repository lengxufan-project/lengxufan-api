MEMORY_RULES = [
    (["讨厌","恨"], "user_said_hate", -20),
    (["花","送你","礼物"], "user_gave_flower", 5),
    (["妈妈","母亲"], "user_asked_about_mom", -10),
    (["陆华望","华望","望仔"], "user_asked_about_wang", 15),
]
IDENTITY_EVIDENCE_RULES = [
    (["哥哥"], 25, 3),
    (["塑料刀"], 10, 0),
    (["护腕"], 10, 0),
    (["讨厌","恨"], -20, -10),
    (["望仔"], 15, 5),
]