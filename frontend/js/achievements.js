/* ============================================================
   成就博物馆 · 交互逻辑（独立页面）
   - 前端占位数据渲染
   - 已解锁 / 未解锁状态切换
   - 预留未来后端事件接口
   ============================================================ */
(function () {
  'use strict';

  /* ============================================================
     1. 占位成就数据（后续可替换为后端接口调用）
     ============================================================ */
  const PLACEHOLDER_ACHIEVEMENTS = [
    {
      id: 'first_chat',
      name: '初次对话',
      desc: '与冷旭帆完成第一次对话',
      icon: '💬',
      unlocked: true,
      unlockedAt: '第 1 天'
    },
    {
      id: 'trust_breakthrough',
      name: '信任突破',
      desc: '角色好感度首次达到 60+',
      icon: '⭐',
      unlocked: true,
      unlockedAt: '第 3 天'
    },
    {
      id: 'late_night_talk',
      name: '深夜长谈',
      desc: '在 23:00~05:00 时段累计对话 10 轮',
      icon: '🌙',
      unlocked: true,
      unlockedAt: '第 5 天'
    },
    {
      id: 'emotion_roller',
      name: '情绪过山车',
      desc: '单次对话中情绪值波动超过 30',
      icon: '🎢',
      unlocked: false,
      unlockedAt: ''
    },
    {
      id: 'story_collector',
      name: '故事收集者',
      desc: '触发 5 个不同的事件剧情',
      icon: '📖',
      unlocked: false,
      unlockedAt: ''
    },
    {
      id: 'group_harmony',
      name: '群聊调和者',
      desc: '在群聊中让所有角色情绪同时提升',
      icon: '🤝',
      unlocked: false,
      unlockedAt: ''
    },
    {
      id: 'weather_watcher',
      name: '天气守望者',
      desc: '体验过全部 4 种天气变化',
      icon: '🌈',
      unlocked: false,
      unlockedAt: ''
    },
    {
      id: 'memory_keeper',
      name: '记忆守护者',
      desc: '累计对话超过 100 轮',
      icon: '🗝️',
      unlocked: false,
      unlockedAt: ''
    },
    {
      id: 'emotion_master',
      name: '情绪大师',
      desc: '让任意角色情绪值达到 90+',
      icon: '💎',
      unlocked: false,
      unlockedAt: ''
    }
  ];

  /* ============================================================
     2. 数据加载函数（预留后端接口）
     ============================================================ */

  /**
   * 从后端加载成就数据（未来接入）
   * @returns {Promise<Array>} 成就数据数组
   */
  function loadAchievementsFromServer() {
    // TODO: 替换为后端 API 调用
    // return fetch('/api/achievements').then(res => res.json());
    return Promise.resolve(null); // 返回 null 表示使用占位数据
  }

  /**
   * 获取成就数据（优先从后端加载，降级使用占位数据）
   */
  async function getAchievements() {
    try {
      const serverData = await loadAchievementsFromServer();
      if (serverData && Array.isArray(serverData)) {
        return serverData;
      }
    } catch (err) {
      console.warn('[成就] 后端加载失败，使用占位数据', err);
    }
    return PLACEHOLDER_ACHIEVEMENTS;
  }

  /* ============================================================
     3. 渲染引擎
     ============================================================ */

  function renderAchievements(achievements) {
    const grid = document.getElementById('achievementsGrid');
    const unlockCount = document.getElementById('unlockCount');
    const totalCount = document.getElementById('totalCount');
    const progressFill = document.getElementById('progressFill');

    if (!grid) return;

    const unlocked = achievements.filter(function (a) { return a.unlocked; });
    const total = achievements.length;

    unlockCount.textContent = unlocked.length;
    totalCount.textContent = total;
    if (progressFill) {
      progressFill.style.width = (total > 0 ? (unlocked.length / total * 100) : 0) + '%';
    }

    grid.innerHTML = achievements.map(function (a) {
      var statusClass = a.unlocked ? 'unlocked' : 'locked';
      var timeHtml = a.unlocked && a.unlockedAt
        ? '<div class="achievement-time">' + a.unlockedAt + '</div>'
        : '';
      return (
        '<div class="achievement-card ' + statusClass + '" data-id="' + a.id + '">' +
          '<div class="achievement-badge">' + a.icon + '</div>' +
          '<div class="achievement-name">' + a.name + '</div>' +
          '<div class="achievement-desc">' + a.desc + '</div>' +
          timeHtml +
        '</div>'
      );
    }).join('');

    // 卡片延迟上浮动画
    var cards = grid.querySelectorAll('.achievement-card');
    cards.forEach(function (card, i) {
      card.style.opacity = '0';
      card.style.transform = 'translateY(20px)';
      setTimeout(function () {
        card.style.transition = 'opacity 0.5s ease-in-out, transform 0.5s ease-in-out';
        card.style.opacity = '1';
        card.style.transform = 'translateY(0)';
      }, 100 + i * 80);
    });
  }

  /* ============================================================
     4. 初始化
     ============================================================ */

  async function init() {
    var achievements = await getAchievements();
    renderAchievements(achievements);
  }

  // DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();