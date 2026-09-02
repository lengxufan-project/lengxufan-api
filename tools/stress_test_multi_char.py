import sys, os, time, random, json
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from services.engine_service import EngineService, get_engine
from lengxufan_core.group_chat import GroupChatManager

# 模拟 100 个角色的 ID（不创建真实文件）
fake_char_ids = [f"npc_{i:03d}" for i in range(100)]

# 只用真实角色测试实际引擎，假角色仅测试管理器逻辑
real_chars = ["lengxufan", "huangjingyun", "yeqingci"]

def test_group_chat_manager_capacity():
    print("=" * 60)
    print("测试群聊管理器参与者上限与成员管理")
    gm = GroupChatManager(max_participants=8)
    gm.set_members(fake_char_ids[:50])  # 尝试加入50个，应被截断到8
    assert len(gm.members) == 8, "参与者上限失效"
    print("✅ 参与者上限生效，50人截断为8人")
    
    gm.add_to_group("test", fake_char_ids[:20])
    gm.set_members_from_group("test")
    assert len(gm.members) == 8, "分组设置后未截断"
    print("✅ 分组设置与上限截断正常")

def test_real_character_isolation():
    print("\n" + "=" * 60)
    print("测试真实角色状态隔离（100次快速对话）")
    engines = {}
    for cid in real_chars:
        engines[cid] = EngineService(char_id=cid)
    for i in range(100):
        cid = random.choice(real_chars)
        reply = engines[cid].get_reply("你好")
        # 简单检查是否包含其他角色特征（粗略）
        if cid == "lengxufan" and ("糖纸" in reply or "误差" in reply):
            print(f"❌ 冷旭帆第{i}轮出现串味: {reply[:50]}")
            return False
        elif cid == "huangjingyun" and ("左肩" in reply or "秒针" in reply):
            print(f"❌ 黄景云第{i}轮出现串味: {reply[:50]}")
            return False
        elif cid == "yeqingci" and ("护腕" in reply or "糖纸" in reply):
            print(f"❌ 叶清辞第{i}轮出现串味: {reply[:50]}")
            return False
    print("✅ 100轮快速对话未发现明显串味")

def test_group_chat_endpoint_load():
    print("\n" + "=" * 60)
    print("测试群聊接口并发稳定性（模拟3个真实角色，但成员上限设置为3）")
    gm = GroupChatManager(max_participants=3)
    gm.set_members(real_chars)
    # 直接调用引擎而非HTTP，避免端口冲突
    replies = []
    for cid in real_chars:
        engine = get_engine(cid)
        reply = engine.get_reply("压力测试")
        replies.append(reply)
        time.sleep(0.1)
    print(f"✅ 群聊顺序回复成功，共{len(replies)}条")

if __name__ == "__main__":
    test_group_chat_manager_capacity()
    test_real_character_isolation()
    test_group_chat_endpoint_load()
    print("\n" + "=" * 60)
    print("压力测试完成")