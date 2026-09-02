/* 开场动画模块：粒子汇聚成球 → 延伸曲线 → 过渡衔接主页面 */
(function () {
  "use strict";

  var intro = document.getElementById("intro");
  var introStage = document.getElementById("introStage");
  var introSphere = document.getElementById("introSphere");
  var introCurves = document.getElementById("introCurves");
  var isMobile = window.matchMedia && window.matchMedia("(max-width: 768px)").matches;

  /* ================================================================
     开场动画最终版 — 四阶段时间线
     单一 requestAnimationFrame 驱动，连续函数插值（无跳变）
     结束时 intro-stage 物理移动到 .core-visual 位置，无缝衔接
     ================================================================ */
  var INTRO_TOTAL = 4000;   // 总时长 4000ms
  var T1_END = 1000;        // 阶段 1：粒子从四周漂浮 → 汇聚到中心
  var T2_END = 2000;        // 阶段 2：汇聚成球 + 呼吸
  var T3_END = 3000;        // 阶段 3：延伸曲线 + 流动
  var T4_END = 4000;        // 阶段 4：曲线淡出 + 球体移动 + 黑幕淡出

  // —— 粒子数量（移动端减半） ——
  var SPHERE_COUNT = isMobile ? 15 : 30;
  var CORE_COUNT = isMobile ? 3 : 6;
  var CURVE_COUNT = isMobile ? 2 : 4;
  var CURVE_PARTICLES = isMobile ? 8 : 15;

  // —— 球体呼吸参数 ——
  var GATHER_R = isMobile ? 22 : 35;
  var SPREAD_R = isMobile ? 38 : 55;
  var CURVE_END_R = isMobile ? 55 : 80;
  var CURVE_CTRL_R_MAX = isMobile ? 45 : 65;

  // —— easeOutCubic 让漂浮汇聚有减速感 ——
  function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }
  function easeInOutCubic(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }

  // —— 二次贝塞尔 ——
  function bezierPoint(t, cx, cy, ex, ey) {
    var mt = 1 - t;
    return {
      x: 2 * mt * t * cx + t * t * ex,
      y: 2 * mt * t * cy + t * t * ey
    };
  }

  // —— 构建阶段 1/2/4 共用的球体粒子数据 ——
  var sphereData = [];
  var coreData = [];
  var curvesData = [];
  var introRafId = null;
  var introStartTs = 0;
  var introLastTs = 0;
  var skipRequested = false;

  function buildIntroParticles() {
    if (!introSphere || !introCurves) return;

    for (var i = 0; i < SPHERE_COUNT; i++) {
      var el = document.createElement("div");
      el.className = "intro-particle drifting";
      var baseOpacity = 0.55 + Math.random() * 0.35;
      var angle = Math.random() * Math.PI * 2;
      var driftR = 150 + Math.random() * 180;
      var driftX = Math.cos(angle) * driftR + (Math.random() - 0.5) * 80;
      var driftY = Math.sin(angle) * driftR + (Math.random() - 0.5) * 80;
      var sphAngle = Math.random() * Math.PI * 2;
      sphereData.push({
        el: el,
        baseOpacity: baseOpacity,
        driftX: driftX, driftY: driftY,
        sphAngle: sphAngle,
        breatheSpeed: 1.0 + Math.random() * 0.6,
        phase: Math.random() * Math.PI * 2,
        jitter: (Math.random() - 0.5) * 0.3
      });
      introSphere.appendChild(el);
    }

    for (var c = 0; c < CORE_COUNT; c++) {
      var cel = document.createElement("div");
      cel.className = "intro-core";
      var csize = 2 + Math.random() * 2;
      cel.style.width = csize + "px";
      cel.style.height = csize + "px";
      cel.style.opacity = "0";
      var cx = (Math.random() - 0.5) * 8;
      var cy = (Math.random() - 0.5) * 8;
      cel.style.transform = "translate3d(" + cx.toFixed(1) + "px," + cy.toFixed(1) + "px,0)";
      introSphere.appendChild(cel);
      coreData.push({ el: cel, baseOpacity: 0.95 });
    }

    var TWO_PI = Math.PI * 2;
    for (var ci = 0; ci < CURVE_COUNT; ci++) {
      var baseAngle = (ci / CURVE_COUNT) * TWO_PI + (Math.random() - 0.5) * 0.4;
      var endR = CURVE_END_R + Math.random() * 25;
      var ctrlR = 30 + Math.random() * CURVE_CTRL_R_MAX;
      var ctrlAngle = baseAngle + (Math.random() - 0.5) * 1.6;
      var endX = Math.cos(baseAngle) * endR;
      var endY = Math.sin(baseAngle) * endR;
      var ctrlX = Math.cos(ctrlAngle) * ctrlR;
      var ctrlY = Math.sin(ctrlAngle) * ctrlR;
      var flowSpeed = 0.05 + Math.random() * 0.07;

      var particles = [];
      for (var pi = 0; pi < CURVE_PARTICLES; pi++) {
        var pel = document.createElement("div");
        pel.className = "intro-flow";
        pel.style.opacity = "0";
        introCurves.appendChild(pel);
        particles.push({
          el: pel,
          t: Math.random()
        });
      }
      curvesData.push({
        endX: endX, endY: endY,
        ctrlX: ctrlX, ctrlY: ctrlY,
        speed: flowSpeed,
        particles: particles
      });
    }
  }

  var stage4Target = null;

  function computeStage4Target() {
    var cv = document.getElementById("coreVisual");
    if (!cv) return null;
    var rect = cv.getBoundingClientRect();
    var targetCenterX = rect.left + rect.width / 2;
    var targetCenterY = rect.top + rect.height / 2;
    var screenCx = window.innerWidth / 2;
    var screenCy = window.innerHeight / 2;
    return {
      dx: targetCenterX - screenCx,
      dy: targetCenterY - screenCy,
      scale: 1
    };
  }

  function introLoop(now) {
    introRafId = null;
    if (!introStartTs) {
      introStartTs = now;
      introLastTs = now;
    }
    var dt = Math.min((now - introLastTs) / 1000, 0.05);
    introLastTs = now;
    var elapsed = now - introStartTs;
    var t = Math.min(elapsed, INTRO_TOTAL);
    var timeSec = t / 1000;

    if (t < T1_END) {
      var p1 = t / T1_END;
      var ease1 = easeOutCubic(p1);
      for (var i = 0; i < sphereData.length; i++) {
        var d = sphereData[i];
        var px = d.driftX * (1 - ease1);
        var py = d.driftY * (1 - ease1);
        var floatAmp = 15 * (1 - ease1);
        var fx = Math.sin(timeSec * 3 + d.phase) * floatAmp;
        var fy = Math.cos(timeSec * 2.5 + d.phase) * floatAmp;
        var opacity = d.baseOpacity * ease1;
        d.el.style.transform = "translate3d(" + (px + fx).toFixed(2) + "px," + (py + fy).toFixed(2) + "px,0)";
        d.el.style.opacity = opacity.toFixed(3);
        d.el.classList.remove("drifting");
      }
    } else if (t < T2_END) {
      var p2 = (t - T1_END) / (T2_END - T1_END);
      var settleEase = easeOutCubic(Math.min(p2 * 2, 1));
      for (var j = 0; j < sphereData.length; j++) {
        var sp = sphereData[j];
        var breath = Math.sin(timeSec * sp.breatheSpeed + sp.phase);
        var r = GATHER_R + (SPREAD_R - GATHER_R) * ((breath + 1) / 2);
        var angle = sp.sphAngle + Math.sin(timeSec * 0.4 + sp.phase) * sp.jitter;
        var px2 = Math.cos(angle) * r;
        var py2 = Math.sin(angle) * r;
        sp.el.style.transform = "translate3d(" + px2.toFixed(2) + "px," + py2.toFixed(2) + "px,0)";
        sp.el.style.opacity = sp.baseOpacity.toFixed(3);
      }
      if (p2 > 0.3) {
        var coreOp = (p2 - 0.3) / 0.7;
        for (var k = 0; k < coreData.length; k++) {
          coreData[k].el.style.opacity = Math.min(coreOp, 1).toFixed(3);
        }
      }
    } else if (t < T3_END) {
      var p3 = (t - T2_END) / (T3_END - T2_END);
      for (var s3 = 0; s3 < sphereData.length; s3++) {
        var sp3 = sphereData[s3];
        var breath3 = Math.sin(timeSec * sp3.breatheSpeed + sp3.phase);
        var r3 = GATHER_R + (SPREAD_R - GATHER_R) * ((breath3 + 1) / 2);
        var angle3 = sp3.sphAngle + Math.sin(timeSec * 0.4 + sp3.phase) * sp3.jitter;
        var px3 = Math.cos(angle3) * r3;
        var py3 = Math.sin(angle3) * r3;
        sp3.el.style.transform = "translate3d(" + px3.toFixed(2) + "px," + py3.toFixed(2) + "px,0)";
      }
      for (var c3 = 0; c3 < coreData.length; c3++) {
        coreData[c3].el.style.opacity = "0.95";
      }
      for (var ci = 0; ci < curvesData.length; ci++) {
        var cv = curvesData[ci];
        for (var pi = 0; pi < cv.particles.length; pi++) {
          var pt = cv.particles[pi];
          pt.t += cv.speed * dt;
          if (pt.t > 1) pt.t -= 1;
          var bp = bezierPoint(pt.t, cv.ctrlX, cv.ctrlY, cv.endX, cv.endY);
          var fade = 1 - pt.t * 0.5;
          var showOp = Math.min(p3 * 2, 1);
          pt.el.style.transform = "translate3d(" + bp.x.toFixed(2) + "px," + bp.y.toFixed(2) + "px,0)";
          pt.el.style.opacity = (fade * showOp).toFixed(3);
        }
      }
    } else {
      var p4 = (t - T3_END) / (T4_END - T3_END);
      var ease4 = easeInOutCubic(p4);

      if (!stage4Target) {
        stage4Target = computeStage4Target();
      }

      var curveFade = 1 - ease4;
      for (var ci2 = 0; ci2 < curvesData.length; ci2++) {
        var cv2 = curvesData[ci2];
        for (var pi2 = 0; pi2 < cv2.particles.length; pi2++) {
          var pt2 = cv2.particles[pi2];
          pt2.t += cv2.speed * dt;
          if (pt2.t > 1) pt2.t -= 1;
          var bp2 = bezierPoint(pt2.t, cv2.ctrlX, cv2.ctrlY, cv2.endX, cv2.endY);
          pt2.el.style.transform = "translate3d(" + bp2.x.toFixed(2) + "px," + bp2.y.toFixed(2) + "px,0)";
          pt2.el.style.opacity = (curveFade).toFixed(3);
        }
      }

      var shrinkFactor = 1 - ease4 * 0.3;
      for (var s4 = 0; s4 < sphereData.length; s4++) {
        var sp4 = sphereData[s4];
        var breath4 = Math.sin(timeSec * sp4.breatheSpeed + sp4.phase);
        var r4 = (GATHER_R + (SPREAD_R - GATHER_R) * ((breath4 + 1) / 2)) * shrinkFactor;
        var angle4 = sp4.sphAngle + Math.sin(timeSec * 0.4 + sp4.phase) * sp4.jitter;
        var px4 = Math.cos(angle4) * r4;
        var py4 = Math.sin(angle4) * r4;
        sp4.el.style.transform = "translate3d(" + px4.toFixed(2) + "px," + py4.toFixed(2) + "px,0)";
        sp4.el.style.opacity = (sp4.baseOpacity * (1 - ease4 * 0.1)).toFixed(3);
      }
      for (var c4 = 0; c4 < coreData.length; c4++) {
        coreData[c4].el.style.opacity = ((1 - ease4) * 0.95).toFixed(3);
      }

      if (stage4Target) {
        var cx = 50 + (stage4Target.dx * ease4 / window.innerWidth) * 100;
        var cy = 50 + (stage4Target.dy * ease4 / window.innerHeight) * 100;
        introStage.style.left = cx.toFixed(3) + "%";
        introStage.style.top = cy.toFixed(3) + "%";
        introStage.style.opacity = (1 - ease4).toFixed(3);
      } else {
        introStage.style.opacity = (1 - ease4).toFixed(3);
      }

      intro.style.background = "rgba(0,0,0," + (1 - ease4).toFixed(3) + ")";
    }

    if (t >= INTRO_TOTAL || skipRequested) {
      finalizeIntro();
      return;
    }

    introRafId = requestAnimationFrame(introLoop);
  }

  function finalizeIntro() {
    if (introRafId != null) {
      cancelAnimationFrame(introRafId);
      introRafId = null;
    }
    if (intro) {
      intro.classList.add("fade-out");
      intro.style.background = "#000";
      setTimeout(function () {
        if (intro && intro.parentNode) {
          intro.parentNode.removeChild(intro);
        }
      }, 400);
    }
  }

  function startIntro() {
    buildIntroParticles();
    introStartTs = 0;
    requestAnimationFrame(function () {
      introStartTs = performance.now();
      introRafId = requestAnimationFrame(introLoop);
    });
  }

  function skipIntroNow() {
    skipRequested = true;
    finalizeIntro();
  }

  var params = new URLSearchParams(window.location.search);
  var skipIntro = params.get("skipIntro") === "1";

  function init() {
  // 优先判断 skipIntro
  var params = new URLSearchParams(window.location.search);
  if (params.get("skipIntro") === "1") {
    finalizeIntro();
    return;
  }
    if (skipIntro) {
      skipIntroNow();
    } else {
      startIntro();
    }
  }

  window.Intro = { init: init };
})();