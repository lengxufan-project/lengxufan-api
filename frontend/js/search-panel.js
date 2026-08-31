/* ============================================================
   search-panel.js — 全局搜索面板（Ctrl+K / 顶部 🔍 唤起）
   仅操作本文件创建的 #spMask / .sp-* 元素与 #searchTrigger
   数据来源：/api/conversations 与 /api/characters（失败时占位兜底）
   ============================================================ */
(function () {
  "use strict";

  // ===== 占位数据：接口缺失或为空时兜底 =====
  var PLACEHOLDER_CONVERSATIONS = [
    { type: "对话", title: "第 1 天 · 黄昏", snippet: "第一次见面，冷旭帆没说话，只是看了你一眼", scene: "307室" },
    { type: "对话", title: "第 3 天 · 深夜", snippet: "深夜，黄景云用粤语说了一句什么", scene: "307室" },
    { type: "对话", title: "第 7 天 · 雨后", snippet: "叶清辞摘下手表，秒针在走", scene: "天台" },
    { type: "对话", title: "第 18 天 · 雪夜", snippet: "窗外有雪，室内很安静", scene: "307室" }
  ];
  var PLACEHOLDER_SCENES = [
    { type: "场景", title: "307室 · 宿舍", snippet: "暖光 · 台灯 · 回来时亮着的房间" },
    { type: "场景", title: "天台", snippet: "冰蓝月光 · 风 · 没说完的话" },
    { type: "场景", title: "防空洞", snippet: "深灰绿 · 应急灯 · 很久以前的回声" }
  ];

  var els = { mask: null, panel: null, input: null, results: null };
  var sources = null;      // 全量搜索源（对话 / 角色 / 场景）
  var filtered = [];       // 当前过滤结果
  var activeIndex = -1;    // 当前高亮项
  var isOpen = false;

  // ===== 工具 =====
  function fetchJSON(url) {
    return fetch(url)
      .then(function (r) { return r.json(); })
      .catch(function () { return null; });
  }

  // 兼容数组与 {value:[...]} 两种返回
  function asList(data) {
    if (Array.isArray(data)) return data;
    if (data && Array.isArray(data.value)) return data.value;
    return [];
  }

  function escapeHtml(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  // ===== 数据源加载与归一化 =====
  function loadSources() {
    return Promise.all([fetchJSON("/api/conversations"), fetchJSON("/api/characters")])
      .then(function (res) {
        var list = [];

        // 对话历史
        var convItems = asList(res[0]).map(function (c) {
          if (!c) return null;
          var title = c.title || c.name || (c.day != null ? "第 " + c.day + " 天" : "");
          var snippet = c.snippet || c.summary || c.content || c.preview || "";
          if (!title && !snippet) return null;
          return { type: "对话", title: title || "(无标题)", snippet: snippet, scene: c.scene || c.location || "" };
        }).filter(Boolean);
        if (convItems.length === 0) convItems = PLACEHOLDER_CONVERSATIONS;
        list = list.concat(convItems);

        // 角色
        var charItems = asList(res[1])
          .filter(function (c) { return c && c.id && c.name; })
          .map(function (c) {
            return { type: "角色", title: c.name, snippet: c.role || c.desc || "角色 · 点击切换对话", charId: c.id };
          });
        if (charItems.length === 0) {
          charItems = [{ type: "角色", title: "冷旭帆", snippet: "角色 · 点击切换对话", charId: "lengxufan" }];
        }
        list = list.concat(charItems);

        // 场景（占位）
        list = list.concat(PLACEHOLDER_SCENES);

        sources = list;
        return list;
      });
  }

  // ===== 过滤 =====
  function filterItems(query) {
    var all = sources || [];
    if (!query) return all.slice(0, 12);
    return all.filter(function (it) {
      var hay = (it.title + " " + (it.snippet || "") + " " + (it.scene || "") + " " + it.type).toLowerCase();
      return hay.indexOf(query) !== -1;
    }).slice(0, 12);
  }

  // ===== 渲染结果 =====
  function render(query) {
    filtered = filterItems((query || "").trim().toLowerCase());

    if (filtered.length === 0) {
      els.results.innerHTML = '<div class="sp-empty">没有找到与「' + escapeHtml(query) + '」相关的结果</div>';
      activeIndex = -1;
      return;
    }

    var html = "";
    filtered.forEach(function (it, i) {
      html += '<div class="sp-item" data-index="' + i + '">' +
        '<span class="sp-badge">' + escapeHtml(it.type) + '</span>' +
        '<span class="sp-item-main">' +
          '<span class="sp-item-title">' + escapeHtml(it.title) + '</span>' +
          (it.snippet ? '<span class="sp-item-snippet">' + escapeHtml(it.snippet) + '</span>' : '') +
        '</span>' +
      '</div>';
    });
    els.results.innerHTML = html;

    Array.prototype.forEach.call(els.results.querySelectorAll(".sp-item"), function (el) {
      var idx = Number(el.getAttribute("data-index"));
      el.addEventListener("click", function () { jump(filtered[idx]); });
      el.addEventListener("mousemove", function () { setActive(idx); });
    });
    setActive(0);
  }

  // ===== 高亮项：上下键移动 =====
  function setActive(i) {
    var items = els.results.querySelectorAll(".sp-item");
    if (items.length === 0) { activeIndex = -1; return; }
    activeIndex = Math.max(0, Math.min(i, items.length - 1));
    Array.prototype.forEach.call(items, function (el, k) {
      var on = k === activeIndex;
      el.classList.toggle("active", on);
      if (on) el.scrollIntoView({ block: "nearest" });
    });
  }

  // ===== 回车跳转 =====
  function jump(item) {
    if (!item) return;
    close();

    // 角色：切换当前对话角色
    if (item.type === "角色" && item.charId) {
      if (window.State && window.State.setCurrentChar) {
        window.State.setCurrentChar({ id: item.charId, name: item.title });
        if (window.UI && window.UI.updateCharInfo) window.UI.updateCharInfo();
        if (window.UI && window.UI.addSysMsg) window.UI.addSysMsg("你转向了" + item.title);
      }
      return;
    }

    // 对话 / 场景：定位到聊天区（不在主页则跳回主页）
    var chat = document.getElementById("chat");
    if (chat) {
      chat.scrollIntoView({ behavior: "smooth", block: "start" });
      if (window.UI && window.UI.addSysMsg) window.UI.addSysMsg("已定位：" + item.title);
    } else {
      location.href = "index.html";
    }
  }

  // ===== 打开 / 关闭 =====
  function open() {
    if (!els.mask) return;
    isOpen = true;
    els.mask.classList.add("show");
    els.input.value = "";
    render("");
    // 拉取搜索源（失败时由 loadSources 内部占位兜底），完成后刷新结果
    loadSources().then(function () {
      if (isOpen) render(els.input.value);
    });
    els.input.focus();
  }

  function close() {
    if (!els.mask) return;
    isOpen = false;
    els.mask.classList.remove("show");
    els.input.blur();
  }

  // ===== 模态框 HTML（动态创建，注入 body）=====
  function buildModal() {
    els.mask = document.createElement("div");
    els.mask.id = "spMask";
    els.mask.className = "sp-mask";
    els.mask.innerHTML =
      '<div class="sp-panel" id="spPanel" role="dialog" aria-label="全局搜索">' +
        '<div class="sp-head">' +
          '<input type="text" class="sp-input" id="spInput" placeholder="搜索对话 / 角色 / 场景…" autocomplete="off">' +
          '<button type="button" class="sp-close" id="spClose" aria-label="关闭">×</button>' +
        '</div>' +
        '<div class="sp-results" id="spResults"></div>' +
        '<div class="sp-foot">↑ ↓ 选择 · Enter 跳转 · Esc 关闭 · Ctrl+K 唤起</div>' +
      '</div>';
    document.body.appendChild(els.mask);

    els.input = els.mask.querySelector("#spInput");
    els.results = els.mask.querySelector("#spResults");

    // 输入时实时过滤
    els.input.addEventListener("input", function () {
      render(els.input.value);
    });

    // 点击遮罩空白处关闭
    els.mask.addEventListener("mousedown", function (e) {
      if (e.target === els.mask) close();
    });
    els.mask.querySelector("#spClose").addEventListener("click", close);
  }

  // ===== 全局键盘：Ctrl+K 唤起 / 上下选择 / 回车跳转 / Esc 关闭 =====
  function onDocumentKeydown(e) {
    if ((e.ctrlKey || e.metaKey) && (e.key === "k" || e.key === "K")) {
      e.preventDefault();
      if (isOpen) close(); else open();
      return;
    }
    if (!isOpen) return;

    if (e.key === "Escape") {
      e.preventDefault();
      close();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive(activeIndex + 1);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive(activeIndex - 1);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filtered[activeIndex]) jump(filtered[activeIndex]);
    }
  }

  // ===== 初始化：创建模态框 + 绑定触发器 =====
  function init() {
    if (els.mask) return;  // 防重复初始化
    buildModal();
    document.addEventListener("keydown", onDocumentKeydown);

    var trigger = document.getElementById("searchTrigger");
    if (trigger) trigger.addEventListener("click", open);
  }

  // ===== 导出 =====
  window.SearchPanel = { init: init, open: open, close: close };
})();
