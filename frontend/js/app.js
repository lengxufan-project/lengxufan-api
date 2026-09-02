/* 主入口：协调各模块初始化 + 启动定时刷新 */
(function () {
  "use strict";

  function init() {
    // 各模块依次初始化
    if (window.Intro && window.Intro.init) window.Intro.init();
    if (window.Particles && window.Particles.init) window.Particles.init();
    if (window.Rail && window.Rail.init) window.Rail.init();
    if (window.Sidebar && window.Sidebar.init) window.Sidebar.init();
    if (window.Notifications && window.Notifications.init) window.Notifications.init();

    // 初始化其他保留模块
    if (window.Scene && window.Scene.init) window.Scene.init();
    if (window.WorldClock && window.WorldClock.init) window.WorldClock.init();
    if (window.EmotionParticles && window.EmotionParticles.init) window.EmotionParticles.init();
    if (window.TimeLighting && window.TimeLighting.init) window.TimeLighting.init();
    if (window.WeatherEffects && window.WeatherEffects.init) window.WeatherEffects.init();
    if (window.SearchPanel && window.SearchPanel.init) window.SearchPanel.init();
    if (window.WorldActivities && window.WorldActivities.init) window.WorldActivities.init();
    // 初始化世界模块（角色列表 + 首次刷新）
    if (window.World && window.World.init) window.World.init();

    // 定时刷新世界状态（每 2 秒）
    if (window.World && window.World.refresh) {
      setInterval(window.World.refresh, 2000);
    }
  }

  // DOM 就绪后启动
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();