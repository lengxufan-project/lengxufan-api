/* ============================================================
   world-guide.js — 世界导览（独立页面脚本）
   仅操作本页 #wg* / .wg-* 元素
   依赖 css/world-guide.css 的类名与主题变量
   ============================================================ */
(function () {
  'use strict';

  // ===== 场景 → 粒子运动方向（px / 帧）=====
  var DIRS = {
    rise:  { x: 0.05, y: -0.42 },  // 宿舍：暖尘缓缓上浮
    drift: { x: -0.5, y: 0.16 },   // 天台：月光风斜向飘
    sink:  { x: 0.04, y: 0.34 }    // 防空洞：尘埃缓慢下沉
  };

  var PARTICLE_COUNT = 26;
  var DOT_COLOR_DEFAULT = '88,166,255';

  var els = { scroll: null, dots: null, particles: null };
  var scenes = [];
  var dots = [];
  var dusts = [];
  var activeIndex = -1;
  var targetDir = DIRS.rise;
  var particles = [];
  var rafId = null;
  var ticking = false;
  var reduceMotion = false;

  // ===== 构建：垂直导航点 =====
  function buildDots() {
    scenes.forEach(function (scene, i) {
      var nameEl = scene.querySelector('.wg-name');
      var dot = document.createElement('button');
      dot.type = 'button';
      dot.className = 'wg-dot';
      dot.setAttribute('aria-label', nameEl ? nameEl.textContent : '场景 ' + (i + 1));
      dot.addEventListener('click', function () {
        scene.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
      });
      els.dots.appendChild(dot);
      dots.push(dot);
    });
  }

  // ===== 构建：全局粒子 =====
  function buildParticles() {
    for (var i = 0; i < PARTICLE_COUNT; i++) {
      var el = document.createElement('i');
      el.className = 'wg-particle';
      var size = 2 + Math.random() * 2.5;
      el.style.width = size.toFixed(1) + 'px';
      el.style.height = size.toFixed(1) + 'px';
      el.style.opacity = (0.25 + Math.random() * 0.4).toFixed(2);

      var p = {
        el: el,
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        vx: targetDir.x,
        vy: targetDir.y,
        mul: 0.5 + Math.random() * 1.2   // 个体速度差异
      };
      el.style.transform = 'translate3d(' + p.x.toFixed(1) + 'px,' + p.y.toFixed(1) + 'px,0)';
      els.particles.appendChild(el);
      particles.push(p);
    }
  }

  // ===== 粒子运动：方向随当前场景平滑过渡 =====
  function tickParticles() {
    var w = window.innerWidth;
    var h = window.innerHeight;
    for (var i = 0; i < particles.length; i++) {
      var p = particles[i];
      p.vx += (targetDir.x * p.mul - p.vx) * 0.02;
      p.vy += (targetDir.y * p.mul - p.vy) * 0.02;
      p.x += p.vx;
      p.y += p.vy;
      // 越界环绕
      if (p.x < -12) { p.x = w + 12; } else if (p.x > w + 12) { p.x = -12; }
      if (p.y < -12) { p.y = h + 12; } else if (p.y > h + 12) { p.y = -12; }
      p.el.style.transform = 'translate3d(' + p.x.toFixed(1) + 'px,' + p.y.toFixed(1) + 'px,0)';
    }
    rafId = requestAnimationFrame(tickParticles);
  }

  // ===== 切换当前场景：高亮导航点 + 粒子换色换向 =====
  function setActive(index) {
    if (index === activeIndex || index < 0 || index >= scenes.length) return;
    activeIndex = index;

    dots.forEach(function (d, i) {
      d.classList.toggle('active', i === index);
    });

    var scene = scenes[index];
    targetDir = DIRS[scene.getAttribute('data-dir')] || DIRS.rise;

    // 从场景主题变量读取粒子 / 导航点颜色
    var color = getComputedStyle(scene).getPropertyValue('--sc-particle').trim();
    if (!color) color = DOT_COLOR_DEFAULT;
    els.particles.style.setProperty('--wg-particle-color', color);
    els.dots.style.setProperty('--wg-dot-color', color);
  }

  // ===== 滚动监听：当前场景判定 + 背景视差 =====
  function update() {
    var scrollTop = els.scroll.scrollTop;
    var vh = els.scroll.clientHeight;
    var center = scrollTop + vh / 2;

    // 视口中心落在哪个场景区间 → 即为当前场景
    for (var i = 0; i < scenes.length; i++) {
      var top = scenes[i].offsetTop;
      if (center >= top && center < top + scenes[i].offsetHeight) {
        setActive(i);
        break;
      }
    }

    // 场景内视觉层视差：偏离视口中心越远，位移越大
    for (var j = 0; j < scenes.length; j++) {
      var layer = scenes[j].querySelector('.wg-parallax');
      if (!layer) continue;
      var speed = parseFloat(layer.getAttribute('data-speed')) || 0;
      var rect = scenes[j].getBoundingClientRect();
      var offset = rect.top + rect.height / 2 - vh / 2;
      layer.style.transform = 'translate3d(0,' + (-offset * speed).toFixed(1) + 'px,0)';
    }

    // 全局尘埃层视差：随滚动反向缓慢移动
    for (var k = 0; k < dusts.length; k++) {
      var dSpeed = parseFloat(dusts[k].getAttribute('data-speed')) || 0;
      dusts[k].style.transform = 'translate3d(0,' + (-scrollTop * dSpeed).toFixed(1) + 'px,0)';
    }
  }

  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      ticking = false;
      update();
    });
  }

  // ===== 初始化 =====
  function init() {
    els.scroll = document.getElementById('wgScroll');
    els.dots = document.getElementById('wgDots');
    els.particles = document.getElementById('wgParticles');
    if (!els.scroll || !els.dots) return;

    scenes = Array.prototype.slice.call(els.scroll.querySelectorAll('.wg-scene'));
    dusts = Array.prototype.slice.call(document.querySelectorAll('.wg-dust'));
    reduceMotion = window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    buildDots();

    // 粒子（尊重减弱动效偏好）
    if (els.particles && !reduceMotion) {
      buildParticles();
      rafId = requestAnimationFrame(tickParticles);
    }

    els.scroll.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    update();
  }

  // ===== 导出 =====
  window.WorldGuide = { init: init };

  // 脚本置于 body 末尾，DOM 就绪后直接初始化
  init();
})();
