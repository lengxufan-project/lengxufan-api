/* ============================================================
   角色图鉴 —— 独立脚本
   从 /api/characters 获取角色列表，支持搜索/标签筛选/分页
   点击卡片跳转 character-profile.html?char=角色id
   ============================================================ */
(function () {
  "use strict";

  var PAGE_SIZE = 12;

  // ===== 占位元数据（API 未提供的字段，与人物典籍页一致）=====
  var CHAR_META = {
    lengxufan: {
      identity: "307室 · 观察者",
      env: "cg-env-blue",
      tags: ["307室", "观察者"]
    },
    huangjingyun: {
      identity: "307室 · 通话者",
      env: "cg-env-orange",
      tags: ["307室", "通话者"]
    },
    yeqingci: {
      identity: "307室 · 计时者",
      env: "cg-env-purple",
      tags: ["307室", "计时者"]
    }
  };

  var FALLBACK_META = {
    identity: "307室 · 成员",
    env: "cg-env-blue",
    tags: ["307室"]
  };

  // API 不可用时的兜底角色列表（模拟未来 100+ 角色数据）
  var FALLBACK_CHARS = [
    { id: "lengxufan", name: "冷旭帆" },
    { id: "huangjingyun", name: "黄景云" },
    { id: "yeqingci", name: "叶清辞" },
    { id: "xiangyunzhou", name: "向云舟", meta: { identity: "307室 · 隐者", env: "cg-env-purple", tags: ["307室", "隐者"] } },
    { id: "ranzhaoran", name: "冉昭然", meta: { identity: "307室 · 记录者", env: "cg-env-blue", tags: ["307室", "记录者"] } },
    { id: "luhuawang", name: "陆华望", meta: { identity: "307室 · 守望者", env: "cg-env-orange", tags: ["307室", "守望者"] } },
    { id: "qinhuxi", name: "秦狐戏", meta: { identity: "307室 · 戏语者", env: "cg-env-purple", tags: ["307室", "戏语者"] } },
    { id: "luahuaxi", name: "陆华希", meta: { identity: "307室 · 希声者", env: "cg-env-blue", tags: ["307室", "希声者"] } },
    { id: "simenyu", name: "司门雨", meta: { identity: "205室 · 守门者", env: "cg-env-blue", tags: ["205室", "守门者"] } },
    { id: "duanmuyun", name: "端木云", meta: { identity: "205室 · 浮云者", env: "cg-env-orange", tags: ["205室", "浮云者"] } },
    { id: "shangguanhe", name: "上官河", meta: { identity: "205室 · 渡河者", env: "cg-env-purple", tags: ["205室", "渡河者"] } },
    { id: "ouyangjing", name: "欧阳镜", meta: { identity: "205室 · 镜中人", env: "cg-env-blue", tags: ["205室", "镜中人"] } },
    { id: "gongsuli", name: "公孙离", meta: { identity: "408室 · 离歌者", env: "cg-env-orange", tags: ["408室", "离歌者"] } },
    { id: "murongxue", name: "慕容雪", meta: { identity: "408室 · 雪语者", env: "cg-env-blue", tags: ["408室", "雪语者"] } },
    { id: "linghuyao", name: "令狐瑶", meta: { identity: "408室 · 瑶光者", env: "cg-env-purple", tags: ["408室", "瑶光者"] } },
    { id: "weiyuan", name: "卫渊", meta: { identity: "408室 · 渊默者", env: "cg-env-blue", tags: ["408室", "渊默者"] } },
    { id: "sunyuming", name: "孙玉铭", meta: { identity: "601室 · 铭记者", env: "cg-env-orange", tags: ["601室", "铭记者"] } },
    { id: "zhaoxia", name: "赵峡", meta: { identity: "601室 · 峡风者", env: "cg-env-blue", tags: ["601室", "峡风者"] } },
    { id: "zhouzichen", name: "周子辰", meta: { identity: "601室 · 星辰者", env: "cg-env-purple", tags: ["601室", "星辰者"] } },
    { id: "wuxiaodie", name: "吴小蝶", meta: { identity: "601室 · 蝶舞者", env: "cg-env-orange", tags: ["601室", "蝶舞者"] } },
    { id: "zhengjing", name: "郑静", meta: { identity: "702室 · 静观者", env: "cg-env-blue", tags: ["702室", "静观者"] } },
    { id: "wangyue", name: "王月", meta: { identity: "702室 · 月华者", env: "cg-env-orange", tags: ["702室", "月华者"] } },
    { id: "jiangtao", name: "江涛", meta: { identity: "702室 · 涛声者", env: "cg-env-blue", tags: ["702室", "涛声者"] } },
    { id: "lichen", name: "李尘", meta: { identity: "702室 · 尘埃者", env: "cg-env-purple", tags: ["702室", "尘埃者"] } }
  ];

  // ===== 状态 =====
  var allChars = [];
  var currentPage = 0;
  var searchQuery = "";
  var activeTag = "";

  // ===== DOM 缓存 =====
  var $ = function (id) { return document.getElementById(id); };
  var gridEl = $("cgGrid");
  var searchEl = $("cgSearch");
  var tagsEl = $("cgTags");
  var pagerTextEl = $("cgPagerText");
  var pagerPrevEl = $("cgPagerPrev");
  var pagerNextEl = $("cgPagerNext");

  // ===== 工具 =====
  function getCharMeta(char) {
    if (char.meta) return char.meta;
    return CHAR_META[char.id] || FALLBACK_META;
  }

  function getFilteredChars() {
    var q = searchQuery.trim().toLowerCase();
    var tag = activeTag;
    return allChars.filter(function (char) {
      var name = (char.name || "").toLowerCase();
      if (q && name.indexOf(q) === -1) return false;
      if (tag) {
        var meta = getCharMeta(char);
        if (!meta.tags || meta.tags.indexOf(tag) === -1) return false;
      }
      return true;
    });
  }

  function extractAllTags() {
    var tagSet = {};
    allChars.forEach(function (char) {
      var meta = getCharMeta(char);
      if (meta.tags) {
        meta.tags.forEach(function (t) { tagSet[t] = true; });
      }
    });
    return Object.keys(tagSet).sort();
  }

  // ===== 渲染 =====
  function createCard(char) {
    var meta = getCharMeta(char);

    var card = document.createElement("article");
    card.className = "cg-card " + meta.env;

    var inner = document.createElement("div");
    inner.className = "cg-card-inner";

    // 立绘舞台
    var stage = document.createElement("div");
    stage.className = "cg-stage";
    var glow = document.createElement("div");
    glow.className = "cg-glow";
    var silhouette = document.createElement("div");
    silhouette.className = "cg-silhouette";
    stage.appendChild(glow);
    stage.appendChild(silhouette);

    // 底部信息
    var info = document.createElement("div");
    info.className = "cg-meta";
    var name = document.createElement("h2");
    name.className = "cg-name";
    name.textContent = char.name || char.id;
    var identity = document.createElement("p");
    identity.className = "cg-identity";
    identity.textContent = meta.identity;
    info.appendChild(name);
    info.appendChild(identity);

    inner.appendChild(stage);
    inner.appendChild(info);
    card.appendChild(inner);

    // 点击跳转人物典籍
    card.addEventListener("click", function () {
      window.location.href = "character-profile.html?char=" + encodeURIComponent(char.id);
    });

    return card;
  }

  function renderChars() {
    var filtered = getFilteredChars();
    var totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    if (currentPage >= totalPages) currentPage = totalPages - 1;

    var start = currentPage * PAGE_SIZE;
    var pageItems = filtered.slice(start, start + PAGE_SIZE);

    gridEl.innerHTML = "";
    if (pageItems.length === 0) {
      var empty = document.createElement("div");
      empty.className = "cg-empty";
      empty.textContent = "没有匹配的角色";
      empty.style.cssText = "grid-column: 1 / -1; text-align: center; padding: 60px 0; color: #5e6d8c; font-size: 14px; letter-spacing: 2px;";
      gridEl.appendChild(empty);
    } else {
      pageItems.forEach(function (char) {
        gridEl.appendChild(createCard(char));
      });
    }

    updatePagination(totalPages);
  }

  function renderTags() {
    var allTags = extractAllTags();
    tagsEl.innerHTML = "";

    // "全部" 标签
    var allTag = document.createElement("span");
    allTag.className = "cg-tag" + (activeTag === "" ? " active" : "");
    allTag.textContent = "全部";
    allTag.addEventListener("click", function () {
      activeTag = "";
      currentPage = 0;
      updateTagActive();
      renderChars();
    });
    tagsEl.appendChild(allTag);

    allTags.forEach(function (tag) {
      var el = document.createElement("span");
      el.className = "cg-tag" + (activeTag === tag ? " active" : "");
      el.textContent = tag;
      el.addEventListener("click", function () {
        activeTag = tag;
        currentPage = 0;
        updateTagActive();
        renderChars();
      });
      tagsEl.appendChild(el);
    });
  }

  function updateTagActive() {
    var tags = tagsEl.querySelectorAll(".cg-tag");
    tags.forEach(function (el) {
      if (el.textContent === "全部" && activeTag === "") {
        el.classList.add("active");
      } else if (el.textContent === activeTag) {
        el.classList.add("active");
      } else {
        el.classList.remove("active");
      }
    });
  }

  function updatePagination(totalPages) {
    pagerTextEl.textContent = (currentPage + 1) + " / " + totalPages;
    pagerPrevEl.disabled = currentPage <= 0;
    pagerNextEl.disabled = currentPage >= totalPages - 1;
  }

  // ===== 事件绑定 =====
  function initEvents() {
    // 搜索输入
    searchEl.addEventListener("input", function () {
      searchQuery = this.value;
      currentPage = 0;
      renderChars();
    });

    // 上一页
    pagerPrevEl.addEventListener("click", function () {
      if (currentPage > 0) {
        currentPage--;
        renderChars();
        gridEl.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });

    // 下一页
    pagerNextEl.addEventListener("click", function () {
      var filtered = getFilteredChars();
      var totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
      if (currentPage < totalPages - 1) {
        currentPage++;
        renderChars();
        gridEl.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  }

  // ===== 数据加载 =====
  function loadCharacters() {
    fetch("/api/characters")
      .then(function (res) {
        if (!res.ok) throw new Error("HTTP " + res.status);
        return res.json();
      })
      .then(function (chars) {
        allChars = (Array.isArray(chars) && chars.length) ? chars : FALLBACK_CHARS;
        ready();
      })
      .catch(function () {
        allChars = FALLBACK_CHARS;
        ready();
      });
  }

  function ready() {
    renderTags();
    renderChars();
    initEvents();
  }

  // ===== 初始化 =====
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", loadCharacters);
  } else {
    loadCharacters();
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