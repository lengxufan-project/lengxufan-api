/* 第一栏 rail 切换第二栏多面板 */
(function () {
  "use strict";

  function init() {
    var railItems = document.querySelectorAll('.rail-item');
    var panelMap = {
  world: '[data-panel="world"]',
  roster: '[data-panel="characters"]',
  chat: '[data-panel="chat"]',
  memory: '[data-panel="memory"]',
  settings: '[data-panel="settings"]'
};
    function switchPanel(view) {
      var selector = panelMap[view];
      if (!selector) return;
      document.querySelectorAll('.sb-panel').forEach(function (p) {
        p.classList.remove('active');
      });
      var target = document.querySelector(selector);
      if (target) target.classList.add('active');
      railItems.forEach(function (item) {
        item.classList.toggle('active', item.getAttribute('data-view') === view);
      });
      localStorage.setItem('lxf_active_view', view);
    }
    railItems.forEach(function (item) {
      item.addEventListener('click', function () {
        var view = item.getAttribute('data-view');
        if (view) switchPanel(view);
      });
    });
    window.switchPanel = switchPanel;
    // Always default to 'world' panel on page load, never remember last user selection
    switchPanel('world');
  }

  window.Rail = { init: init };
})();