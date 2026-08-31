/* ============ 时段氛围光 ============ */
/* 依据 world.time_of_day 切换 body[data-time-of-day]，驱动 CSS 变量过渡 */
(function () {
  "use strict";

  var current = null;

  function init() {
    if (!document.body) return;
    // 初始值：白天为默认平静蓝；首次 update 会覆盖
    document.body.setAttribute("data-time-of-day", "清晨");
    current = "清晨";

    // 若 WorldClock 提供时段变化回调，则自动同步
    if (window.WorldClock && typeof window.WorldClock.onChange === "function") {
      window.WorldClock.onChange(function (tod) { update(tod); });
    }
  }

  function update(timeOfDay) {
    if (!document.body) return;
    // 标准化：未知值不更新，避免清掉氛围光
    var allowed = ["深夜", "清晨", "正午", "黄昏", "夜晚"];
    if (!timeOfDay || allowed.indexOf(timeOfDay) === -1) return;
    if (timeOfDay === current) return;
    current = timeOfDay;
    document.body.setAttribute("data-time-of-day", timeOfDay);
    // CSS 变量与 ::before 过渡由 CSS 处理，无需额外触发
  }

  window.TimeLighting = { init: init, update: update };
})();
