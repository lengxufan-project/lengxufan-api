/* ============================================================
   export.js · 时光档案馆对话导出
   功能：获取 /api/conversations → 过滤 → 格式化 → 自动下载
   ============================================================ */

(function () {
  "use strict";

  // ====== DOM 引用 ======
  const $ = (id) => document.getElementById(id);
  const charSelect   = $("charSelect");
  const dateFrom     = $("dateFrom");
  const dateTo       = $("dateTo");
  const statCount    = $("statCount");
  const statChars    = $("statChars");
  const statSize     = $("statSize");
  const exportBtn    = $("exportBtn");
  const btnIcon      = exportBtn.querySelector(".btn-icon");
  const btnText      = exportBtn.querySelector(".btn-text");
  const progressWrap = $("progressWrapper");
  const progressFill = $("progressFill");
  const progressText = $("progressText");
  const progressPct  = $("progressPercent");
  const statusMsg    = $("statusMsg");
  const formatBtns   = document.querySelectorAll(".format-btn");

  let currentFormat = "json";
  let rawData = null;          // 缓存的原始对话
  let isExporting = false;

  // ====== 初始化 ======
  init();

  function init() {
    bindFormatBtns();
    bindFilterEvents();
    bindExportBtn();
    loadConversations();
  }

  // ---------- 格式选择（带波纹） ----------
  function bindFormatBtns() {
    formatBtns.forEach((btn) => {
      btn.addEventListener("click", (e) => {
        formatBtns.forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        currentFormat = btn.dataset.format;

        // 手动创建一个从点击位置扩散的波纹
        const ripple = btn.querySelector(".ripple") || document.createElement("span");
        ripple.className = "ripple";
        const rect = btn.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = (e.clientX || rect.left + rect.width / 2) - rect.left - size / 2;
        const y = (e.clientY || rect.top  + rect.height / 2) - rect.top  - size / 2;
        ripple.style.width = ripple.style.height = size + "px";
        ripple.style.left = x + "px";
        ripple.style.top  = y + "px";
        // 重置动画
        ripple.style.animation = "none";
        // 强制回流
        void ripple.offsetWidth;
        ripple.style.animation = "";
        if (!btn.contains(ripple)) btn.appendChild(ripple);

        updateStats();
      });
    });
  }

  function bindFilterEvents() {
    [charSelect, dateFrom, dateTo].forEach((el) =>
      el.addEventListener("change", updateStats)
    );
  }

  function bindExportBtn() {
    exportBtn.addEventListener("click", onExportClick);
  }

  // ---------- 加载对话数据 ----------
  async function loadConversations() {
    setStatus("正在读取对话档案…", "");
    try {
      const res = await fetch("/api/conversations", {
        credentials: "same-origin",
      });
      if (!res.ok) throw new Error("HTTP " + res.status);
      const data = await res.json();
      rawData = normalizeData(data);
      populateCharOptions();
      updateStats();
      setStatus("档案已就绪，可以开始导出", "ok");
    } catch (err) {
      console.error(err);
      rawData = [];
      setStatus("读取失败：" + err.message + "，使用演示数据", "err");
      rawData = demoData();
      populateCharOptions();
      updateStats();
    }
  }

  // 将不同的后端返回结构统一成 [{charId, charName, ts, role, content}]
  function normalizeData(data) {
    const list = [];
    if (!data) return list;

    // 常见结构 1：{ conversations: [{character, messages:[...]}] }
    if (Array.isArray(data.conversations)) {
      data.conversations.forEach((conv) => {
        const cid = conv.character_id || conv.charId || conv.id || "unknown";
        const cname = conv.character || conv.name || conv.charName || "未知角色";
        (conv.messages || []).forEach((m) => pushMsg(cid, cname, m));
      });
    }
    // 常见结构 2：{ logs: [...] }
    else if (Array.isArray(data.logs)) {
      data.logs.forEach((m) => pushMsg(m.charId || m.character_id, m.charName || m.character, m));
    }
    // 常见结构 3：纯数组
    else if (Array.isArray(data)) {
      data.forEach((m) => {
        if (Array.isArray(m.messages)) {
          const cid = m.character_id || m.charId || m.id;
          const cname = m.character || m.name || m.charName;
          m.messages.forEach((mm) => pushMsg(cid, cname, mm));
        } else {
          pushMsg(m.charId || m.character_id, m.charName || m.character, m);
        }
      });
    }
    return list;

    function pushMsg(cid, cname, m) {
      if (!m) return;
      list.push({
        charId:   cid || (m.character_id ?? m.charId ?? ""),
        charName: cname || (m.character ?? m.charName ?? "未知角色"),
        ts:       parseTime(m.timestamp ?? m.time ?? m.ts ?? m.created_at ?? m.date),
        role:     (m.role || m.speaker || (m.is_ai || m.isAi ? "ai" : "user") || "user").toString().toLowerCase(),
        content:  m.content ?? m.text ?? m.message ?? m.msg ?? "",
      });
    }
  }

  function parseTime(t) {
    if (!t) return Date.now();
    if (typeof t === "number") return t;
    const n = new Date(t).getTime();
    return isNaN(n) ? Date.now() : n;
  }

  // ---------- 下拉框填充角色 ----------
  function populateCharOptions() {
    const map = new Map();
    rawData.forEach((m) => {
      if (m.charId || m.charName) {
        const key = m.charId || m.charName;
        if (!map.has(key)) map.set(key, m.charName || key);
      }
    });
    // 保留第一个 <option> (全部)
    charSelect.innerHTML = '<option value="all">全部角色</option>';
    [...map.entries()].forEach(([id, name]) => {
      const opt = document.createElement("option");
      opt.value = id;
      opt.textContent = name;
      charSelect.appendChild(opt);
    });
  }

  // ---------- 过滤 ----------
  function getFiltered() {
    const charVal = charSelect.value;
    const from = dateFrom.value ? new Date(dateFrom.value + "T00:00:00").getTime() : -Infinity;
    const to   = dateTo.value   ? new Date(dateTo.value   + "T23:59:59").getTime() :  Infinity;
    return rawData.filter((m) => {
      if (charVal !== "all") {
        if ((m.charId || m.charName) !== charVal && m.charName !== charVal) return false;
      }
      if (m.ts < from || m.ts > to) return false;
      return true;
    });
  }

  function updateStats() {
    const filtered = getFiltered();
    const count = filtered.length;
    const chars = filtered.reduce((s, m) => s + String(m.content || "").length, 0);
    statCount.textContent = count;
    statChars.textContent = chars.toLocaleString();

    // 估算文件大小
    const sample = formatData(filtered.slice(0, Math.min(50, count)));
    const ratio  = count > 0 ? sample.length / Math.min(50, count) : 0;
    const size   = Math.round(ratio * count);
    statSize.textContent = prettyBytes(size);
  }

  function prettyBytes(n) {
    if (n < 1024) return n + " B";
    if (n < 1024 * 1024) return (n / 1024).toFixed(1) + " KB";
    return (n / 1024 / 1024).toFixed(2) + " MB";
  }

  // ---------- 导出按钮 ----------
  function onExportClick() {
    if (isExporting) return;
    const filtered = getFiltered();
    if (!filtered.length) {
      setStatus("没有符合条件的对话，请调整过滤条件", "err");
      return;
    }
    startExport(filtered);
  }

  function startExport(filtered) {
    isExporting = true;
    resetBtn();
    progressWrap.style.display = "flex";
    statusMsg.className = "status-msg";
    statusMsg.textContent = "";

    const stages = [
      { pct: 20,  text: "① 正在读取对话片段…" },
      { pct: 45,  text: "② 按条件排序与清洗…" },
      { pct: 70,  text: "③ 正在生成 " + currentFormat.toUpperCase() + " 文件…" },
      { pct: 90,  text: "④ 准备下载链接…" },
      { pct: 100, text: "⑤ 导出完成！" },
    ];
    let stageIdx = 0;

    const tick = () => {
      if (stageIdx >= stages.length) {
        // 最后：触发下载 + 显示完成
        finalizeExport(filtered);
        return;
      }
      const s = stages[stageIdx++];
      animateProgressTo(s.pct, s.text, 420, tick);
    };
    tick();
  }

  function animateProgressTo(targetPct, text, duration, done) {
    const startPct = parseFloat(progressFill.style.width) || 0;
    const delta    = targetPct - startPct;
    const startAt  = performance.now();

    progressText.textContent = text;

    const step = (now) => {
      const t = Math.min(1, (now - startAt) / duration);
      const ease = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      const p = startPct + delta * ease;
      setProgress(p, text);
      if (t < 1) requestAnimationFrame(step);
      else done && setTimeout(done, 120);
    };
    requestAnimationFrame(step);
  }

  function setProgress(pct, text) {
    const p = Math.max(0, Math.min(100, pct));
    progressFill.style.width = p + "%";
    progressPct.textContent   = Math.round(p) + "%";
    if (text) progressText.textContent = text;
  }

  function finalizeExport(filtered) {
    try {
      const content = formatData(filtered);
      const filename = buildFilename(filtered);
      downloadFile(content, filename, mimeOf(currentFormat));

      btnIcon.textContent = "✅";
      btnText.textContent = "导出成功";
      exportBtn.classList.add("done");
      setStatus("文件已生成：" + filename + "（" + prettyBytes(content.length) + "）", "ok");

      // 3 秒后恢复按钮，保留绿色提示一小段时间
      setTimeout(() => {
        exportBtn.classList.remove("done");
        btnIcon.textContent = "⬇️";
        btnText.textContent = "再次导出";
        isExporting = false;
      }, 3500);
    } catch (e) {
      console.error(e);
      setStatus("导出失败：" + e.message, "err");
      isExporting = false;
      progressWrap.style.display = "none";
    }
  }

  function resetBtn() {
    exportBtn.classList.remove("done");
    btnIcon.textContent = "⬇️";
    btnText.textContent = "正在导出…";
    setProgress(0, "准备中…");
  }

  // ---------- 格式转换 ----------
  function formatData(filtered) {
    switch (currentFormat) {
      case "json": return toJSON(filtered);
      case "md":   return toMarkdown(filtered);
      case "txt":  return toText(filtered);
      default:     return toJSON(filtered);
    }
  }

  function toJSON(list) {
    const grouped = groupBy(list, (m) => m.charName);
    const out = {
      exportTime: new Date().toISOString(),
      totalMessages: list.length,
      conversations: Object.keys(grouped).map((charName) => ({
        character: charName,
        messages: grouped[charName].map((m) => ({
          timestamp: new Date(m.ts).toISOString(),
          role:      m.role,
          content:   m.content,
        })),
      })),
    };
    return JSON.stringify(out, null, 2);
  }

  function toMarkdown(list) {
    const header = [
      "# 时光档案馆 · 对话导出",
      "",
      `- 导出时间：${new Date().toLocaleString()}`,
      `- 对话条数：${list.length}`,
      "",
      "---",
      "",
    ];
    const grouped = groupBy(list, (m) => m.charName);
    const body = [];
    Object.keys(grouped).forEach((charName) => {
      body.push(`## 🧑‍💼 ${charName}`);
      body.push("");
      grouped[charName].forEach((m) => {
        const time = new Date(m.ts).toLocaleString();
        const who  = m.role === "ai" || m.role === "assistant" ? `**${charName}**` : "**你**";
        body.push(`> ${time}  ${who}`);
        body.push("");
        body.push(String(m.content).replace(/\n/g, "\n\n"));
        body.push("");
      });
      body.push("---");
      body.push("");
    });
    return header.concat(body).join("\n");
  }

  function toText(list) {
    const lines = [];
    lines.push("===== 时光档案馆 · 对话导出 =====");
    lines.push("导出时间：" + new Date().toLocaleString());
    lines.push("对话条数：" + list.length);
    lines.push("=================================");
    lines.push("");
    list.forEach((m) => {
      const time = new Date(m.ts).toLocaleString();
      const who  = m.role === "ai" || m.role === "assistant" ? m.charName : "你";
      lines.push(`[${time}] ${who}:`);
      lines.push(String(m.content));
      lines.push("");
    });
    return lines.join("\n");
  }

  // ---------- 工具 ----------
  function groupBy(arr, keyFn) {
    const map = {};
    arr.forEach((it) => {
      const k = keyFn(it);
      (map[k] = map[k] || []).push(it);
    });
    return map;
  }

  function mimeOf(fmt) {
    if (fmt === "json") return "application/json;charset=utf-8";
    if (fmt === "md")   return "text/markdown;charset=utf-8";
    return "text/plain;charset=utf-8";
  }

  function extOf(fmt) {
    return fmt === "md" ? "md" : (fmt === "txt" ? "txt" : "json");
  }

  function buildFilename(list) {
    const d = new Date();
    const pad = (n) => String(n).padStart(2, "0");
    const ts = `${d.getFullYear()}${pad(d.getMonth()+1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}`;
    const charName = charSelect.value === "all" ? "all" : safe(charSelect.options[charSelect.selectedIndex]?.textContent || charSelect.value);
    return `memory-${charName}-${ts}.${extOf(currentFormat)}`;
  }

  function safe(s) {
    return String(s || "").replace(/[\\/:*?"<>|\s]+/g, "_").slice(0, 20);
  }

  function downloadFile(content, filename, mime) {
    const blob = new Blob(["\uFEFF" + content], { type: mime });
    const url  = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }

  function setStatus(text, type) {
    statusMsg.textContent = text;
    statusMsg.className = "status-msg " + (type || "");
  }

  // ---------- 演示数据（兜底） ----------
  function demoData() {
    const chars = [
      { id: "lxf", name: "冷旭帆" },
      { id: "hjy", name: "黄景云" },
      { id: "yqc", name: "叶清辞" },
    ];
    const now = Date.now();
    const arr = [];
    const samplesAi = [
      "晚风很凉，记得加一件外套。",
      "你今天看起来有点疲惫，要不要先休息一下？",
      "刚刚读了你推荐的那段文字，确实很动人。",
      "不管怎样，我都会在这里。",
    ];
    const samplesUser = [
      "今天工作好累啊。",
      "你有没有推荐的书？",
      "谢谢你一直在。",
      "想出去走走。",
    ];
    let t = now - 8 * 86400000;
    for (let i = 0; i < 48; i++) {
      const c = chars[i % chars.length];
      const isUser = i % 2 === 0;
      arr.push({
        charId: c.id,
        charName: c.name,
        ts: t,
        role: isUser ? "user" : "ai",
        content: isUser ? samplesUser[i % samplesUser.length] : samplesAi[i % samplesAi.length],
      });
      t += 3600000 * (Math.random() * 4 + 1);
    }
    return arr;
  }
})();

/* 统一返回逻辑：有同源来源页则回退，否则回主界面（导航闭环） */
window.goBack = function () {
  if (document.referrer && document.referrer.includes(window.location.host)) {
    history.back();
  } else {
    window.location.href = "index.html?skipIntro=1";
  }
};
