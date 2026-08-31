/* 世界时钟：右上角显示系统时间与时段，随世界数据切换昼夜滤镜 */
(function () {
  "use strict";

  var el = null;
  var timeEl = null;
  var phaseEl = null;
  var lastTimeOfDay = null;
  var lastDay = null;

  // 时段映射：深夜(0-5)、清晨(5-8)、正午(8-14)、下午(14-17)、黄昏(17-19)、夜晚(19-24)
  function phaseFromHour(h) {
    if (h < 5) return "深夜";
    if (h < 8) return "清晨";
    if (h < 14) return "正午";
    if (h < 17) return "下午";
    if (h < 19) return "黄昏";
    return "夜晚";
  }

  function nowHM() {
    var now = new Date();
    return ("0" + now.getHours()).slice(-2) + ":" + ("0" + now.getMinutes()).slice(-2);
  }

  function render() {
    if (!timeEl || !phaseEl) return;
    timeEl.textContent = nowHM();
    var phase = lastTimeOfDay || phaseFromHour(new Date().getHours());
    phaseEl.textContent = phase;
    if (lastDay != null) {
      phaseEl.textContent = "第" + lastDay + "天 · " + phase;
    }
  }

  window.WorldClock = {
    init: function () {
      if (el) return;
      el = document.createElement("div");
      el.className = "world-clock";
      timeEl = document.createElement("span");
      timeEl.className = "time";
      phaseEl = document.createElement("span");
      phaseEl.className = "phase";
      el.appendChild(timeEl);
      el.appendChild(phaseEl);
      document.body.appendChild(el);
      render();
      setInterval(render, 60000); // 每分钟刷新一次系统时间
    },
    update: function (timeOfDay, day) {
      if (timeOfDay) {
        lastTimeOfDay = timeOfDay;
        document.body.setAttribute("data-time-of-day", timeOfDay);
      }
      if (day != null) {
        lastDay = day;
      }
      render();
    }
  };
})();
