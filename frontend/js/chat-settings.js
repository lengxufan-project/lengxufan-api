/* 聊天设置 —— 骨架脚本 */
(function () {
  "use strict";

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