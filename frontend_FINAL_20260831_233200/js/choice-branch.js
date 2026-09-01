/* 分支选择浮层：关键词触发的叙事选项 */
(function () {
  "use strict";

  var overlay = null;

  // 创建浮层容器并插入 body
  function init() {
    if (overlay) return;
    overlay = document.createElement("div");
    overlay.className = "choice-overlay";
    document.body.appendChild(overlay);
  }

  // 展示一组选项：options 为 [{id, text}]，点击后回调 optionId 并隐藏
  function show(options, callback) {
    if (!overlay) init();
    if (!overlay || !Array.isArray(options)) return;

    // 清空上一组选项
    overlay.innerHTML = "";

    var title = document.createElement("div");
    title.className = "choice-title";
    title.textContent = "请选择";
    overlay.appendChild(title);

    options.forEach(function (opt) {
      var btn = document.createElement("div");
      btn.className = "choice-option";
      btn.textContent = opt.text;
      btn.addEventListener("click", function () {
        if (typeof callback === "function") callback(opt.id);
        hide();
      });
      overlay.appendChild(btn);
    });

    overlay.classList.add("active");
  }

  function hide() {
    if (overlay) overlay.classList.remove("active");
  }

  window.ChoiceBranch = { init: init, show: show, hide: hide };
})();
