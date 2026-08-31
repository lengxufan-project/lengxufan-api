/* 天气特效层：晴 / 雨 / 雪 / 阴 / 风（纯 CSS 动画，JS 只负责切换类名） */
(function () {
  "use strict";

  var layer = null;

  // 天气值 → 模式类名（风复用雨丝，倾斜模拟）
  var WEATHER_MAP = {
    "晴": "sun",
    "雨": "rain",
    "雪": "snow",
    "阴": "cloud",
    "风": "rain"
  };

  function init() {
    if (document.getElementById("weatherLayer")) {
      layer = document.getElementById("weatherLayer");
      return;
    }
    layer = document.createElement("div");
    layer.id = "weatherLayer";

    // 四种模式子元素常驻层内，靠 opacity 交叉淡入淡出
    ["sun", "rain", "snow", "cloud"].forEach(function (key) {
      var el = document.createElement("div");
      el.className = "weather-mode weather-" + key;
      layer.appendChild(el);
    });

    document.body.appendChild(layer);
  }

  function update(weather) {
    if (!layer) init();
    if (!layer) return;

    var key = WEATHER_MAP[weather];
    if (!key) return; // 未知天气保持现状

    var cls = "active-" + key;
    if (weather === "风") cls += " wind"; // 雨丝倾斜

    if (layer._current === cls) return;
    layer.className = cls; // 移除旧类、添加新类，触发 CSS 过渡
    layer._current = cls;
  }

  window.WeatherEffects = { init: init, update: update };
})();
