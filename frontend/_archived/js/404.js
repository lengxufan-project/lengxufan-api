/* ============================================================
   404.js — 世界的缝隙（独立页面脚本）
   仅操作本页 #nf* 元素，依赖 css/404.css 的类名
   ============================================================ */
(function () {
  'use strict';

  var PARTICLE_COUNT = 24;   // 桌面端粒子数（移动端由 CSS 隐藏一半）

  var els = {
    page: null,
    orbWrap: null,
    orbit: null,
    content: null,
    btn: null
  };

  var state = {
    tx: 0, ty: 0,      // 视差目标偏移
    cx: 0, cy: 0,      // 视差当前偏移（缓动）
    burst: false,
    rafId: 0
  };

  // ===== 创建环绕粒子：随机角度 / 半径 / 大小 / 亮度 =====
  function createParticles() {
    els.orbit.innerHTML = '';
    for (var i = 0; i < PARTICLE_COUNT; i++) {
      var p = document.createElement('div');
      p.className = 'nf-particle';

      var angle = Math.random() * Math.PI * 2;
      var radius = 32 + Math.random() * 15;          // 距球心半径（占容器百分比）
      var left = 50 + Math.cos(angle) * radius;
      var top = 50 + Math.sin(angle) * radius;
      var size = 2 + Math.random() * 3;

      p.style.left = left.toFixed(2) + '%';
      p.style.top = top.toFixed(2) + '%';
      p.style.width = size.toFixed(1) + 'px';
      p.style.height = size.toFixed(1) + 'px';
      p.style.setProperty('--p-op', (0.4 + Math.random() * 0.6).toFixed(2));
      p.style.setProperty('--tw-dur', (2.2 + Math.random() * 2.6).toFixed(2) + 's');
      p.style.setProperty('--tw-delay', (Math.random() * 3).toFixed(2) + 's');

      els.orbit.appendChild(p);
    }
  }

  // ===== 鼠标移动视差：光球层正向偏移，文案层反向偏移 =====
  function onMouseMove(e) {
    if (state.burst) return;
    var nx = e.clientX / window.innerWidth - 0.5;    // -0.5 ~ 0.5
    var ny = e.clientY / window.innerHeight - 0.5;
    state.tx = nx * 26;
    state.ty = ny * 18;
  }

  function onMouseLeave() {
    if (state.burst) return;
    state.tx = 0;
    state.ty = 0;
  }

  function loop() {
    state.cx += (state.tx - state.cx) * 0.08;
    state.cy += (state.ty - state.cy) * 0.08;
    els.orbWrap.style.transform =
      'translate3d(' + state.cx.toFixed(2) + 'px, ' + state.cy.toFixed(2) + 'px, 0)';
    els.content.style.transform =
      'translate3d(' + (state.cx * -0.4).toFixed(2) + 'px, ' + (state.cy * -0.4).toFixed(2) + 'px, 0)';
    state.rafId = requestAnimationFrame(loop);
  }

  // ===== 点击返回：光球爆发 → 粒子四散 → 跳转 index.html =====
  function onBackClick() {
    if (state.burst) return;
    state.burst = true;
    cancelAnimationFrame(state.rafId);

    // 为每颗粒子注入随机飞散方向
    var particles = els.orbit.children;
    for (var i = 0; i < particles.length; i++) {
      var a = Math.random() * Math.PI * 2;
      var d = 120 + Math.random() * 180;
      particles[i].style.setProperty('--fx', (Math.cos(a) * d).toFixed(1) + 'px');
      particles[i].style.setProperty('--fy', (Math.sin(a) * d).toFixed(1) + 'px');
    }

    els.page.classList.add('burst');
    setTimeout(function () {
      goBack();
    }, 900);
  }

  // ===== 初始化 =====
  function init() {
    els.page = document.getElementById('nfPage');
    els.orbWrap = document.getElementById('nfOrbWrap');
    els.orbit = document.getElementById('nfOrbit');
    els.content = document.getElementById('nfContent');
    els.btn = document.getElementById('nfBackBtn');
    if (!els.page || !els.orbWrap || !els.orbit) return;

    createParticles();

    window.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseleave', onMouseLeave);
    if (els.btn) els.btn.addEventListener('click', onBackClick);

    loop();
  }

  init();
})();

/* 统一返回逻辑：有同源来源页则回退，否则回主界面（导航闭环） */
window.goBack = function () {
  if (document.referrer && document.referrer.includes(window.location.host)) {
    history.back();
  } else {
    window.location.href = "index.html?skipIntro=1";
  }
};
