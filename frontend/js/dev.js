/* ============================================================
   开发者数据统计面板 · 交互逻辑（独立页面）
   - 占位数据展示（对话轮数、角色交互、情绪曲线、事件）
   - 预留后端接口
   - SVG 折线图绘制
   ============================================================ */
(function () {
  'use strict';

  /* ========== 权限检测：非开发者跳转 ========== */
  (function checkRole() {
    var role = localStorage.getItem("lxf_user_role");
    if (role !== "developer") {
      window.location.href = "index.html?skipIntro=1";
      return;
    }
  })();

  /* ============================================================
     1. 占位数据
     ============================================================ */
  var PLACEHOLDER_DATA = {
    totalChatRounds: 47,
    totalCharInteractions: 82,
    totalEvents: 12,
    totalDays: 7,
    charStats: [
      { name: '冷旭帆', count: 28 },
      { name: '黄景云', count: 32 },
      { name: '叶清辞', count: 22 }
    ],
    emotionHistory: [
      { day: '第1天', value: 55 },
      { day: '第2天', value: 62 },
      { day: '第3天', value: 48 },
      { day: '第4天', value: 71 },
      { day: '第5天', value: 65 },
      { day: '第6天', value: 78 },
      { day: '第7天', value: 83 }
    ],
    recentEvents: [
      { day: '第5天', desc: '冷旭帆在深夜主动分享了童年往事', type: '剧情' },
      { day: '第4天', desc: '黄景云与叶清辞发生观点分歧', type: '冲突' },
      { day: '第3天', desc: '冷旭帆情绪值首次突破 70', type: '情绪' },
      { day: '第2天', desc: '群聊中三人首次达成一致意见', type: '剧情' },
      { day: '第1天', desc: '世界创建，初次对话开始', type: '系统' }
    ]
  };

  /* ============================================================
     2. 数据加载函数（预留后端接口）
     ============================================================ */

  /**
   * 从后端加载数据（未来接入）
   * @returns {Promise<Object|null>}
   */
  function loadDataFromServer() {
    // TODO: 替换为后端 API 调用
    // return fetch('/api/dev/stats').then(res => res.json());
    return Promise.resolve(null);
  }

  async function getData() {
    try {
      var serverData = await loadDataFromServer();
      if (serverData) {
        return serverData;
      }
    } catch (err) {
      console.warn('[DevStats] 后端数据加载失败，使用占位数据', err);
    }
    return PLACEHOLDER_DATA;
  }

  /* ============================================================
     3. 渲染引擎
     ============================================================ */

  function renderStats(data) {
    document.getElementById('totalChatRounds').textContent = data.totalChatRounds;
    document.getElementById('totalCharInteractions').textContent = data.totalCharInteractions;
    document.getElementById('totalEvents').textContent = data.totalEvents;
    document.getElementById('totalDays').textContent = data.totalDays;
  }

  function renderCharStats(charStats) {
    var container = document.getElementById('charStats');
    if (!container) return;

    var maxCount = 0;
    charStats.forEach(function (c) { if (c.count > maxCount) maxCount = c.count; });

    container.innerHTML = charStats.map(function (c) {
      var pct = maxCount > 0 ? (c.count / maxCount * 100) : 0;
      return (
        '<div class="char-stat-row">' +
          '<span class="char-stat-name">' + c.name + '</span>' +
          '<div class="char-stat-bar-wrap">' +
            '<div class="char-stat-bar" style="width:' + pct + '%"></div>' +
          '</div>' +
          '<span class="char-stat-count">' + c.count + '</span>' +
        '</div>'
      );
    }).join('');
  }

  function renderEmotionCurve(history) {
    var svg = document.getElementById('emotionSvg');
    var line = document.getElementById('emotionLine');
    var fill = document.getElementById('emotionFill');
    var dots = document.getElementById('emotionDots');
    if (!svg || !line || !fill || !dots) return;

    // SVG viewBox 尺寸
    var W = 600;
    var H = 200;
    var padding = { top: 10, bottom: 20, left: 10, right: 10 };
    var chartW = W - padding.left - padding.right;
    var chartH = H - padding.top - padding.bottom;

    var len = history.length;
    if (len < 2) return;

    // 计算 x/y 坐标
    var points = history.map(function (d, i) {
      var x = padding.left + (i / (len - 1)) * chartW;
      // y: 0 -> bottom, 100 -> top
      var y = padding.top + (1 - d.value / 100) * chartH;
      return { x: x, y: y, day: d.day, value: d.value };
    });

    // 折线 path
    var lineD = points.map(function (p, i) {
      return (i === 0 ? 'M' : 'L') + p.x.toFixed(1) + ',' + p.y.toFixed(1);
    }).join(' ');
    line.setAttribute('d', lineD);

    // 填充 path（折线 + 底部闭合）
    var fillD = lineD +
      ' L' + (padding.left + chartW).toFixed(1) + ',' + (padding.top + chartH).toFixed(1) +
      ' L' + padding.left.toFixed(1) + ',' + (padding.top + chartH).toFixed(1) + ' Z';
    fill.setAttribute('d', fillD);

    // 数据点
    dots.innerHTML = points.map(function (p) {
      return '<circle class="emotion-dot" cx="' + p.x.toFixed(1) + '" cy="' + p.y.toFixed(1) + '" r="3.5" />';
    }).join('');

    // 注入渐变定义
    var defs = svg.querySelector('defs');
    if (!defs) {
      defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
      svg.insertBefore(defs, svg.firstChild);
    }
    defs.innerHTML =
      '<linearGradient id="emotionGradient" x1="0" y1="0" x2="0" y2="1">' +
        '<stop offset="0%" stop-color="#58a6ff" stop-opacity="0.3" />' +
        '<stop offset="100%" stop-color="#58a6ff" stop-opacity="0.02" />' +
      '</linearGradient>';
  }

  function renderEvents(events) {
    var container = document.getElementById('eventList');
    if (!container) return;

    container.innerHTML = events.map(function (e) {
      return (
        '<div class="event-item">' +
          '<span class="event-day">' + e.day + '</span>' +
          '<span class="event-desc">' + e.desc + '</span>' +
          '<span class="event-type">' + e.type + '</span>' +
        '</div>'
      );
    }).join('');
  }

  /* ============================================================
     4. 初始化
     ============================================================ */

  async function init() {
    var data = await getData();
    renderStats(data);
    renderCharStats(data.charStats);
    renderEmotionCurve(data.emotionHistory);
    renderEvents(data.recentEvents);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();