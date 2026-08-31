/* 通知中心：右上角触发按钮 + 右侧滑出抽屉（预设通知为占位，后续接入后端） */
(function () {
  "use strict";

  var trigger = null;
  var drawer = null;

  // 预设通知（占位，后续接入后端）
  var PRESETS = [
    { sender: "冷旭帆", time: "刚刚", content: "今天训练到很晚，回来时宿舍已经熄灯了。" },
    { sender: "系统", time: "00:05", content: "世界日第 1 天结束，状态已自动保存。" },
    { sender: "黄景云", time: "昨天 23:30", content: "帮你带了宵夜，在桌上。" }
  ];

  function ensureElements() {
    trigger = document.getElementById("notificationTrigger");
    drawer = document.getElementById("notificationDrawer");

    if (!trigger) {
      trigger = document.createElement("div");
      trigger.id = "notificationTrigger";
      document.body.appendChild(trigger);
    }
    if (!drawer) {
      drawer = document.createElement("div");
      drawer.id = "notificationDrawer";
      document.body.appendChild(drawer);
    }
    if (!trigger.querySelector(".mail-icon")) {
      var icon = document.createElement("span");
      icon.className = "mail-icon";
      icon.textContent = "✉";
      trigger.appendChild(icon);
    }
  }

  function init() {
    ensureElements();
    if (trigger._ncBound) return;
    trigger._ncBound = true;

    // 点击触发按钮：toggle 抽屉开合
    trigger.addEventListener("click", function (e) {
      e.stopPropagation();
      if (drawer.classList.contains("open")) {
        close();
      } else {
        open();
      }
    });

    // 初始化时添加 3 条预设通知（倒序插入使 1 号位于顶部）
    PRESETS.slice().reverse().forEach(function (n) {
      addNotification(n.sender, n.time, n.content);
    });
  }

  function open() {
    drawer.classList.add("open");
    trigger.classList.remove("unread"); // 已查看，清除未读状态
  }

  function close() {
    drawer.classList.remove("open");
  }

  function addNotification(sender, time, content) {
    var item = document.createElement("div");
    item.className = "notification-item unread";
    item.innerHTML =
      '<div class="sender"></div>' +
      '<div class="time"></div>' +
      '<div class="preview"></div>';
    item.querySelector(".sender").textContent = sender;
    item.querySelector(".time").textContent = time;
    item.querySelector(".preview").textContent = content;

    // 点击通知项：展开/收起完整内容并标记已读
    item.addEventListener("click", function () {
      item.classList.toggle("expanded");
      item.classList.remove("unread");
    });

    // 添加到抽屉顶部
    drawer.insertBefore(item, drawer.firstChild);
    // 触发按钮显示未读状态
    trigger.classList.add("unread");
  }

  window.NotificationCenter = { init: init, addNotification: addNotification, open: open, close: close };
})();
