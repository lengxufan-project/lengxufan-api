/* ============================================================
   world-map.js — 星图导航（独立页面脚本）
   场景切换：localStorage['world_scene'] + 自定义事件 worldmap:change
   ============================================================ */
(function () {
  'use strict';

  // ===== 5 个场景节点（viewBox 1000x600，五边形分布） =====
  var NODES = [
    { id: '307',    name: '307室',  x: 500, y: 100 },  // 顶
    { id: 'roof',   name: '天台',    x: 690, y: 238 },  // 右上
    { id: 'train',  name: '训练场',  x: 618, y: 462 },  // 右下
    { id: 'hill',   name: '后山',    x: 382, y: 462 },  // 左下
    { id: 'shelter',name: '防空洞',  x: 310, y: 238 }   // 左上
  ];
  var VB_W = 1000, VB_H = 600;

  // 连线：五边形外环 + 内部星形 + 中心辐射
  var OUTER = [[0,1],[1,2],[2,3],[3,4],[4,0]];
  var INNER = [[0,2],[2,4],[4,1],[1,3],[3,0]];
  // RADIAL 在 drawLines 中按 current 动态生成

  var els = { svg: null, nodes: null, traveler: null, chips: null, stars: null };

  var state = {
    current: '307',
    nodeEls: {},
    chipEls: {},
    pixelPos: {},
    flying: false
  };

  function nodeById(id) {
    for (var i = 0; i < NODES.length; i++) if (NODES[i].id === id) return NODES[i];
    return null;
  }
  function clamp(v, lo, hi) { return v < lo ? lo : (v > hi ? hi : v); }

  // ===== 随机星点（80 个，覆盖整个背景） =====
  function createStars() {
    var layer = els.stars;
    if (!layer) return;
    for (var i = 0; i < 80; i++) {
      var s = document.createElement('div');
      s.className = 'wm-star';
      var size = 1 + Math.random() * 2.5;
      s.style.left = (Math.random() * 100) + '%';
      s.style.top  = (Math.random() * 100) + '%';
      s.style.width  = size + 'px';
      s.style.height = size + 'px';
      s.style.opacity = (0.15 + Math.random() * 0.75).toFixed(2);
      s.style.animationDuration = (3 + Math.random() * 6) + 's';
      s.style.animationDelay    = (Math.random() * 5) + 's';
      layer.appendChild(s);
    }
  }

  // ===== SVG 元素工厂 =====
  function svgEl(tag, attrs) {
    var e = document.createElementNS('http://www.w3.org/2000/svg', tag);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    return e;
  }

  // ===== SVG 连线：外环 + 内部星形 + 中心辐射 =====
  function drawLines() {
    var svg = els.svg;
    if (!svg) return;

    // 只清理由 JS 注入的 line（保留 defs 和静态星云 ellipse）
    var lines = svg.querySelectorAll('line.map-line');
    for (var i = lines.length - 1; i >= 0; i--) {
      lines[i].parentNode.removeChild(lines[i]);
    }

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

    // 中心辐射线：从 current 节点出发到所有其他节点
    var cur = nodeById(state.current);
    if (cur) {
      var ci = -1;
      for (var i = 0; i < NODES.length; i++) {
        if (NODES[i].id === cur.id) { ci = i; break; }
      }
      if (ci >= 0) {
        NODES.forEach(function (n, ni) {
          if (ni === ci) return;
          svg.appendChild(makeLine([ci, ni], 'radial'));
        });
      }
    }
  }

  // ===== 创建节点 DOM =====
  function createNodes() {
    var wrap = els.nodes;
    if (!wrap) return;
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
      node.title = n.name;  // 原生 tooltip

      var label = document.createElement('div');
      label.className = 'map-label';
      label.textContent = n.name;

      group.appendChild(node);
      group.appendChild(label);
      wrap.appendChild(group);

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

  // ===== 底部 chips =====
  function createChips() {
    var box = els.chips;
    if (!box) return;
    box.innerHTML = '';
    state.chipEls = {};
    NODES.forEach(function (n) {
      var chip = document.createElement('span');
      chip.className = 'wm-chip';
      chip.setAttribute('data-id', n.id);
      chip.textContent = n.name;
      chip.title = '切换至 ' + n.name;
      chip.addEventListener('click', function () { travelTo(n.id); });
      box.appendChild(chip);
      state.chipEls[n.id] = chip;
    });
  }

  // ===== 坐标换算（letterbox aware） =====
  function recalcPixelPositions() {
    var svg = els.svg;
    if (!svg) return;
    var rect = svg.getBoundingClientRect();
    var W = rect.width, H = rect.height;
    if (W === 0 || H === 0) return;
    var vbRatio = VB_W / VB_H;
    var boxRatio = W / H;
    var contentW, contentH, offX, offY;
    if (boxRatio > vbRatio) {
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

  // ===== 应用节点位置 =====
  function applyNodePositions() {
    recalcPixelPositions();
    var svg = els.svg;
    if (!svg) return;
    var rect = svg.getBoundingClientRect();
    var scale = clamp(rect.width / VB_W, 0.4, 1.4);
    Object.keys(state.nodeEls).forEach(function (id) {
      var p = state.pixelPos[id];
      var entry = state.nodeEls[id];
      if (!p) return;
      entry.node.style.left = p.x + 'px';
      entry.node.style.top  = p.y + 'px';
      entry.label.style.left = p.x + 'px';
      entry.label.style.top  = (p.y + 18) + 'px';
      if (id !== state.current) {
        var s = scale;
        entry.node.style.transform = 'scale(' + s.toFixed(3) + ')';
      }
      // current 节点不用 transform scale，让 CSS 控制尺寸 + current 波纹动画
    });
  }

  // ===== 高亮当前 =====
  function applyCurrent() {
    Object.keys(state.nodeEls).forEach(function (id) {
      var e = state.nodeEls[id];
      if (id === state.current) {
        e.node.classList.add('current');
        e.node.style.transform = '';  // 让 CSS .current 控制
      } else {
        e.node.classList.remove('current');
      }
    });
    Object.keys(state.chipEls).forEach(function (id) {
      if (id === state.current) state.chipEls[id].classList.add('active');
      else state.chipEls[id].classList.remove('active');
    });
    // 重绘连线（因为 current 变了，radial 线也要重绘）
    drawLines();
  }

  // ===== 光点滑行 → 切换场景 =====
  function travelTo(targetId) {
    if (state.flying) return;
    if (targetId === state.current) return;
    var from = state.pixelPos[state.current];
    var to   = state.pixelPos[targetId];
    if (!from || !to) return;

    var traveler = els.traveler;
    state.flying = true;
    traveler.style.transition = 'none';
    traveler.style.left = from.x + 'px';
    traveler.style.top  = from.y + 'px';
    traveler.classList.add('flying');

    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        traveler.style.transition = 'left 0.6s ease-in-out, top 0.6s ease-in-out, opacity 0.2s ease-in-out';
        traveler.style.left = to.x + 'px';
        traveler.style.top  = to.y + 'px';
      });
    });

    setTimeout(function () {
      state.current = targetId;
      applyCurrent();
      applyNodePositions();
      traveler.classList.remove('flying');
      state.flying = false;
      var node = nodeById(targetId);
      if (node) {
        try { localStorage.setItem('world_scene', node.id); } catch (e) {}
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

  // ===== 解析当前场景：URL > localStorage > 兜底 307室 =====
  function resolveCurrent() {
    // 1. URL ?scene=
    try {
      var qs = new URLSearchParams(window.location.search).get('scene');
      if (qs && nodeById(qs)) { state.current = qs; return qs; }
    } catch (e) {}
    // 2. localStorage
    try {
      var ls = localStorage.getItem('world_scene');
      if (ls && nodeById(ls)) { state.current = ls; return ls; }
    } catch (e) {}
    return '307';
  }

  // ===== 初始化 =====
  function init() {
    els.svg     = document.getElementById('wmSvg');
    els.nodes   = document.getElementById('wmNodes');
    els.traveler = document.getElementById('mapTraveler');
    els.chips   = document.getElementById('wmChips');
    els.stars   = document.getElementById('wmStars');
    if (!els.svg || !els.nodes) return;

    createStars();
    drawLines();
    createNodes();
    createChips();

    state.current = resolveCurrent();
    // 初始布局（等一帧确保 SVG 有尺寸）
    requestAnimationFrame(function () {
      applyNodePositions();
      applyCurrent();
    });

    // 响应式
    var resizeTimer = null;
    window.addEventListener('resize', function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () {
        applyNodePositions();
      }, 120);
    });
    window.addEventListener('orientationchange', function () {
      setTimeout(function () {
        applyNodePositions();
      }, 200);
    });
  }

  // ===== 根因修复：自动调用 init() =====
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.WorldMap = { init: init };
})();

// ===== 返回逻辑 =====
window.goBack = function () {
  if (document.referrer && document.referrer.indexOf(window.location.host) !== -1) {
    history.back();
  } else {
    window.location.href = 'index.html?skipIntro=1';
  }
};
