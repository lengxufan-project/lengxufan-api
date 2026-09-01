/* ============================================================
   memory-gallery.js — 时光回廊（独立页面脚本）
   仅操作本页 #gallery* / .memory-card / .mg-* 元素
   依赖 css/memory-gallery.css 的类名
   ============================================================ */
(function () {
  'use strict';

  // ===== 预设记忆：6 条 =====
  var MEMORIES = [
    {
      date: '第 1 天 · 黄昏',
      name: '冷旭帆',
      snippet: '第一次见面，冷旭帆没说话，只是看了你一眼',
      full: '门被推开的时候，黄昏的光斜斜地落进来。冷旭帆站在窗边，没有说话，只是抬眼看了你一眼。那一眼很轻，却像一根针，慢慢扎进空气里。'
    },
    {
      date: '第 3 天 · 深夜',
      name: '黄景云',
      snippet: '深夜，黄景云用粤语说了一句什么',
      full: '深夜十一点四十分，黄景云靠在吧台边，低声用粤语说了一句什么。你没听清，只看到他嘴角勾了一下，像是在笑，又像是在叹气。'
    },
    {
      date: '第 7 天 · 雨后',
      name: '叶清辞',
      snippet: '叶清辞摘下手表，秒针在走',
      full: '叶清辞把那块旧手表摘下来，搁在桌沿。玻璃表面有一道细裂纹，秒针却仍在一格一格地走，走得缓慢而坚定，像是在数着什么。'
    },
    {
      date: '第 12 天 · 正午',
      name: '冷旭帆',
      snippet: '你说了什么，冷旭帆的左肩动了一下',
      full: '你说了什么，自己也记不太清。只看见冷旭帆的左肩动了一下，很轻，像是被风掠过。他没回头，但那一下颤动，比任何回答都响。'
    },
    {
      date: '第 18 天 · 雪夜',
      name: '—',
      snippet: '窗外有雪，室内很安静',
      full: '窗外有雪，一片一片地落，落得很慢。室内很安静，安静到能听见暖气管里水流动的声音。你们谁都没有开口，雪替你们说完了所有的话。'
    },
    {
      date: '第 21 天 · 凌晨',
      name: '系统',
      snippet: '信任值第一次上升',
      full: '凌晨两点零三分，状态面板的某一行轻轻跳了一下。信任值 +1。这是它第一次，朝上的方向走。没有人看见，但它确实发生了。'
    }
  ];

  // ===== 布局参数 =====
  var CARD_W = 240;          // 卡片宽度
  var CARD_SPACING = 200;    // 相邻卡片横向间距
  var VISIBLE_RANGE = 3;    // 左右各显示 3 张（含中央）

  var els = {
    view: null,
    track: null,
    stars: null,
    indicator: null
  };

  var state = {
    active: 0,            // 当前居中卡片索引
    cards: [],            // 卡片 DOM
    dots: [],             // 指示器 DOM
    parallaxX: 0,         // 鼠标视差偏移
    parallaxY: 0,
    dragging: false,
    dragStartX: 0,
    dragActiveStart: 0
  };

  // ===== 工具 =====
  function clamp(v, lo, hi) {
    return v < lo ? lo : (v > hi ? hi : v);
  }

  // ===== 创建星点 =====
  function createStars() {
    var layer = els.stars;
    layer.innerHTML = '';
    for (var i = 0; i < 60; i++) {
      var s = document.createElement('div');
      s.className = 'mg-star';
      s.style.left = (Math.random() * 100) + '%';
      s.style.top = (Math.random() * 100) + '%';
      s.style.animationDelay = (Math.random() * 18) + 's';
      s.style.animationDuration = (12 + Math.random() * 14) + 's';
      var size = 1 + Math.random() * 2;
      s.style.width = size + 'px';
      s.style.height = size + 'px';
      s.style.opacity = (0.2 + Math.random() * 0.6).toFixed(2);
      layer.appendChild(s);
    }
  }

  // ===== 创建卡片 =====
  function createCards() {
    var track = els.track;
    track.innerHTML = '';
    state.cards = [];
    for (var i = 0; i < MEMORIES.length; i++) {
      var m = MEMORIES[i];
      var card = document.createElement('div');
      card.className = 'memory-card';
      card.setAttribute('data-index', String(i));
      card.innerHTML =
        '<div class="mc-date">' + m.date + '</div>' +
        '<div class="mc-snippet">' + m.snippet + '</div>' +
        '<div class="mc-name">— ' + m.name + '</div>';
      card.addEventListener('click', (function (idx) {
        return function (e) {
          // 拖动尾随的点击不应触发
          if (state._justDragged) { state._justDragged = false; return; }
          openModal(idx);
        };
      })(i));
      track.appendChild(card);
      state.cards.push(card);
    }
  }

  // ===== 创建底部指示器 =====
  function createIndicator() {
    var ind = els.indicator;
    ind.innerHTML = '';
    state.dots = [];
    for (var i = 0; i < MEMORIES.length; i++) {
      var dot = document.createElement('span');
      dot.className = 'mg-dot' + (i === state.active ? ' active' : '');
      dot.setAttribute('data-index', String(i));
      dot.addEventListener('click', (function (idx) {
        return function () { setActive(idx); };
      })(i));
      ind.appendChild(dot);
      state.dots.push(dot);
    }
  }

  // ===== 布局：根据 state.active 重排所有卡片 =====
  function layout() {
    for (var i = 0; i < state.cards.length; i++) {
      var card = state.cards[i];
      var d = i - state.active;                 // 相对位置
      var absD = Math.abs(d);

      // 超出可见范围：隐藏
      if (absD > VISIBLE_RANGE) {
        card.style.opacity = '0';
        card.style.pointerEvents = 'none';
        card.style.transform = 'translate3d(' + (d * CARD_SPACING) + 'px, 0, -800px)';
        continue;
      }

      // 侧别 class
      var sideClass = d < 0 ? 'mc-left' : (d > 0 ? 'mc-right' : '');
      // 重建类名（保留 memory-card，移除旧的 mc-left/right）
      var baseClass = 'memory-card';
      if (d === 0) baseClass += ' mc-center';
      else if (d < 0) baseClass += ' mc-left';
      else baseClass += ' mc-right';
      card.className = baseClass;

      // 计算位置与旋转
      var x = d * CARD_SPACING;
      var z = -Math.abs(d) * 120;                // 远离视口
      var rotY = d === 0 ? 0 : (d < 0 ? 15 : -15);
      var scale = d === 0 ? 1 : (1 - absD * 0.08);
      var opacity = 1 - absD * 0.18;

      // 视差微调（鼠标位置引起的整体平移）
      x += state.parallaxX * (1 - absD * 0.2);
      var y = state.parallaxY * (1 - absD * 0.2);

      card.style.opacity = opacity.toFixed(2);
      card.style.pointerEvents = 'auto';
      card.style.transform =
        'translate3d(' + x + 'px, ' + y + 'px, ' + z + 'px) ' +
        'rotateY(' + rotY + 'deg) scale(' + scale.toFixed(3) + ')';
      card.style.zIndex = String(100 - absD);
    }
    // 更新指示器
    for (var k = 0; k < state.dots.length; k++) {
      if (k === state.active) state.dots[k].classList.add('active');
      else state.dots[k].classList.remove('active');
    }
  }

  // ===== 设置当前活跃卡片 =====
  function setActive(idx) {
    state.active = clamp(idx, 0, MEMORIES.length - 1);
    layout();
  }

  function next() { setActive(state.active + 1); }
  function prev() { setActive(state.active - 1); }

  // ===== 模态框 =====
  function openModal(idx) {
    var m = MEMORIES[idx];
    var mask = document.createElement('div');
    mask.className = 'mg-modal-mask';
    mask.innerHTML =
      '<div class="mg-modal" role="dialog" aria-modal="true">' +
        '<div class="mg-modal-date">' + m.date + '</div>' +
        '<div class="mg-modal-body">' + m.full + '</div>' +
        '<div class="mg-modal-name">— ' + m.name + '</div>' +
        '<button class="mg-modal-close" type="button">关闭</button>' +
      '</div>';
    document.body.appendChild(mask);
    // 触发动画
    requestAnimationFrame(function () {
      requestAnimationFrame(function () { mask.classList.add('show'); });
    });
    // 关闭逻辑
    var close = function () {
      mask.classList.remove('show');
      setTimeout(function () {
        if (mask.parentNode) mask.parentNode.removeChild(mask);
      }, 420);
    };
    mask.querySelector('.mg-modal-close').addEventListener('click', close);
    mask.addEventListener('click', function (e) {
      if (e.target === mask) close();
    });
    document.addEventListener('keydown', function esc(e) {
      if (e.key === 'Escape' || e.keyCode === 27) {
        close();
        document.removeEventListener('keydown', esc);
      }
    });
  }

  // ===== 交互：鼠标移动视差 =====
  function onMouseMove(e) {
    var rect = els.view.getBoundingClientRect();
    var nx = (e.clientX - rect.left) / rect.width - 0.5;   // -0.5 ~ 0.5
    var ny = (e.clientY - rect.top) / rect.height - 0.5;
    state.parallaxX = nx * 40;    // ±20px
    state.parallaxY = ny * 16;
    layout();
  }

  // ===== 交互：滚轮切换 =====
  function onWheel(e) {
    e.preventDefault();
    if (state._wheelLock) return;
    state._wheelLock = true;
    setTimeout(function () { state._wheelLock = false; }, 360);
    if (e.deltaY > 0 || e.deltaX > 0) next();
    else prev();
  }

  // ===== 交互：拖动切换 =====
  function onDown(e) {
    state.dragging = true;
    state._justDragged = false;
    state.dragStartX = (typeof e.clientX === 'number') ? e.clientX : (e.touches && e.touches[0].clientX);
    state.dragActiveStart = state.active;
    document.body.style.cursor = 'grabbing';
    e.preventDefault && e.preventDefault();
  }
  function onMove(e) {
    if (!state.dragging) return;
    var cx = (typeof e.clientX === 'number') ? e.clientX : (e.touches && e.touches[0].clientX);
    var dx = cx - state.dragStartX;
    if (Math.abs(dx) > 6) state._justDragged = true;
    // 拖过半张卡片宽度切换
    var steps = Math.round(dx / (CARD_W * 0.5));
    setActive(state.dragActiveStart - steps);
  }
  function onUp() {
    if (!state.dragging) return;
    state.dragging = false;
    document.body.style.cursor = '';
  }

  // ===== 键盘 =====
  function onKey(e) {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); next(); }
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); prev(); }
    else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openModal(state.active); }
  }

  // ===== 初始化 =====
  function init() {
    els.view = document.getElementById('galleryView');
    els.track = document.getElementById('galleryTrack');
    els.stars = document.getElementById('galleryStars');
    els.indicator = document.getElementById('mgIndicator');
    if (!els.view || !els.track) return;

    createStars();
    createCards();
    createIndicator();
    layout();

    // 鼠标视差
    els.view.addEventListener('mousemove', onMouseMove);
    els.view.addEventListener('mouseleave', function () {
      state.parallaxX = 0; state.parallaxY = 0; layout();
    });
    // 滚轮
    els.view.addEventListener('wheel', onWheel, { passive: false });
    // 拖动（鼠标 + 触摸）
    els.track.addEventListener('mousedown', onDown);
    els.track.addEventListener('touchstart', onDown, { passive: false });
    window.addEventListener('mousemove', onMove);
    window.addEventListener('touchmove', onMove, { passive: false });
    window.addEventListener('mouseup', onUp);
    window.addEventListener('touchend', onUp);
    // 键盘
    window.addEventListener('keydown', onKey);
  }

  // ===== 导出 =====
  window.MemoryGallery = { init: init };
})();
