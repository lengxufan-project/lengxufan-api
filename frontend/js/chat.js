/* ============================================================
   chat.js — 独立聊天页（window.ChatPage）
   数据契约与主页面一致：
   - POST /api/chat { message, char_id } -> { reply, state? }
   - GET  /api/state -> engine snapshot（emotion/body/mind/relationship/world...）
   - GET  /api/conversations?char_id=xxx -> 历史消息
   自包含实现：不依赖 api.js / ui.js（chat.html 仅引用本文件）
   ============================================================ */
(function () {
  "use strict";

  /* ---------- 角色预设（与 characters.js 命名保持一致） ---------- */
  var CHARS = {
    lengxufan:    { name: "冷旭帆", greeting: "……你来了。坐吧，我刚好也在想些事。", glow: "88, 166, 255" },
    huangjingyun: { name: "黄景云", greeting: "哟，稀客啊。今天想聊点什么？", glow: "255, 170, 90" },
    yeqingci:     { name: "叶清辞", greeting: "嗯，我在听。慢慢说。",       glow: "180, 130, 255" }
  };

  /* 角色颜色映射（群聊角色区分：冷旭帆冰蓝/黄景云暖橙/叶清辞冷紫） */
  var CHAR_COLORS = {
    lengxufan: "#58a6ff",
    huangjingyun: "#f0883e",
    yeqingci: "#a371f7"
  };
  var CHAR_NAME_TO_ID = {
    "冷旭帆": "lengxufan",
    "黄景云": "huangjingyun",
    "叶清辞": "yeqingci"
  };

  var runtime = {
    charId: "lengxufan",
    isGroup: false,
    sending: false,
    emotionHistory: [],
    pollTimer: null,
    historyLoaded: false   // 防止重复加载历史
  };

  /* ---------- 工具 ---------- */
  function $(id) { return document.getElementById(id); }

  function getCharId() {
    var params = new URLSearchParams(window.location.search);
    var v = params.get("char") || params.get("char_id") || "lengxufan";
    return CHARS[v] ? v : "lengxufan";
  }

  function isGroupMode() {
    var params = new URLSearchParams(window.location.search);
    return params.get("group") === "1";
  }

  /* ---------- localStorage 历史记录（50 条上限，API 不可用时兜底） ---------- */
  function getHistoryKey() {
    return runtime.isGroup ? 'chat_history_group' : 'chat_history_' + runtime.charId;
  }
  function saveHistory(role, content, extra) {
    var key = getHistoryKey();
    var history = [];
    try {
      var stored = localStorage.getItem(key);
      if (stored) history = JSON.parse(stored);
    } catch (e) {}
    var entry = { role: role, content: content };
    if (extra) {
      if (extra.charId) entry.charId = extra.charId;
      if (extra.charName) entry.charName = extra.charName;
    }
    history.push(entry);
    if (history.length > 50) history = history.slice(-50);
    try { localStorage.setItem(key, JSON.stringify(history)); } catch (e) {}
  }
  function loadFromLocalStorage() {
    var key = getHistoryKey();
    var history = [];
    try {
      var stored = localStorage.getItem(key);
      if (stored) history = JSON.parse(stored);
    } catch (e) {}
    return history;
  }

  /* ---------- 从 API 拉取历史消息（支持 char_id 过滤） ---------- */
  function loadFromApi() {
    if (!window.fetch) return Promise.reject('no-fetch');
    var url = "/api/conversations";
    if (!runtime.isGroup) {
      url += "?char_id=" + encodeURIComponent(runtime.charId);
    } else {
      url += "?group=1";
    }
    return fetch(url).then(function (r) {
      if (!r.ok) return Promise.reject('http-' + r.status);
      return r.json();
    }).then(function (data) {
      var list = Array.isArray(data) ? data : (data && data.value ? data.value : null);
      if (!list || !list.length) return Promise.reject('empty');
      return list;
    });
  }

  /* ---------- 解析消息：拆分主体、动作描写、内心独白 ----------
     - 💭 / 💡 开头行 → 内心独白（淡蓝、引号、独立样式）
     - 以（） 或 [] 包裹的整行 / 句首句尾括号 → 动作描写（灰色斜体、气泡下方）
     - 其余 → 正文
  */
  function parseMessage(text) {
    var actions = [];
    var segments = [];
    String(text || "").split("\n").forEach(function (line) {
      var t = line.trim();
      if (!t) return;
      // 内心独白
      if (t.indexOf("💭") === 0 || t.indexOf("💡") === 0) {
        var prefix = t.charAt(0);
        var inner = t.replace(/^[💭💡][：:]?\s*/, "");
        if (inner) segments.push({ type: "inner", text: prefix + " " + inner });
        return;
      }
      // 动作描写：整行用括号包裹
      var actionMatch = t.match(/^[（\(\[【]([^）\)\]】]+)[）\)\]】]$/);
      if (actionMatch && actionMatch[1].trim()) {
        actions.push(actionMatch[1].trim());
        return;
      }
      // 句尾括号内内容 → 动作描写
      var tailMatch = t.match(/^(.*?)\s*[（\(\[【]([^）\)\]】]+)[）\)\]】]\s*$/);
      if (tailMatch && tailMatch[2] && tailMatch[1]) {
        actions.push(tailMatch[2].trim());
        var rest = tailMatch[1].trim();
        if (rest) segments.push({ type: "normal", text: rest });
        return;
      }
      segments.push({ type: "normal", text: t });
    });
    return { actions: actions, segments: segments };
  }

  /* ---------- 渲染气泡（支持动作描写/独白/群聊角色颜色） ---------- */
  function formatTime() {
    var d = new Date();
    var h = d.getHours();
    var m = d.getMinutes();
    return (h < 10 ? "0" + h : h) + ":" + (m < 10 ? "0" + m : m);
  }

  function getCharColor(charIdOrName) {
    if (CHAR_COLORS[charIdOrName]) return CHAR_COLORS[charIdOrName];
    var id = CHAR_NAME_TO_ID[charIdOrName];
    if (id && CHAR_COLORS[id]) return CHAR_COLORS[id];
    return "#58a6ff";
  }

  function addBubble(role, text, opts) {
    var area = $("chatArea");
    if (!area) return null;
    opts = opts || {};

    var charId = opts.charId || (runtime.isGroup ? null : runtime.charId);
    var charName = opts.charName || null;
    var parsed = parseMessage(text);

    var row = document.createElement("div");
    row.className = "cp-msg " + role;
    if (opts.isGroupMsg) row.classList.add("cp-group-msg");

    // 头像（任务一：可点击跳转角色详情；任务二：多样式 CSS 类名）
    var avatar = document.createElement("div");
    avatar.className = "cp-avatar";
    if (role === "user") {
      avatar.classList.add("cp-avatar-user");
    } else if (charId && CHAR_COLORS[charId]) {
      avatar.classList.add("cp-avatar-" + charId);
    } else if (charName && CHAR_NAME_TO_ID[charName]) {
      avatar.classList.add("cp-avatar-" + CHAR_NAME_TO_ID[charName]);
    } else {
      // 兜底：冰蓝
      avatar.classList.add("cp-avatar-lengxufan");
    }
    // 点击头像跳转角色详情（仅非用户消息）
    if (role !== "user") {
      (function (targetId) {
        avatar.addEventListener("click", function (e) {
          e.stopPropagation();
          if (targetId) {
            window.location.href = "character-profile.html?char=" + encodeURIComponent(targetId);
          }
        });
      })(charId || (charName && CHAR_NAME_TO_ID[charName]) || null);
    }

    // 气泡包裹（群聊包含角色名）
    var wrap = document.createElement("div");
    wrap.className = "cp-bubble-wrap";

    // 群聊/带角色名场景：角色名单独占一行 + 加粗 + 染色
    if (charName || (opts.showCharName && CHARS[charId])) {
      var displayName = charName || CHARS[charId].name;
      var nameEl = document.createElement("div");
      nameEl.className = "cp-msg-name";
      var cid = charId || CHAR_NAME_TO_ID[displayName] || "lengxufan";
      nameEl.style.color = getCharColor(cid);
      nameEl.textContent = displayName;
      wrap.appendChild(nameEl);
    }

    // 气泡：渲染段落
    var bubble = document.createElement("div");
    bubble.className = "cp-bubble";
    if (parsed.segments.length === 0 && parsed.actions.length === 0) {
      // 空气泡（打字中占位等）
      bubble.textContent = "";
    } else {
      parsed.segments.forEach(function (seg, i) {
        var sp = document.createElement("span");
        if (seg.type === "inner") {
          sp.className = "cp-inner";
          sp.textContent = "\u201c" + seg.text + "\u201d";
        } else {
          sp.className = "cp-line";
          sp.textContent = seg.text;
        }
        bubble.appendChild(sp);
        if (i < parsed.segments.length - 1) {
          bubble.appendChild(document.createElement("br"));
        }
      });
    }
    wrap.appendChild(bubble);

    // 动作描写：气泡下方灰色小字斜体
    if (parsed.actions.length > 0) {
      var actBox = document.createElement("div");
      actBox.className = "cp-action-desc";
      actBox.textContent = parsed.actions.join("；");
      wrap.appendChild(actBox);
    }

    // 时间戳
    var ts = document.createElement("span");
    ts.className = "cp-msg-time";
    ts.textContent = formatTime();

    row.appendChild(avatar);
    row.appendChild(wrap);
    row.appendChild(ts);
    area.appendChild(row);
    area.scrollTop = area.scrollHeight;

    // 新消息气泡淡入动画（仅 AI 新消息，历史记录跳过）
    if (role === "ai" && !opts.skipAnim) {
      row.classList.add("cp-msg-anim");
    }

    return { row: row, bubble: bubble };
  }

  /* ---------- 情绪曲线模块动态加载 ---------- */
  var chartAssetsRequested = false;
  function initDrawerChart() {
    if (!(window.EmotionChart && $("drawerChart"))) return;
    try {
      window.EmotionChart.init("drawerChart");
      window.EmotionChart.update(runtime.emotionHistory);
    } catch (err) {}
  }
  function loadEmotionChartAssets() {
    if (chartAssetsRequested) return;
    chartAssetsRequested = true;
    var head = document.head;
    if (!head.querySelector('link[data-emotion-chart]')) {
      var link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = "css/emotion-chart.css";
      link.setAttribute("data-emotion-chart", "1");
      head.appendChild(link);
    }
    if (window.EmotionChart) { initDrawerChart(); return; }
    if (head.querySelector('script[data-emotion-chart]')) return;
    var script = document.createElement("script");
    script.src = "js/emotion-chart.js";
    script.setAttribute("data-emotion-chart", "1");
    script.onload = initDrawerChart;
    script.onerror = function () {};
    head.appendChild(script);
  }

  /* ---------- 状态 ---------- */
  function refreshState() {
    if (!window.fetch) return;
    fetch("/api/state").then(function (r) { return r.ok ? r.json() : null; }).then(function (s) {
      if (!s) return;
      var label = $("chatEmotionLabel");
      if (label) label.textContent = s.emotion_label || (s.emotion != null ? s.emotion : "--");
      var set = function (id, v) { var el = $(id); if (el) el.textContent = (v == null || v === "") ? "--" : v; };
      set("drawerBody", s.body);
      set("drawerMind", s.mind);
      set("drawerRelation", s.relationship);
      set("drawerWeather", s.world && s.world.weather);
      set("drawerTime", s.world ? "第 " + (s.world.day != null ? s.world.day : "--") + " 天 · " + (s.world.time_of_day || "--") : null);
      if (s.emotion != null) {
        runtime.emotionHistory.push(s.emotion);
        if (runtime.emotionHistory.length > 20) runtime.emotionHistory.shift();
        if (window.EmotionChart && $("drawerChart")) {
          window.EmotionChart.update(runtime.emotionHistory);
        } else {
          var host = $("drawerChart");
          if (host && !host.firstChild) {
            var fb = document.createElement("div");
            fb.className = "cp-fallback-chart";
            host.appendChild(fb);
          }
          var fb2 = host && host.firstChild;
          if (fb2) fb2.textContent = "当前情绪值：" + s.emotion + (s.emotion_label ? "（" + s.emotion_label + "）" : "");
        }
      }
    }).catch(function () {});
  }

  /* ---------- 加载 & 渲染历史消息（API 优先，失败则 localStorage） ---------- */
  function renderHistoryFromEntries(entries) {
    var area = $("chatArea");
    if (!area || !entries || !entries.length) return false;
    area.innerHTML = "";
    entries.forEach(function (entry) {
      var role = entry.role === "user" ? "user" : "ai";
      if (entry.charId || entry.charName) {
        // 群聊消息：带角色
        addBubble(role, entry.content, {
          isGroupMsg: true,
          charId: entry.charId,
          charName: entry.charName,
          showCharName: true,
          skipAnim: true
        });
      } else {
        addBubble(role, entry.content, { skipAnim: true });
      }
    });
    return true;
  }

  function loadAndRenderHistory(onDone) {
    // 群聊模式：不调用 API（后端无群聊专属历史接口），仅加载 localStorage 群聊历史
    if (runtime.isGroup) {
      var local = loadFromLocalStorage();
      if (local.length) {
        renderHistoryFromEntries(local);
        runtime.historyLoaded = true;
      }
      if (onDone) onDone(runtime.historyLoaded);
      return;
    }
    // 单聊模式：API 优先，失败则回退 localStorage
    loadFromApi().then(function (list) {
      // API 返回格式归一化
      var entries = list.map(function (item) {
        return {
          role: item.role || (item.sender === "user" ? "user" : "ai"),
          content: item.content || item.message || item.text || "",
          charId: item.char_id || item.charId,
          charName: item.name || item.char_name || item.charName
        };
      }).filter(function (e) { return e.content; });
      if (entries.length) {
        renderHistoryFromEntries(entries);
        runtime.historyLoaded = true;
      }
      if (onDone) onDone(runtime.historyLoaded);
    }).catch(function () {
      // API 失败：回退 localStorage
      var local = loadFromLocalStorage();
      if (local.length) {
        renderHistoryFromEntries(local);
        runtime.historyLoaded = true;
      }
      if (onDone) onDone(runtime.historyLoaded);
    });
  }

  /* ---------- 发送（单聊：直接发送，等待回复气泡） ---------- */
  function sendMessage() {
    var input = $("chatInput"), btn = $("sendBtn");
    if (!input || runtime.sending) return;
    var text = input.value.trim();
    if (!text) return;

    runtime.sending = true;
    if (btn) btn.disabled = true;
    input.value = "";
    autosize(input);

    // 1. 立即显示用户自己的消息
    addBubble("user", text, {});
    saveHistory("user", text);

    if (runtime.isGroup) {
      sendGroupMessage(text);
      return;
    }

    // 2. 直接等待回复气泡
    if (!window.fetch) {
      runtime.sending = false;
      if (btn) btn.disabled = false;
      return;
    }
    fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: text, char_id: runtime.charId })
    }).then(function (r) { return r.ok ? r.json() : Promise.reject(r.status); }).then(function (data) {
      // 3. 完整显示回复
      var replyText = data.reply || "\uff08\u4ed6\u6ca1\u6709\u56de\u5e94\u3002\uff09";
      addBubble("ai", replyText, {});
      saveHistory("ai", replyText, { charId: runtime.charId, charName: CHARS[runtime.charId] ? CHARS[runtime.charId].name : null });
      refreshState();
    }).catch(function () {
      var errText = "\uff08\u4fe1\u53f7\u4f3c\u4e4e\u65ad\u4e86\u2026\u2026\u7a0d\u540e\u518d\u8bd5\u3002\uff09";
      addBubble("ai", errText, {});
      saveHistory("ai", errText);
    }).then(function () {
      runtime.sending = false;
      var b = $("sendBtn");
      if (b) b.disabled = !($("chatInput") && $("chatInput").value.trim());
    });
  }

  /* ---------- 群聊串行发送：全部获取后，依次完整弹出，带随机间隔 ---------- */
  function sendGroupMessage(text) {
    if (!window.fetch) {
      runtime.sending = false;
      var btn0 = $("sendBtn");
      if (btn0) btn0.disabled = false;
      return;
    }
    fetch("/api/group_chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: text })
    }).then(function (r) { return r.ok ? r.json() : Promise.reject(r.status); }).then(function (data) {
      var replies = data.replies || [];
      // 串行处理：按角色顺序依次完整弹出
      processRepliesSequentially(replies, 0);
      refreshState();
    }).catch(function () {
      runtime.sending = false;
      var b = $("sendBtn");
      if (b) b.disabled = !($("chatInput") && $("chatInput").value.trim());
      var err = "\uff08\u7fa4\u804a\u4f3c\u4e4e\u4e2d\u65ad\u4e86\u2026\u2026\u7a0d\u540e\u518d\u8bd5\u3002\uff09";
      addBubble("ai", err, {});
      saveHistory("ai", err);
    });
  }

  /* ---------- 群聊回复串行渲染（依次完整弹出，800-1500ms 随机间隔） ---------- */
  function processRepliesSequentially(replies, index) {
    if (index >= replies.length) {
      runtime.sending = false;
      var b = $("sendBtn");
      if (b) b.disabled = !($("chatInput") && $("chatInput").value.trim());
      return;
    }
    var reply = replies[index];
    var rname = reply.name || reply.char_id || "?";
    var rid = reply.char_id || CHAR_NAME_TO_ID[rname] || null;
    var replyText = reply.reply || "\uff08\u6ca1\u6709\u56de\u5e94\uff09";

    addBubble("ai", replyText, {
      isGroupMsg: true,
      charId: rid,
      charName: rname,
      showCharName: true
    });
    saveHistory("ai", replyText, { charId: rid, charName: rname });

    var delay = 800 + Math.random() * 700; // 800-1500ms
    setTimeout(function () {
      processRepliesSequentially(replies, index + 1);
    }, delay);
  }

  function autosize(el) {
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 120) + "px";
  }

  /* ---------- 长按/右键菜单 + Toast提示 ---------- */
  var ctxMenu = null;
  var ctxActiveRow = null;
  var toastTimer = null;

  function showToast(text) {
    var toast = $("cpToast");
    if (!toast) return;
    if (toastTimer) {
      clearTimeout(toastTimer);
      toastTimer = null;
    }
    toast.textContent = text;
    toast.style.display = "block";
    toast.classList.remove("hide");
    // Force reflow
    void toast.offsetWidth;
    toast.classList.add("show");
    toastTimer = setTimeout(function () {
      toast.classList.remove("show");
      toast.classList.add("hide");
      setTimeout(function () {
        toast.style.display = "none";
        toastTimer = null;
      }, 250);
    }, 1500);
  }

  function initContextMenu() {
    ctxMenu = $("contextMenu");
    if (!ctxMenu) return;

    // 点击菜单项
    ctxMenu.addEventListener("click", function (e) {
      var item = e.target.closest(".context-menu-item");
      if (!item) return;
      var action = item.getAttribute("data-action");
      var stub = item.getAttribute("data-stub");
      if (stub) {
        showToast("功能开发中");
        hideContextMenu();
        return;
      }
      if (action === "copy") {
        copyMessageText();
        showToast("已复制");
      }
      hideContextMenu();
    });

    // 点击菜单外关闭
    document.addEventListener("click", function (e) {
      if (ctxMenu.style.display !== "none" && !ctxMenu.contains(e.target)) {
        hideContextMenu();
      }
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") hideContextMenu();
    });
  }

  function showContextMenu(x, y, row) {
    if (!ctxMenu) return;
    ctxActiveRow = row;
    ctxMenu.style.display = "flex";
    // 边界处理：防止菜单溢出视口
    var mw = ctxMenu.offsetWidth || 150;
    var mh = ctxMenu.offsetHeight || 200;
    var vw = window.innerWidth;
    var vh = window.innerHeight;
    var fx = Math.min(x, vw - mw - 8);
    var fy = Math.min(y, vh - mh - 8);
    ctxMenu.style.left = Math.max(8, fx) + "px";
    ctxMenu.style.top = Math.max(8, fy) + "px";
  }

  function hideContextMenu() {
    if (!ctxMenu) return;
    ctxMenu.style.display = "none";
    ctxActiveRow = null;
  }

  function copyMessageText() {
    if (!ctxActiveRow) return;
    var bubble = ctxActiveRow.querySelector(".cp-bubble");
    if (!bubble) return;
    var text = bubble.textContent || "";
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).catch(function () {});
    } else {
      // fallback
      var ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand("copy"); } catch (e) {}
      document.body.removeChild(ta);
    }
  }

  function setupMessageContextMenu() {
    var area = $("chatArea");
    if (!area) return;

    // 桌面端：右键
    area.addEventListener("contextmenu", function (e) {
      var row = e.target.closest(".cp-msg");
      if (!row) return;
      e.preventDefault();
      showContextMenu(e.clientX, e.clientY, row);
    });

    // 移动端：长按
    var longPressTimer = null;
    area.addEventListener("touchstart", function (e) {
      var row = e.target.closest(".cp-msg");
      if (!row) return;
      longPressTimer = setTimeout(function () {
        var touch = e.touches[0];
        showContextMenu(touch.clientX, touch.clientY, row);
      }, 600);
    }, { passive: true });
    area.addEventListener("touchmove", function () {
      if (longPressTimer) { clearTimeout(longPressTimer); longPressTimer = null; }
    }, { passive: true });
    area.addEventListener("touchend", function () {
      if (longPressTimer) { clearTimeout(longPressTimer); longPressTimer = null; }
    });
  }

  /* ---------- 抽屉 ---------- */
  function toggleDrawer(force) {
    var drawer = $("statusDrawer"), btn = $("statusToggle"), mask = $("drawerMask");
    if (!drawer) return;
    var open = typeof force === "boolean" ? force : !drawer.classList.contains("open");
    drawer.classList.toggle("open", open);
    if (mask) mask.classList.toggle("show", open);
    drawer.setAttribute("aria-hidden", open ? "false" : "true");
    if (btn) btn.setAttribute("aria-expanded", open ? "true" : "false");
  }

  /* ---------- 角色光晕 ---------- */
  function applyCharGlow(charId) {
    var glow = "88, 166, 255";
    if (charId && CHARS[charId] && CHARS[charId].glow) {
      glow = CHARS[charId].glow;
    }
    var page = document.querySelector(".cp-page");
    if (page) {
      page.style.setProperty("--char-glow", glow);
    }
  }

  /* ---------- 初始化 ---------- */
  function init() {
    runtime.charId = getCharId();
    runtime.isGroup = isGroupMode();

    applyCharGlow(runtime.isGroup ? null : runtime.charId);

    // 任务三：标题详情按钮 / 设置按钮
    var detailBtn = $("chatDetailBtn");
    if (detailBtn) {
      if (runtime.isGroup) {
        detailBtn.style.display = "none";
      } else {
        detailBtn.href = "character-profile.html?char=" + encodeURIComponent(runtime.charId);
        detailBtn.style.display = "";
      }
    }

    if (runtime.isGroup) {
      var nameEl = $("chatCharName");
      if (nameEl) nameEl.textContent = "307\u5ba4\u591a\u4eba\u5bf9\u8bdd";
      document.title = "\u7fa4\u804a \u00b7 \u5bf9\u8bdd";
    } else {
      var conf = CHARS[runtime.charId];
      var nameEl2 = $("chatCharName");
      if (nameEl2 && conf) nameEl2.textContent = conf.name;
      document.title = (conf ? conf.name : "\u51b7\u65ed\u5e06") + " \u00b7 \u5bf9\u8bdd";
    }

    // 历史消息加载（API → localStorage 兜底），有历史则跳过问候
    loadAndRenderHistory(function (loaded) {
      if (!loaded) {
        if (runtime.isGroup) {
          addBubble("ai", "\u6b22\u8fce\u8fdb\u5165\u7fa4\u804a\uff0c\u5927\u5bb6\u6b63\u5728\u804a\u5929\u2026\u2026", { skipAnim: true });
        } else {
          var conf2 = CHARS[runtime.charId];
          addBubble("ai", conf2 ? conf2.greeting : "\u2026\u2026", { skipAnim: true });
        }
      }
    });

    // 输入区事件
    var input = $("chatInput"), btn = $("sendBtn");
    if (input) {
      input.addEventListener("input", function () {
        autosize(input);
        var b = $("sendBtn");
        if (b) b.disabled = !input.value.trim();
      });
      input.addEventListener("keydown", function (e) {
        if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
      });
    }
    if (btn) btn.addEventListener("click", sendMessage);

    // 抽屉开关（群聊模式：三条杠按钮显示占位提示，不打开状态抽屉）
    var toggle = $("statusToggle");
    if (toggle) {
      toggle.addEventListener("click", function () {
        if (runtime.isGroup) {
          alert("群聊设置（开发中）");
          return;
        }
        toggleDrawer();
      });
    }
    var close = $("statusClose");
    if (close) close.addEventListener("click", function () { toggleDrawer(false); });
    var mask = $("drawerMask");
    if (mask) mask.addEventListener("click", function () { toggleDrawer(false); });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") toggleDrawer(false);
    });

    // 长按/右键菜单（任务六）
    initContextMenu();
    setupMessageContextMenu();

    // 情绪曲线
    if (window.EmotionChart && $("drawerChart")) {
      initDrawerChart();
    } else {
      loadEmotionChartAssets();
    }

    // 状态轮询
    refreshState();
    runtime.pollTimer = setInterval(refreshState, 2000);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  window.ChatPage = { init: init };
})();

/* 移动端键盘弹起时保持输入框可见 */
(function () {
  if (!window.visualViewport) return;
  var chatPage = document.querySelector('.cp-page');
  if (!chatPage) return;
  var inputBar = document.querySelector('.cp-input-bar');
  if (!inputBar) return;
  function adjustForKeyboard() {
    var diff = window.innerHeight - window.visualViewport.height;
    if (diff > 100) {
      inputBar.style.position = 'fixed';
      inputBar.style.bottom = (window.innerHeight - window.visualViewport.height) + 'px';
      inputBar.style.left = '0';
      inputBar.style.right = '0';
    } else {
      inputBar.style.position = '';
      inputBar.style.bottom = '';
      inputBar.style.left = '';
      inputBar.style.right = '';
    }
  }
  window.visualViewport.addEventListener('resize', adjustForKeyboard);
  window.visualViewport.addEventListener('scroll', adjustForKeyboard);
})();

/* 统一返回逻辑 */
window.goBack = function () {
  if (history.length > 1) {
    history.back();
  } else {
    window.location.href = "index.html?skipIntro=1";
  }
};
