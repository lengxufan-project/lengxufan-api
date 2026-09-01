/* 场景区渲染：天气、时间、室友活动 */
(function () {
  "use strict";

  // 由 state 渲染场景区
  function render(s) {
    var w = s.world || {};
    document.getElementById("sceneLabel").textContent = "307室 · " + (w.time_of_day || "--");
    document.getElementById("sceneMeta").textContent = "第" + (w.day != null ? w.day : "--") + "天 · " + (w.weather || "--");

    var actsEl = document.getElementById("sceneActs");
    actsEl.innerHTML = "";
    var acts = s.dorm_activities || {};
    var keys = Object.keys(acts).slice(0, 3);
    if (keys.length === 0) {
      actsEl.innerHTML = '<div class="scene-act"><span class="who">——</span>室内一片安静</div>';
    } else {
      keys.forEach(function (k) {
        var d = document.createElement("div");
        d.className = "scene-act";
        d.innerHTML = '<span class="who">' + UI.escapeText(k) + '</span>：' + UI.escapeText(acts[k]);
        actsEl.appendChild(d);
      });
    }
  }

  // update(s)：传入 state 直接渲染；不传则自行请求 /api/state
  function update(s) {
    if (s) { render(s); return; }
    API.getState().then(render).catch(function () { /* 静默 */ });
  }

  function init() {
    // 场景区无独立事件，由 app.js 调度刷新
  }

  window.Scene = { update: update, init: init };
})();
