/* 暗夜拾遗（独立页面）
   融合形态：藏品图鉴（默认）+ 场景点击探索
   localStorage 存储收集状态 */
(function () {
  "use strict";

  var STORAGE_KEY = "nightEchoes_found_v1";
  var GUIDE_KEY = "nightEchoes_guide_shown";

  // 5 个物品
  var ITEMS = [
    { id: "bracelet", name: "护腕", mark: "护", desc: "冰蓝色护腕，左肩旧伤的记忆", source: "训练场" },
    { id: "candy",    name: "糖纸", mark: "糖", desc: "暖橙色糖纸，折着半句粤语", source: "307室桌上" },
    { id: "watch",    name: "手表", mark: "手", desc: "冷紫手表，停在一次走神的下午", source: "天台角落" },
    { id: "lamp",     name: "台灯", mark: "台", desc: "台灯还亮着一角，谁忘了关", source: "后山石缝" },
    { id: "note",     name: "纸条", mark: "纸", desc: "折起的纸条，字迹被夜色泡软", source: "防空洞墙边" }
  ];

  // 探索点随机分布范围
  var RANGE = { leftMin: 8, leftMax: 88, topMin: 18, topMax: 62 };
  var MIN_GAP = 14;

  // ---------- DOM 缓存 ----------
  var els = {};

  // ---------- 状态 ----------
  var state = {
    mode: 'gallery',  // 'gallery' | 'explore'
    found: [],
    toastTimer: null
  };

  // ---------- 工具 ----------
  function loadFound() {
    try {
      var arr = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      return Array.isArray(arr) ? arr : [];
    } catch (e) { return []; }
  }

  function saveFound(list) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(list)); } catch (e) {}
  }

  function isFound(itemId) {
    return state.found.indexOf(itemId) !== -1;
  }

  function randomPositions(count) {
    var pts = [];
    while (pts.length < count) {
      var p = {
        left: RANGE.leftMin + Math.random() * (RANGE.leftMax - RANGE.leftMin),
        top: RANGE.topMin + Math.random() * (RANGE.topMax - RANGE.topMin)
      };
      var ok = pts.every(function (q) {
        var dx = p.left - q.left, dy = (p.top - q.top) * 1.6;
        return Math.sqrt(dx * dx + dy * dy) >= MIN_GAP;
      });
      if (ok) pts.push(p);
    }
    return pts;
  }

  // ---------- 图鉴模式：构建卡片网格 ----------
  function buildGallery() {
    var grid = els.grid;
    if (!grid) return;
    grid.innerHTML = '';

    ITEMS.forEach(function (item) {
      var card = document.createElement('div');
      card.className = 'ex-card' + (isFound(item.id) ? ' found' : '');
      card.dataset.id = item.id;

      var icon = document.createElement('div');
      icon.className = 'ex-card-icon';
      icon.textContent = item.mark;

      var name = document.createElement('div');
      name.className = 'ex-card-name';
      name.textContent = item.name;

      var status = document.createElement('div');
      status.className = 'ex-card-status';
      status.textContent = isFound(item.id) ? '已收集' : '未收集';

      card.appendChild(icon);
      card.appendChild(name);
      card.appendChild(status);

      // 只有已收集的卡片可点击查看详情
      if (isFound(item.id)) {
        card.addEventListener('click', function () { showDetail(item.id); });
      }

      grid.appendChild(card);
    });
  }

  // ---------- 探索模式：构建场景光点 ----------
  function buildPoints() {
    var scene = els.sceneArea;
    if (!scene) return;

    // 清除旧的光点（保留月光、返回按钮、完成文字）
    var oldPoints = scene.querySelectorAll('.explore-point');
    oldPoints.forEach(function (p) { p.remove(); });

    var pts = randomPositions(ITEMS.length);

    ITEMS.forEach(function (item, i) {
      var el = document.createElement('div');
      el.className = 'explore-point';
      el.dataset.id = item.id;
      el.style.left = pts[i].left + '%';
      el.style.top = pts[i].top + '%';
      el.style.animationDelay = (Math.random() * 2).toFixed(2) + 's';
      el.innerHTML =
        '<div class="item-tooltip">' +
          '<div class="tip-name">' + item.name + '</div>' +
          '<div class="tip-desc">' + item.desc + '</div>' +
        '</div>';

      if (isFound(item.id)) {
        el.classList.add('found');
      } else {
        el.addEventListener('click', function () { collect(el, item); });
      }
      scene.appendChild(el);
    });

    // 更新拾遗完成状态
    updateDoneText();
  }

  // ---------- 底部收集栏 ----------
  function buildBar() {
    var bar = els.collectBar;
    if (!bar) return;
    bar.innerHTML = '';

    ITEMS.forEach(function (item) {
      var slot = document.createElement('div');
      slot.className = 'slot' + (isFound(item.id) ? ' filled' : '');
      slot.dataset.id = item.id;
      slot.textContent = item.mark;
      slot.title = item.name;  // 悬浮提示完整名称
      bar.appendChild(slot);
    });
  }

  // ---------- 收集提示 Toast ----------
  function showCollectToast(itemName) {
    var toast = els.collectToast;
    if (!toast) return;
    if (state.toastTimer) {
      clearTimeout(state.toastTimer);
    }
    toast.textContent = '已收集：' + itemName;
    toast.style.display = 'block';
    // 强制 reflow 后显示
    void toast.offsetWidth;
    toast.classList.add('show');
    state.toastTimer = setTimeout(function () {
      toast.classList.remove('show');
      state.toastTimer = setTimeout(function () {
        toast.style.display = 'none';
        state.toastTimer = null;
      }, 300);
    }, 2000);
  }

  // ---------- 引导浮层 ----------
  function showGuide() {
    var overlay = els.guideOverlay;
    if (!overlay) return;
    // 检查是否已经显示过
    var shown = false;
    try { shown = localStorage.getItem(GUID_KEY) === '1'; } catch (e) {}
    if (shown) return;
    overlay.style.display = 'flex';
    var closeGuide = function () {
      overlay.style.display = 'none';
      try { localStorage.setItem(GUID_KEY, '1'); } catch (e) {}
      overlay.removeEventListener('click', closeGuide);
    };
    overlay.addEventListener('click', closeGuide);
  }

  // ---------- 收集逻辑 ----------
  function collect(el, item) {
    if (el.classList.contains('found')) return;
    el.classList.add('found');

    // 显示收集提示
    showCollectToast(item.name);

    // 爆破粒子
    burst(el);

    // 延迟更新底部栏
    setTimeout(function () {
      // 更新状态
      if (state.found.indexOf(item.id) === -1) {
        state.found.push(item.id);
        saveFound(state.found);
      }

      // 更新底部栏
      var slot = els.collectBar.querySelector('.slot[data-id="' + item.id + '"]');
      if (slot) slot.classList.add('filled');

      // 更新图鉴卡片
      var card = els.grid.querySelector('.ex-card[data-id="' + item.id + '"]');
      if (card) {
        card.classList.add('found');
        card.querySelector('.ex-card-status').textContent = '已收集';
        // 添加点击查看详情
        card.addEventListener('click', function () { showDetail(item.id); });
      }

      // 更新拾遗完成
      updateDoneText();

      // 全部收集完成
      if (state.found.length >= ITEMS.length) {
        setTimeout(function () {
          // 切换到图鉴模式并显示完成
          switchToGallery();
        }, 1200);
      }
    }, 500);
  }

  // 爆破粒子
  function burst(el) {
    for (var i = 0; i < 12; i++) {
      var p = document.createElement('span');
      p.className = 'burst-particle';
      var angle = (Math.PI * 2 * i) / 12 + Math.random() * 0.5;
      var dist = 26 + Math.random() * 34;
      p.style.setProperty('--dx', (Math.cos(angle) * dist).toFixed(1) + 'px');
      p.style.setProperty('--dy', (Math.sin(angle) * dist).toFixed(1) + 'px');
      el.appendChild(p);
      (function (node) {
        setTimeout(function () { node.remove(); }, 800);
      })(p);
    }
  }

  function updateDoneText() {
    var doneEl = els.doneText;
    if (!doneEl) return;
    if (state.found.length >= ITEMS.length) {
      doneEl.classList.add('show');
    } else {
      doneEl.classList.remove('show');
    }
  }

  // ---------- 藏品详情弹窗 ----------
  function showDetail(itemId) {
    var item = null;
    for (var i = 0; i < ITEMS.length; i++) {
      if (ITEMS[i].id === itemId) { item = ITEMS[i]; break; }
    }
    if (!item) return;
    if (!isFound(itemId)) return;

    var nameEl = els.detailName;
    var descEl = els.detailDesc;
    var sourceEl = els.detailSource;
    var iconEl = els.detailIcon;

    if (nameEl) nameEl.textContent = item.name;
    if (descEl) descEl.textContent = item.desc;
    if (sourceEl) sourceEl.textContent = item.source;
    if (iconEl) iconEl.textContent = item.mark;

    if (els.detailMask) els.detailMask.classList.add('open');
    if (els.detailPopup) els.detailPopup.classList.add('open');
  }

  function closeDetail() {
    if (els.detailMask) els.detailMask.classList.remove('open');
    if (els.detailPopup) els.detailPopup.classList.remove('open');
  }

  // ---------- 模式切换 ----------
  function switchToExplore() {
    state.mode = 'explore';

    // 显示场景，隐藏图鉴
    if (els.gallery) els.gallery.classList.add('hidden');
    if (els.sceneArea) els.sceneArea.classList.add('active');

    // 重建探索点（位置随机变化）
    buildPoints();

    // 按钮文字切换
    if (els.exploreBtn) els.exploreBtn.textContent = '探索中...';

    // 显示引导浮层（仅首次）
    showGuide();
  }

  function switchToGallery() {
    state.mode = 'gallery';

    // 显示图鉴，隐藏场景
    if (els.gallery) els.gallery.classList.remove('hidden');
    if (els.sceneArea) els.sceneArea.classList.remove('active');

    // 更新图鉴
    buildGallery();

    // 按钮文字
    if (els.exploreBtn) els.exploreBtn.textContent = '去探索';
  }

  // ---------- 初始化 ----------
  function init() {
    els.gallery    = document.getElementById('exGallery');
    els.grid       = document.getElementById('exGrid');
    els.sceneArea  = document.getElementById('exSceneArea');
    els.collectBar = document.getElementById('collectBar');
    els.doneText   = document.getElementById('exDoneText');
    els.exploreBtn = document.getElementById('exExploreBtn');
    els.backGallery = document.getElementById('exBackGallery');
    els.detailMask  = document.getElementById('exDetailMask');
    els.detailPopup = document.getElementById('exDetailPopup');
    els.detailClose = document.getElementById('exDetailClose');
    els.detailName  = document.getElementById('exDetailName');
    els.detailDesc  = document.getElementById('exDetailDesc');
    els.detailSource = document.getElementById('exDetailSource');
    els.detailIcon  = document.getElementById('exDetailIcon');
    els.collectToast = document.getElementById('exCollectToast');
    els.guideOverlay = document.getElementById('exGuideOverlay');

    if (!els.grid || !els.collectBar) return;

    // 加载保存状态
    state.found = loadFound();

    // 构建 UI
    buildBar();
    buildGallery();

    // 如果全部收集完成，显示完成状态
    updateDoneText();

    // ---------- 事件绑定 ----------
    // "去探索" 按钮
    if (els.exploreBtn) {
      els.exploreBtn.addEventListener('click', function () {
        if (state.mode === 'gallery') {
          switchToExplore();
        }
      });
    }

    // "返回图鉴" 按钮
    if (els.backGallery) {
      els.backGallery.addEventListener('click', switchToGallery);
    }

    // 详情弹窗关闭
    if (els.detailClose) {
      els.detailClose.addEventListener('click', closeDetail);
    }
    if (els.detailMask) {
      els.detailMask.addEventListener('click', closeDetail);
    }
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeDetail();
    });
  }

  window.Exploration = { init: init };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

window.goBack = function () {
  if (document.referrer && document.referrer.includes(window.location.host)) {
    history.back();
  } else {
    window.location.href = 'index.html?skipIntro=1';
  }
};