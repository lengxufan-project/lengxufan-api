/* ============ 情绪粒子层 ============ */
/* 依据情绪值调整粒子颜色 / 速度 / 方向 / 密度 */
(function () {
  "use strict";

  var container = null;
  var particles = [];
  var isMobile = window.matchMedia && window.matchMedia("(max-width: 768px)").matches;
  var BASE_COUNT = isMobile ? 12 : 25;

  // 当前情绪态：颜色 / 方向 / 速度区间 / 额外密度
  // - normal：向上飘散（复用全局 floatUp 关键帧）
  // - reverse：向下飘落（floatUp 反向播放）
  var state = { color: "#58a6ff", dir: "normal", durMin: 8, durMax: 13, bonus: 0 };

  function rand(min, max) { return min + Math.random() * (max - min); }

  function applyStateTo(p) {
    p.style.setProperty("--particle-color", state.color);
    p.style.animationDuration = rand(state.durMin, state.durMax).toFixed(1) + "s";
    p.style.animationDirection = state.dir;
  }

  function createParticle() {
    var p = document.createElement("div");
    p.className = "emotion-particle";
    var size = 1 + Math.random() * 2; // 1-3px
    p.style.left = (Math.random() * 100) + "%";
    p.style.width = size.toFixed(2) + "px";
    p.style.height = size.toFixed(2) + "px";
    p.style.setProperty("--p-opacity", "0.3"); // 与 floatUp 关键帧的 opacity 对齐
    p.style.animationDelay = (Math.random() * 5).toFixed(1) + "s";
    applyStateTo(p);
    return p;
  }

  function init() {
    if (container) return;
    container = document.createElement("div");
    container.id = "emotionParticles";
    document.body.appendChild(container);
    for (var i = 0; i < BASE_COUNT; i++) {
      var p = createParticle();
      container.appendChild(p);
      particles.push(p);
    }
  }

  function syncAll() {
    for (var i = 0; i < particles.length; i++) applyStateTo(particles[i]);
  }

  // 调整密度：bonus 为相对 BASE_COUNT 的额外粒子数（可为负，下限为 0）
  function setDensity(bonus) {
    state.bonus = Math.max(0, bonus | 0);
    var target = BASE_COUNT + state.bonus;
    while (particles.length < target) {
      var p = createParticle();
      container.appendChild(p);
      particles.push(p);
    }
    while (particles.length > target) {
      var extra = particles.pop();
      if (extra && extra.parentNode) extra.parentNode.removeChild(extra);
    }
  }

  function update(emotionValue) {
    if (!container) return;
    var v = Number(emotionValue) || 0;
    if (v > 50) {
      // 积极：偏暖绿 #66e08b，向上飘散，速度稍快，密度增加
      state.color = "#66e08b"; state.dir = "normal";
      state.durMin = 5; state.durMax = 9;
      setDensity(isMobile ? 6 : 12);
    } else if (v < -50) {
      // 消极：偏紫 #a371f7，速度减慢，向下飘落
      state.color = "#a371f7"; state.dir = "reverse";
      state.durMin = 14; state.durMax = 20;
      setDensity(0);
    } else {
      // 平静：冰蓝 #58a6ff，正常速度，向上
      state.color = "#58a6ff"; state.dir = "normal";
      state.durMin = 8; state.durMax = 13;
      setDensity(0);
    }
    syncAll();
  }

  window.EmotionParticles = { init: init, update: update };
})();
