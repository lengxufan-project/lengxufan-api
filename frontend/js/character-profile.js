/* 人物典籍页 —— 独立脚本：数据获取与渲染 */
(function () {
  "use strict";

  // ===== 占位数据（API 未提供的字段）=====
  var CHAR_META = {
    lengxufan: {
      codename: "阿冷",
      identity: "307室 · 观察者",
      token: "黑色护腕",
      monologues: [
        "灯管又开始闪了。 third time tonight。我数着，像数心跳。",
        "望仔把腿垂在窗台外面，我盯着那个高度，算了很久重心。",
        "如果所有人都睡了，房间里的安静是谁的？"
      ]
    },
    huangjingyun: {
      codename: "阿云",
      identity: "307室 · 通话者",
      token: "老式手机",
      monologues: [
        "电话那头的声音断了一秒，我把这半句粤语咽了回去。",
        "阿辞的手表秒针走一下，我就少说一个字。",
        "上铺的口香糖声，比闹钟更让我清醒。"
      ]
    },
    yeqingci: {
      codename: "阿辞",
      identity: "307室 · 计时者",
      token: "机械手表",
      monologues: [
        "秒针走一格，桌上那张纸条还是对折了三次的样子。",
        "我摘下手表的时候，时间并没有停下来等我。",
        "台灯的螺丝松了半圈，没有人发现，除了我。"
      ]
    }
  };

  // 关系网络占位室友（与当前角色不同的 3 个室友，信任值随机）
  var ROOMMATE_POOL = ["黄景云", "叶清辞", "向云舟", "冉昭然", "陆华望", "秦狐戏", "陆华希"];

  // 翻页循环的角色（3 个）
  var PAGE_CHARS = ["lengxufan", "huangjingyun", "yeqingci"];

  var currentId = "lengxufan";

  // ===== 工具 =====
  function $(id) { return document.getElementById(id); }

  function getCharIdFromUrl() {
    var params = new URLSearchParams(window.location.search);
    var id = params.get("char") || params.get("char_id") || "lengxufan";
    return id;
  }

  function randomTrust() {
    // 55 ~ 98 的信任值
    return Math.floor(Math.random() * 44) + 55;
  }

  function pickRoommates(selfName) {
    var pool = ROOMMATE_POOL.filter(function (n) { return n !== selfName; });
    return pool.slice(0, 3);
  }

  // ===== 渲染 =====
  function renderCharacter(char, stateInfo) {
    stateInfo = stateInfo || {};
    var meta = CHAR_META[char.id] || {
      codename: char.id,
      identity: "307室 · 成员",
      token: "未知",
      monologues: ["……（TA 暂时沉默着）", "有些话还没整理好，先收进抽屉里。", "也许下一次对话会不一样。"]
    };

    // 情绪标签：优先取 state 中的 emotion_label
    var emotionText = meta.emotionLabel || "--";
    if (stateInfo.emotionLabel) {
      emotionText = stateInfo.emotionLabel;
      if (stateInfo.emotionValue != null) {
        emotionText += " · " + stateInfo.emotionValue;
      }
    }

    // 左侧：名字 + 情绪标签
    $("profileName").textContent = char.name || char.id;
    $("profileEmotion").textContent = emotionText;

    // 基本信息
    $("infoCodename").textContent = meta.codename;
    $("infoIdentity").textContent = meta.identity;
    $("infoToken").textContent = meta.token;

    // 内心独白碎片
    var monoBox = $("monologueList");
    monoBox.innerHTML = "";
    meta.monologues.forEach(function (text, i) {
      var card = document.createElement("div");
      card.className = "monologue-card";
      var tag = document.createElement("span");
      tag.className = "mono-tag";
      tag.textContent = "碎片 0" + (i + 1);
      var p = document.createElement("div");
      p.textContent = text;
      card.appendChild(tag);
      card.appendChild(p);
      monoBox.appendChild(card);
    });

    // 关系网络（占位：3 个室友，信任值随机）
    var relBox = $("relationList");
    relBox.innerHTML = "";
    var roommates = pickRoommates(char.name || "");
    roommates.forEach(function (name) {
      var val = randomTrust();
      var item = document.createElement("div");
      item.className = "relation-item";

      var nameEl = document.createElement("span");
      nameEl.className = "relation-name";
      nameEl.textContent = name;

      var bar = document.createElement("div");
      bar.className = "relation-bar";
      var fill = document.createElement("div");
      fill.className = "relation-bar-fill";
      bar.appendChild(fill);

      var valEl = document.createElement("span");
      valEl.className = "relation-val";
      valEl.textContent = val;

      item.appendChild(nameEl);
      item.appendChild(bar);
      item.appendChild(valEl);
      relBox.appendChild(item);

      // 延迟触发宽度过渡动画
      requestAnimationFrame(function () {
        setTimeout(function () { fill.style.width = val + "%"; }, 30);
      });
    });
  }

  function updatePagerText() {
    $("pagerText").textContent = (currentPage() + 1) + " / " + PAGE_CHARS.length;
  }

  function currentPage() {
    var idx = PAGE_CHARS.indexOf(currentId);
    return idx < 0 ? 0 : idx;
  }

  // ===== 翻页切换角色（循环）=====
  function switchTo(id) {
    currentId = id;
    // 同步 URL 参数（不刷新页面）
    try {
      var url = new URL(window.location.href);
      url.searchParams.set("char", id);
      window.history.replaceState({}, "", url);
    } catch (e) { /* 忽略 */ }
    loadAndRender();
  }

  function cyclePrev() {
    var idx = (currentPage() - 1 + PAGE_CHARS.length) % PAGE_CHARS.length;
    switchTo(PAGE_CHARS[idx]);
  }

  function cycleNext() {
    var idx = (currentPage() + 1) % PAGE_CHARS.length;
    switchTo(PAGE_CHARS[idx]);
  }

  // ===== 数据获取 =====
  function fetchJson(url) {
    return fetch(url).then(function (r) { return r.json(); });
  }

  function loadAndRender() {
    var charId = currentId;

    Promise.all([
      fetchJson("/api/characters").catch(function () { return null; }),
      fetchJson("/api/state").catch(function () { return null; })
    ]).then(function (results) {
      var chars = results[0];
      var state = results[1];

      // 兼容数组与 {value:[...]} 两种返回
      var list = Array.isArray(chars) ? chars : (chars && chars.value) || null;
      if (!list || !list.length) {
        // 兜底角色列表
        list = [
          { id: "lengxufan", name: "冷旭帆" },
          { id: "huangjingyun", name: "黄景云" },
          { id: "yeqingci", name: "叶清辞" }
        ];
      }

      // 匹配当前角色；找不到则用列表第一个
      var char = null;
      for (var i = 0; i < list.length; i++) {
        if (list[i].id === charId) { char = list[i]; break; }
      }
      if (!char) char = list[0];

      // 从 state 提取 emotion_label / body / mind / relationship
      var stateInfo = {};
      if (state) {
        stateInfo.emotionLabel = state.emotion_label || null;
        stateInfo.emotionValue = state.emotion != null ? Math.round(state.emotion) : null;
        stateInfo.body = state.body || null;
        stateInfo.mind = state.mind || null;
        stateInfo.relationship = state.relationship || null;
      }

      renderCharacter(char, stateInfo);
      updatePagerText();
    });
  }

  // ===== 对外接口 =====
  window.CharacterProfile = {
    init: function () {
      currentId = getCharIdFromUrl();

      // 左侧形象区域点击 = 翻页（循环切换 3 个角色）
      $("profileFigure").addEventListener("click", cycleNext);

      // 上一页 / 下一页按钮
      $("pagerPrev").addEventListener("click", cyclePrev);
      $("pagerNext").addEventListener("click", cycleNext);

      loadAndRender();
    }
  };

  // 自动初始化
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", window.CharacterProfile.init);
  } else {
    window.CharacterProfile.init();
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
