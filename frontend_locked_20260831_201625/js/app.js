/* 主入口：初始化所有模块、开场动画、定时刷新、事件绑定 */
(function () {
  "use strict";

  var intro = document.getElementById("intro");
  var introSkip = document.getElementById("introSkip");
  var app = document.getElementById("app");
  var inputEl = document.getElementById("input");
  var sendBtn = document.getElementById("send");
  var groupToggle = document.getElementById("groupToggle");
  var chatEl = document.getElementById("chat");

  // ---------- 开场动画 ----------
  var introTimer = setTimeout(function () {
    if (intro) {
      intro.classList.add("hide");
      app.classList.add("show");
      setTimeout(function () { intro.style.display = "none"; }, 600);
    }
  }, 2500);
  if (introSkip) introSkip.addEventListener("click", function () {
    clearTimeout(introTimer);
    intro.classList.add("hide");
    app.classList.add("show");
    setTimeout(function () { intro.style.display = "none"; }, 600);
  });

  // ---------- 全局粒子 ----------
  (function initGlobalParticles() {
    var container = document.getElementById("globalParticles");
    if (!container) return;
    var isMobile = window.matchMedia && window.matchMedia("(max-width: 768px)").matches;
    var count = isMobile ? 15 : 30;
    for (var i = 0; i < count; i++) {
      var p = document.createElement("div");
      p.className = "global-particle";
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
    }
  })();

  // ---------- 状态刷新 ----------
  function refreshState() {
    if (!window.API || !window.API.getState) return;
    window.API.getState().then(function (s) {
      if (!s) return;
      if (window.Scene && window.Scene.update) window.Scene.update(s);
      if (window.UI && window.UI.updateState) window.UI.updateState(s);
      if (window.WorldClock && s.world) window.WorldClock.update(s.world.time_of_day, s.world.day);
      if (window.EmotionChart) {
        // 记录情绪历史
        if (!window._emotionHistory) window._emotionHistory = [];
        var now = new Date();
        var timeStr = ("0" + now.getHours()).slice(-2) + ":" + ("0" + now.getMinutes()).slice(-2);
        window._emotionHistory.push({ time: timeStr, value: Number(s.emotion) || 0 });
        if (window._emotionHistory.length > 20) window._emotionHistory.shift();
        window.EmotionChart.update(window._emotionHistory);
      }
    }).catch(function () { /* 静默失败 */ });
  }

  // ---------- 初始化 ----------
  function init() {
    // 初始化各模块
    if (window.Characters && window.Characters.load) window.Characters.load();
    if (window.Scene && window.Scene.init) window.Scene.init();
    if (window.EmotionChart) window.EmotionChart.init("emotionChart");
    if (window.WorldClock) window.WorldClock.init();

    // 初始消息
    if (window.UI && window.UI.addMessage) {
      window.UI.addMessage("……（他靠在窗边，目光淡淡地落过来）", "ai");
    }

    refreshState();
    setInterval(refreshState, 2000);
  }

  // ---------- 事件绑定 ----------
  if (sendBtn && inputEl) {
    sendBtn.addEventListener("click", function () {
      if (window.Chat && window.Chat.send) window.Chat.send();
    });
    inputEl.addEventListener("keydown", function (e) {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        if (window.Chat && window.Chat.send) window.Chat.send();
      }
    });
  }
  if (groupToggle) {
    groupToggle.addEventListener("click", function () {
      if (window.Chat && window.Chat.toggleGroup) window.Chat.toggleGroup();
    });
  }

  // 启动
  init();
})();
