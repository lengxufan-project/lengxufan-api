/* ============================================================
   chat.js — 独立聊天页（window.ChatPage）
   数据契约与主页面一致：
   - POST /api/chat { message, char_id } -> { reply, state? }
   - GET  /api/state -> engine snapshot（emotion/body/mind/relationship/world...）
   自包含实现：不依赖 api.js / ui.js（chat.html 仅引用本文件）
   ============================================================ */
(function () {
  "use strict";

  /* ---------- 角色预设（与 characters.js 命名保持一致） ---------- */
  var CHARS = {
    lengxufan:    { name: "冷旭帆", greeting: "……你来了。坐吧，我刚好也在想些事。" },
    huangjingyun: { name: "黄景云", greeting: "哟，稀客啊。今天想聊点什么？" },
    yeqingci:     { name: "叶清辞", greeting: "嗯，我在听。慢慢说。" }
  };

  var runtime = {
    charId: "lengxufan",
    sending: false,
    emotionHistory: [],     // 情绪数值历史（供曲线）
    pollTimer: null
  };

  /* ---------- 工具 ---------- */
  function $(id) { return document.getElementById(id); }

  function getCharId() {
    var params = new URLSearchParams(window.location.search);
    var v = params.get("char") || params.get("char_id") || "lengxufan";
    return CHARS[v] ? v : "lengxufan";   // 未知角色回退默认
  }

  /* ---------- 消息渲染 ---------- */
  function addBubble(role, text) {
    var area = $("chatArea");
    if (!area) return null;
    var row = document.createElement("div");
    row.className = "cp-msg " + role;
    var avatar = document.createElement("div");
    avatar.className = "cp-avatar";
    var bubble = document.createElement("div");
    bubble.className = "cp-bubble";
    bubble.textContent = text || "";
    row.appendChild(avatar);
    row.appendChild(bubble);
    area.appendChild(row);
    area.scrollTop = area.scrollHeight;
    return { row: row, bubble: bubble };
  }

  /* 解析回复：以 💭 开头的行渲染为心理独白 */
  function parseSegments(text) {
    var segs = [];
    String(text || "").split("\n").forEach(function (line) {
      var t = line.trim();
      if (!t) return;
      if (t.indexOf("💭") === 0) {
        var inner = t.replace(/^💭[：:]?\s*/, "");
        if (inner) segs.push({ inner: true, text: "💭 " + inner });
      } else {
        segs.push({ inner: false, text: t });
      }
    });
    return segs;
  }

  /* 打字机：按段落/独白逐字输出，段间换行 */
  function typewriter(bubble, segments, done) {
    var caret = document.createElement("span");
    caret.className = "cp-caret";
    bubble.textContent = "";
    bubble.appendChild(caret);
    var si = 0, ci = 0;
    var curSpan = null;
    var timer = setInterval(function () {
      if (si >= segments.length) {
        clearInterval(timer);
        if (caret.parentNode) caret.parentNode.removeChild(caret);
        if (done) done();
        return;
      }
      var seg = segments[si];
      if (ci === 0) {
        curSpan = document.createElement("span");
        if (seg.inner) curSpan.className = "cp-inner";
        bubble.insertBefore(curSpan, caret);
      }
      curSpan.appendChild(document.createTextNode(seg.text.charAt(ci)));
      ci++;
      var area = $("chatArea");
      if (area) area.scrollTop = area.scrollHeight;
      if (ci >= seg.text.length) { si++; ci = 0; }
    }, 24);
  }

  /* ---------- 状态 ---------- */
  function refreshState() {
    if (!window.fetch) return;
    fetch("/api/state").then(function (r) { return r.ok ? r.json() : null; }).then(function (s) {
      if (!s) return;
      // 顶部情绪标签
      var label = $("chatEmotionLabel");
      if (label) label.textContent = s.emotion_label || (s.emotion != null ? s.emotion : "--");
      // 抽屉字段
      var set = function (id, v) { var el = $(id); if (el) el.textContent = (v == null || v === "") ? "--" : v; };
      set("drawerBody", s.body);
      set("drawerMind", s.mind);
      set("drawerRelation", s.relationship);
      set("drawerWeather", s.world && s.world.weather);
      set("drawerTime", s.world ? "第 " + (s.world.day != null ? s.world.day : "--") + " 天 · " + (s.world.time_of_day || "--") : null);
      // 情绪曲线
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
    }).catch(function () { /* 离线静默 */ });
  }

  /* ---------- 发送 ---------- */
  function sendMessage() {
    var input = $("chatInput"), btn = $("sendBtn");
    if (!input || runtime.sending) return;
    var text = input.value.trim();
    if (!text) return;

    runtime.sending = true;
    if (btn) btn.disabled = true;
    input.value = "";
    autosize(input);
    addBubble("user", text);

    var typing = addBubble("ai", "");
    if (typing) typing.bubble.textContent = "…";

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
      if (typing && typing.row.parentNode) typing.row.parentNode.removeChild(typing.row);
      var segments = parseSegments(data.reply || "（他没有回应。）");
      var bubble = addBubble("ai", "");
      if (bubble) typewriter(bubble.bubble, segments);
    }).catch(function () {
      if (typing && typing.row.parentNode) typing.row.parentNode.removeChild(typing.row);
      addBubble("ai", "（信号似乎断了……稍后再试。）");
    }).then(function () {
      runtime.sending = false;
      var b = $("sendBtn");
      if (b) b.disabled = !($("chatInput") && $("chatInput").value.trim());
    });
  }

  function autosize(el) {
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 120) + "px";
  }

  /* ---------- 抽屉 ---------- */
  function toggleDrawer(force) {
    var drawer = $("statusDrawer"), btn = $("statusToggle");
    if (!drawer) return;
    var open = typeof force === "boolean" ? force : !drawer.classList.contains("open");
    drawer.classList.toggle("open", open);
    drawer.setAttribute("aria-hidden", open ? "false" : "true");
    if (btn) btn.setAttribute("aria-expanded", open ? "true" : "false");
  }

  /* ---------- 初始化 ---------- */
  function init() {
    runtime.charId = getCharId();

    // 角色名 + 初始消息
    var conf = CHARS[runtime.charId];
    var nameEl = $("chatCharName");
    if (nameEl && conf) nameEl.textContent = conf.name;
    document.title = (conf ? conf.name : "冷旭帆") + " · 对话";
    addBubble("ai", conf ? conf.greeting : "……");

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

    // 状态抽屉开关
    var toggle = $("statusToggle");
    if (toggle) toggle.addEventListener("click", function () { toggleDrawer(); });
    var close = $("statusClose");
    if (close) close.addEventListener("click", function () { toggleDrawer(false); });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") toggleDrawer(false);
    });

    // 情绪曲线：优先复用主页面组件
    if (window.EmotionChart && $("drawerChart")) {
      try { window.EmotionChart.init("drawerChart"); } catch (err) { /* 组件异常时走数值兜底 */ }
    }

    // 状态轮询：立即 + 每 2s
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
