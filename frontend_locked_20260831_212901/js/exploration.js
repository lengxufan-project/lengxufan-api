/* 暗夜拾遗：307 室夜晚探索（独立页面） */
(function () {
  "use strict";

  var STORAGE_KEY = "nightEchoes_found_v1";

  // 5 个物品（占位）；护腕 / 糖纸 / 手表 呼应三名角色信物
  var ITEMS = [
    { id: "bracelet", name: "护腕", mark: "护", desc: "冰蓝色护腕，左肩旧伤的记忆" },
    { id: "candy",    name: "糖纸", mark: "糖", desc: "暖橙色糖纸，折着半句粤语" },
    { id: "watch",    name: "手表", mark: "手", desc: "冷紫手表，停在一次走神的下午" },
    { id: "lamp",     name: "台灯", mark: "台", desc: "台灯还亮着一角，谁忘了关" },
    { id: "note",     name: "纸条", mark: "纸", desc: "折起的纸条，字迹被夜色泡软" }
  ];

  // 探索点随机分布范围（避开顶部标题与底部收集栏）
  var RANGE = { leftMin: 8, leftMax: 88, topMin: 18, topMax: 62 };
  var MIN_GAP = 14; // 两点最小间距（百分比）

  // ---------- DOM 缓存 ----------
  var sceneArea, collectBar, doneText;

  // ---------- 工具 ----------
  function loadFound() {
    try {
      var arr = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      return Array.isArray(arr) ? arr : [];
    } catch (e) {
      return [];
    }
  }

  function saveFound(list) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    } catch (e) { /* 忽略存储失败 */ }
  }

  // 生成随机位置，并保证与已生成点保持最小间距
  function randomPositions(count) {
    var pts = [];
    while (pts.length < count) {
      var p = {
        left: RANGE.leftMin + Math.random() * (RANGE.leftMax - RANGE.leftMin),
        top: RANGE.topMin + Math.random() * (RANGE.topMax - RANGE.topMin)
      };
      var ok = pts.every(function (q) {
        var dx = p.left - q.left, dy = (p.top - q.top) * 1.6; // 拉开纵向权重
        return Math.sqrt(dx * dx + dy * dy) >= MIN_GAP;
      });
      if (ok) pts.push(p);
    }
    return pts;
  }

  // ---------- 构建 ----------
  function buildPoints() {
    var found = loadFound();
    var pts = randomPositions(ITEMS.length);

    ITEMS.forEach(function (item, i) {
      var el = document.createElement("div");
      el.className = "explore-point";
      el.dataset.id = item.id;
      el.style.left = pts[i].left + "%";
      el.style.top = pts[i].top + "%";
      el.style.animationDelay = (Math.random() * 2).toFixed(2) + "s";
      el.innerHTML =
        '<div class="item-tooltip">' +
          '<div class="tip-name">' + item.name + '</div>' +
          '<div class="tip-desc">' + item.desc + '</div>' +
        '</div>';

      if (found.indexOf(item.id) !== -1) {
        el.classList.add("found"); // 恢复历史收集状态，无动画
      } else {
        el.addEventListener("click", function () { collect(el, item); });
      }
      sceneArea.appendChild(el);
    });
  }

  function buildBar() {
    ITEMS.forEach(function (item) {
      var slot = document.createElement("div");
      slot.className = "slot";
      slot.dataset.id = item.id;
      slot.textContent = item.mark;
      collectBar.appendChild(slot);
    });
    // 恢复已收集的格子
    var found = loadFound();
    ITEMS.forEach(function (item) {
      if (found.indexOf(item.id) !== -1) {
        var slot = collectBar.querySelector('.slot[data-id="' + item.id + '"]');
        if (slot) slot.classList.add("filled");
      }
    });
  }

  // ---------- 收集 ----------
  function collect(el, item) {
    if (el.classList.contains("found")) return;
    el.classList.add("found");

    burst(el);
    setTimeout(function () {
      var slot = collectBar.querySelector('.slot[data-id="' + item.id + '"]');
      if (slot) slot.classList.add("filled");
    }, 450);

    var found = loadFound();
    if (found.indexOf(item.id) === -1) {
      found.push(item.id);
      saveFound(found);
    }
    if (found.length >= ITEMS.length) showDone();
  }

  // 光点爆破：粒子散落
  function burst(el) {
    for (var i = 0; i < 12; i++) {
      var p = document.createElement("span");
      p.className = "burst-particle";
      var angle = (Math.PI * 2 * i) / 12 + Math.random() * 0.5;
      var dist = 26 + Math.random() * 34;
      p.style.setProperty("--dx", (Math.cos(angle) * dist).toFixed(1) + "px");
      p.style.setProperty("--dy", (Math.sin(angle) * dist).toFixed(1) + "px");
      el.appendChild(p);
      (function (node) {
        setTimeout(function () { node.remove(); }, 800);
      })(p);
    }
  }

  function showDone() {
    doneText.classList.add("show");
  }

  // ---------- 初始化 ----------
  function init() {
    sceneArea = document.getElementById("sceneArea");
    collectBar = document.getElementById("collectBar");
    doneText = document.getElementById("doneText");
    if (!sceneArea || !collectBar) return;

    buildBar();
    buildPoints();

    // 全部收集过则直接显示完成文字
    if (loadFound().length >= ITEMS.length) showDone();
  }

  window.Exploration = { init: init };

  // 独立页面：脚本置于 body 末尾，直接自动初始化
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
