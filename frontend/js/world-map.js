/* ============================================================
   world-map.js — 星图导航（独立页面脚本）
   仅操作本页 #wm* / .map-* 元素，依赖 css/world-map.css 的类名
   场景切换：localStorage['world_scene'] + 自定义事件 worldmap:change
   ============================================================ */
(function () {
  'use strict';

  // ===== 5 个场景节点：五边形分布（viewBox 1000x600） =====
  var NODES = [
    { id: '307',    name: '307室',  x: 500, y: 100 },  // 顶
    { id: 'roof',   name: '天台',    x: 690, y: 238 },  // 右上
    { id: 'train',  name: '训练场',  x: 618, y: 462 },  // 右下
    { id: 'hill',   name: '后山',    x: 382, y: 462 },  // 左下
    { id: 'shelter',name: '防空洞',  x: 310, y: 238 }   // 左上
  ];
  var VB_W = 1000, VB_H = 600;

  // 连线：五边形外环 + 内部星形
  var OUTER = [[0,1],[1,2],[2,3],[3,4],[4,0]];
  var INNER = [[0,2],[2,4],[4,1],[1,3],[3,0]];

  var els = {
    svg: null,
    nodes: null,
    traveler: null,
    chips: null,
    stars: null
  };

  var state = {
    current: '307',          // 当前场景 id
    nodeEls: {},             // id -> {wrap, node, label}
    chipEls: {},             // id -> chip DOM
    pixelPos: {},            // id -> {x, y} 屏幕像素坐标（相对舞台）
    flying: false
  };

  // ===== 工具 =====
  function nodeById(id) {
    for (var i = 0; i < NODES.length; i++) if (NODES[i].id === id) return NODES[i];
    return null;
  }
  function clamp(v, lo, hi) { return v < lo ? lo : (v > hi ? hi : v); }

  // ===== 随机星点（背景层增强） =====
  function createStars() {
    var layer = els.stars;
    if (!layer) return;
    for (var i = 0; i < 40; i++) {
      var s = document.createElement('div');
      s.className = 'wm-star';
      var size = 1 + Math.random() * 2;
      s.style.left = (Math.random() * 100) + '%';
      s.style.top = (Math.random() * 100) + '%';
      s.style.width = size + 'px';
      s.style.height = size + 'px';
      s.style.opacity = (0.2 + Math.random() * 0.6).toFixed(2);
      s.style.animationDuration = (3 + Math.random() * 5) + 's';
      s.style.animationDelay = (Math.random() * 4) + 's';
      layer.appendChild(s);
    }
  }

  // ===== SVG 连线 =====
  function svgEl(tag, attrs) {
    var e = document.createElementNS('http://www.w3.org/2000/svg', tag);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    return e;
  }
  function drawLines() {
    var svg = els.svg;
    // 清空旧线
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    function makeLine(pair, cls) {
      var a = nodeById(NODES[pair[0]].id);
      var b = nodeById(NODES[pair[1]].id);
      return svgEl('line', {
        x1: a.x, y1: a.y, x2: b.x, y2: b.y,
        class: 'map-line ' + (cls || '')
      });
    }
    OUTER.forEach(function (p) { svg.appendChild(makeLine(p, 'outer')); });
    INNER.forEach(function (p) { svg.appendChild(makeLine(p, 'inner')); });
  }

  // ===== 创建节点（HTML div，覆盖在 SVG 上） =====
  function createNodes() {
    var wrap = els.nodes;
    wrap.innerHTML = '';
    state.nodeEls = {};
    NODES.forEach(function (n) {
      var group = document.createElement('div');
      group.className = 'map-node-wrap';
      group.style.position = 'absolute';
      group.style.left = '0';
      group.style.top = '0';

      var node = document.createElement('div');
      node.className = 'map-node';
      node.setAttribute('data-id', n.id);
      node.setAttribute('role', 'button');
      node.setAttribute('tabindex', '0');
      node.setAttribute('aria-label', '切换至 ' + n.name);

      var label = document.createElement('div');
      label.className = 'map-label';
      label.textContent = n.name;

      group.appendChild(node);
      group.appendChild(label);
      wrap.appendChild(group);

      // 点击 / 键盘
      var onActivate = function () { travelTo(n.id); };
      node.addEventListener('click', onActivate);
      node.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ' || e.keyCode === 13 || e.keyCode === 32) {
          e.preventDefault();
          onActivate();
        }
      });

      state.nodeEls[n.id] = { wrap: group, node: node, label: label };
    });
  }

  // ===== 底部场景名称 chips =====
  function createChips() {
    var box = els.chips;
    box.innerHTML = '';
    state.chipEls = {};
    NODES.forEach(function (n) {
      var chip = document.createElement('span');
      chip.className = 'wm-chip';
      chip.setAttribute('data-id', n.id);
      chip.textContent = n.name;
      chip.addEventListener('click', function () { travelTo(n.id); });
      box.appendChild(chip);
      state.chipEls[n.id] = chip;
    });
  }

  // ===== 坐标换算：viewBox 坐标 → 舞台像素（处理 letterbox） =====
  function recalcPixelPositions() {
    var svg = els.svg;
    if (!svg) return;
    var rect = svg.getBoundingClientRect();
    var W = rect.width, H = rect.height;
    if (W === 0 || H === 0) return;
    var vbRatio = VB_W / VB_H;        // 1000/600
    var boxRatio = W / H;
    var contentW, contentH, offX, offY;
    if (boxRatio > vbRatio) {
      // 舞台更宽 → 左右留白
      contentH = H;
      contentW = H * vbRatio;
      offX = (W - contentW) / 2;
      offY = 0;
    } else {
      contentW = W;
      contentH = W / vbRatio;
      offX = 0;
      offY = (H - contentH) / 2;
    }
    state.pixelPos = {};
    NODES.forEach(function (n) {
      state.pixelPos[n.id] = {
        x: offX + (n.x / VB_W) * contentW,
        y: offY + (n.y / VB_H) * contentH
      };
    });
  }

  // ===== 应用节点像素位置（含移动端自动缩放） =====
  function applyNodePositions() {
    recalcPixelPositions();
    var svg = els.svg;
    var rect = svg.getBoundingClientRect();
    var scale = clamp(rect.width / VB_W, 0.4, 1.4); // 节点视觉缩放
    Object.keys(state.nodeEls).forEach(function (id) {
      var p = state.pixelPos[id];
      var entry = state.nodeEls[id];
      if (!p) return;
      entry.node.style.left = p.x + 'px';
      entry.node.style.top = p.y + 'px';
      entry.label.style.left = p.x + 'px';
      entry.label.style.top = (p.y + 20) + 'px';
      // 节点尺寸随舞台缩放（移动端缩小）
      var s = scale;
      entry.node.style.transform = 'scale(' + s.toFixed(3) + ')';
    });
  }

  // ===== 高亮当前 =====
  function applyCurrent() {
    Object.keys(state.nodeEls).forEach(function (id) {
      var e = state.nodeEls[id];
      if (id === state.current) {
        e.node.classList.add('current');
        e.node.style.transform = '';  // current 由 CSS 控制尺寸
      } else {
        e.node.classList.remove('current');
      }
    });
    Object.keys(state.chipEls).forEach(function (id) {
      if (id === state.current) state.chipEls[id].classList.add('active');
      else state.chipEls[id].classList.remove('active');
    });
  }

  // ===== 光点滑行 → 切换场景 =====
  function travelTo(targetId) {
    if (state.flying) return;
    if (targetId === state.current) return;
    var from = state.pixelPos[state.current];
    var to = state.pixelPos[targetId];
    if (!from || !to) return;

    var traveler = els.traveler;
    state.flying = true;
    traveler.style.transition = 'none';
    traveler.style.left = from.x + 'px';
    traveler.style.top = from.y + 'px';
    traveler.classList.add('flying');

    // 下一帧开始滑行
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        traveler.style.transition = 'left 0.6s ease-in-out, top 0.6s ease-in-out, opacity 0.2s ease-in-out';
        traveler.style.left = to.x + 'px';
        traveler.style.top = to.y + 'px';
      });
    });

    // 滑行结束：切换场景
    setTimeout(function () {
      state.current = targetId;
      applyCurrent();
      // 淡出光点
      traveler.classList.remove('flying');
      state.flying = false;
      // 触发场景切换：localStorage + 自定义事件 + URL
      var node = nodeById(targetId);
      if (node) {
        try {
          localStorage.setItem('world_scene', node.id);
          localStorage.setItem('world_scene_name', node.name);
        } catch (e) {}
        try {
          if (history.replaceState) {
            history.replaceState(null, '', '?scene=' + encodeURIComponent(node.id));
          }
        } catch (e) {}
        try {
          window.dispatchEvent(new CustomEvent('worldmap:change', {
            detail: { id: node.id, name: node.name }
          }));
        } catch (e) {}
      }
    }, 620);
  }

  // ===== 获取当前场景：URL > localStorage > /api/state > 默认 307室 =====
  function resolveCurrent(callback) {
    // 1. URL ?scene=
    try {
      var qs = new URLSearchParams(window.location.search).get('scene');
      if (qs && nodeById(qs)) { callback(qs); return; }
    } catch (e) {}
    // 2. localStorage
    try {
      var ls = localStorage.getItem('world_scene');
      if (ls && nodeById(ls)) { callback(ls); return; }
    } catch (e) {}
    // 3. /api/state（带超时与容错）
    var done = false;
    var timer = setTimeout(function () {
      if (!done) { done = true; callback('307'); }
    }, 2500);
    try {
      fetch('/api/state', { headers: { 'Accept': 'application/json' } })
        .then(function (r) { return r.ok ? r.json() : null; })
        .then(function (data) {
          if (done) return;
          done = true;
          clearTimeout(timer);
          var w = data && (data.world || (data.state && data.state.world));
          if (w && nodeById(w)) callback(w);
          else callback('307');
        })
        .catch(function () {
          if (done) return;
          done = true;
          clearTimeout(timer);
          callback('307');
        });
    } catch (e) {
      if (!done) { done = true; clearTimeout(timer); callback('307'); }
    }
  }

  // ===== 初始化 =====
  function init() {
    els.svg = document.getElementById('wmSvg');
    els.nodes = document.getElementById('wmNodes');
    els.traveler = document.getElementById('mapTraveler');
    els.chips = document.getElementById('wmChips');
    els.stars = document.getElementById('wmStars');
    if (!els.svg || !els.nodes) return;

    createStars();
    drawLines();
    createNodes();
    createChips();

    // 先用默认值布局，再异步解析真实 current
    state.current = '307';
    applyNodePositions();
    applyCurrent();

    resolveCurrent(function (id) {
      state.current = id;
      applyCurrent();
    });

    // 响应式
    var resizeTimer = null;
    window.addEventListener('resize', function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(applyNodePositions, 120);
    });
    window.addEventListener('orientationchange', function () {
      setTimeout(applyNodePositions, 200);
    });
  }

  // ===== 导出 =====
  window.WorldMap = { init: init };
})();

/* 统一返回逻辑：有同源来源页则回退，否则回主界面（导航闭环） */
window.goBack = function () {
  if (document.referrer && document.referrer.includes(window.location.host)) {
    history.back();
  } else {
    window.location.href = "index.html?skipIntro=1";
  }
};
