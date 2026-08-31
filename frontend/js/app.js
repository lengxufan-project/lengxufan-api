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
  var introParticles = document.getElementById("introParticles");
  var introBall = document.getElementById("introBall");
  var floatingBall = document.getElementById("floatingBall");

  // 主界面初始隐藏，过渡时淡入（opacity 0→1，0.8s）；同时挂载侧边栏偏移过渡
  if (app) { app.style.opacity = "0"; app.style.transition = "opacity 0.8s ease-in-out, margin-left 0.3s ease-in-out"; }

  // 动态生成开场粒子：桌面 60 个 / 移动端 25 个（1-3px，冰蓝三色调 + 随机透明度，floatUp 8-12s）
  if (introParticles) {
    var isMobileIntro = window.matchMedia && window.matchMedia("(max-width: 768px)").matches;
    var pCount = isMobileIntro ? 25 : 60;        // 移动端保持较少数量，避免过度增强
    var pTones = ["#58a6ff", "#8ec9ff", "#bfe0ff"];
    for (var i = 0; i < pCount; i++) {
      var p = document.createElement("div");
      p.className = "intro-particle";
      var pSize = 1 + Math.random() * 2;             // 1-3px
      var pOpacity = 0.2 + Math.random() * 0.65;     // 透明度 0.2-0.85，增强层次
      var pDur = 8 + Math.random() * 4;              // 8-12s
      var pDelay = Math.random() * 6;
      p.style.left = (Math.random() * 100) + "%";
      p.style.width = pSize.toFixed(2) + "px";
      p.style.height = pSize.toFixed(2) + "px";
      p.style.background = pTones[i % pTones.length];
      p.style.setProperty("--p-opacity", pOpacity.toFixed(2));
      p.style.animationDuration = pDur.toFixed(1) + "s";
      p.style.animationDelay = pDelay.toFixed(1) + "s";
      introParticles.appendChild(p);
    }
  }

  var introTimers = [];
  function clearIntroTimers() { introTimers.forEach(clearTimeout); introTimers = []; }

  // URL 参数 skipIntro=1：跳过开场动画直接进入主界面
  var params = new URLSearchParams(window.location.search);
  var skipIntro = params.get("skipIntro") === "1";

  // 结束开场动画（"跳过"按钮与 skipIntro 参数共用）
  function endIntro() {
    clearIntroTimers();
    if (app) app.style.opacity = "1";
    if (intro) {
      intro.classList.add("hide"); intro.style.display = "none";
      // 清理可能残留的拖尾球
      var trails = intro.querySelectorAll(".intro-trail");
      for (var i = 0; i < trails.length; i++) {
        if (trails[i].parentNode) trails[i].parentNode.removeChild(trails[i]);
      }
    }
    if (floatingBall) {
      floatingBall.style.transition = "none";
      floatingBall.style.opacity = "1";
      requestAnimationFrame(function () { floatingBall.style.transition = ""; });
    }
  }

  if (skipIntro) {
    // 直接显示主界面
    endIntro();
  } else {
    // 0ms：光点已显示（CSS 初始 scale 1 opacity 0.3）
    // 1000ms：光球膨胀 + 环状波纹
    introTimers.push(setTimeout(function () {
      if (introBall) introBall.classList.add("expand");
    }, 1000));
    // 2500ms：光球爆发 + 粒子散落 + 8 向放射光线（"世界入口"文字由 CSS 2s 延迟自动出现）
    introTimers.push(setTimeout(function () {
      if (introBall) introBall.classList.add("burst");
      if (introParticles) introParticles.classList.add("scatter");
      if (intro) intro.classList.add("burst-rays");
    }, 2500));
    // 3500ms：整体淡出，光球缩小至右下角（带 3 球拖尾），主界面淡入
    introTimers.push(setTimeout(function () {
      if (introBall) introBall.classList.add("shrink-to-corner");
      if (intro) intro.classList.add("transparent");
      var introGlow = document.getElementById("introGlow");
      var introText = document.getElementById("introText");
      if (introGlow) introGlow.classList.add("fade-out");
      if (introText) introText.classList.add("fade-out");
      if (app) app.style.opacity = "1";
      // 拖尾：3 个渐小球体沿收缩路径（视口中心 → 右下角悬浮球）依次消散
      if (intro) {
        var isMobileTrail = window.matchMedia && window.matchMedia("(max-width: 768px)").matches;
        var vw2 = window.innerWidth, vh2 = window.innerHeight;
        var sx = vw2 / 2, sy = vh2 / 2;               // 起点：视口中心
        var ex = vw2 - 44, ey = vh2 - 44;             // 终点：悬浮球中心（近似）
        var trailSizes = isMobileTrail ? [10, 7, 5] : [14, 10, 7];
        for (var t = 0; t < 3; t++) {
          (function (idx) {
            var trail = document.createElement("div");
            trail.className = "intro-trail";
            var frac = 0.3 + idx * 0.25;              // 路径 30% / 55% / 80% 处
            trail.style.left = (sx + (ex - sx) * frac) + "px";
            trail.style.top = (sy + (ey - sy) * frac) + "px";
            trail.style.width = trailSizes[idx] + "px";
            trail.style.height = trailSizes[idx] + "px";
            trail.style.animationDelay = (idx * 0.1) + "s";   // 0.3s 内依次消失
            intro.appendChild(trail);
            setTimeout(function () {
              if (trail.parentNode) trail.parentNode.removeChild(trail);
            }, 900);
          })(t);
        }
      }
    }, 3500));
    // 4000ms：移除 #intro，悬浮球接替
    introTimers.push(setTimeout(function () {
      if (intro) { intro.classList.add("hide"); intro.style.display = "none"; }
      if (floatingBall) {
        floatingBall.style.transition = "none";
        floatingBall.style.opacity = "1";
        requestAnimationFrame(function () { floatingBall.style.transition = ""; });
      }
    }, 4000));
  }

  // 跳过：立即结束动画并显示主界面
  if (introSkip) introSkip.addEventListener("click", endIntro);

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
  // 首次数据返回前显示骨架屏
  var skeletonVisible = true;

  function refreshState() {
    if (!window.API || !window.API.getState) return;
    window.API.getState().then(function (s) {
      if (!s) return;
      // 首次数据返回：移除 .chat / .statusbar / .scene 骨架
      if (skeletonVisible) {
        skeletonVisible = false;
        if (window.Skeleton) {
          window.Skeleton.hide(".chat");
          window.Skeleton.hide(".statusbar");
          window.Skeleton.hide(".scene");
        }
      }
      if (window.Scene && window.Scene.update) window.Scene.update(s);
      if (window.UI && window.UI.updateState) window.UI.updateState(s);
      if (window.WorldClock && s.world) window.WorldClock.update(s.world.time_of_day, s.world.day);
      // 时段氛围光：依据 world.time_of_day 切换场景光晕
      if (window.TimeLighting && s.world) window.TimeLighting.update(s.world.time_of_day);
      // 天气特效：依据 world.weather 切换晴 / 雨 / 雪 / 阴 / 风
      if (window.WeatherEffects && s.world) window.WeatherEffects.update(s.world.weather);
      // 侧边栏底部：时间 / 天气（与 WorldClock / WeatherEffects 同源数据）
      if (s.world) {
        var sbTime = document.getElementById("sidebarTime");
        var sbWeather = document.getElementById("sidebarWeather");
        if (sbTime) sbTime.textContent = "第 " + (s.world.day != null ? s.world.day : "--") + " 天 · " + (s.world.time_of_day || "--");
        if (sbWeather) sbWeather.textContent = s.world.weather || "--";
      }
      if (window.EmotionChart) {
        // 记录情绪历史
        if (!window._emotionHistory) window._emotionHistory = [];
        var now = new Date();
        var timeStr = ("0" + now.getHours()).slice(-2) + ":" + ("0" + now.getMinutes()).slice(-2);
        window._emotionHistory.push({ time: timeStr, value: Number(s.emotion) || 0 });
        if (window._emotionHistory.length > 20) window._emotionHistory.shift();
        window.EmotionChart.update(window._emotionHistory);
      }
      // 情绪粒子：依据情绪值调整颜色 / 速度 / 方向 / 密度
      if (window.EmotionParticles) window.EmotionParticles.update(s.emotion);
    }).catch(function () { /* 静默失败 */ });
  }

  // ---------- 初始化 ----------
  function init() {
    // 初始化各模块
    if (window.Characters && window.Characters.load) window.Characters.load();
    if (window.Scene && window.Scene.init) window.Scene.init();
    if (window.EmotionChart) window.EmotionChart.init("emotionChart");
    if (window.WorldClock) window.WorldClock.init();
    if (window.ChoiceBranch) window.ChoiceBranch.init();
    if (window.EmotionParticles) window.EmotionParticles.init();
    if (window.TimeLighting) window.TimeLighting.init();
    if (window.WeatherEffects) window.WeatherEffects.init();
    if (window.AchievementCard) window.AchievementCard.init();
    if (window.NotificationCenter) window.NotificationCenter.init();
    if (window.SearchPanel) window.SearchPanel.init();
    if (window.ShortcutsPanel) window.ShortcutsPanel.init();

    // 首次加载 3 秒后显示首个成就（占位，后续接入后端）
    if (window.AchievementCard && window.AchievementCard.show) {
      setTimeout(function () {
        window.AchievementCard.show("初见", "你第一次踏入 307 室");
      }, 3000);
    }

    // 初始消息
    if (window.UI && window.UI.addMessage) {
      window.UI.addMessage("……（他靠在窗边，目光淡淡地落过来）", "ai");
    }

    // 页面初始骨架：数据返回后由 refreshState 移除
    if (window.Skeleton) {
      window.Skeleton.show(".chat");
      window.Skeleton.show(".statusbar");
      window.Skeleton.show(".scene");
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

  // ---------- 侧边栏 ----------
  var sidebar = document.getElementById("sidebar");
  var sidebarToggle = document.getElementById("sidebarToggle");
  if (sidebar && sidebarToggle) {
    sidebarToggle.addEventListener("click", function () {
      // 移动端切换 .open（滑出 / 收起），桌面端切换 .collapsed（220px / 50px）
      var isMobile = window.matchMedia && window.matchMedia("(max-width: 768px)").matches;
      if (isMobile) sidebar.classList.toggle("open");
      else sidebar.classList.toggle("collapsed");
    });
  }

  // 当前页高亮：依据 pathname 匹配对应 .nav-link
  (function highlightSidebar() {
    var links = document.querySelectorAll("#sidebar .nav-link");
    if (!links.length) return;
    var current = window.location.pathname.replace(/\/+$/, "") || "/";
    var onIndex = current === "/" || current.indexOf("index.html") !== -1;
    var matched = false;
    Array.prototype.forEach.call(links, function (a) {
      a.classList.remove("active");
      try {
        var path = new URL(a.href).pathname.replace(/\/+$/, "") || "/";
        var isIndexLink = path.indexOf("index.html") !== -1;
        if ((onIndex && isIndexLink) || (!onIndex && path === current)) {
          a.classList.add("active");
          matched = true;
        }
      } catch (err) { /* href 解析失败则跳过 */ }
    });
    if (!matched) links[0].classList.add("active");   // 兜底：世界入口
  })();

  // 启动
  init();
})();
