import sys, os, time, random
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from api.router import router
from services.engine_service import EngineService

# 初始化三个角色引擎
chars = ['lengxufan', 'huangjingyun', 'yeqingci']
engines = {}
for cid in chars:
    engines[cid] = EngineService(char_id=cid)
    print(f"已初始化 {cid}")

# 针对不同角色预设话题库，避免重复和抽象
topic_bank = {
    'lengxufan': [
        "你手上的护腕是哪里来的？",
        "你为什么总看门口？",
        "你饿不饿？",
        "昨晚睡得好吗？",
        "你一个人待着的时候会做什么？",
        "听说你喜欢吃苹果？",
        "这把塑料刀跟了你很久吗？",
        "你为什么不说话？",
        "你在等谁吗？",
        "我能坐你旁边吗？"
    ],
    'huangjingyun': [
        "你刚刚说的方言是哪一种？",
        "糖纸上的字是谁写的？",
        "你最喜欢的歌是什么？",
        "叶清辞今天怎么没跟你一起？",
        "你老家是哪里的？",
        "你害怕什么？",
        "你的录音笔里存了什么？",
        "你为什么总在笑？",
        "听说你会七种方言？",
        "陆华望给过你什么糖？"
    ],
    'yeqingci': [
        "你手表上的时间准吗？",
        "你为什么要记录黄景云说话的时间？",
        "你父亲是个什么样的人？",
        "你算过自己的心跳吗？",
        "误差多少你才会不安？",
        "你上次摘下手表是什么时候？",
        "你在分析什么数据？",
        "你为什么总在整理东西？",
        "你相信直觉吗？",
        "23秒对你来说意味着什么？"
    ]
}

def get_user_message(round_num, cid):
    # 前10轮使用预设话题，之后如果还有更多轮，则循环或让AI生成
    bank = topic_bank.get(cid, ["你好"])
    if round_num <= len(bank):
        return bank[round_num - 1]
    else:
        # 超过预设数量后，让AI自由生成一个简短的关心句
        prompt = f"你正在和潜龙学院的{cid}聊天。请说一句简短、具体、不超过20字的新话题，不要重复之前的。"
        messages = [{"role":"system","content":"你是普通访客，说话自然。"},{"role":"user","content":prompt}]
        try:
            return router.call(messages).strip().split('\n')[0]
        except:
            return "你在想什么？"

# 每个角色进行 8 轮对话（可修改）
total_rounds = 8
for r in range(1, total_rounds + 1):
    print(f"\n{'='*30} 第{r}轮 {'='*30}")
    for cid in chars:
        user_msg = get_user_message(r, cid)
        print(f"\n【用户→{cid}】 {user_msg}")
        try:
            reply = engines[cid].get_reply(user_msg)
            print(f"【{cid}回复】 {reply}")
            state = engines[cid].get_state_snapshot()
            print(f"  [情绪:{state.get('emotion',0):.0f}] [信任:{state.get('wang_trust',0)}]")
        except Exception as e:
            print(f"  {cid} 出错: {e}")
        time.sleep(0.5)

print("\n测试完成。")