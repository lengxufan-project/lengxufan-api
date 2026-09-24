/* ============ 设置页 ============ */
/* 读写 localStorage("lxf_world_settings")，恢复 / 实时保存用户偏好 */
(function () {
  "use strict";

  var STORAGE_KEY = "lxf_world_settings";
  var DEFAULTS = {
    accentColor: "#58a6ff",
    particleDensity: 50,
    animations: true,
    fontSize: "medium",
    worldClock: true,
    eventLog: true
  };
  var settings = loadSettings();

  // ---------- 持久化 ----------
  function loadSettings() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return Object.assign({}, DEFAULTS);
      var parsed = JSON.parse(raw);
      return Object.assign({}, DEFAULTS, parsed);
    } catch (e) {
      return Object.assign({}, DEFAULTS);
    }
  }
  function saveSettings() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(settings)); } catch (e) {}
  }

  // ---------- 应用设置到 DOM ----------
  function applyAccentColor() {
    document.documentElement.style.setProperty("--accent-color", settings.accentColor);
  }
  function applyAnimations() {
    if (settings.animations) {
      document.body.removeAttribute("data-animations");
    } else {
      document.body.setAttribute("data-animations", "off");
    }
  }
  function applyFontSize() {
    document.body.setAttribute("data-font-size", settings.fontSize);
  }

  /* 粒子密度：调整 #globalParticles 的粒子数量
     设置页是独立页面，#globalParticles 可能不存在；
     数量被写入 localStorage，主界面（index.html）加载时若实现同步可读取。
     这里尝试操作实际存在的容器，缺失则静默。 */
  function applyParticleDensity() {
    var container = document.getElementById("globalParticles");
    if (!container) return;
    var desired = Math.round(settings.particleDensity * 0.4); // 0-100 -> 0-40
    var current = container.querySelectorAll(".global-particle, .emotion-particle").length;
    // 增加粒子
    while (current < desired) {
      var p = document.createElement("div");
      var cls = "global-particle";
      p.className = cls;
      var size = 1 + Math.random() * 2;
      var opacity = 0.2 + Math.random() * 0.3;
      var duration = 8 + Math.random() * 7;
      var delay = Math.random() * 5;
      p.style.left = (Math.random() * 100) + "%";
      p.style.top = (Math.random() * 100) + "%";
      p.style.width = size + "px";
      p.style.height = size + "px";
      p.style.opacity = opacity;
      p.style.setProperty("--p-opacity", opacity.toFixed(2));
      p.style.animationDuration = duration.toFixed(1) + "s";
      p.style.animationDelay = delay.toFixed(1) + "s";
      container.appendChild(p);
      current++;
    }
    // 减少粒子
    while (current > desired) {
      var last = container.lastElementChild;
      if (!last) break;
      container.removeChild(last);
      current--;
    }
  }

  function applyAll() {
    applyAccentColor();
    applyAnimations();
    applyFontSize();
    applyParticleDensity();
  }

  // ---------- 渲染 UI 状态 ----------
  function renderSwatch() {
    var swatches = document.querySelectorAll(".swatch");
    swatches.forEach(function (s) {
      s.classList.toggle("active", s.getAttribute("data-color") === settings.accentColor);
    });
  }
  function renderParticleRange() {
    var range = document.getElementById("particleRange");
    var val = document.getElementById("particleValue");
    if (range) range.value = settings.particleDensity;
    if (val) val.textContent = settings.particleDensity;
    updateRangeFill();
  }
  function updateRangeFill() {
    var range = document.getElementById("particleRange");
    if (!range) return;
    var pct = ((range.value - range.min) / (range.max - range.min)) * 100;
    range.style.setProperty("--fill", pct + "%");
  }
  function renderToggle(id, value) {
    var el = document.getElementById(id);
    if (el) el.setAttribute("aria-pressed", value ? "true" : "false");
  }
  function renderFontSeg() {
    var segs = document.querySelectorAll(".seg");
    segs.forEach(function (s) {
      s.classList.toggle("active", s.getAttribute("data-size") === settings.fontSize);
    });
  }
  function renderAll() {
    renderSwatch();
    renderParticleRange();
    renderToggle("animToggle", settings.animations);
    renderToggle("clockToggle", settings.worldClock);
    renderToggle("logToggle", settings.eventLog);
    renderFontSeg();
  }

  // ---------- 事件绑定 ----------
  function bindEvents() {
    // 返回按钮
    var back = document.getElementById("backBtn");
    if (back) back.addEventListener("click", function () {
      window.goBack();
    });

    // 主题色
    var swatchRow = document.getElementById("swatchRow");
    if (swatchRow) swatchRow.addEventListener("click", function (e) {
      var t = e.target.closest(".swatch");
      if (!t) return;
      settings.accentColor = t.getAttribute("data-color");
      saveSettings(); applyAccentColor(); renderSwatch();
    });

    // 粒子密度
    var range = document.getElementById("particleRange");
    if (range) range.addEventListener("input", function () {
      settings.particleDensity = Number(range.value);
      document.getElementById("particleValue").textContent = settings.particleDensity;
      updateRangeFill();
      saveSettings(); applyParticleDensity();
    });

    // 动画开关
    bindToggle("animToggle", function (v) {
      settings.animations = v; saveSettings(); applyAnimations();
    });
    // 世界时钟
    bindToggle("clockToggle", function (v) {
      settings.worldClock = v; saveSettings();
    });
    // 事件日志
    bindToggle("logToggle", function (v) {
      settings.eventLog = v; saveSettings();
    });

    // 字体大小
    var fontSeg = document.getElementById("fontSeg");
    if (fontSeg) fontSeg.addEventListener("click", function (e) {
      var t = e.target.closest(".seg");
      if (!t) return;
      settings.fontSize = t.getAttribute("data-size");
      saveSettings(); applyFontSize(); renderFontSeg();
    });

    // 重置
    var reset = document.getElementById("resetBtn");
    if (reset) reset.addEventListener("click", function () {
      try { localStorage.removeItem(STORAGE_KEY); } catch (e) {}
      settings = Object.assign({}, DEFAULTS);
      applyAll(); renderAll();
    });
  }

  function bindToggle(id, cb) {
    var el = document.getElementById(id);
    if (!el) return;
    el.addEventListener("click", function () {
      var pressed = el.getAttribute("aria-pressed") === "true";
      var next = !pressed;
      el.setAttribute("aria-pressed", next ? "true" : "false");
      cb(next);
    });
  }

  // ---------- 启动 ----------
  function init() {
    applyAll();
    renderAll();
    bindEvents();
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  // 暴露：供主界面在加载时读取并应用同一份设置（可选集成）
  window.WorldSettings = {
    get: function () { return Object.assign({}, settings); },
    apply: applyAll
  };
})();

/* 统一返回逻辑：有同源来源页则回退，否则回主界面（导航闭环） */
window.goBack = function () {
  if (document.referrer && document.referrer.includes(window.location.host)) {
    history.back();
  } else {
    window.location.href = "index.html?skipIntro=1";
  }
};
