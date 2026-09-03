/* ============================================================
   world-map.js — 星图导航（独立页面脚本）
   融合形态：星图总览 + 场景百科详情
   场景切换：localStorage['world_scene'] + 自定义事件 worldmap:change
   ============================================================ */
(function () {
  'use strict';

  // ===== 5 个场景节点（viewBox 1000x600，五边形分布） =====
  var NODES = [
    { id: '307',    name: '307室',  x: 500, y: 100 },
    { id: 'roof',   name: '天台',    x: 690, y: 238 },
    { id: 'train',  name: '训练场',  x: 618, y: 462 },
    { id: 'hill',   name: '后山',    x: 382, y: 462 },
    { id: 'shelter',name: '防空洞',  x: 310, y: 238 }
  ];
  var VB_W = 1000, VB_H = 600;

  // 连线
  var OUTER = [[0,1],[1,2],[2,3],[3,4],[4,0]];
  var INNER = [[0,2],[2,4],[4,1],[1,3],[3,0]];

  // ===== 场景百科数据 =====
  var SCENE_DATA = {
    '307': {
      name: '307室',
      terrain: '宿舍平面图',
      desc: '四人间的宿舍，窗台上摆着一盆快要枯死的绿萝。冷旭帆的床铺总是整理得一丝不苟，黄景云的桌上堆着零食和漫画，叶清辞的床位则永远拉着帘子。夜晚熄灯后，这里会响起各种声音——键盘敲击声、翻书声、偶尔的梦话。',
      characters: ['冷旭帆常在窗边看书，偶尔会望向窗外发呆', '黄景云喜欢在床上打游戏，耳机里传来激烈的枪声', '叶清辞偶尔会在熄灯后拉琴，声音很轻']
    },
    'roof': {
      name: '天台',
      terrain: '天台俯瞰图',
      desc: '宿舍楼的顶层天台，视野开阔，能看到整个校园和远处的山。铁门常年锁着，但有个螺丝松动的窗户可以翻出去。傍晚时分，这里是最适合看日落的地方，也是某些人独自思考的去处。',
      characters: ['冷旭帆偶尔会来天台吹风，一个人站很久', '叶清辞曾在黄昏时独自来这里，手里拿着琴盒']
    },
    'train': {
      name: '训练场',
      terrain: '训练场布局图',
      desc: '校园东侧的露天训练场，有单杠、双杠和沙坑。地面是硬实的黄土，边缘长着杂草。清晨和傍晚常有体育生在这里训练，铁质器械在阳光下泛着冷光。',
      characters: ['冷旭帆每天清晨会来训练，雷打不动', '黄景云偶尔路过时会停下来，看一会儿再走']
    },
    'hill': {
      name: '后山',
      terrain: '后山地形图',
      desc: '校园后面的小山丘，长满了野草和灌木。有一条被人踩出来的小路通往山顶。山顶有一棵歪脖子树，树下有块平整的大石头，据说坐在这里能看到整个城市的天际线。',
      characters: ['冷旭帆曾和叶清辞一起爬过后山，两人在山顶待了很久', '黄景云说后山晚上有萤火虫，但没人真的见过']
    },
    'shelter': {
      name: '防空洞',
      terrain: '防空洞结构图',
      desc: '校园深处的废弃防空洞，入口被铁栅栏封住，但侧面有个缺口可以钻进去。洞内阴冷潮湿，墙壁上有人用粉笔写下的字迹。最深处有一扇生锈的铁门，不知道通往哪里。',
      characters: ['冷旭帆曾在这里躲雨，发现墙上有奇怪的涂鸦', '黄景云绘声绘色地说这里闹鬼，但没人信他', '叶清辞对此保持沉默，眼神有些微妙']
    }
  };

  var els = { svg: null, nodes: null, traveler: null, chips: null, stars: null, detailPanel: null, detailMask: null, detailClose: null };

  var state = {
    current: '307',
    nodeEls: {},
    chipEls: {},
    pixelPos: {},
    flying: false,
    detailOpen: false,
    selectedId: null    // 当前被选中的节点（用于左移放大）
  };

  function nodeById(id) {
    for (var i = 0; i < NODES.length; i++) if (NODES[i].id === id) return NODES[i];
    return null;
  }
  function clamp(v, lo, hi) { return v < lo ? lo : (v > hi ? hi : v); }

  // ===== 随机星点 =====
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

  function svgEl(tag, attrs) {
    var e = document.createElementNS('http://www.w3.org/2000/svg', tag);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    return e;
  }

  // ===== SVG 连线 =====
  function drawLines() {
    var svg = els.svg;
    if (!svg) return;
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
      node.setAttribute('aria-label', '查看 ' + n.name + ' 详情');

      var label = document.createElement('div');
      label.className = 'map-label';
      label.textContent = n.name;

      group.appendChild(node);
      group.appendChild(label);
      wrap.appendChild(group);

      var onActivate = function () {
        travelTo(n.id);
        showDetail(n.id);
      };
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
      chip.addEventListener('click', function () {
        // 如果有点击选中节点，先重置
        resetSelectedNode();
        travelTo(n.id);
        showDetail(n.id);
      });
      box.appendChild(chip);
      state.chipEls[n.id] = chip;
    });
  }

  // ===== 坐标换算 =====
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
    });
  }

  // ===== 重置选中节点位置 =====
  function resetSelectedNode() {
    if (state.selectedId && state.nodeEls[state.selectedId]) {
      var entry = state.nodeEls[state.selectedId];
      entry.wrap.style.transform = '';
      entry.wrap.style.zIndex = '';
      state.selectedId = null;
    }
  }

  // ===== 高亮当前 =====
  function applyCurrent() {
    Object.keys(state.nodeEls).forEach(function (id) {
      var e = state.nodeEls[id];
      if (id === state.current) {
        e.node.classList.add('current');
        // current 不会同时是选中节点，清除 transform
        if (e.wrap) e.wrap.style.transform = '';
      } else {
        e.node.classList.remove('current');
      }
    });
    Object.keys(state.chipEls).forEach(function (id) {
      if (id === state.current) state.chipEls[id].classList.add('active');
      else state.chipEls[id].classList.remove('active');
    });
    drawLines();
  }

  // ===== 光点滑行 =====
  function travelTo(targetId) {
    if (state.flying) return;
    if (targetId === state.current) return;
    // 如果有点击选中节点，先重置
    resetSelectedNode();
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

  // ===== 场景百科详情面板 =====
  function showDetail(sceneId) {
    var data = SCENE_DATA[sceneId];
    if (!data) return;

    // 填充内容
    var titleEl = document.getElementById('wmDetailTitle');
    var descEl = document.getElementById('wmDetailDesc');
    var charsEl = document.getElementById('wmDetailCharacters');
    var eventEl = document.getElementById('wmDetailEvent');

    if (titleEl) titleEl.textContent = data.name;
    if (descEl) descEl.textContent = data.desc;

    // 角色活动
    if (charsEl) {
      charsEl.innerHTML = '';
      if (data.characters && data.characters.length > 0) {
        data.characters.forEach(function (c) {
          var li = document.createElement('li');
          li.textContent = c;
          charsEl.appendChild(li);
        });
      } else {
        var li = document.createElement('li');
        li.textContent = '暂无相关角色活动记录';
        li.style.color = '#5f6b80';
        charsEl.appendChild(li);
      }
    }

    // 特殊事件
    if (eventEl) {
      eventEl.innerHTML = '<span class="event-placeholder">暂无特殊事件，敬请期待</span>';
    }

    // 打开面板（传入sceneId使节点放大左移）
    openDetail(sceneId);
  }

  function openDetail(sceneId) {
    if (state.detailOpen) {
      resetSelectedNode();
    }
    state.detailOpen = true;
    if (els.detailMask) els.detailMask.classList.add('open');
    if (els.detailPanel) els.detailPanel.classList.add('open');
    document.body.style.overflow = 'hidden';
    // 选中节点放大并向左偏移80px
    if (sceneId && state.nodeEls[sceneId]) {
      state.selectedId = sceneId;
      var entry = state.nodeEls[sceneId];
      entry.wrap.style.transform = 'translate(-80px, 0) scale(1.2)';
      entry.wrap.style.zIndex = '10';
    }
  }

  function closeDetail() {
    if (!state.detailOpen) return;
    state.detailOpen = false;
    resetSelectedNode();
    if (els.detailMask) els.detailMask.classList.remove('open');
    if (els.detailPanel) els.detailPanel.classList.remove('open');
    document.body.style.overflow = '';
  }

  // ===== 解析当前场景 =====
  function resolveCurrent() {
    try {
      var qs = new URLSearchParams(window.location.search).get('scene');
      if (qs && nodeById(qs)) { state.current = qs; return qs; }
    } catch (e) {}
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
    els.detailPanel = document.getElementById('wmDetailPanel');
    els.detailMask  = document.getElementById('wmDetailMask');
    els.detailClose = document.getElementById('wmDetailClose');
    if (!els.svg || !els.nodes) return;

    createStars();
    drawLines();
    createNodes();
    createChips();

    state.current = resolveCurrent();
    requestAnimationFrame(function () {
      applyNodePositions();
      applyCurrent();
    });

    // 关闭详情
    if (els.detailClose) {
      els.detailClose.addEventListener('click', closeDetail);
    }
    if (els.detailMask) {
      els.detailMask.addEventListener('click', closeDetail);
    }
    // ESC 关闭
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeDetail();
    });

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

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.WorldMap = { init: init, showDetail: showDetail, closeDetail: closeDetail };
})();

window.goBack = function () {
  if (document.referrer && document.referrer.indexOf(window.location.host) !== -1) {
    history.back();
  } else {
    window.location.href = 'index.html?skipIntro=1';
  }
};