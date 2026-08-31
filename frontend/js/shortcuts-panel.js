/* ============================================================
   shortcuts-panel.js — 键盘快捷键面板（按 ? 唤起）
   仅操作本文件创建的 #scpMask / .scp-* 元素
   点击列表中的快捷键行可模拟触发对应功能：
   直接调用模块 API，场景切换通过合成 ← → 键盘事件复用
   js/scene-shortcut.js 的现有监听
   ============================================================ */
(function () {
  "use strict";

  // ===== 快捷键配置（分组渲染）=====
  var GROUPS = [
    {
      label: "消息输入",
      items: [
        { keys: ["Enter"], desc: "发送当前消息", action: "send" },
        { keys: ["Shift", "Enter"], desc: "输入框内换行", action: "newline" }
      ]
    },
    {
      label: "全局",
      items: [
        { keys: ["Ctrl", "K"], desc: "打开全局搜索", action: "search" },
        { keys: ["Esc"], desc: "关闭面板 / 提示", action: "esc" },
        { keys: ["?"], desc: "打开本快捷键面板", action: "self" }
      ]
    },
    {
      label: "场景",
      items: [
        { keys: ["←"], desc: "切换到上一个场景", action: "left" },
        { keys: ["→"], desc: "切换到下一个场景", action: "right" }
      ]
    }
  ];

  var els = { mask: null, panel: null, body: null };
  var isOpen = false;

  // ===== 模拟触发对应功能 =====
  function runAction(name) {
    switch (name) {
      case "send":
        if (window.Chat && window.Chat.send) window.Chat.send();
        break;
      case "newline": {
        var input = document.getElementById("input");
        if (input) {
          input.value += "\n";
          input.focus();
          // 触发 input 事件，兼容可能的自动增高逻辑
          input.dispatchEvent(new Event("input", { bubbles: true }));
        }
        break;
      }
      case "search":
        if (window.SearchPanel && window.SearchPanel.open) {
          window.SearchPanel.open();
        }
        break;
      case "esc":
        close();
        break;
      case "self":
        // 已处于打开状态，仅保持
        open();
        break;
      case "left":
      case "right":
        // 合成键盘事件，复用 scene-shortcut.js 的场景切换监听
        document.dispatchEvent(new KeyboardEvent("keydown", {
          key: name === "left" ? "ArrowLeft" : "ArrowRight",
          bubbles: true
        }));
        break;
    }
  }

  // ===== 构建面板 HTML =====
  function buildPanel() {
    var html = "";
    GROUPS.forEach(function (group) {
      html += '<div class="scp-group">' + group.label + "</div>";
      group.items.forEach(function (item) {
        var keysHtml = item.keys.map(function (k) {
          return '<span class="sc-key">' + k + "</span>";
        }).join("");
        html += '<div class="scp-row" data-action="' + item.action + '">' +
          '<span class="scp-keys">' + keysHtml + "</span>" +
          '<span class="scp-desc">' + item.desc + "</span>" +
        "</div>";
      });
    });

    els.mask = document.createElement("div");
    els.mask.id = "scpMask";
    els.mask.className = "scp-mask";
    els.mask.innerHTML =
      '<div class="scp-panel" id="scpPanel" role="dialog" aria-label="键盘快捷键">' +
        '<div class="scp-head">' +
          '<span class="scp-title">键盘快捷键</span>' +
          '<button type="button" class="scp-close" id="scpClose" aria-label="关闭">×</button>' +
        "</div>" +
        '<div class="scp-body" id="scpBody">' + html + "</div>" +
        '<div class="scp-foot">点击任意快捷键行可模拟触发 · 随时按 ? 唤起</div>' +
      "</div>";
    document.body.appendChild(els.mask);

    els.panel = els.mask.querySelector("#scpPanel");
    els.body = els.mask.querySelector("#scpBody");

    // 点击快捷键行 → 模拟触发；点击遮罩空白 / 关闭按钮 → 关闭
    Array.prototype.forEach.call(els.body.querySelectorAll(".scp-row"), function (row) {
      row.addEventListener("click", function () {
        runAction(row.getAttribute("data-action"));
      });
    });
    els.mask.addEventListener("mousedown", function (e) {
      if (e.target === els.mask) close();
    });
    els.mask.querySelector("#scpClose").addEventListener("click", close);
  }

  // ===== ? 键监听：输入框内不触发 =====
  function onDocumentKeydown(e) {
    if (e.key === "?" && !e.ctrlKey && !e.metaKey && !e.altKey) {
      var t = e.target;
      var tag = t && t.tagName;
      var inEditor = tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" ||
        (t && t.isContentEditable);
      if (inEditor) return;
      e.preventDefault();
      if (isOpen) close(); else open();
      return;
    }
    // 面板打开时 Esc 关闭
    if (isOpen && e.key === "Escape") {
      e.preventDefault();
      close();
    }
  }

  // ===== 打开 / 关闭 =====
  function open() {
    if (!els.mask) return;
    isOpen = true;
    els.mask.classList.add("show");
  }

  function close() {
    if (!els.mask) return;
    isOpen = false;
    els.mask.classList.remove("show");
  }

  // ===== 初始化 =====
  function init() {
    if (els.mask) return;  // 防重复初始化
    buildPanel();
    document.addEventListener("keydown", onDocumentKeydown);
  }

  // ===== 导出 =====
  window.ShortcutsPanel = { init: init, open: open, close: close };
})();
