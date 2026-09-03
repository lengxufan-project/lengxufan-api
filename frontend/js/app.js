/* 主入口：协调各模块初始化 + 启动定时刷新 */
(function () {
  "use strict";

  /* ========== 角色权限初始化 ========== */
  function initRole() {
    var role = localStorage.getItem("lxf_user_role");
    if (role) {
      document.body.setAttribute("data-role", role);
      return;
    }
    // 未登录/无缓存，请求 /api/auth/me
    fetch("/api/auth/me")
      .then(function (r) { return r.json(); })
      .then(function (data) {
        if (data && data.role) {
          localStorage.setItem("lxf_user_role", data.role);
          document.body.setAttribute("data-role", data.role);
        } else {
          document.body.setAttribute("data-role", "guest");
        }
      })
      .catch(function () {
        document.body.setAttribute("data-role", "guest");
      });
  }

  // 暴露全局角色检查工具，供独立页面调用
  window.RoleGuard = {
    getRole: function () {
      return localStorage.getItem("lxf_user_role") || "guest";
    },
    isDeveloper: function () {
      return window.RoleGuard.getRole() === "developer";
    },
    redirectUnlessDeveloper: function () {
      if (!window.RoleGuard.isDeveloper()) {
        window.location.href = "index.html?skipIntro=1";
      }
    }
  };

  /* ========== 角色选择器（全屏角色列表） ========== */
  function initCharSelector() {
    var btn = document.getElementById("viewAllCharsBtn");
    var selector = document.getElementById("charSelector");
    var back = document.getElementById("charSelectorBack");
    var grid = document.getElementById("charSelectorGrid");
    var search = document.getElementById("charSelectorSearch");
    var empty = document.getElementById("charSelectorEmpty");
    if (!btn || !selector || !grid) return;

    /* 角色数据 */
    var CHARS_LIST = [
      { id: "lengxufan",    name: "冷旭帆", emotion: "稍好" },
      { id: "huangjingyun", name: "黄景云", emotion: "平静" },
      { id: "yeqingci",     name: "叶清辞", emotion: "低落" }
    ];

    /* 情绪标签样式映射 */
    var EMOTION_STYLES = {
      "稍好": { bg: "rgba(46,204,113,0.12)", border: "rgba(46,204,113,0.3)", color: "#7ddfa0" },
      "平静": { bg: "rgba(88,166,255,0.12)", border: "rgba(88,166,255,0.3)", color: "#7db8ff" },
      "低落": { bg: "rgba(155,100,200,0.12)", border: "rgba(155,100,200,0.3)", color: "#b88dda" }
    };

    function renderGrid(filter) {
      grid.innerHTML = "";
      var filtered = CHARS_LIST;
      if (filter && filter.trim()) {
        var q = filter.trim().toLowerCase();
        filtered = CHARS_LIST.filter(function (c) {
          return c.name.toLowerCase().indexOf(q) !== -1;
        });
      }
      if (filtered.length === 0) {
        empty.classList.add("show");
        return;
      }
      empty.classList.remove("show");
      filtered.forEach(function (c) {
        var card = document.createElement("div");
        card.className = "cs-card";
        card.setAttribute("data-char", c.id);

        var dot = document.createElement("div");
        dot.className = "cs-card-dot";
        card.appendChild(dot);

        var name = document.createElement("div");
        name.className = "cs-card-name";
        name.textContent = c.name;
        card.appendChild(name);

        var emotion = c.emotion || "--";
        var es = EMOTION_STYLES[emotion] || { bg: "rgba(255,255,255,0.05)", border: "rgba(255,255,255,0.08)", color: "#8fa0c0" };
        var el = document.createElement("span");
        el.className = "cs-card-emotion";
        el.textContent = emotion;
        el.style.cssText = "background:" + es.bg + ";border-color:" + es.border + ";color:" + es.color;
        card.appendChild(el);

        card.addEventListener("click", function () {
          window.location.href = "chat.html?char=" + encodeURIComponent(c.id);
        });
        grid.appendChild(card);
      });
    }

    /* 打开 */
    btn.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();
      selector.classList.add("open");
      renderGrid("");
      if (search) {
        search.value = "";
        search.focus();
      }
    });

    /* 返回关闭 */
    if (back) {
      back.addEventListener("click", function () {
        selector.classList.remove("open");
      });
    }

    /* 点击遮罩关闭 */
    var mask = selector.querySelector(".char-selector-mask");
    if (mask) {
      mask.addEventListener("click", function () {
        selector.classList.remove("open");
      });
    }

    /* ESC 关闭 */
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && selector.classList.contains("open")) {
        selector.classList.remove("open");
      }
    });

    /* 搜索过滤 */
    if (search) {
      search.addEventListener("input", function () {
        renderGrid(search.value);
      });
    }
  }

  function init() {
    initRole();
    // 各模块依次初始化
    if (window.Intro && window.Intro.init) window.Intro.init();
    if (window.Particles && window.Particles.init) window.Particles.init();
    if (window.Rail && window.Rail.init) window.Rail.init();
    if (window.Sidebar && window.Sidebar.init) window.Sidebar.init();
    if (window.Notifications && window.Notifications.init) window.Notifications.init();

    // 初始化其他保留模块
    if (window.Scene && window.Scene.init) window.Scene.init();
    if (window.WorldClock && window.WorldClock.init) window.WorldClock.init();
    if (window.EmotionParticles && window.EmotionParticles.init) window.EmotionParticles.init();
    if (window.TimeLighting && window.TimeLighting.init) window.TimeLighting.init();
    if (window.WeatherEffects && window.WeatherEffects.init) window.WeatherEffects.init();
    if (window.SearchPanel && window.SearchPanel.init) window.SearchPanel.init();
    if (window.WorldActivities && window.WorldActivities.init) window.WorldActivities.init();
    // 初始化世界模块（角色列表 + 首次刷新）
    if (window.World && window.World.init) window.World.init();

    // 初始化角色选择器
    initCharSelector();

    // 定时刷新世界状态（每 2 秒）
    if (window.World && window.World.refresh) {
      setInterval(window.World.refresh, 2000);
    }
  }

  // DOM 就绪后启动
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();