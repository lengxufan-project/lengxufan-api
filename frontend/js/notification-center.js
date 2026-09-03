/* ============================================================
   通知中心抽屉（右侧滑入 · 磨砂玻璃）
   - 不接管 sidebarNotify / notifyClose 的 click 事件（已由 app.js 处理）
   - 通过 MutationObserver 监听抽屉 .open class 变化，同步遮罩显隐
   - 管理通知数据（近况 / 系统两个分区）、渲染列表、标记已读、触发按钮红点
   - 支持：全部标为已读 / 点击遮罩关闭 / ESC 关闭
   - 数据来源：近况从 /api/state 的 dorm_activities / recent_events 刷新
   - 系统通知由其他模块通过 addSystemNotification 添加
   - 升级功能：Tab 切换（近况/系统）、未读/已读分区、详情弹窗
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

  /* ---------- 已读追踪 ---------- */
  var readIds = {}; // { id: true }

  /* ---------- 当前活跃 Tab ---------- */
  var activeTab = "recent";

  /* ---------- 详情弹窗当前通知 ---------- */
  var modalCurrentItem = null;
  var modalCurrentGroup = null;

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

    // Tab 切换
    initTabs();

    // 详情弹窗
    initModal();

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

  /* ---------- Tab 切换 ---------- */
  function initTabs() {
    var tabs = document.querySelectorAll(".notify-tab");
    if (!tabs.length) return;
    Array.prototype.forEach.call(tabs, function (tab) {
      tab.addEventListener("click", function () {
        var target = tab.getAttribute("data-tab");
        if (!target) return;
        // 切换 tab 激活态
        Array.prototype.forEach.call(tabs, function (t) { t.classList.remove("active"); });
        tab.classList.add("active");
        // 切换 content
        var contents = document.querySelectorAll(".notify-tab-content");
        Array.prototype.forEach.call(contents, function (c) {
          c.classList.toggle("active", c.getAttribute("data-tab-content") === target);
        });
        activeTab = target;
      });
    });
  }

  /* ---------- 详情弹窗 ---------- */
  function initModal() {
    var modal = document.getElementById("notifyModal");
    var maskEl = document.getElementById("notifyModalMask");
    var closeBtn = document.getElementById("notifyModalClose");
    var readBtn = document.getElementById("notifyModalRead");
    if (!modal) return;

    function closeModal() {
      modal.classList.remove("show");
      modalCurrentItem = null;
      modalCurrentGroup = null;
    }

    if (maskEl) {
      maskEl.addEventListener("click", closeModal);
    }
    if (closeBtn) {
      closeBtn.addEventListener("click", closeModal);
    }
    if (readBtn) {
      readBtn.addEventListener("click", function () {
        if (modalCurrentItem) {
          markAsRead(modalCurrentItem, modalCurrentGroup);
        }
        closeModal();
      });
    }
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && modal.classList.contains("show")) {
        closeModal();
      }
    });
  }

  function openModal(item, group) {
    var modal = document.getElementById("notifyModal");
    var typeEl = document.getElementById("notifyModalType");
    var titleEl = document.getElementById("notifyModalTitle");
    var bodyEl = document.getElementById("notifyModalBody");
    var readBtn = document.getElementById("notifyModalRead");
    if (!modal) return;

    modalCurrentItem = item;
    modalCurrentGroup = group;

    typeEl.textContent = group === "system" ? "系统通知" : "近况";
    typeEl.style.color = group === "system" ? "#8fa0c0" : "#58a6ff";
    titleEl.textContent = item.sender || "未知";
    bodyEl.textContent = item.content || "";
    readBtn.style.display = item.read ? "none" : "";
    modal.classList.add("show");
  }

  /* ---------- 从 /api/events 刷新数据 ---------- */
  function fetchEvents() {
    if (!window.API || !window.API.getEvents) return;

    // 并行拉取 activity 和 system
    Promise.all([
      window.API.getEvents("activity"),
      window.API.getEvents("system")
    ]).then(function (results) {
      var activityData = results[0];
      var systemData = results[1];

      if (activityData && activityData.events && activityData.events.length > 0) {
        hasFetchedData = true;
        var newRecent = activityData.events.map(function (ev, idx) {
          var sender = ev.character_name || "未知";
          var content = ev.content || "";
          return {
            id: ev.id || Date.now() + idx,
            sender: sender,
            time: ev.created_at ? new Date(ev.created_at * 1000).toLocaleString() : "刚刚",
            content: content,
            avatar: (sender && sender.charAt(0)) || "?",
            read: false
          };
        });
        recentEvents = newRecent;
        hasBadge = true;
      }

      if (systemData && systemData.events && systemData.events.length > 0) {
        hasFetchedData = true;
        var newSystem = systemData.events.map(function (ev, idx) {
          var content = ev.content || "";
          return {
            id: ev.id || "sys_" + Date.now() + idx,
            sender: "系统",
            time: ev.created_at || "刚刚",
            content: content,
            avatar: "系",
            read: false
          };
        });
        systemNotifications = newSystem;
        hasBadge = true;
      }

      render();
      syncTriggerBadge();
    });
  }

  /* ---------- 占位数据（仅当后端未返回数据时使用） ---------- */
  function loadPlaceholderData() {
    if (hasFetchedData) return;
    // 先尝试从 /api/events 拉取
    fetchEvents();
    // 如果 fetchEvents 已经设了数据，就不再覆盖
    var checkLoaded = function () {
      if (hasFetchedData) return;
      recentEvents = [
        { id: 1, sender: "开发中", time: "刚刚", content: "近况数据将在接入后端后自动更新", avatar: "开", read: false }
      ];
      systemNotifications = [];
      render();
      syncTriggerBadge();
    };
    // 给 fetchEvents 一点时间，如果还没返回则用占位
    setTimeout(checkLoaded, 500);
  }

  /* ---------- 从 /api/state 数据刷新近况（兼容旧接口） ---------- */
  function refreshFromState(state) {
    if (!state) return;

    // 如果已经通过事件接口获取过数据，不再覆盖
    if (hasFetchedData) return;

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
        avatar: (sender && sender.charAt(0)) || "?",
        read: false
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

  /* ---------- 标记单个通知为已读 ---------- */
  function markAsRead(item, group) {
    if (item.read) return;
    item.read = true;
    readIds[item.id] = true;
    // 检查是否所有通知都已读
    var allRead = true;
    var allItems = group === "system" ? systemNotifications : recentEvents;
    allItems.forEach(function (n) {
      if (!n.read) allRead = false;
    });
    if (allRead) {
      hasBadge = false;
    }
    render();
    syncTriggerBadge();
    syncMarkAllBtn();
  }

  /* ---------- 渲染 ---------- */
  function render() {
    renderGroup("recent", recentEvents);
    renderGroup("system", systemNotifications);
    syncMarkAllBtn();
  }

  function renderGroup(group, items) {
    var unreadList = drawer.querySelector('[data-group="' + group + '"][data-read="false"]');
    var readList = drawer.querySelector('[data-group="' + group + '"][data-read="true"]');
    var unreadSection = document.getElementById("notify" + capitalize(group) + "Unread");
    var readSection = document.getElementById("notify" + capitalize(group) + "Read");
    var unreadEmpty = document.getElementById("notify" + capitalize(group) + "UnreadEmpty");
    var readEmpty = document.getElementById("notify" + capitalize(group) + "ReadEmpty");
    var totalEmpty = document.getElementById("notify" + capitalize(group) + "Empty");

    if (!unreadList || !readList) return;

    unreadList.innerHTML = "";
    readList.innerHTML = "";

    var unreadItems = items.filter(function (n) { return !n.read; });
    var readItems = items.filter(function (n) { return n.read; });

    unreadItems.forEach(function (n) {
      unreadList.appendChild(createItem(n, group));
    });
    readItems.forEach(function (n) {
      readList.appendChild(createItem(n, group));
    });

    // 未读/已读区显隐
    if (unreadSection) unreadSection.classList.toggle("hidden", unreadItems.length === 0);
    if (readSection) readSection.classList.toggle("hidden", readItems.length === 0);
    if (unreadEmpty) unreadEmpty.classList.toggle("hidden", unreadItems.length > 0);
    if (readEmpty) readEmpty.classList.toggle("hidden", readItems.length > 0);
    if (totalEmpty) totalEmpty.classList.toggle("hidden", items.length > 0);
  }

  function capitalize(s) {
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  /* ---------- 创建单条通知 DOM ---------- */
  function createItem(n, group) {
    var el = document.createElement("div");
    el.className = "notify-item" + (n.read ? "" : " unread");
    if (group === "system") {
      el.classList.add("notify-system");
    }
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

    // 点击弹出详情
    el.addEventListener("click", function () {
      openModal(n, group);
    });

    return el;
  }

  /* ---------- 全部标为已读（清除红点标记） ---------- */
  function markAllAsRead() {
    if (!hasBadge) return;
    // 标记所有通知为已读
    recentEvents.forEach(function (n) { n.read = true; readIds[n.id] = true; });
    systemNotifications.forEach(function (n) { n.read = true; readIds[n.id] = true; });
    hasBadge = false;
    render();
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
        avatar: avatar || (sender && sender.charAt(0)) || "?",
        read: false
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
        avatar: avatar || "系",
        read: false
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