/* 全局背景粒子 + 核心视觉粒子系统 */
(function () {
  "use strict";

  function initGlobalParticles() {
    var container = document.getElementById("globalBg");
    if (!container) return;
    var isMobile = window.matchMedia && window.matchMedia("(max-width: 768px)").matches;
    var count = isMobile
      ? (20 + Math.floor(Math.random() * 11))
      : (40 + Math.floor(Math.random() * 21));
    function randDuration() {
      var r = Math.random();
      if (r < 0.35) return 20 + Math.random() * 5;
      if (r < 0.75) return 10 + Math.random() * 5;
      return 6 + Math.random() * 4;
    }
    for (var i = 0; i < count; i++) {
      var p = document.createElement("div");
      p.className = "global-particle";
      var size = 1 + Math.random() * 2;
      var opacity = 0.3 + Math.random() * 0.4;
      var duration = randDuration();
      var delay = Math.random() * duration;
      p.style.left = (Math.random() * 100).toFixed(1) + "%";
      p.style.top = (100 + Math.random() * 10).toFixed(1) + "%";
      p.style.width = size + "px";
      p.style.height = size + "px";
      p.style.opacity = opacity;
      p.style.setProperty("--p-opacity", opacity.toFixed(2));
      p.style.animationDuration = duration.toFixed(1) + "s";
      p.style.animationDelay = "-" + delay.toFixed(1) + "s";
      container.appendChild(p);
    }
  }

  function initGlobalSparks() {
    var container = document.getElementById("globalBg");
    if (!container) return;
    var isMobile3 = window.matchMedia && window.matchMedia("(max-width: 768px)").matches;
    var SPARK_COUNT = isMobile3
      ? (3 + Math.floor(Math.random() * 2))
      : (6 + Math.floor(Math.random() * 3));

    var COLORS = [
      "rgba(140,190,255,1)",
      "rgba(180,215,255,1)",
      "rgba(220,235,255,1)"
    ];
    var BOX_SHADOWS = {
      "rgba(140,190,255,1)": "0 0 6px rgba(140,190,255,0.9), 0 0 16px rgba(88,166,255,0.5)",
      "rgba(180,215,255,1)": "0 0 7px rgba(180,215,255,0.85), 0 0 18px rgba(140,190,255,0.4)",
      "rgba(220,235,255,1)": "0 0 5px rgba(220,235,255,0.9), 0 0 14px rgba(180,215,255,0.3)"
    };

    var sparkEls = [];

    function placeSpark(el) {
      el.style.left = (Math.random() * 100).toFixed(1) + "%";
      el.style.top = (Math.random() * 100).toFixed(1) + "%";
    }

    for (var i = 0; i < SPARK_COUNT; i++) {
      var s = document.createElement("div");
      s.className = "global-spark";
      var size = 2 + Math.random() * 2;
      var color = COLORS[Math.floor(Math.random() * COLORS.length)];
      var duration = 3 + Math.random() * 5;
      var delay = Math.random() * duration;

      s.style.width = size + "px";
      s.style.height = size + "px";
      s.style.color = color;
      s.style.boxShadow = BOX_SHADOWS[color];
      s.style.setProperty("--spark-duration", duration.toFixed(1) + "s");
      s.style.animationDelay = "-" + delay.toFixed(1) + "s";

      placeSpark(s);
      container.appendChild(s);
      sparkEls.push(s);
    }

    setInterval(function () {
      if (!sparkEls.length) return;
      var batch = Math.max(1, Math.floor(sparkEls.length / 3));
      var indices = [];
      while (indices.length < batch) {
        var idx = Math.floor(Math.random() * sparkEls.length);
        if (indices.indexOf(idx) === -1) indices.push(idx);
      }
      for (var k = 0; k < indices.length; k++) {
        placeSpark(sparkEls[indices[k]]);
      }
    }, 3500);
  }

  function initCoreVisual() {
    var container = document.getElementById("coreVisual");
    if (!container) return;

    var isMobile2 = window.matchMedia && window.matchMedia("(max-width: 768px)").matches;
    var SPHERE_COUNT = isMobile2 ? 50 : 100;
    var CORE_COUNT = isMobile2 ? 6 : 10;
    var CURVE_COUNT = isMobile2 ? 3 : 4;
    var CURVE_PARTICLES_PER_CURVE = isMobile2 ? 12 : 20;

    var CENTER_X = isMobile2 ? 75 : 100;
    var CENTER_Y = isMobile2 ? 75 : 100;

    var GATHER_R = 35;
    var SPREAD_R = 60;
    if (isMobile2) { GATHER_R = 25; SPREAD_R = 40; }

    var CURVE_END_R = isMobile2 ? 60 : 90;

    var sphereData = [];
    for (var i = 0; i < SPHERE_COUNT; i++) {
      var el = document.createElement("div");
      el.className = "cv-particle";
      var size = 1 + Math.random() * 2;
      var baseOpacity = 0.4 + Math.random() * 0.5;
      el.style.width = size + "px";
      el.style.height = size + "px";
      el.style.opacity = baseOpacity.toFixed(3);
      el.style.left = CENTER_X + "px";
      el.style.top = CENTER_Y + "px";
      container.appendChild(el);
      sphereData.push({
        el: el,
        baseOpacity: baseOpacity,
        angle: Math.random() * Math.PI * 2,
        breatheSpeed: 1.0 + Math.random() * 0.55,
        phase: Math.random() * Math.PI * 2,
        jitter: (Math.random() - 0.5) * 0.4
      });
    }

    for (var c = 0; c < CORE_COUNT; c++) {
      var cel = document.createElement("div");
      cel.className = "cv-core-particle";
      var csize = 2 + Math.random() * 2;
      cel.style.width = csize + "px";
      cel.style.height = csize + "px";
      cel.style.left = CENTER_X + "px";
      cel.style.top = CENTER_Y + "px";
      var cx = (Math.random() - 0.5) * 10;
      var cy = (Math.random() - 0.5) * 10;
      cel.style.transform = "translate3d(" + cx.toFixed(1) + "px, " + cy.toFixed(1) + "px, 0)";
      container.appendChild(cel);
    }

    var curves = [];
    var TWO_PI = Math.PI * 2;

    for (var cvi = 0; cvi < CURVE_COUNT; cvi++) {
      var baseAngle = (cvi / CURVE_COUNT) * TWO_PI + (Math.random() - 0.5) * 0.3;
      var endR = CURVE_END_R + Math.random() * (isMobile2 ? 25 : 40);
      var ctrlR = endR * (0.4 + Math.random() * 0.4);
      var ctrlAngle = baseAngle + (Math.random() - 0.5) * 1.4;
      var endX = Math.cos(baseAngle) * endR;
      var endY = Math.sin(baseAngle) * endR;
      var ctrlX = Math.cos(ctrlAngle) * ctrlR;
      var ctrlY = Math.sin(ctrlAngle) * ctrlR;

      var flowSpeed = 0.04 + Math.random() * 0.08;

      var particles = [];
      for (var cp = 0; cp < CURVE_PARTICLES_PER_CURVE; cp++) {
        var pel = document.createElement("div");
        pel.className = "cv-flow-particle";
        var psize = 1 + Math.random() * 1.5;
        pel.style.width = psize + "px";
        pel.style.height = psize + "px";
        pel.style.left = CENTER_X + "px";
        pel.style.top = CENTER_Y + "px";
        container.appendChild(pel);
        particles.push({
          el: pel,
          t: Math.random()
        });
      }

      curves.push({
        endX: endX, endY: endY,
        ctrlX: ctrlX, ctrlY: ctrlY,
        speed: flowSpeed,
        particles: particles
      });
    }

    function bezierPoint(t, cx, cy, ex, ey) {
      var mt = 1 - t;
      var x = 2 * mt * t * cx + t * t * ex;
      var y = 2 * mt * t * cy + t * t * ey;
      return { x: x, y: y };
    }

    var rafId = null;
    var lastTs = 0;

    function animate(now) {
      rafId = null;
      if (!lastTs) lastTs = now;
      var dt = (now - lastTs) / 1000;
      lastTs = now;
      var timeSec = now / 1000;

      for (var si = 0; si < sphereData.length; si++) {
        var sp = sphereData[si];
        var breath = Math.sin(timeSec * sp.breatheSpeed + sp.phase);
        var r = GATHER_R + (SPREAD_R - GATHER_R) * ((breath + 1) / 2);
        var angle = sp.angle + Math.sin(timeSec * 0.3 + sp.phase) * sp.jitter;
        var px = Math.cos(angle) * r;
        var py = Math.sin(angle) * r;
        var opAdj = 0.75 + 0.25 * ((breath + 1) / 2);
        sp.el.style.transform = "translate3d(" + px.toFixed(2) + "px, " + py.toFixed(2) + "px, 0)";
        sp.el.style.opacity = (sp.baseOpacity * opAdj).toFixed(3);
      }

      for (var ci = 0; ci < curves.length; ci++) {
        var cv = curves[ci];
        for (var pi = 0; pi < cv.particles.length; pi++) {
          var pt = cv.particles[pi];
          pt.t += cv.speed * dt;
          if (pt.t > 1) pt.t -= 1;
          var bp = bezierPoint(pt.t, cv.ctrlX, cv.ctrlY, cv.endX, cv.endY);
          var fade = 1 - pt.t * 0.6;
          pt.el.style.transform = "translate3d(" + bp.x.toFixed(2) + "px, " + bp.y.toFixed(2) + "px, 0)";
          pt.el.style.opacity = fade.toFixed(3);
        }
      }

      rafId = requestAnimationFrame(animate);
    }

    function startLoop() {
      if (rafId != null) return;
      lastTs = 0;
      rafId = requestAnimationFrame(animate);
    }
    function stopLoop() {
      if (rafId != null) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
    }

    document.addEventListener("visibilitychange", function () {
      if (document.hidden) { stopLoop(); } else { startLoop(); }
    });

    startLoop();
  }

  function init() {
    initGlobalParticles();
    initGlobalSparks();
    initCoreVisual();
  }

  window.Particles = { init: init };
})();