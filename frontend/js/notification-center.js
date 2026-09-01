/* ============================================================
   通知中心抽屉（右侧滑入 · 磨砂玻璃）
   - 不接管 sidebarNotify / notifyClose 的 click 事件（已由 app.js 处理）
   - 通过 MutationObserver 监听抽屉 .open class 变化，同步遮罩显隐
   - 管理通知数据（未读 / 已读分组）、渲染列表、标记已读、触发按钮红点
   - 支持：单条标记已读 / 全部标为已读 / 点击遮罩关闭 / ESC 关闭
   ============================================================ */
(function () {
  "use strict";

  var drawer = null;
  var mask = null;
  var sidebarNotify = null;
  var markAllBtn = null;

  /* ---------- 预设通知数据（占位，后续接入后端 API） ---------- */
  var notifications = {
    unread: [
      { id: 1, sender: "冷旭帆",   time: "刚刚",      content: "今天训练到很晚，回来时宿舍已经熄灯了。",       avatar: "冷" },
      { id: 2, sender: "黄景云",   time: "5 分钟前",  content: "帮你带了宵夜，在桌上。记得趁热吃。",           avatar: "黄" },
      { id: 3, sender: "系统",     time: "12 分钟前", content: "世界日第 1 天结束，状态已自动保存。",          avatar: "系" },
      { id: 4, sender: "叶清辞",   time: "半小时前",  content: "明天的观测时间调整到下午 3 点。",              avatar: "叶" }
    ],
    read: [
      { id: 5, sender: "系统",     time: "昨天 23:30", content: "版本更新已完成，新增通知中心功能。",           avatar: "系" },
      { id: 6, sender: "冷旭帆",   time: "昨天 18:02", content: "今天晚上有训练，可能晚回来。",                 avatar: "冷" }
    ]
  };

  /* ---------- 初始化 ---------- */
  function init() {
    drawer = document.getElementById("notifyDrawer");
    mask = document.getElementById("notifyMask");
    sidebarNotify = document.getElementById("sidebarNotify");
    markAllBtn = document.getElementById("notifyMarkAll");
    if (!drawer) return;

    // 遮罩点击 → 关闭抽屉
    if (mask && !mask._ncBound) {
      mask._ncBound = true;
      mask.addEventListener("click", function () {
        drawer.classList.remove("open");
      });
    }

    // ESC 键 → 关闭抽屉
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

    // MutationObserver：监听 .open class 变化 → 同步遮罩
    var observer = new MutationObserver(syncMask);
    observer.observe(drawer, { attributes: true, attributeFilter: ["class"] });

    // 初始同步 + 渲染
    syncMask();
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

  /* ---------- 触发按钮红点同步（sidebar.css 已有 .has-new → 显示 .notify-dot） ---------- */
  function syncTriggerBadge() {
    if (!sidebarNotify) return;
    if (notifications.unread.length > 0) {
      sidebarNotify.classList.add("has-new");
    } else {
      sidebarNotify.classList.remove("has-new");
    }
  }

  /* ---------- "全部标为已读"按钮状态同步 ---------- */
  function syncMarkAllBtn() {
    if (!markAllBtn) return;
    markAllBtn.disabled = notifications.unread.length === 0;
  }

  /* ---------- 渲染 ---------- */
  function render() {
    var unreadList = drawer.querySelector('[data-group="unread"]');
    var readList   = drawer.querySelector('[data-group="read"]');
    var unreadSection = document.getElementById("notifyUnread");
    var readSection   = document.getElementById("notifyRead");
    var emptyEl       = document.getElementById("notifyEmpty");
    if (!unreadList || !readList) return;

    unreadList.innerHTML = "";
    readList.innerHTML   = "";

    notifications.unread.forEach(function (n) {
      unreadList.appendChild(createItem(n, "unread"));
    });
    notifications.read.forEach(function (n) {
      readList.appendChild(createItem(n, "read"));
    });

    // 分组显隐：空则隐藏 section
    unreadSection.classList.toggle("hidden", notifications.unread.length === 0);
    readSection.classList.toggle("hidden",   notifications.read.length === 0);

    // 全空兜底
    var allEmpty = notifications.unread.length === 0 && notifications.read.length === 0;
    emptyEl.style.display = allEmpty ? "block" : "none";

    syncMarkAllBtn();
  }

  /* ---------- 创建单条通知 DOM ---------- */
  function createItem(n, group) {
    var el = document.createElement("div");
    el.className = "notify-item" + (group === "unread" ? " unread" : "");
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

    // 点击未读条目 → 标记已读
    if (group === "unread") {
      el.addEventListener("click", function () { markAsRead(n.id); });
    }

    return el;
  }

  /* ---------- 标记单条已读 ---------- */
  function markAsRead(id) {
    var idx = -1;
    for (var i = 0; i < notifications.unread.length; i++) {
      if (notifications.unread[i].id === id) { idx = i; break; }
    }
    if (idx === -1) return;
    var item = notifications.unread.splice(idx, 1)[0];
    notifications.read.unshift(item);
    render();
    syncTriggerBadge();
  }

  /* ---------- 全部标为已读 ---------- */
  function markAllAsRead() {
    if (notifications.unread.length === 0) return;
    notifications.unread.forEach(function (n) {
      notifications.read.unshift(n);
    });
    notifications.unread = [];
    render();
    syncTriggerBadge();
  }

  /* ---------- 对外 API ---------- */
  window.NotificationCenter = {
    init: init,
    open: function ()  { if (drawer) drawer.classList.add("open"); },
    close: function () { if (drawer) drawer.classList.remove("open"); },
    /** 添加一条通知（默认未读） */
    addNotification: function (sender, content, time, avatar) {
      var id = Date.now();
      notifications.unread.unshift({
        id: id,
        sender: sender || "未知",
        content: content || "",
        time: time || "刚刚",
        avatar: avatar || (sender && sender.charAt(0)) || "?"
      });
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
