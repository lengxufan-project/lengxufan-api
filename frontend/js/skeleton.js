/* ============================================================
   skeleton.js — 数据加载骨架屏
   仅操作各容器内本文件创建的 .sk-box / .skeleton-block 元素
   show(selector)：在指定容器内添加骨架块，隐藏真实内容
   hide(selector)：移除骨架块，真实内容淡入
   依赖 css/skeleton.css 的类名
   ============================================================ */
(function () {
  "use strict";

  var FADE_MS = 450;   // 与 css/skeleton.css 的 .sk-fade 时长保持一致

  // ===== 工具：选择器或元素引用均可 =====
  function resolve(selector) {
    if (typeof selector === "string") return document.querySelector(selector);
    return selector || null;
  }

  // 容器内真实内容（排除骨架盒自身）
  function realChildren(container) {
    return Array.prototype.filter.call(container.children, function (el) {
      return !el.classList.contains("sk-box");
    });
  }

  // ===== 按容器类型生成骨架形状 =====
  function buildShapes(container) {
    var html = "";
    var i;

    if (container.classList.contains("chat")) {
      // 聊天区：左右交替气泡
      html =
        '<div class="skeleton-block sk-bubble left"></div>' +
        '<div class="skeleton-block sk-bubble right"></div>' +
        '<div class="skeleton-block sk-bubble left short"></div>' +
        '<div class="skeleton-block sk-bubble right"></div>';
    } else if (container.classList.contains("statusbar")) {
      // 状态栏：6 组「标签 + 迷你条」
      for (i = 0; i < 6; i++) {
        html +=
          '<div class="sk-status">' +
            '<div class="skeleton-block sk-label"></div>' +
            '<div class="skeleton-block sk-line"></div>' +
          "</div>";
      }
    } else if (container.classList.contains("scene")) {
      // 场景区：两行文字
      html =
        '<div class="skeleton-block sk-scene-line main"></div>' +
        '<div class="skeleton-block sk-scene-line sub"></div>';
    } else {
      // 未知容器：三行通用占位
      for (i = 0; i < 3; i++) {
        html += '<div class="skeleton-block sk-line-generic"></div>';
      }
    }
    return html;
  }

  // ===== 显示骨架 =====
  function show(selector) {
    var container = resolve(selector);
    if (!container || container.getAttribute("data-sk") === "1") return;
    container.setAttribute("data-sk", "1");

    // 隐藏真实内容（display:none，恢复时再淡入）
    realChildren(container).forEach(function (el) {
      el.classList.add("sk-hidden");
    });

    var box = document.createElement("div");
    box.className = "sk-box";
    box.innerHTML = buildShapes(container);
    container.appendChild(box);
  }

  // ===== 隐藏骨架，真实内容淡入 =====
  function hide(selector) {
    var container = resolve(selector);
    if (!container) return;

    var box = container.querySelector(".sk-box");
    if (box) box.remove();

    Array.prototype.forEach.call(container.children, function (el) {
      if (!el.classList.contains("sk-hidden")) return;
      // 先以 opacity 0 恢复显示，再过渡到 1，实现淡入
      el.style.opacity = "0";
      el.classList.add("sk-fade");
      el.classList.remove("sk-hidden");
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          el.style.opacity = "1";
          // 过渡结束后清理内联样式与过渡类
          setTimeout(function () {
            el.classList.remove("sk-fade");
            el.style.opacity = "";
          }, FADE_MS);
        });
      });
    });

    container.removeAttribute("data-sk");
  }

  // ===== 导出 =====
  window.Skeleton = { show: show, hide: hide };
})();
