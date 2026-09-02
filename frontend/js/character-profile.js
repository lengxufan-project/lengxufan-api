/* 人物典籍页 —— 骨架脚本：仅 URL 参数读取与基础导航，无真实数据加载 */
(function () {
  "use strict";

  // 角色名映射（只用于页面标题显示，不做真实数据加载）
  var CHAR_NAMES = {
    lengxufan: "冷旭帆",
    huangjingyun: "黄景云",
    yeqingci: "叶清辞"
  };

  function $(id) { return document.getElementById(id); }

  function getCharIdFromUrl() {
    var params = new URLSearchParams(window.location.search);
    return params.get("char") || "lengxufan";
  }

  function init() {
    var charId = getCharIdFromUrl();
    var name = CHAR_NAMES[charId] || charId;

    // 更新顶部角色名
    var titleEl = $("profileTitle");
    if (titleEl) titleEl.textContent = name;

    // 更新大字角色名
    var nameEl = $("charName");
    if (nameEl) nameEl.textContent = name;

    // 更新页面标题
    document.title = "人物典籍 · " + name;
  }

  // 自动初始化
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();

/* 统一返回逻辑 */
window.goBack = function () {
  if (history.length > 1) {
    history.back();
  } else {
    window.location.href = "index.html?skipIntro=1";
  }
};