/* 观察者之窗：情绪环 / 压力值 / 亲密度摘要（独立页面） */
(function () {
  "use strict";

  // 三名固定角色；当前后端仅提供冷旭帆的关系数据，其余为占位
  var CHARACTERS = [
    { id: "lengxufan", name: "冷旭帆", locked: false, placeholder: 10 },
    { id: "huangjingyun", name: "黄景云", locked: true, placeholder: 6 },
    { id: "yeqingci", name: "叶清辞", locked: true, placeholder: 3 }
  ];

  var REFRESH_MS = 3000;
  var BREATH_HOLD_MS = 2000; // 深呼吸：数值归零后保持的时长

  var timer = null;
  var breathing = false;
  // 当前展示值（供补间动画使用）
  var shown = { emotion: 0, stress: 0 };

  // ---------- DOM 缓存 ----------
  var ring, valueEl, stressFill, stressNum, summaryEl, hintEl;

  // ---------- 工具 ----------
  function clamp(v, lo, hi) {
    v = Number(v) || 0;
    return Math.max(lo, Math.min(hi, v));
  }

  function escapeText(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  // 从 relationship 字符串提取信任值（与 profile.js.parseTrust 同逻辑）
  function parseTrust(rel) {
    rel = rel || "";
    var m = rel.match(/信任\s*(\d+)/);
    if (m) return parseInt(m[1], 10);
    m = rel.match(/(\d+)\s*\/\s*100/);
    if (m) return parseInt(m[1], 10);
    return 0;
  }

  // 数值补间（ease-in-out），onFrame 每帧接收当前值
  function tween(from, to, duration, onFrame) {
    var start = null;
    function step(ts) {
      if (start === null) start = ts;
      var t = Math.min(1, (ts - start) / duration);
      var e = 0.5 - Math.cos(Math.PI * t) / 2; // ease-in-out
      onFrame(from + (to - from) * e);
      if (t < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  // ---------- 渲染 ----------
  function renderEmotion(v) {
    ring.style.setProperty("--p", v.toFixed(1));
    valueEl.textContent = Math.round(v);
  }

  function renderStress(v) {
    stressFill.style.width = v.toFixed(1) + "%";
    stressNum.textContent = Math.round(v) + " / 100";
  }

  // 构建三行亲密度摘要（仅构建一次）
  function buildRelations() {
    CHARACTERS.forEach(function (c) {
      var row = document.createElement("div");
      row.className = "rel-row" + (c.locked ? " locked" : "");
      row.dataset.id = c.id;
      row.innerHTML =
        '<span class="rel-name">' + escapeText(c.name) + '</span>' +
        '<div class="rel-bar"><div class="rel-fill"></div></div>' +
        '<span class="rel-val">--</span>';
      summaryEl.appendChild(row);
    });
  }

  // 更新三行亲密度（trust: 已解锁角色从后端提取的信任值）
  function renderRelations(trust) {
    CHARACTERS.forEach(function (c) {
      var row = summaryEl.querySelector('.rel-row[data-id="' + c.id + '"]');
      if (!row) return;
      var v = clamp(c.locked ? c.placeholder : (trust || c.placeholder), 0, 100);
      row.querySelector(".rel-fill").style.width = v + "%";
      row.querySelector(".rel-val").textContent = v + "/100";
    });
  }

  function apply(data) {
    tween(shown.emotion, data.emotion, 600, function (v) {
      shown.emotion = v;
      renderEmotion(v);
    });
    tween(shown.stress, data.stress, 600, function (v) {
      shown.stress = v;
      renderStress(v);
    });
    renderRelations(data.trust);
  }

  // ---------- 数据刷新 ----------
  function refresh() {
    return fetch("/api/state")
      .then(function (r) { return r.json(); })
      .then(function (s) {
        if (breathing) return; // 深呼吸动画期间不覆盖数值
        s = s || {};
        var us = s.user_state || {};
        var rel = us.relationship || s.relationship || "";
        apply({
          emotion: clamp(s.emotion, 0, 100),
          stress: us.stress != null ? clamp(us.stress, 0, 100) : 35, // 无数据时占位
          trust: parseTrust(rel)
        });
      })
      .catch(function () { /* 静默失败，等待下次刷新 */ });
  }

  // ---------- 深呼吸重置：数值归零，光晕扩散，2 秒后恢复 ----------
  var HINT_DEFAULT = "";
  function breathReset() {
    if (breathing) return;
    breathing = true;
    ring.classList.add("breathing");
    hintEl.textContent = "深呼吸中……情绪与压力正在归零，光晕扩散";

    tween(shown.emotion, 0, 700, function (v) {
      shown.emotion = v;
      renderEmotion(v);
    });
    tween(shown.stress, 0, 700, function (v) {
      shown.stress = v;
      renderStress(v);
    });

    setTimeout(function () {
      ring.classList.remove("breathing");
      breathing = false;
      hintEl.textContent = HINT_DEFAULT;
      refresh(); // 重新拉取并恢复数值
    }, BREATH_HOLD_MS);
  }

  // ---------- 初始化 ----------
  function init() {
    ring = document.getElementById("observerRing");
    valueEl = document.getElementById("emotionValue");
    stressFill = document.getElementById("stressFill");
    stressNum = document.getElementById("stressNum");
    summaryEl = document.getElementById("relationSummary");
    hintEl = document.getElementById("breathHint");
    if (!ring || !valueEl) return;

    HINT_DEFAULT = hintEl.textContent;
    buildRelations();
    document.getElementById("breathCore").addEventListener("click", breathReset);

    refresh();
    timer = setInterval(refresh, REFRESH_MS);
  }

  window.ObserverPanel = { init: init };

  // 独立页面：脚本置于 body 末尾，直接自动初始化
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();

/* 统一返回逻辑：有同源来源页则回退，否则回主界面（导航闭环） */
window.goBack = function () {
  if (document.referrer && document.referrer.includes(window.location.host)) {
    history.back();
  } else {
    window.location.href = "index.html?skipIntro=1";
  }
};
