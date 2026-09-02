/* 账号与安全 —— 骨架脚本 */
(function () {
  "use strict";

  function init() {
    document.title = "账号与安全";
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