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

  // ===== 从 character.json 提取数据 =====
  function parseCharJson(charJson) {
    if (!charJson || !charJson.persona) return null;
    var p = charJson.persona;
    return {
      codename: p.code || "--",
      identity: (p.academy || "") + (p.academy && p.room ? " · " : "") + (p.room || ""),
      // 年龄信息
      age: p.age != null ? p.age + "岁" : null,
      // 内心独白碎片：从 autobiographical_memories 中提取 event 字段
      monologues: null,
      // 关系里程碑
      milestones: null
    };
  }

  function extractMonologues(charJson) {
    if (!charJson || !charJson.autobiographical_memories || !charJson.autobiographical_memories.length) return null;
    return charJson.autobiographical_memories.map(function (m) { return m.event; });
  }

  function extractMilestones(charJson) {
    if (!charJson || !charJson.relationship_milestones || !charJson.relationship_milestones.length) return null;
    return charJson.relationship_milestones;
  }

  // ===== 渲染 =====
  function renderCharacter(char, stateInfo, charJson) {
    stateInfo = stateInfo || {};
    var meta = CHAR_META[char.id] || {
      codename: char.id,
      identity: "307室 · 成员",
      token: "未知",
      monologues: ["……（TA 暂时沉默着）", "有些话还没整理好，先收进抽屉里。", "也许下一次对话会不一样。"]
    };

    // 更新数据状态提示
    var notice = $("profileNotice");
    if (notice) {
      if (charJson) {
        notice.textContent = "角色基本信息已同步，部分数据（自传体记忆、关系里程碑、独白）待后端接口";
      } else {
        notice.textContent = "部分数据待后端接口，当前为占位展示";
      }
    }

    // 尝试从 character.json 提取更多数据
    var jsonData = parseCharJson(charJson);
    if (jsonData) {
      // 补充 token 字段：仍使用 CHAR_META（JSON 中无此字段）
      jsonData.token = meta.token;
      // 提取独白碎片
      jsonData.monologues = extractMonologues(charJson) || meta.monologues;
      // 提取关系里程碑
      jsonData.milestones = extractMilestones(charJson);
    }

    // 情绪标签：优先取 state 中的 emotion_label
    var emotionText = "--";
    if (stateInfo.emotionLabel) {
      emotionText = stateInfo.emotionLabel;
      if (stateInfo.emotionValue != null) {
        emotionText += " · " + stateInfo.emotionValue;
      }
    }

    // 左侧：名字 + 情绪标签
    $("profileName").textContent = char.name || char.id;
    $("profileEmotion").textContent = emotionText;

    // 基本信息：优先使用 JSON 数据，回退到 CHAR_META
    var codename = jsonData ? jsonData.codename : meta.codename;
    var identity = jsonData ? jsonData.identity : meta.identity;
    var token = jsonData ? jsonData.token : meta.token;
    $("infoCodename").textContent = codename;
    $("infoIdentity").textContent = identity;
    $("infoToken").textContent = token;

    // 内心独白碎片
    var monoBox = $("monologueList");
    monoBox.innerHTML = "";
    var monologues = jsonData ? jsonData.monologues : meta.monologues;
    monologues.forEach(function (text, i) {
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

    // 关系网络
    var relBox = $("relationList");
    relBox.innerHTML = "";
    var milestones = jsonData ? jsonData.milestones : null;
    if (milestones && milestones.length) {
      // 使用真实关系里程碑
      milestones.forEach(function (ms) {
        var item = document.createElement("div");
        item.className = "relation-item";

        var nameEl = document.createElement("span");
        nameEl.className = "relation-name";
        nameEl.textContent = ms.description || "里程碑";

        var bar = document.createElement("div");
        bar.className = "relation-bar";
        var fill = document.createElement("div");
        fill.className = "relation-bar-fill";
        bar.appendChild(fill);

        var valEl = document.createElement("span");
        valEl.className = "relation-val";
        valEl.textContent = ms.trust != null ? ms.trust : "--";

        item.appendChild(nameEl);
        item.appendChild(bar);
        item.appendChild(valEl);
        relBox.appendChild(item);

        // 延迟触发宽度过渡动画
        requestAnimationFrame(function () {
          setTimeout(function () { fill.style.width = (ms.trust != null ? ms.trust : 50) + "%"; }, 30);
        });
      });
    } else {
      // 回退：3 个室友，信任值随机（原有逻辑）
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

    // 并行获取：角色列表 + 状态 + 角色 JSON 数据文件
    Promise.all([
      fetchJson("/api/characters").catch(function () { return null; }),
      fetchJson("/api/state").catch(function () { return null; }),
      fetchJson("/characters/" + encodeURIComponent(charId) + "/data/character.json").catch(function () { return null; })
    ]).then(function (results) {
      var chars = results[0];
      var state = results[1];
      var charJson = results[2];

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

      renderCharacter(char, stateInfo, charJson);
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

/* 统一返回逻辑：有历史记录则回退，否则回主界面（导航闭环） */
window.goBack = function () {
  if (history.length > 1) {
    history.back();
  } else {
    window.location.href = "index.html?skipIntro=1";
  }
};
