/* UI 工具函数：渲染气泡、打字机、状态栏、角色按钮等所有 DOM 操作 */
(function () {
  "use strict";

  var chatEl = document.getElementById("chat");

  // ---------- 工具 ----------
  function escapeText(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
  // 情绪颜色：<30 冷色，30-70 中性，>70 暖色
  function emotionColor(v) {
    v = Number(v) || 0;
    if (v < 30) return "#4a8fd9";
    if (v <= 70) return "#7fb86b";
    return "#e07b3a";
  }
  // 天气 emoji
  function weatherEmoji(w) {
    w = w || "";
    if (w.indexOf("雪") >= 0) return "❄️";
    if (w.indexOf("雨") >= 0) return "🌧️";
    if (w.indexOf("阴") >= 0) return "☁️";
    if (w.indexOf("风") >= 0) return "💨";
    if (w.indexOf("晴") >= 0) return "☀️";
    return "🌤️";
  }
  // 从 relationship 字符串提取信任值
  function parseTrust(rel) {
    rel = rel || "";
    var m = rel.match(/信任\s*(\d+)/);
    if (m) return parseInt(m[1], 10);
    m = rel.match(/(\d+)\s*\/\s*100/);
    if (m) return parseInt(m[1], 10);
    return 0;
  }
  function scrollBottom() { chatEl.scrollTop = chatEl.scrollHeight; }

  // ---------- 渲染 AI 气泡（支持 💭 独白拆分） ----------
  function buildBubble(text) {
    var bubble = document.createElement("div");
    bubble.className = "bubble ai";
    if (text.indexOf("💭") === -1) {
      bubble.textContent = text;
      return bubble;
    }
    var parts = text.split("💭");
    // parts[0] 为 💭 之前的对话；其后每段为独白
    if (parts[0].length > 0) {
      var d = document.createElement("div");
      d.textContent = parts[0];
      bubble.appendChild(d);
    }
    for (var i = 1; i < parts.length; i++) {
      var m = document.createElement("div");
      m.className = "monologue";
      m.textContent = parts[i];
      bubble.appendChild(m);
    }
    return bubble;
  }

  function addMessage(text, role, opt) {
    opt = opt || {};
    var row = document.createElement("div");
    row.className = "row " + (role === "user" ? "right" : "left");
    if (role === "user") {
      var b = document.createElement("div");
      b.className = "bubble user";
      b.textContent = text;
      row.appendChild(b);
    } else {
      var stack = document.createElement("div");
      stack.className = "msg-stack";
      if (opt.name) {
        var nm = document.createElement("div");
        nm.className = "msg-name";
        nm.textContent = opt.name;
        stack.appendChild(nm);
      }
      stack.appendChild(buildBubble(text));
      row.appendChild(stack);
    }
    chatEl.appendChild(row);
    scrollBottom();
  }

  function addSysMsg(text) {
    var div = document.createElement("div");
    div.className = "sysmsg";
    div.textContent = text;
    chatEl.appendChild(div);
    scrollBottom();
  }

  function showTyping() {
    var row = document.createElement("div");
    row.className = "row left";
    row.id = "typing-row";
    var stack = document.createElement("div");
    stack.className = "msg-stack typing";
    var bubble = document.createElement("div");
    bubble.className = "bubble ai";
    bubble.textContent = "对方正在输入";
    stack.appendChild(bubble);
    row.appendChild(stack);
    chatEl.appendChild(row);
    scrollBottom();
  }
  function removeTyping() {
    var el = document.getElementById("typing-row");
    if (el) el.parentNode.removeChild(el);
  }

  // ---------- 角色展示条 ----------
  function updateCharInfo() {
    var c = State.getCurrentChar();
    document.getElementById("ciAvatar").textContent = (c.name || "?").charAt(0);
    document.getElementById("ciName").textContent = c.name;
  }

  // ---------- 角色按钮 ----------
  function renderCharButtons(list, onSwitch) {
    var charbar = document.getElementById("charbar");
    var groupToggle = document.getElementById("groupToggle");
    Array.prototype.forEach.call(charbar.querySelectorAll(".char-btn"), function (n) {
      charbar.removeChild(n);
    });
    list.forEach(function (c) {
      var btn = document.createElement("button");
      btn.className = "char-btn" + (c.id === State.getCurrentChar().id ? " active" : "");
      btn.textContent = c.name;
      btn.dataset.id = c.id;
      btn.addEventListener("click", function () {
        if (typeof onSwitch === "function") onSwitch(c);
      });
      charbar.insertBefore(btn, groupToggle);
    });
  }

  // ---------- 状态栏 + 角色条数据更新 ----------
  function updateState(s) {
    var emo = (s.emotion != null ? Number(s.emotion) : 0);
    var emoInt = Math.round(emo);
    var label = s.emotion_label || "";
    var w = s.world || {};

    // 角色展示条
    document.getElementById("ciLabel").textContent = label || "--";
    var eFill = document.getElementById("ciFill");
    eFill.style.width = Math.max(0, Math.min(100, emo)) + "%";
    eFill.style.background = emotionColor(emo);
    document.getElementById("ciVal").textContent = emoInt;

    // 状态栏
    document.getElementById("s-emotion").textContent = emoInt + (label ? " " + label : "");
    var sEbar = document.getElementById("s-emoBar");
    sEbar.style.width = Math.max(0, Math.min(100, emo)) + "%";
    sEbar.style.background = emotionColor(emo);

    var bodyTxt = (s.body || "--");
    document.getElementById("s-body").textContent = bodyTxt.length > 10 ? bodyTxt.slice(0, 10) + "…" : bodyTxt;
    document.getElementById("s-mind").textContent = s.mind || "--";

    var rel = s.relationship || "--";
    document.getElementById("s-rel").textContent = rel;
    var trust = parseTrust(rel);
    var sRbar = document.getElementById("s-relBar");
    sRbar.style.width = Math.max(0, Math.min(100, trust)) + "%";
    sRbar.style.background = emotionColor(trust);

    var weather = w.weather || "--";
    document.getElementById("s-weather").textContent = weatherEmoji(weather) + " " + weather;
    document.getElementById("s-time").textContent = "第" + (w.day != null ? w.day : "--") + "天 · " + (w.time_of_day || "--");
  }

  // ---------- 情绪曲线图 ----------
  var SVG_NS = "http://www.w3.org/2000/svg";

  // 数值映射：-100~100 → y=110~10（越高兴越靠上）
  function valueToY(v) {
    v = Math.max(-100, Math.min(100, Number(v) || 0));
    return 110 - ((v + 100) / 200) * 100;
  }

  // 向 SVG 注入渐变定义（每次重建，避免残留）
  function ensureChartDefs(svg) {
    var defs = document.createElementNS(SVG_NS, "defs");
    var grad = document.createElementNS(SVG_NS, "linearGradient");
    grad.setAttribute("id", "chartGradient");
    grad.setAttribute("x1", "0"); grad.setAttribute("y1", "0");
    grad.setAttribute("x2", "0"); grad.setAttribute("y2", "1");
    var s1 = document.createElementNS(SVG_NS, "stop");
    s1.setAttribute("offset", "0");
    s1.setAttribute("stop-color", "rgba(88,166,255,0.3)");
    var s2 = document.createElementNS(SVG_NS, "stop");
    s2.setAttribute("offset", "1");
    s2.setAttribute("stop-color", "rgba(88,166,255,0)");
    grad.appendChild(s1);
    grad.appendChild(s2);
    defs.appendChild(grad);
    svg.appendChild(defs);
  }

  // history: [{time:"HH:MM", value:Number}]，最多渲染最近 20 个点
  function renderEmotionChart(history) {
    var svg = document.getElementById("chartSvg");
    var ball = document.getElementById("chartBall");
    var valueEl = document.getElementById("chartValue");
    var labelsEl = document.getElementById("chartLabels");
    if (!svg || !ball || !valueEl || !labelsEl) return;

    var pts = (history || []).slice(-20);

    // 清空旧图层后重建
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    ensureChartDefs(svg);

    // 无数据态
    if (pts.length === 0) {
      valueEl.textContent = "暂无数据";
      ball.style.opacity = "0";
      labelsEl.innerHTML = "";
      return;
    }

    var n = pts.length;
    var xOf = function (i) { return n > 1 ? (i / (n - 1)) * 600 : 300; };
    var linePts = pts.map(function (p, i) {
      return xOf(i).toFixed(1) + "," + valueToY(p.value).toFixed(1);
    });

    // 面积填充（渐变）
    var polygon = document.createElementNS(SVG_NS, "polygon");
    polygon.setAttribute("points", linePts.join(" ") + " 600,120 0,120");
    polygon.setAttribute("fill", "url(#chartGradient)");
    svg.appendChild(polygon);

    // 折线（描边生长动画见 animations.css 的 .chart-line）
    var polyline = document.createElementNS(SVG_NS, "polyline");
    polyline.setAttribute("points", linePts.join(" "));
    polyline.setAttribute("stroke", "#58a6ff");
    polyline.setAttribute("stroke-width", "2");
    polyline.setAttribute("fill", "none");
    polyline.setAttribute("class", "chart-line");
    svg.appendChild(polyline);

    // 当前值（带符号显示，如 +62）
    var cur = Math.round(Number(pts[n - 1].value) || 0);
    valueEl.textContent = (cur >= 0 ? "+" : "") + cur;

    // 端点球：x 与折线末端对齐，y 按数值映射（百分比，随容器高度自适应）
    ball.style.opacity = "1";
    ball.style.left = (n > 1 ? 100 : 50) + "%";
    ball.style.top = (valueToY(pts[n - 1].value) / 120 * 100) + "%";

    // 最近 3 个时间点标签
    labelsEl.innerHTML = "";
    pts.slice(-3).forEach(function (p) {
      var sp = document.createElement("span");
      sp.textContent = p.time;
      labelsEl.appendChild(sp);
    });
  }

  window.UI = {
    addMessage: addMessage,
    addSysMsg: addSysMsg,
    showTyping: showTyping,
    removeTyping: removeTyping,
    updateState: updateState,
    updateCharInfo: updateCharInfo,
    renderCharButtons: renderCharButtons,
    renderEmotionChart: renderEmotionChart,
    escapeText: escapeText,
    emotionColor: emotionColor,
    weatherEmoji: weatherEmoji,
    parseTrust: parseTrust
  };
})();
