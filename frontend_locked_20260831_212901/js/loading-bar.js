/* 顶部加载进度条控制 */
(function () {
  "use strict";

  function getEl() {
    return document.getElementById("loadingBar");
  }

  window.LoadingBar = {
    // 开始加载：显示进度条并推进到 30%（模拟开始加载）
    start: function () {
      var el = getEl();
      if (!el) return;
      el.classList.add("active");
      el.style.width = "30%";
    },

    // 完成加载：推进到 100% 后淡出并重置
    finish: function () {
      var el = getEl();
      if (!el) return;
      el.classList.add("complete");
      el.style.width = "100%";
      setTimeout(function () {
        el.classList.remove("active");
        el.classList.remove("complete");
        el.style.width = "0%";
      }, 300);
    }
  };
})();
