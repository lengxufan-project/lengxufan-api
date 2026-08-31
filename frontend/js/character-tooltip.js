/* 角色悬浮提示（char-tooltip） */
(function () {
  "use strict";

  // 占位数据：id -> { name, desc, tags }
  var PLACEHOLDER = {
    lengxufan: { name: "冷旭帆", desc: "冰蓝护腕", tags: ["左肩旧伤"] },
    huangjingyun: { name: "黄景云", desc: "暖橙糖纸", tags: ["粤语"] },
    yeqingci: { name: "叶清辞", desc: "冷紫手表", tags: ["发呆"] }
  };

  var tip = null;

  function ensureTip() {
    if (tip) return tip;
    tip = document.createElement("div");
    tip.className = "char-tooltip";
    tip.innerHTML =
      '<div class="name"></div>' +
      '<div class="desc"></div>' +
      '<div class="status"></div>';
    document.body.appendChild(tip);
    return tip;
  }

  function render(data) {
    var el = ensureTip();
    el.querySelector(".name").textContent = data.name;
    var descEl = el.querySelector(".desc");
    descEl.textContent = data.desc || "";
    descEl.style.display = data.desc ? "" : "none";
    var status = el.querySelector(".status");
    status.innerHTML = "";
    (data.tags || []).forEach(function (t) {
      var tag = document.createElement("span");
      tag.className = "tag";
      tag.textContent = t;
      status.appendChild(tag);
    });
    return el;
  }

  // 定位：按钮上方居中；上方空间不足放下方；左右越界时收拢
  function position(btn) {
    var rect = btn.getBoundingClientRect();
    var tipW = tip.offsetWidth;
    var tipH = tip.offsetHeight;
    var scrollX = window.pageXOffset || document.documentElement.scrollLeft;
    var scrollY = window.pageYOffset || document.documentElement.scrollTop;

    var left = scrollX + rect.left + rect.width / 2 - tipW / 2;
    var top = scrollY + rect.top - tipH - 10;

    if (rect.top - tipH - 10 < 0) {
      // 上方空间不足：放按钮下方
      top = scrollY + rect.bottom + 10;
    }
    var minX = scrollX + 8;
    var maxX = scrollX + document.documentElement.clientWidth - tipW - 8;
    if (left < minX) left = minX;
    if (left > maxX) left = maxX;

    tip.style.left = left + "px";
    tip.style.top = top + "px";
  }

  function show(btn) {
    var data = PLACEHOLDER[btn.dataset.id];
    if (!data) {
      // 无占位数据时回退：仅显示按钮文字
      var name = btn.textContent.trim();
      if (!name) return;
      data = { name: name, desc: "", tags: [] };
    }
    render(data);
    position(btn);
    tip.classList.add("visible");
  }

  function hide() {
    if (tip) tip.classList.remove("visible");
  }

  // 按钮由 UI.renderCharButtons 动态重建，用委托模拟 mouseenter / mouseleave
  function onMouseOver(e) {
    var btn = e.target.closest ? e.target.closest(".char-btn") : null;
    if (!btn) return;
    // 在按钮内部移动时不重复触发
    if (e.relatedTarget && btn.contains(e.relatedTarget)) return;
    show(btn);
  }

  function onMouseOut(e) {
    var btn = e.target.closest ? e.target.closest(".char-btn") : null;
    if (!btn) return;
    // 移向按钮内部其他节点时不隐藏
    if (e.relatedTarget && btn.contains(e.relatedTarget)) return;
    hide();
  }

  function init() {
    ensureTip();
    document.addEventListener("mouseover", onMouseOver);
    document.addEventListener("mouseout", onMouseOut);
    // 点击切换角色时隐藏，避免残留
    document.addEventListener("click", function (e) {
      if (e.target.closest && e.target.closest(".char-btn")) hide();
    });
  }

  window.CharacterTooltip = { init: init };
})();
