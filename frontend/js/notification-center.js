/* ============================================================
   通知中心抽屉（右侧滑入 · 磨砂玻璃）
   - 不接管 sidebarNotify / notifyClose 的 click 事件（已由 app.js 处理）
   - 通过 MutationObserver 监听抽屉 .open class 变化，同步遮罩显隐
   - 管理通知数据（近况 / 系统两个分区）、渲染列表、标记已读、触发按钮红点
   - 支持：全部标为已读 / 点击遮罩关闭 / ESC 关闭
   - 数据来源：近况从 /api/state 的 dorm_activities / recent_events 刷新
   - 系统通知由其他模块通过 addSystemNotification 添加
   ============================================================ */
(function () {
  "use strict";

  var drawer = null;
  var mask = null;
  var sidebarNotify = null;
  var markAllBtn = null;

  /* ---------- 通知数据 ---------- */
  var recentEvents = [];        // 近况（角色动态）
  var systemNotifications = []; // 系统通知
  var hasBadge = false;         // 是否显示红点（全部标为已读后关闭）

  /* 是否已从后端获取过数据 */
  var hasFetchedData = false;

  /* ---------- 初始化 ---------- */
  function init() {
    drawer = document.getElementById("notifyDrawer");
    mask = document.getElementById("notifyMask");
    sidebarNotify = document.getElementById("sidebarNotify");
    markAllBtn = document.getElementById("notifyMarkAll");
    if (!drawer) return;

    // 遮罩点击 -> 关闭抽屉
    if (mask && !mask._ncBound) {
      mask._ncBound = true;
      mask.addEventListener("click", function () {
        drawer.classList.remove("open");
      });
    }

    // ESC 键 -> 关闭抽屉
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && drawer.classList.contains("open")) {
        drawer.classList.remove("open");
      }
    });

    // 全部标为已读
    if (markAllBtn && !markAllBtn._ncBound) {
      markAllBtn._ncBound = true;
      markAllBtn.addEventListener("click", markAllAsRead);
    }

    // MutationObserver：监听 .open class 变化 -> 同步遮罩
    var observer = new MutationObserver(syncMask);
    observer.observe(drawer, { attributes: true, attributeFilter: ["class"] });

    // 初始填充占位数据
    loadPlaceholderData();

    // 初始同步 + 渲染
    syncMask();
    render();
    syncTriggerBadge();
  }

  /* ---------- 占位数据（仅当后端未返回数据时使用） ---------- */
  function loadPlaceholderData() {
    if (hasFetchedData) return;
    recentEvents = [
      { id: 1, sender: "开发中", time: "刚刚", content: "近况数据将在接入后端后自动更新", avatar: "开" }
    ];
    systemNotifications = [];
  }

  /* ---------- 从 /api/state 数据刷新近况 ---------- */
  function refreshFromState(state) {
    if (!state) return;

    var activities = [];
    // 尝试获取 dorm_activities 或 recent_events
    if (state.dorm_activities && Array.isArray(state.dorm_activities)) {
      activities = state.dorm_activities;
    } else if (state.recent_events && Array.isArray(state.recent_events)) {
      activities = state.recent_events;
    } else if (state.world && state.world.dorm_activities && Array.isArray(state.world.dorm_activities)) {
      activities = state.world.dorm_activities;
    }

    if (activities.length === 0) return;

    hasFetchedData = true;

    // 替换近况列表为最新的活动
    var newRecent = activities.map(function (act, idx) {
      var sender = act.name || act.sender || act.character || "未知";
      var content = act.action || act.content || act.description || "";
      // 如果是 "name: action" 格式，拆开
      if (act.name && act.action) {
        sender = act.name;
        content = act.action;
      }
      var time = act.time || act.time_of_day || "刚刚";
      return {
        id: Date.now() + idx,
        sender: sender,
        time: time,
        content: content,
        avatar: (sender && sender.charAt(0)) || "?"
      };
    });

    recentEvents = newRecent;
    hasBadge = true;

    render();
    syncTriggerBadge();
  }

  /* ---------- 遮罩同步 ---------- */
  function syncMask() {
    if (!mask) return;
    if (drawer.classList.contains("open")) {
      mask.classList.add("show");
    } else {
      mask.classList.remove("show");
    }
  }

  /* ---------- 触发按钮红点同步 ---------- */
  function syncTriggerBadge() {
    if (!sidebarNotify) return;
    if (hasBadge) {
      sidebarNotify.classList.add("has-new");
    } else {
      sidebarNotify.classList.remove("has-new");
    }
  }

  /* ---------- "全部标为已读"按钮状态同步 ---------- */
  function syncMarkAllBtn() {
    if (!markAllBtn) return;
    markAllBtn.disabled = !hasBadge;
  }

  /* ---------- 渲染 ---------- */
  function render() {
    var recentList = drawer.querySelector('[data-group="recent"]');
    var systemList = drawer.querySelector('[data-group="system"]');
    var recentSection = document.getElementById("notifyRecent");
    var systemSection = document.getElementById("notifySystem");
    var recentEmpty = document.getElementById("notifyRecentEmpty");
    var systemEmpty = document.getElementById("notifySystemEmpty");
    if (!recentList || !systemList) return;

    recentList.innerHTML = "";
    systemList.innerHTML = "";

    recentEvents.forEach(function (n) {
      recentList.appendChild(createItem(n));
    });
    systemNotifications.forEach(function (n) {
      systemList.appendChild(createItem(n));
    });

    // 分组空状态显隐
    if (recentEmpty) {
      recentEmpty.classList.toggle("hidden", recentEvents.length > 0);
    }
    if (systemEmpty) {
      systemEmpty.classList.toggle("hidden", systemNotifications.length > 0);
    }

    syncMarkAllBtn();
  }

  /* ---------- 创建单条通知 DOM ---------- */
  function createItem(n) {
    var el = document.createElement("div");
    el.className = "notify-item";
    el.dataset.id = n.id;

    el.innerHTML =
      '<div class="notify-avatar"></div>' +
      '<div class="notify-content">' +
        '<div class="notify-meta">' +
          '<span class="notify-sender"></span>' +
          '<span class="notify-time"></span>' +
        '</div>' +
        '<div class="notify-preview"></div>' +
      '</div>';

    el.querySelector(".notify-avatar").textContent = n.avatar || (n.sender && n.sender.charAt(0)) || "?";
    el.querySelector(".notify-sender").textContent = n.sender || "未知";
    el.querySelector(".notify-time").textContent   = n.time   || "";
    el.querySelector(".notify-preview").textContent = n.content || "";

    return el;
  }

  /* ---------- 全部标为已读（清除红点标记） ---------- */
  function markAllAsRead() {
    if (!hasBadge) return;
    hasBadge = false;
    syncTriggerBadge();
    syncMarkAllBtn();
  }

  /* ---------- 对外 API ---------- */
  window.NotificationCenter = {
    init: init,
    open: function ()  { if (drawer) drawer.classList.add("open"); },
    close: function () { if (drawer) drawer.classList.remove("open"); },
    /** 从后端状态刷新近况列表 */
    refresh: function (state) { refreshFromState(state); },
    /** 添加一条近况通知 */
    addNotification: function (sender, content, time, avatar) {
      var id = Date.now();
      recentEvents.unshift({
        id: id,
        sender: sender || "未知",
        content: content || "",
        time: time || "刚刚",
        avatar: avatar || (sender && sender.charAt(0)) || "?"
      });
      hasBadge = true;
      render();
      syncTriggerBadge();
    },
    /** 添加一条系统通知 */
    addSystemNotification: function (sender, content, time, avatar) {
      var id = Date.now() + 100000;
      systemNotifications.unshift({
        id: id,
        sender: sender || "系统",
        content: content || "",
        time: time || "刚刚",
        avatar: avatar || "系"
      });
      hasBadge = true;
      render();
      syncTriggerBadge();
    }
  };

  /* ---------- DOM 就绪后启动 ---------- */
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();