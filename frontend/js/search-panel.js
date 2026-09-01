/* ============================================================
   search-panel.js — 全局命令面板（Ctrl+K / 顶部 🔍 唤起）
   类似 VSCode / ChatGPT Command Palette
   分类：全部 / 聊天记录 / 角色 / 场景
   仅操作本文件动态创建的 #spMask / .sp-* 元素与 #searchTrigger
   数据：硬编码预设（不依赖后端 API，避免乱码）
   ============================================================ */
(function () {
  "use strict";

  /* ============ 硬编码预设数据 ============ */
  var PRESETS = {
    chat: [
      { type: "chat",  title: "第 1 天 · 黄昏",   target: "index.html" },
      { type: "chat",  title: "第 3 天 · 深夜",   target: "index.html" },
      { type: "chat",  title: "第 7 天 · 雨后",   target: "index.html" },
      { type: "chat",  title: "第 12 天 · 清晨",  target: "index.html" },
      { type: "chat",  title: "第 18 天 · 雪夜",  target: "index.html" }
    ],
    char: [
      { type: "char",  title: "冷旭帆",  target: "character-profile.html?char=lengxufan",   avatar: "冷" },
      { type: "char",  title: "黄景云",  target: "character-profile.html?char=huangjingyun", avatar: "黄" },
      { type: "char",  title: "叶清辞",  target: "character-profile.html?char=yeqingci",     avatar: "叶" }
    ],
    scene: [
      { type: "scene", title: "307室",   target: "index.html" },
      { type: "scene", title: "天台",    target: "index.html" },
      { type: "scene", title: "训练场",  target: "index.html" }
    ]
  };

  var TABS = [
    { key: "all",   label: "全部" },
    { key: "chat",  label: "聊天记录" },
    { key: "char",  label: "角色" },
    { key: "scene", label: "场景" }
  ];

  /* ============ 状态 ============ */
  var els = { mask: null, panel: null, input: null, tabs: null, results: null };
  var activeTab = "all";      // 默认"全部"
  var filtered = [];          // 当前结果
  var activeIndex = -1;       // 当前高亮
  var isOpen = false;

  /* ============ 工具 ============ */
  function escapeHtml(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  /* ============ 数据获取 ============ */
  function allItems() {
    return PRESETS.chat.concat(PRESETS.char, PRESETS.scene);
  }

  function getItems(tabKey) {
    if (tabKey === "all") return allItems();
    return PRESETS[tabKey] || [];
  }

  function typeLabel(t) {
    return t === "chat" ? "聊天" : t === "char" ? "角色" : "场景";
  }

  function typeIconClass(t) {
    return t === "chat" ? "chat" : t === "char" ? "char" : "scene";
  }

  /* ============ 过滤 ============ */
  function filterItems(query) {
    var items = getItems(activeTab);
    var q = (query || "").trim().toLowerCase();
    if (!q) return items.slice(0, 8);
    return items.filter(function (it) {
      return (it.title || "").toLowerCase().indexOf(q) !== -1;
    }).slice(0, 8);
  }

  /* ============ 渲染 Tab ============ */
  function renderTabs() {
    if (!els.tabs) return;
    els.tabs.innerHTML = "";
    TABS.forEach(function (t) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "sp-tab" + (t.key === activeTab ? " active" : "");
      btn.textContent = t.label;
      btn.dataset.tab = t.key;
      btn.addEventListener("click", function () {
        activeTab = t.key;
        renderTabs();
        render(els.input.value);
      });
      els.tabs.appendChild(btn);
    });
  }

  /* ============ 渲染结果 ============ */
  function render(query) {
    filtered = filterItems(query);

    if (filtered.length === 0) {
      els.results.innerHTML =
        '<div class="sp-empty">没有找到与「' + escapeHtml(query) + '」相关的结果</div>';
      activeIndex = -1;
      return;
    }

    var html = "";
    filtered.forEach(function (it, i) {
      var iconClass = typeIconClass(it.type);
      var iconContent = "";
      if (iconClass === "char") {
        iconContent = '<div class="sp-icon char">' + escapeHtml(it.avatar || (it.title && it.title.charAt(0)) || "?") + '</div>';
      } else {
        iconContent = '<div class="sp-icon ' + iconClass + '"></div>';
      }
      html +=
        '<div class="sp-item" data-index="' + i + '">' +
          iconContent +
          '<div class="sp-item-main">' + escapeHtml(it.title) + '</div>' +
          '<div class="sp-type-label ' + iconClass + '">' + typeLabel(it.type) + '</div>' +
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

  /* ============ 高亮项 ============ */
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

  /* ============ 跳转 ============ */
  function jump(item) {
    if (!item) return;
    close();
    if (item.target) {
      location.href = item.target;
    }
  }

  /* ============ 打开 / 关闭 ============ */
  function open(initialQuery) {
    if (!els.mask) return;
    isOpen = true;
    els.mask.classList.add("show");
    var q = (initialQuery != null ? String(initialQuery) : "");
    els.input.value = q;
    renderTabs();
    render(q);
    // 如果有初始查询，聚焦时选中全部文本方便继续输入
    if (q) {
      els.input.focus();
      els.input.select();
    } else {
      els.input.focus();
    }
  }

  function close() {
    if (!els.mask) return;
    isOpen = false;
    els.mask.classList.remove("show");
    els.input.blur();
    // 同步清理侧边栏输入（如果面板输入为空）
    var sidebarInput = document.getElementById("sidebarSearchInput");
    if (sidebarInput && !els.input.value.trim() && sidebarInput.value) {
      sidebarInput.value = "";
    }
  }

  /* ============ 构建模态框 ============ */
  function buildModal() {
    els.mask = document.createElement("div");
    els.mask.id = "spMask";
    els.mask.className = "sp-mask";
    els.mask.innerHTML =
      '<div class="sp-panel" id="spPanel" role="dialog" aria-label="全局搜索">' +
        '<div class="sp-head">' +
          '<div class="sp-input-wrap">' +
            '<span class="sp-search-icon">🔍</span>' +
            '<input type="text" class="sp-input" id="spInput" placeholder="搜索对话、角色、场景..." autocomplete="off">' +
          '</div>' +
          '<span class="sp-esc-tag">Esc</span>' +
        '</div>' +
        '<div class="sp-tabs" id="spTabs"></div>' +
        '<div class="sp-results" id="spResults"></div>' +
        '<div class="sp-foot">' +
          '<span>↑↓ 选择 · Enter 跳转 · Esc 关闭</span>' +
        '</div>' +
      '</div>';
    document.body.appendChild(els.mask);

    els.input   = els.mask.querySelector("#spInput");
    els.tabs    = els.mask.querySelector("#spTabs");
    els.results = els.mask.querySelector("#spResults");

    // 输入实时过滤
    els.input.addEventListener("input", function () {
      render(els.input.value);
    });

    // 点击遮罩关闭
    els.mask.addEventListener("mousedown", function (e) {
      if (e.target === els.mask) close();
    });
  }

  /* ============ 键盘 ============ */
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

  /* ============ 侧边栏搜索输入同步 ============ */
  function syncSidebarInput() {
    var sidebarInput = document.getElementById("sidebarSearchInput");
    if (!sidebarInput) return;

    // 输入时实时同步到面板
    sidebarInput.addEventListener("input", function () {
      var val = sidebarInput.value;
      if (isOpen) {
        // 面板已打开 → 更新面板输入并重新过滤
        els.input.value = val;
        render(val);
      } else if (val.trim()) {
        // 面板未打开但有输入 → 打开面板并带入查询
        open(val);
      }
    });

    // 聚焦时打开面板（如果尚未打开）
    sidebarInput.addEventListener("focus", function () {
      if (!isOpen) {
        var val = sidebarInput.value;
        open(val || "");
      }
    });
  }

  /* ============ 初始化 ============ */
  function init() {
    if (els.mask) return;
    buildModal();
    document.addEventListener("keydown", onDocumentKeydown);

    var trigger = document.getElementById("searchTrigger");
    if (trigger) {
      trigger.addEventListener("click", function (e) {
        // 如果点击的是输入框本身，不重复触发（focus 事件已处理）
        if (e.target && e.target.tagName === "INPUT") return;
        var sidebarInput = document.getElementById("sidebarSearchInput");
        var val = sidebarInput ? sidebarInput.value : "";
        open(val || "");
      });
    }

    // 绑定侧边栏输入同步
    syncSidebarInput();
  }

  window.SearchPanel = { init: init, open: open, close: close };
})();
