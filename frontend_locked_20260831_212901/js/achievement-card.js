/* 成就卡片：左侧滑入 + 粒子洒落（预设成就为占位，后续接入后端） */
(function () {
  "use strict";

  var card = null;
  var hideTimer = null;

  // 预设成就（当前阶段占位，后续接入后端）
  var PRESETS = [
    { title: "初见", desc: "你第一次踏入 307 室" },
    { title: "信任萌芽", desc: "某个角色开始对你放松警惕" },
    { title: "深夜对话", desc: "在凌晨与角色进行了一次长谈" }
  ];

  function init() {
    if (document.getElementById("achievementCard")) {
      card = document.getElementById("achievementCard");
      return;
    }
    card = document.createElement("div");
    card.id = "achievementCard";
    card.innerHTML =
      '<div class="badge"></div>' +
      '<div class="title"></div>' +
      '<div class="desc"></div>' +
      '<div class="particles"></div>';
    document.body.appendChild(card);
  }

  // 生成 8 个粒子元素（随机位置，1-2px，冰蓝/金色，掉落 1s）
  function spawnParticles() {
    var box = card.querySelector(".particles");
    if (!box) return;
    box.innerHTML = "";
    for (var i = 0; i < 8; i++) {
      var p = document.createElement("span");
      p.className = "particle";
      var size = (1 + Math.random()).toFixed(1); // 1-2px
      p.style.width = size + "px";
      p.style.height = size + "px";
      p.style.left = (Math.random() * 100).toFixed(1) + "%";
      p.style.top = (Math.random() * 40).toFixed(1) + "%";
      p.style.background = Math.random() > 0.5 ? "#ffd76a" : "#8cc8ff";
      p.style.animationDelay = (Math.random() * 0.5).toFixed(2) + "s";
      box.appendChild(p);
    }
    setTimeout(function () { box.innerHTML = ""; }, 1600);
  }

  function show(title, description) {
    if (!card) init();
    card.querySelector(".title").textContent = title;
    card.querySelector(".desc").textContent = description;
    spawnParticles();
    card.classList.add("visible");
    if (hideTimer) clearTimeout(hideTimer);
    // 6 秒后自动滑出
    hideTimer = setTimeout(function () {
      card.classList.remove("visible");
    }, 6000);
  }

  window.AchievementCard = { init: init, show: show, presets: PRESETS };
})();
