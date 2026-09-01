/* 主入口：初始化所有模块、开场动画、定时刷新、事件绑定 */
(function () {
  "use strict";

  var intro = document.getElementById("intro");
  var introEnter = document.getElementById("introEnter");

  // ---------- 开场动画（非对称电影感构图：左侧文字 / 右下光球） ----------
  var introParticlesBg = document.getElementById("introParticlesBg");
  var introParticlesMid = document.getElementById("introParticlesMid");
  var introParticlesFront = document.getElementById("introParticlesFront");
  var introTitle = document.getElementById("introTitle");
  var floatingBall = document.getElementById("floatingBall");

  // 标题逐字拆分：每个字符一个 .ch，CSS 按 --d 延迟依次显现（打字机/遮罩效果）
  if (introTitle) {
    var chars = introTitle.textContent.split("");
    var frag = document.createDocumentFragment();
    for (var c = 0; c < chars.length; c++) {
      var ch = document.createElement("span");
      ch.className = "ch";
      ch.textContent = chars[c] === " " ? "\u00A0" : chars[c];
      ch.style.setProperty("--d", (c * 0.12).toFixed(2) + "s");
      frag.appendChild(ch);
    }
    introTitle.textContent = "";
    introTitle.appendChild(frag);
  }

  // 动态生成三层粒子（颜色统一冰蓝 rgba(88,166,255,0.4-0.7)）
  function iceBlue(p) {
    p.style.background = "rgba(88,166,255," + (0.4 + Math.random() * 0.3).toFixed(2) + ")";
  }
  function spawnParticles(container, count, make) {
    if (!container) return;
    for (var i = 0; i < count; i++) {
      var p = document.createElement("div");
      p.className = "ip";
      make(p);
      container.appendChild(p);
    }
  }

  // 背景层：30 个 1px，随机分布，静止或极慢漂移
  spawnParticles(introParticlesBg, 30, function (p) {
    p.style.width = "1px"; p.style.height = "1px";
    p.style.left = (Math.random() * 100).toFixed(1) + "%";
    p.style.top = (Math.random() * 100).toFixed(1) + "%";
    iceBlue(p);
    p.style.setProperty("--dx", ((Math.random() - 0.5) * 16).toFixed(1) + "px");
    p.style.setProperty("--dy", ((Math.random() - 0.5) * 20).toFixed(1) + "px");
    p.style.animationDuration = (24 + Math.random() * 20).toFixed(1) + "s";
    p.style.animationDelay = (Math.random() * 4).toFixed(1) + "s";
  });

  // 中景层：15 个 2px，从屏幕左下角向右上角缓缓移动
  spawnParticles(introParticlesMid, 15, function (p) {
    p.style.width = "2px"; p.style.height = "2px";
    p.style.left = (-5 + Math.random() * 30).toFixed(1) + "%";
    p.style.top = (60 + Math.random() * 45).toFixed(1) + "%";
    iceBlue(p);
    p.style.animationDuration = (12 + Math.random() * 8).toFixed(1) + "s";
    p.style.animationDelay = (Math.random() * 5).toFixed(1) + "s";
  });

  // 前景层：8 个 3-4px（blur 2px），从屏幕右侧缓慢飘入
  spawnParticles(introParticlesFront, 8, function (p) {
    var size = (3 + Math.random()).toFixed(1);
    p.style.width = size + "px"; p.style.height = size + "px";
    p.style.filter = "blur(2px)";
    p.style.left = (100 + Math.random() * 12).toFixed(1) + "%";
    p.style.top = (8 + Math.random() * 84).toFixed(1) + "%";
    iceBlue(p);
    p.style.setProperty("--dy", ((Math.random() - 0.5) * 140).toFixed(0) + "px");
    p.style.animationDuration = (16 + Math.random() * 10).toFixed(1) + "s";
    p.style.animationDelay = (Math.random() * 6).toFixed(1) + "s";
  });

  var introTimers = [];
  function scheduleIntro(fn, ms) { introTimers.push(setTimeout(fn, ms)); }
  function clearIntroTimers() { introTimers.forEach(clearTimeout); introTimers = []; }

  // URL 参数 skipIntro=1：跳过开场动画直接进入主界面（独立页返回链路使用）
  var params = new URLSearchParams(window.location.search);
  var skipIntro = params.get("skipIntro") === "1";

  // 立即结束开场动画（skipIntro 参数路径使用，无过渡）
  function endIntro() {
    clearIntroTimers();
    if (intro) { intro.classList.add("hide"); intro.style.display = "none"; }
    showFloatingBall();
  }

  // 悬浮球浮现（开场动画结束后接替）
  function showFloatingBall() {
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
    // 时间线（总 4s；用户必须点击"进入世界"按钮才进入主界面，不自动进入）
    // 0-1s：三层粒子渐显（CSS layerIn 自带 1s 淡入）
    // 0.6s：光点出现
    scheduleIntro(function () { if (intro) intro.classList.add("dot-in"); }, 600);
    // 1-2.2s：光点膨胀为 60px 光球并开始呼吸，环状波纹向外扩散
    scheduleIntro(function () { if (intro) intro.classList.add("orb-in"); }, 1000);
    // 1.2-2.4s：标题逐字渐显（遮罩效果）
    scheduleIntro(function () { if (intro) intro.classList.add("title-in"); }, 1200);
    // 2.5-3.5s："世界正在苏醒"淡入，光球稳定呼吸
    scheduleIntro(function () { if (intro) intro.classList.add("sub-in"); }, 2500);
    // 3.5s 起：右下角"进入世界"按钮浮现
    scheduleIntro(function () { if (intro) intro.classList.add("enter-in"); }, 3500);
  }

  // 点击"进入世界"：光球爆发（8 向放射光线）→ 整体淡出 → 主界面淡入
  if (introEnter) {
    introEnter.addEventListener("click", function () {
      if (!intro || intro.classList.contains("leaving")) return;
      clearIntroTimers();
      intro.classList.add("leaving", "burst-rays");
      // 600ms 后整体淡出，悬浮球接替；淡出完成后隐藏 #intro
      scheduleIntro(function () {
        if (intro) intro.classList.add("transparent");
        showFloatingBall();
        scheduleIntro(function () {
          if (intro) { intro.classList.add("hide"); intro.style.display = "none"; }
        }, 750);
      }, 600);
    });
  }

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

  // ---------- 状态刷新（世界观察中心：场景 / 时段 / 天气 / 粒子） ----------
  function refreshState() {
    if (!window.API || !window.API.getState) return;
    window.API.getState().then(function (s) {
      if (!s) return;
      if (window.Scene && window.Scene.update) window.Scene.update(s);
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
      // 情绪粒子：依据情绪值调整颜色 / 速度 / 方向 / 密度
      if (window.EmotionParticles) window.EmotionParticles.update(s.emotion);
    }).catch(function () { /* 静默失败 */ });
  }

  // ---------- 初始化 ----------
  function init() {
    // 初始化保留模块（场景 / 时钟 / 时段光 / 粒子 / 天气）
    if (window.Scene && window.Scene.init) window.Scene.init();
    if (window.WorldClock) window.WorldClock.init();
    if (window.EmotionParticles) window.EmotionParticles.init();
    if (window.TimeLighting) window.TimeLighting.init();
    if (window.WeatherEffects) window.WeatherEffects.init();
    if (window.SearchPanel) window.SearchPanel.init();   // 全局搜索面板（侧边栏入口 / Ctrl+K）

    renderActiveCharacters();   // 活跃角色快捷区（动态加载，静态回退）
    refreshState();
    setInterval(refreshState, 2000);
  }

  // ---------- 侧边栏 ----------
  var sidebar = document.getElementById("sidebar");
  var sidebarToggle = document.getElementById("sidebarToggle");
  var sidebarMask = document.getElementById("sidebarMask");
  if (sidebar && sidebarToggle) {
    sidebarToggle.addEventListener("click", function () {
      // 移动端切换 .open（滑出 / 收起），桌面端切换 .collapsed（220px / 50px）
      var isMobile = window.matchMedia && window.matchMedia("(max-width: 768px)").matches;
      if (isMobile) {
        var willOpen = !sidebar.classList.contains("open");
        sidebar.classList.toggle("open");
        if (sidebarMask) sidebarMask.classList.toggle("show", willOpen);
      } else {
        sidebar.classList.toggle("collapsed");
      }
    });
  }

  // 移动端遮罩点击关闭侧边栏
  if (sidebarMask && sidebar) {
    sidebarMask.addEventListener("click", function () {
      sidebar.classList.remove("open");
      sidebarMask.classList.remove("show");
    });
  }

  // 搜索入口：唤起全局搜索面板（模块存在才绑定）
  var searchTrigger = document.getElementById("searchTrigger");
  if (searchTrigger) {
    searchTrigger.addEventListener("click", function () {
      if (window.SearchPanel && window.SearchPanel.open) window.SearchPanel.open();
    });
  }

  // ---------- 通知抽屉（侧边栏右上角铃铛图标） ----------
  var sidebarNotify = document.getElementById("sidebarNotify");
  var notifyDrawer = document.getElementById("notifyDrawer");
  var notifyClose = document.getElementById("notifyClose");
  if (sidebarNotify && notifyDrawer) {
    sidebarNotify.addEventListener("click", function (e) {
      e.stopPropagation();
      notifyDrawer.classList.toggle("open");
    });
  }
  if (notifyClose && notifyDrawer) {
    notifyClose.addEventListener("click", function () {
      notifyDrawer.classList.remove("open");
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

  // ---------- 活跃角色快捷区（最多 3 个，支持未来 100+ 角色扩展） ----------
  // 数据来源优先级：API.getActiveCharacters() → HTML 静态回退（冷旭帆 / 黄景云 / 叶清辞）
  // 角色对象约定：{ id: string, name: string }
  // 当前角色高亮：依据 URL ?char= 参数标记 .char-link.current（冰蓝边框 + 发光）
  function highlightCurrentChar() {
    var p = new URLSearchParams(window.location.search);
    var charId = p.get("char");
    if (!charId) return;
    var links = document.querySelectorAll("#sidebarCharacters .char-link[data-char-id]");
    Array.prototype.forEach.call(links, function (a) {
      if (a.getAttribute("data-char-id") === charId) a.classList.add("current");
    });
  }
  function renderActiveCharacters() {
    var container = document.getElementById("sidebarCharacters");
    if (!container) return;
    if (!window.API || typeof window.API.getActiveCharacters !== "function") {
      highlightCurrentChar();   // 静态回退路径
      return;
    }
    window.API.getActiveCharacters().then(function (chars) {
      if (!chars || !chars.length) { highlightCurrentChar(); return; }   // 失败回退
      var allLink = container.querySelector(".char-link.all");
      // 清空现有角色链接（保留标题与 .all 链接）
      Array.prototype.forEach.call(container.querySelectorAll(".char-link:not(.all)"), function (el) {
        el.remove();
      });
      // 最多渲染 3 个
      chars.slice(0, 3).forEach(function (c) {
        var a = document.createElement("a");
        a.href = "chat.html?char=" + encodeURIComponent(c.id || c.key || "");
        a.className = "char-link";
        a.setAttribute("data-char-id", c.id || c.key || "");
        var avatar = document.createElement("div");
        avatar.className = "char-avatar";
        avatar.textContent = (c.name || c.id || "?").slice(0, 1);
        var span = document.createElement("span");
        span.className = "char-name";
        span.textContent = c.name || c.id;
        a.appendChild(avatar);
        a.appendChild(span);
        if (allLink && allLink.parentNode) {
          allLink.parentNode.insertBefore(a, allLink);
        } else {
          container.appendChild(a);
        }
      });
      highlightCurrentChar();   // 动态渲染后高亮
    }).catch(function () { highlightCurrentChar(); /* 静默回退到静态 HTML */ });
  }

  // 启动
  init();
})();
