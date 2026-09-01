/* ============================================================
   群像画廊 —— 独立脚本
   从 /api/characters 获取角色列表，动态生成卡片
   点击卡片跳转 character-profile.html?char=角色id
   ============================================================ */
(function () {
  "use strict";

  // ===== 占位元数据（API 未提供的字段，与人物典籍页一致）=====
  var CHAR_META = {
    lengxufan: {
      identity: "307室 · 观察者",
      env: "cg-env-blue"
    },
    huangjingyun: {
      identity: "307室 · 通话者",
      env: "cg-env-orange"
    },
    yeqingci: {
      identity: "307室 · 计时者",
      env: "cg-env-purple"
    }
  };

  var FALLBACK_META = {
    identity: "307室 · 成员",
    env: "cg-env-blue"
  };

  // API 不可用时的兜底角色列表
  var FALLBACK_CHARS = [
    { id: "lengxufan", name: "冷旭帆" },
    { id: "huangjingyun", name: "黄景云" },
    { id: "yeqingci", name: "叶清辞" }
  ];

  function createCard(char) {
    var meta = CHAR_META[char.id] || FALLBACK_META;

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

  function render(chars) {
    var grid = document.getElementById("cgGrid");
    if (!grid) return;
    grid.innerHTML = "";
    (chars || []).forEach(function (char) {
      grid.appendChild(createCard(char));
    });
  }

  function loadCharacters() {
    fetch("/api/characters")
      .then(function (res) {
        if (!res.ok) throw new Error("HTTP " + res.status);
        return res.json();
      })
      .then(function (chars) {
        render(Array.isArray(chars) && chars.length ? chars : FALLBACK_CHARS);
      })
      .catch(function () {
        render(FALLBACK_CHARS);
      });
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
