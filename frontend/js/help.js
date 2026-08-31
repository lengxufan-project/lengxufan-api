/* 帮助中心：折叠面板 / 左侧导航滚动 / 键盘 ? 跳转（独立页面） */
(function () {
  "use strict";

  var nav, navToggle, navList, content;
  var navOpen = false;

  // ---------- 折叠面板：展开/收起（高度过渡 0.4s，由 CSS 承担） ----------
  function setOpen(item, open) {
    var body = item.querySelector(".acc-body");
    if (!body) return;
    if (open) {
      item.classList.add("open");
      body.style.height = body.scrollHeight + "px";
      // 过渡结束后释放为 auto，内容变化时不再受固定高度限制
      var onEnd = function (e) {
        if (e.propertyName !== "height" || e.target !== body) return;
        body.removeEventListener("transitionend", onEnd);
        if (item.classList.contains("open")) body.style.height = "auto";
      };
      body.addEventListener("transitionend", onEnd);
    } else {
      // 从 auto（或动画中的高度）先固定为当前内容高度，再过渡到 0
      body.style.height = body.scrollHeight + "px";
      void body.offsetHeight; // 强制回流，确保触发过渡
      item.classList.remove("open");
      body.style.height = "0px";
    }
  }

  // ---------- 左侧导航：点击滚动到对应区块 ----------
  function setActiveNav(id) {
    var links = navList.querySelectorAll(".nav-link");
    Array.prototype.forEach.call(links, function (a) {
      a.classList.toggle("active", a.dataset.target === id);
    });
  }

  function scrollToSection(id) {
    var sec = document.getElementById(id);
    if (!sec) return;
    sec.scrollIntoView({ behavior: "smooth", block: "start" });
    setActiveNav(id);
  }

  function closeMobileNav() {
    if (!navOpen) return;
    navOpen = false;
    nav.classList.remove("nav-open");
    navToggle.setAttribute("aria-expanded", "false");
  }

  // ---------- 键盘 ? 快速跳转到常见问题 ----------
  function onKeydown(e) {
    if (e.key !== "?") return;
    var t = e.target;
    if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
    e.preventDefault();
    scrollToSection("sec-faq");
    // 短暂高亮目标区块标题
    var sec = document.getElementById("sec-faq");
    if (!sec) return;
    sec.classList.add("flash");
    setTimeout(function () { sec.classList.remove("flash"); }, 1200);
  }

  // ---------- 初始化 ----------
  function init() {
    nav = document.getElementById("hpNav");
    navToggle = document.getElementById("navToggle");
    navList = document.getElementById("navList");
    content = document.getElementById("hpContent");
    if (!nav || !content) return;

    // 折叠面板：点击标题切换（事件委托）
    content.addEventListener("click", function (e) {
      var head = e.target.closest(".acc-head");
      if (!head) return;
      var item = head.parentElement;
      setOpen(item, !item.classList.contains("open"));
    });

    // 左侧导航：点击滚动到对应区块
    navList.addEventListener("click", function (e) {
      var link = e.target.closest(".nav-link");
      if (!link) return;
      e.preventDefault();
      scrollToSection(link.dataset.target);
      closeMobileNav();
    });

    // 移动端：目录下拉开关
    navToggle.addEventListener("click", function () {
      navOpen = !navOpen;
      nav.classList.toggle("nav-open", navOpen);
      navToggle.setAttribute("aria-expanded", String(navOpen));
    });

    // 键盘 ? 跳转
    document.addEventListener("keydown", onKeydown);
  }

  window.HelpPage = { init: init };

  // 独立页面：脚本置于 body 末尾，直接自动初始化
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
