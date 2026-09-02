/* 通知抽屉打开/关闭（侧边栏右上角铃铛图标） */
(function () {
  "use strict";

  function init() {
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
  }

  window.Notifications = { init: init };
})();