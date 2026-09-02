/* 侧边栏折叠、抽屉、遮罩、高亮、移动端汉堡菜单 */
(function () {
  "use strict";

  function init() {
    // 侧边栏移动端遮罩点击关闭
    var sidebar = document.getElementById("sidebar");
    var sidebarMask = document.getElementById("sidebarMask");
    if (sidebarMask && sidebar) {
      sidebarMask.addEventListener("click", function () {
        sidebar.classList.remove("open");
        sidebarMask.classList.remove("show");
      });
    }

    // 当前页高亮
    highlightSidebar();

    // 移动端独立汉堡按钮
    bindMobileMenuBtn();
  }

  function highlightSidebar() {
    var links = document.querySelectorAll("#sidebar .nav-link");
    if (!links.length) return;
    var current = window.location.pathname.replace(/\/+$/, "") || "/";
    var onIndex = current === "/" || current.indexOf("index.html") !== -1;
    var matched = false;
    Array.prototype.forEach.call(links, function (a) {
      a.classList.remove("active");
      try {
        var path = new URL(a.href).pathname.replace(/\/+$/, "") || "/";
        var isIndexLink = path.indexOf("index.html") !== -1;
        if ((onIndex && isIndexLink) || (!onIndex && path === current)) {
          a.classList.add("active");
          matched = true;
        }
      } catch (err) { /* href 解析失败则跳过 */ }
    });
    if (!matched) links[0].classList.add("active");
  }

  function bindMobileMenuBtn() {
    var btn = document.getElementById('mobileMenuBtn');
    var sidebar = document.getElementById('sidebar');
    var mask = document.getElementById('sidebarMask');
    if (!btn || !sidebar) return;
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      var willOpen = !sidebar.classList.contains('open');
      sidebar.classList.toggle('open', willOpen);
      if (mask) mask.classList.toggle('show', willOpen);
    });
  }

  window.Sidebar = { init: init };
})();