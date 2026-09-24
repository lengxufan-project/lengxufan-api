/* 个人中心：用户信息、关系阶段、信任值、回忆碎片 */
(function () {
  "use strict";

  // ---------- 工具 ----------
  function escapeText(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  // 从 relationship 字符串提取信任值（与 ui.js.parseTrust 同逻辑）
  function parseTrust(rel) {
    rel = rel || "";
    var m = rel.match(/信任\s*(\d+)/);
    if (m) return parseInt(m[1], 10);
    m = rel.match(/(\d+)\s*\/\s*100/);
    if (m) return parseInt(m[1], 10);
    return 0;
  }

  // 从 relationship 字符串提取阶段名称
  function parseStage(rel) {
    rel = rel || "";
    var m = rel.match(/关系:\s*([^\（(]+)/);
    if (m) return m[1].trim();
    m = rel.match(/关系[:：]\s*([^\(（]+)/);
    if (m) return m[1].trim();
    return "陌生人";
  }

  // 由信任值决定等级文案
  function trustLevel(v) {
    v = Number(v) || 0;
    if (v >= 80) return "等级 Ⅴ · 挚友";
    if (v >= 60) return "等级 Ⅳ · 倾心";
    if (v >= 40) return "等级 Ⅲ · 熟识";
    if (v >= 20) return "等级 Ⅱ · 相识";
    return "等级 Ⅰ · 初遇";
  }

  // ---------- DOM 缓存 ----------
  var el = {
    avatar: document.getElementById("profileAvatar"),
    username: document.getElementById("profileUsername"),
    level: document.getElementById("profileLevel"),
    trustText: document.getElementById("profileTrustText"),
    relations: document.getElementById("profileRelations"),
    trustFill: document.getElementById("profileTrustFill"),
    trustStage: document.getElementById("profileTrustStage"),
    trustNum: document.getElementById("profileTrustNum"),
    timeline: document.getElementById("profileTimeline"),
    headerRight: document.getElementById("profileHeaderRight"),
    modal: document.getElementById("profileModal"),
    modalMask: document.getElementById("profileModalMask"),
    modalTitle: document.getElementById("profileModalTitle"),
    modalBody: document.getElementById("profileModalBody"),
    modalClose: document.getElementById("profileModalClose"),
    userSection: document.getElementById("profileUser"),
    entriesSection: document.querySelector(".profile-entries")
  };

  // ---------- 渲染：未登录引导卡片 ----------
  function renderLoginGuide() {
    // 隐藏常规内容，显示引导卡片
    var sections = document.querySelectorAll(".profile-section");
    Array.prototype.forEach.call(sections, function (s) { s.style.display = "none"; });
    if (el.userSection) el.userSection.style.display = "none";
    if (el.headerRight) el.headerRight.textContent = "";

    // 检查是否已有引导卡片，避免重复创建
    var existing = document.querySelector(".profile-login-guide");
    if (existing) {
      existing.style.display = "flex";
      return;
    }

    var guide = document.createElement("div");
    guide.className = "profile-login-guide";

    guide.innerHTML =
      '<div class="plg-orb"></div>' +
      '<div class="plg-text">登录后解锁本世界</div>' +
      '<div class="plg-buttons">' +
        '<a class="plg-btn plg-btn-login" href="login.html">登录</a>' +
        '<a class="plg-btn plg-btn-guest" href="index.html?skipIntro=1">游客进入</a>' +
      '</div>';

    var main = document.querySelector(".profile-main");
    if (main) main.appendChild(guide);
  }

  // ---------- 渲染：访客提示 ----------
  function renderGuestBanner() {
    var existing = document.querySelector(".profile-guest-banner");
    if (existing) {
      existing.style.display = "flex";
    } else {
      var banner = document.createElement("div");
      banner.className = "profile-guest-banner";
      banner.innerHTML = '你正在以访客身份浏览 <a class="pgb-login" href="login.html">立即登录</a>';
      var main = document.querySelector(".profile-main");
      if (main) main.insertBefore(banner, main.firstChild);
    }
  }

  // ---------- 渲染：用户信息 ----------
  function renderUser(user) {
    user = user || {};
    var name = user.username || "未登录旅人";
    el.avatar.textContent = name.charAt(0) || "客";
    el.username.textContent = name;
    if (user.role) {
      el.headerRight.textContent = user.role === "guest" ? "游客" : user.role;
    } else {
      el.headerRight.textContent = "";
    }
  }

  // ---------- 渲染：关系阶段 ----------
  function renderRelations(characters, state) {
    characters = characters || [];
    state = state || {};
    if (characters.length === 0) {
      characters = [{ id: "lengxufan", name: "冷旭帆" }];
    }

    el.relations.innerHTML = "";
    characters.forEach(function (c) {
      // 当前 /api/state 仅返回 lengxufan 的状态：匹配则视为已解锁
      var unlocked = (c.id === "lengxufan");
      var stage = unlocked ? parseStage(state.relationship) : "未解锁";
      var trust = unlocked ? parseTrust(state.relationship) : 0;

      var node = document.createElement("div");
      node.className = "relation-node " + (unlocked ? "unlocked" : "locked");
      node.dataset.id = c.id;
      node.innerHTML =
        '<div class="relation-dot">' + escapeText(c.name.charAt(0)) + '</div>' +
        '<div class="relation-name">' + escapeText(c.name) + '</div>' +
        '<div class="relation-stage">' + escapeText(stage) +
          (unlocked ? ' · ' + trust + '/100' : '') + '</div>' +
        '<div class="relation-detail">' + escapeText(buildDetailText(c, unlocked, state)) + '</div>';

      node.addEventListener("click", function () {
        node.classList.toggle("expanded");
      });
      el.relations.appendChild(node);
    });
  }

  // 节点展开详情文案
  function buildDetailText(c, unlocked, state) {
    if (!unlocked) {
      return "尚未与 " + c.name + " 建立连接。\n前往世界入口开启这段关系。";
    }
    var lines = [];
    lines.push("角色：" + c.name);
    lines.push("关系阶段：" + parseStage(state.relationship));
    lines.push("信任值：" + parseTrust(state.relationship) + " / 100");
    if (state.emotion != null) lines.push("当前情绪：" + Math.round(Number(state.emotion)) + (state.emotion_label ? " " + state.emotion_label : ""));
    if (state.body) lines.push("身体：" + state.body);
    if (state.mind) lines.push("心理：" + state.mind);
    return lines.join("\n");
  }

  // ---------- 渲染：信任值进度条 ----------
  function renderTrustbar(state) {
    state = state || {};
    var trust = parseTrust(state.relationship);
    var stage = parseStage(state.relationship);
    el.trustFill.style.width = Math.max(0, Math.min(100, trust)) + "%";
    el.trustStage.textContent = stage;
    el.trustNum.textContent = trust + " / 100";
    el.level.textContent = trustLevel(trust);
    el.trustText.textContent = "信任值 " + trust + " / 100";
  }

  // ---------- 渲染：回忆碎片时间线（占位） ----------
  function renderTimeline(memories) {
    el.timeline.innerHTML = "";
    if (!memories || memories.length === 0) {
      var empty = document.createElement("div");
      empty.className = "profile-timeline-empty";
      empty.textContent = "暂无回忆";
      el.timeline.appendChild(empty);
      return;
    }
    memories.forEach(function (m) {
      var card = document.createElement("div");
      card.className = "memory-card";
      card.innerHTML =
        '<div class="memory-time">' + escapeText(m.time || "") + '</div>' +
        '<div class="memory-title">' + escapeText(m.title || "回忆") + '</div>' +
        '<div class="memory-snippet">' + escapeText(m.snippet || "") + '</div>';
      card.addEventListener("click", function () {
        openMemoryModal(m);
      });
      el.timeline.appendChild(card);
    });
  }

  // ---------- 模态框 ----------
  function openMemoryModal(m) {
    m = m || {};
    el.modalTitle.textContent = m.title || "回忆";
    el.modalBody.textContent = m.snippet || "一段尚未被书写的记忆……";
    el.modal.classList.add("show");
  }
  function closeMemoryModal() { el.modal.classList.remove("show"); }
  el.modalMask.addEventListener("click", closeMemoryModal);
  el.modalClose.addEventListener("click", closeMemoryModal);
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") closeMemoryModal();
  });

  // ---------- 数据加载 ----------
  function loadUser() {
    return fetch("/api/auth/me", { credentials: "same-origin" })
      .then(function (r) { return r.ok ? r.json() : null; })
      .catch(function () { return null; })
      .then(function (data) {
        if (data && data.username) return data;
        return null; // 未登录
      });
  }

  function loadCharacters() {
    return API.getCharacters()
      .then(function (data) {
        var list = [];
        if (Array.isArray(data)) list = data;
        else if (data && Array.isArray(data.value)) list = data.value;
        list = list.filter(function (c) { return c && c.id && c.name; });
        if (list.length === 0) list = [{ id: "lengxufan", name: "冷旭帆" }];
        return list;
      })
      .catch(function () {
        return [{ id: "lengxufan", name: "冷旭帆" }];
      });
  }

  function loadState() {
    return API.getState().catch(function () { return {}; });
  }

  // ---------- 初始化 ----------
  function init() {
    // 先检查本地角色缓存
    var role = localStorage.getItem("lxf_user_role") || "guest";

    loadUser().then(function (user) {
      // 未登录（user 为 null）或 role 为 guest
      if (!user || !user.username || user.role === "guest") {
        if (!user || !user.username) {
          // 完全未登录 -> 引导卡片
          renderLoginGuide();
          return;
        }
        // 已登录但为访客 -> 显示访客 banner + 正常内容
        renderGuestBanner();
        renderNormalContent(user);
        return;
      }
      // 正常登录用户
      renderNormalContent(user);
    });
  }

  function renderNormalContent(user) {
    // 显示常规内容
    var sections = document.querySelectorAll(".profile-section");
    Array.prototype.forEach.call(sections, function (s) { s.style.display = ""; });
    if (el.userSection) el.userSection.style.display = "";
    var guide = document.querySelector(".profile-login-guide");
    if (guide) guide.style.display = "none";

    Promise.all([loadCharacters(), loadState()])
      .then(function (results) {
        var characters = results[0];
        var state = results[1] || {};
        renderUser(user);
        renderRelations(characters, state);
        renderTrustbar(state);
        renderTimeline([]); // 占位：暂无回忆
      });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
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