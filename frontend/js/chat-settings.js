/* 聊天设置 —— 骨架脚本 */
(function () {
  "use strict";

  /* ========== 权限检测：非开发者跳转 ========== */
  (function checkRole() {
    var role = localStorage.getItem("lxf_user_role");
    if (role !== "developer") {
      window.location.href = "index.html?skipIntro=1";
      return;
    }
  })();

  function init() {
    document.title = "聊天设置";
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();

window.goBack = function () {
  if (history.length > 1) { history.back(); }
  else { window.location.href = "index.html?skipIntro=1"; }
};