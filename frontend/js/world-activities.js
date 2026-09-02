/* 世界动态流：自动滚动室友活动列表 */
(function () {
  "use strict";

  var actsEl = null;
  var items = [];
  var currentIndex = -1;
  var timer = null;
  var updateTimer = null;

  function init() {
    actsEl = document.getElementById("sceneActs");
    if (!actsEl) return;
    actsEl.innerHTML = '<div class="scene-act-wrap" id="sceneActWrap"></div>';
  }

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

    if (activities.length === 0) {
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