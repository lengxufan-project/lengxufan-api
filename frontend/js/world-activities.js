/* 世界动态流：自动滚动室友活动列表 */
(function () {
  "use strict";

  var actsEl = null;
  var items = [];
  var currentIndex = -1;
  var timer = null;
  var updateTimer = null;
  var fetchTimer = null;

  function init() {
    actsEl = document.getElementById("sceneActs");
    if (!actsEl) return;
    actsEl.innerHTML = '<div class="scene-act-wrap" id="sceneActWrap"></div>';
    // 启动事件流定时拉取
    fetchAndUpdate();
    fetchTimer = setInterval(fetchAndUpdate, 10000);
  }

  /* ---------- 核心渲染：将活动列表渲染到 DOM ---------- */
  function renderActivities(activities) {
    if (!actsEl) return;

    if (!activities || activities.length === 0) {
      actsEl.innerHTML = '<div class="scene-act"><span class="who">——</span>室内一片安静</div>';
      stopTimer();
      items = [];
      currentIndex = -1;
      return;
    }

    var newItems = activities.map(function (act) {
      if (act.name && act.action) {
        return '<span class="who">' + (act.name) + '</span>：' + (act.action);
      }
      if (act.sender && act.content) {
        return '<span class="who">' + (act.sender) + '</span>：' + (act.content);
      }
      if (act.character && act.description) {
        return '<span class="who">' + (act.character) + '</span>：' + (act.description);
      }
      if (act.character_name && act.content) {
        return '<span class="who">' + (act.character_name) + '</span>：' + (act.content);
      }
      if (typeof act === "string") return act;
      return '——室内一片安静';
    });

    if (JSON.stringify(newItems) === JSON.stringify(items)) return;

    items = newItems;
    currentIndex = -1;
    stopTimer();

    var wrap = document.createElement("div");
    wrap.className = "scene-act-wrap";
    wrap.id = "sceneActWrap";
    actsEl.innerHTML = "";
    actsEl.appendChild(wrap);

    items.forEach(function (html) {
      var div = document.createElement("div");
      div.className = "scene-act-item";
      div.innerHTML = html;
      wrap.appendChild(div);
    });

    showNext();
    startTimer();
  }

  /* ---------- 从 /api/events?type=activity 拉取动态 ---------- */
  function fetchAndUpdate() {
    if (!window.API || !window.API.getEvents) return;
    window.API.getEvents("activity").then(function (data) {
      if (!data || !data.events || !data.events.length) return;
      // 将事件流数据转为 renderActivities 接受的格式
      var activities = data.events.map(function (ev) {
        return {
          name: ev.character_name || "未知",
          action: ev.content || ""
        };
      });
      renderActivities(activities);
    });
  }

  /* ---------- 兼容旧接口：从 /api/state 对象刷新 ---------- */
  function update(s) {
    if (!actsEl) init();
    if (!actsEl) return;

    var activities = [];
    if (s.dorm_activities && Array.isArray(s.dorm_activities)) {
      activities = s.dorm_activities;
    } else if (s.recent_events && Array.isArray(s.recent_events)) {
      activities = s.recent_events;
    } else if (s.world && s.world.dorm_activities && Array.isArray(s.world.dorm_activities)) {
      activities = s.world.dorm_activities;
    } else if (s.dorm_activities && typeof s.dorm_activities === "object" && !Array.isArray(s.dorm_activities)) {
      var keys = Object.keys(s.dorm_activities);
      activities = keys.map(function (k) {
        return { name: k, action: s.dorm_activities[k] };
      });
    }

    renderActivities(activities);
  }

  function showNext() {
    var wrap = document.getElementById("sceneActWrap");
    if (!wrap) return;
    var allItems = wrap.querySelectorAll(".scene-act-item");
    if (allItems.length === 0) return;

    if (currentIndex >= 0 && allItems[currentIndex]) {
      allItems[currentIndex].classList.remove("active");
      allItems[currentIndex].classList.add("exit");
    }

    currentIndex = (currentIndex + 1) % allItems.length;
    var next = allItems[currentIndex];

    next.classList.remove("exit");
    next.classList.remove("active");
    void next.offsetWidth;
    next.classList.add("active");
  }

  function startTimer() {
    stopTimer();
    if (items.length < 2) return;
    timer = setInterval(showNext, 3800);
  }

  function stopTimer() {
    if (timer) { clearInterval(timer); timer = null; }
  }

  window.WorldActivities = {
    init: init,
    update: update
  };
})();