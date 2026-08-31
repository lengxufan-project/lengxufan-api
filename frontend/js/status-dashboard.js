(function () {
  'use strict';

  var DEFAULT_PCT = 50;

  // 身体状态文字 → 百分比
  var BODY_MAP = {
    '良好': 70,
    '没太大问题': 65
  };

  // 心理状态文字 → 百分比
  var MIND_MAP = {
    '警觉': 60,
    '平静': 50
  };

  function mapByKeywords(text, map) {
    if (!text || typeof text !== 'string') return DEFAULT_PCT;
    for (var key in map) {
      if (text.indexOf(key) !== -1) return map[key];
    }
    return DEFAULT_PCT;
  }

  // 从关系描述中提取信任值，如 "信任2/100" → 2
  function extractTrust(str) {
    if (!str || typeof str !== 'string') return 0;
    var m = str.match(/信任[^\d]*(\d{1,3})/);
    if (m) return Math.min(100, Math.max(0, parseInt(m[1], 10)));
    m = str.match(/(\d{1,3})\s*\/\s*100/);
    if (m) return Math.min(100, Math.max(0, parseInt(m[1], 10)));
    return 0;
  }

  function updateRing(ring, value, pct) {
    if (!ring) return;
    ring.style.setProperty('--pct', pct + '%');
    var valueEl = ring.querySelector('.value');
    if (valueEl) valueEl.textContent = String(value);
  }

  function init(containerId) {
    var container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = [
      '<div class="status-dashboard" id="statusDashboard">',
      '  <div class="sd-item">',
      '    <div class="sd-ring" data-type="emotion"><div class="glow"></div><span class="value">--</span></div>',
      '    <span class="label">情绪</span>',
      '  </div>',
      '  <div class="sd-item">',
      '    <div class="sd-ring" data-type="body"><div class="glow"></div><span class="value">--</span></div>',
      '    <span class="label">身体</span>',
      '  </div>',
      '  <div class="sd-item">',
      '    <div class="sd-ring" data-type="mind"><div class="glow"></div><span class="value">--</span></div>',
      '    <span class="label">心理</span>',
      '  </div>',
      '  <div class="sd-item">',
      '    <div class="sd-ring" data-type="trust"><div class="glow"></div><span class="value">--</span></div>',
      '    <span class="label">信任</span>',
      '  </div>',
      '</div>'
    ].join('\n');
  }

  function update(state) {
    if (!state) return;
    var dashboard = document.getElementById('statusDashboard');
    if (!dashboard) return;

    var emotionRing = dashboard.querySelector('.sd-ring[data-type="emotion"]');
    var bodyRing = dashboard.querySelector('.sd-ring[data-type="body"]');
    var mindRing = dashboard.querySelector('.sd-ring[data-type="mind"]');
    var trustRing = dashboard.querySelector('.sd-ring[data-type="trust"]');

    // 情绪：value = Math.round(state.emotion)，百分比 = (emotion+100)/2
    var emotionRaw = typeof state.emotion === 'number' ? state.emotion : 0;
    var emotionValue = Math.round(emotionRaw);
    var emotionPct = Math.min(100, Math.max(0, (emotionRaw + 100) / 2));
    updateRing(emotionRing, emotionValue, emotionPct);

    // 身体：文字映射百分比
    var bodyPct = mapByKeywords(state.body, BODY_MAP);
    updateRing(bodyRing, Math.round(bodyPct), bodyPct);

    // 心理：文字映射百分比
    var mindPct = mapByKeywords(state.mind, MIND_MAP);
    updateRing(mindRing, Math.round(mindPct), mindPct);

    // 信任：从关系描述提取
    var trustPct = extractTrust(state.relationship);
    updateRing(trustRing, Math.round(trustPct), trustPct);
  }

  window.StatusDashboard = {
    init: init,
    update: update
  };
})();
