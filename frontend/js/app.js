﻿﻿﻿/* 主入口：初始化所有模块、开场动画、定时刷新、事件绑定 */
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
  var SPHERE_COUNT = isMobile ? 15 : 30;     // 阶段1漂浮 + 阶段2球粒子
  var CORE_COUNT = isMobile ? 3 : 6;         // 球心亮核
  var CURVE_COUNT = isMobile ? 2 : 4;        // 曲线数量
  var CURVE_PARTICLES = isMobile ? 8 : 15;    // 每条曲线粒子数

  // —— 球体呼吸参数（与主页面 .core-visual 保持一致风格） ——
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

    // --- 球体粒子 ---
    for (var i = 0; i < SPHERE_COUNT; i++) {
      var el = document.createElement("div");
      el.className = "intro-particle drifting";   // 初始为漂浮态
      var baseOpacity = 0.55 + Math.random() * 0.35;
      var angle = Math.random() * Math.PI * 2;
      // 初始漂浮位置：在屏幕 600×600 范围内的随机点（相对于 intro-stage 中心）
      // 但 intro-stage 是居中的，所以用较大的随机半径
      var driftR = 150 + Math.random() * 180;
      var driftX = Math.cos(angle) * driftR + (Math.random() - 0.5) * 80;
      var driftY = Math.sin(angle) * driftR + (Math.random() - 0.5) * 80;
      // 球面目标坐标（单位球上均匀分布）
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

    // --- 球心亮核（静止 + CSS 脉冲） ---
    for (var c = 0; c < CORE_COUNT; c++) {
      var cel = document.createElement("div");
      cel.className = "intro-core";
      var csize = 2 + Math.random() * 2;
      cel.style.width = csize + "px";
      cel.style.height = csize + "px";
      // 初始隐藏，阶段 2 结束后才显
      cel.style.opacity = "0";
      var cx = (Math.random() - 0.5) * 8;
      var cy = (Math.random() - 0.5) * 8;
      cel.style.transform = "translate3d(" + cx.toFixed(1) + "px," + cy.toFixed(1) + "px,0)";
      introSphere.appendChild(cel);
      coreData.push({ el: cel, baseOpacity: 0.95 });
    }

    // --- 曲线粒子（初始隐藏，阶段 3 开始才显） ---
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
        pel.style.opacity = "0";   // 初始隐藏
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

  // —— 在阶段 4 开始时（t=3s）计算 intro-stage 需要移动到的目标位置 ——
  // 目标 = 主页面 .core-visual 的屏幕中心（getBoundingClientRect）
  var stage4Target = null;   // { dx, dy, scale } 从屏幕中心到目标的偏移

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
      // intro 粒子球在阶段 3 结束时半径 ≈ SPREAD_R，core-visual 球体呼吸半径也是 SPREAD_R 级
      // 不需要额外缩放（两者球体大小一致）
      scale: 1
    };
  }

  // —— rAF 动画主循环 ——
  function introLoop(now) {
    introRafId = null;
    if (!introStartTs) {
      introStartTs = now;
      introLastTs = now;
    }
    var dt = Math.min((now - introLastTs) / 1000, 0.05);   // 真实帧间隔，封顶 50ms 防卡顿
    introLastTs = now;
    var elapsed = now - introStartTs;   // ms，0 ~ 4000
    var t = Math.min(elapsed, INTRO_TOTAL);
    var timeSec = t / 1000;

    // ========= 阶段 1: 0 ~ 1s，粒子从四周漂浮汇聚 =========
    if (t < T1_END) {
      var p1 = t / T1_END;
      var ease1 = easeOutCubic(p1);
      for (var i = 0; i < sphereData.length; i++) {
        var d = sphereData[i];
        // 从 driftX/Y → 0/0
        var px = d.driftX * (1 - ease1);
        var py = d.driftY * (1 - ease1);
        // 轻微随机漂浮叠加（漂浮感）
        var floatAmp = 15 * (1 - ease1);
        var fx = Math.sin(timeSec * 3 + d.phase) * floatAmp;
        var fy = Math.cos(timeSec * 2.5 + d.phase) * floatAmp;
        var opacity = d.baseOpacity * ease1;
        d.el.style.transform = "translate3d(" + (px + fx).toFixed(2) + "px," + (py + fy).toFixed(2) + "px,0)";
        d.el.style.opacity = opacity.toFixed(3);
        d.el.classList.remove("drifting");   // 进入汇聚阶段后切换样式
      }
    }

    // ========= 阶段 2: 1s ~ 2s，聚集成球 + 呼吸 =========
    else if (t < T2_END) {
      var p2 = (t - T1_END) / (T2_END - T1_END);
      // 从"刚汇聚"到"稳定呼吸球"的过渡
      var settleEase = easeOutCubic(Math.min(p2 * 2, 1));   // 前 0.5s 完成稳定
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
      // 阶段 2 中段后让核粒子渐显
      if (p2 > 0.3) {
        var coreOp = (p2 - 0.3) / 0.7;
        for (var k = 0; k < coreData.length; k++) {
          coreData[k].el.style.opacity = Math.min(coreOp, 1).toFixed(3);
        }
      }
    }

    // ========= 阶段 3: 2s ~ 3s，延伸曲线 + 流动 =========
    else if (t < T3_END) {
      var p3 = (t - T2_END) / (T3_END - T2_END);
      // 曲线渐显 + 流动
      // 球体继续呼吸
      for (var s3 = 0; s3 < sphereData.length; s3++) {
        var sp3 = sphereData[s3];
        var breath3 = Math.sin(timeSec * sp3.breatheSpeed + sp3.phase);
        var r3 = GATHER_R + (SPREAD_R - GATHER_R) * ((breath3 + 1) / 2);
        var angle3 = sp3.sphAngle + Math.sin(timeSec * 0.4 + sp3.phase) * sp3.jitter;
        var px3 = Math.cos(angle3) * r3;
        var py3 = Math.sin(angle3) * r3;
        sp3.el.style.transform = "translate3d(" + px3.toFixed(2) + "px," + py3.toFixed(2) + "px,0)";
      }
      // 核粒子常亮
      for (var c3 = 0; c3 < coreData.length; c3++) {
        coreData[c3].el.style.opacity = "0.95";
      }
      // 曲线粒子：沿贝塞尔流动
      for (var ci = 0; ci < curvesData.length; ci++) {
        var cv = curvesData[ci];
        for (var pi = 0; pi < cv.particles.length; pi++) {
          var pt = cv.particles[pi];
          pt.t += cv.speed * dt;
          if (pt.t > 1) pt.t -= 1;
          var bp = bezierPoint(pt.t, cv.ctrlX, cv.ctrlY, cv.endX, cv.endY);
          var fade = 1 - pt.t * 0.5;
          var showOp = Math.min(p3 * 2, 1);   // 渐显
          pt.el.style.transform = "translate3d(" + bp.x.toFixed(2) + "px," + bp.y.toFixed(2) + "px,0)";
          pt.el.style.opacity = (fade * showOp).toFixed(3);
        }
      }
    }

    // ========= 阶段 4: 3s ~ 4s，曲线淡出 + 球体移动 + intro 淡出 =========
    else {
      var p4 = (t - T3_END) / (T4_END - T3_END);   // 0 ~ 1
      var ease4 = easeInOutCubic(p4);

      // 首次进入阶段 4：计算目标位置
      if (!stage4Target) {
        stage4Target = computeStage4Target();
      }

      // --- 曲线粒子整体淡出 ---
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

      // --- 球体粒子：呼吸 + 渐向小半径收缩 + 整体随 stage 移动 ---
      var shrinkFactor = 1 - ease4 * 0.3;   // 半径收缩到 70%
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
      // 核粒子也渐隐
      for (var c4 = 0; c4 < coreData.length; c4++) {
        coreData[c4].el.style.opacity = ((1 - ease4) * 0.95).toFixed(3);
      }

      // --- intro-stage 整体：从屏幕中心移动到 core-visual 目标位置 ---
      // 保持 transform: translate(-50%, -50%) 不变，只改 left/top 百分比偏移
      if (stage4Target) {
        var cx = 50 + (stage4Target.dx * ease4 / window.innerWidth) * 100;
        var cy = 50 + (stage4Target.dy * ease4 / window.innerHeight) * 100;
        introStage.style.left = cx.toFixed(3) + "%";
        introStage.style.top = cy.toFixed(3) + "%";
        introStage.style.opacity = (1 - ease4).toFixed(3);
      } else {
        introStage.style.opacity = (1 - ease4).toFixed(3);
      }

      // --- intro 黑幕背景也逐渐透明（让下方 .app 自然露出） ---
      intro.style.background = "rgba(0,0,0," + (1 - ease4).toFixed(3) + ")";
    }

    // ========= 时间线结束 =========
    if (t >= INTRO_TOTAL || skipRequested) {
      finalizeIntro();
      return;
    }

    introRafId = requestAnimationFrame(introLoop);
  }

  // —— 收尾：移除 intro，恢复 background，清理 rAF ——
  function finalizeIntro() {
    if (introRafId != null) {
      cancelAnimationFrame(introRafId);
      introRafId = null;
    }
    if (intro) {
      intro.classList.add("fade-out");
      // 恢复背景为纯黑（避免残留渐变）
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
    // 延迟 1 帧启动，确保 DOM 已渲染
    requestAnimationFrame(function () {
      introStartTs = performance.now();
      introRafId = requestAnimationFrame(introLoop);
    });
  }

  function skipIntroNow() {
    skipRequested = true;
    finalizeIntro();
  }

  // —— URL 参数判断 ——
  var params = new URLSearchParams(window.location.search);
  var skipIntro = params.get("skipIntro") === "1";

  if (skipIntro) {
    // 直接收尾：黑幕立即淡出（400ms CSS transition）
    skipIntroNow();
  } else {
    // 确保 core-visual 容器已存在（intro 运行期间后台粒子循环也在跑）
    startIntro();
  }

  // ---------- 全局背景粒子（底部向上漂浮，三档速度：慢 20s / 中 12s / 快 7s） ----------
  (function initGlobalParticles() {
    var container = document.getElementById("globalBg");
    if (!container) return;
    var isMobile = window.matchMedia && window.matchMedia("(max-width: 768px)").matches;
    var count = isMobile
      ? (20 + Math.floor(Math.random() * 11))          // 移动端 20-30
      : (40 + Math.floor(Math.random() * 21));         // 桌面 40-60
    // 为每个粒子分配速度档位，保证三档都有覆盖
    function randDuration() {
      var r = Math.random();
      if (r < 0.35) return 20 + Math.random() * 5;   // 慢：20-25s
      if (r < 0.75) return 10 + Math.random() * 5;   // 中：10-15s
      return 6 + Math.random() * 4;                  // 快：6-10s
    }
    for (var i = 0; i < count; i++) {
      var p = document.createElement("div");
      p.className = "global-particle";
      var size = 1 + Math.random() * 2;                              // 1-3px
      var opacity = 0.3 + Math.random() * 0.4;                        // 0.3-0.7
      var duration = randDuration();
      var delay = Math.random() * duration;
      p.style.left = (Math.random() * 100).toFixed(1) + "%";
      p.style.top = (100 + Math.random() * 10).toFixed(1) + "%";      // 从屏幕底部外侧开始
      p.style.width = size + "px";
      p.style.height = size + "px";
      p.style.opacity = opacity;
      p.style.setProperty("--p-opacity", opacity.toFixed(2));
      p.style.animationDuration = duration.toFixed(1) + "s";
      p.style.animationDelay = "-" + delay.toFixed(1) + "s";           // 负延迟让粒子初始即散布
      container.appendChild(p);
    }
  })();

  // ---------- #globalBg 碰撞微光光点（随机位置闪烁 + 消失 + 再闪） ----------
  // 与 global-particle（缓慢上浮）完全独立：此处光点是突然闪烁后消失的"碰撞微光"
  (function initGlobalSparks() {
    var container = document.getElementById("globalBg");
    if (!container) return;
    var isMobile3 = window.matchMedia && window.matchMedia("(max-width: 768px)").matches;
    // 桌面 6-8 个，移动 3-4 个
    var SPARK_COUNT = isMobile3
      ? (3 + Math.floor(Math.random() * 2))
      : (6 + Math.floor(Math.random() * 3));

    // 颜色池：冰蓝 / 淡蓝白 两种，随机混合
    var COLORS = [
      "rgba(140,190,255,1)",   // 冰蓝
      "rgba(180,215,255,1)",   // 淡白蓝
      "rgba(220,235,255,1)"    // 近白
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
      var size = 2 + Math.random() * 2;                         // 2-4px
      var color = COLORS[Math.floor(Math.random() * COLORS.length)];
      var duration = 3 + Math.random() * 5;                    // 3-8s 闪烁周期
      var delay = Math.random() * duration;                     // 初始延迟（让光点初始即散布）

      s.style.width = size + "px";
      s.style.height = size + "px";
      s.style.color = color;                                    /* currentColor 的来源 */
      s.style.boxShadow = BOX_SHADOWS[color];                   /* 闪烁时的 glow */
      s.style.setProperty("--spark-duration", duration.toFixed(1) + "s");
      s.style.animationDelay = "-" + delay.toFixed(1) + "s";    /* 负延迟避免初始同步 */

      placeSpark(s);
      container.appendChild(s);
      sparkEls.push(s);
    }

    // 每 3.5s 随机重定位 ~1/3 的光点位置，让它们"闪烁后换地方"
    setInterval(function () {
      if (!sparkEls.length) return;
      var batch = Math.max(1, Math.floor(sparkEls.length / 3));
      // 随机选择 batch 个光点（不重复）
      var indices = [];
      while (indices.length < batch) {
        var idx = Math.floor(Math.random() * sparkEls.length);
        if (indices.indexOf(idx) === -1) indices.push(idx);
      }
      for (var k = 0; k < indices.length; k++) {
        placeSpark(sparkEls[indices[k]]);
      }
    }, 3500);
  })();

  // ---------- 核心视觉：粒子聚合球 + 动态曲线 ----------
  // 理念："一个角色原点，身后连接着无数动态的线"
  (function initCoreVisual() {
    var container = document.getElementById("coreVisual");
    if (!container) return;   // feature detect：不在 index.html 上静默跳过

    var isMobile2 = window.matchMedia && window.matchMedia("(max-width: 768px)").matches;
    // 桌面 100 球粒子 / 10 核粒子 / 4 条曲线 x 20 粒子 ≈ 190；移动端减半
    var SPHERE_COUNT = isMobile2 ? 50 : 100;
    var CORE_COUNT = isMobile2 ? 6 : 10;
    var CURVE_COUNT = isMobile2 ? 3 : 4;
    var CURVE_PARTICLES_PER_CURVE = isMobile2 ? 12 : 20;

    // 容器中心像素值（CSS 固定 200x200 / 移动 150x150）
    var CENTER_X = isMobile2 ? 75 : 100;
    var CENTER_Y = isMobile2 ? 75 : 100;

    // 呼吸半径：聚拢 35px，扩散 60px
    var GATHER_R = 35;
    var SPREAD_R = 60;
    if (isMobile2) { GATHER_R = 25; SPREAD_R = 40; }

    // 曲线终点距离球心（桌面）
    var CURVE_END_R = isMobile2 ? 60 : 90;

    // ---------- 1. 构建球体粒子数据（聚散呼吸） ----------
    var sphereData = [];
    for (var i = 0; i < SPHERE_COUNT; i++) {
      var el = document.createElement("div");
      el.className = "cv-particle";
      var size = 1 + Math.random() * 2;
      var baseOpacity = 0.4 + Math.random() * 0.5;
      el.style.width = size + "px";
      el.style.height = size + "px";
      el.style.opacity = baseOpacity.toFixed(3);
      // 一次性把 left/top 设为容器中心像素值，避免每帧 calc
      el.style.left = CENTER_X + "px";
      el.style.top = CENTER_Y + "px";
      container.appendChild(el);
      sphereData.push({
        el: el,
        baseOpacity: baseOpacity,
        angle: Math.random() * Math.PI * 2,
        // 呼吸周期 4-6s 对应角频率 2π/6 ≈ 1.05 到 2π/4 ≈ 1.57
        breatheSpeed: 1.0 + Math.random() * 0.55,
        phase: Math.random() * Math.PI * 2,
        jitter: (Math.random() - 0.5) * 0.4
      });
    }

    // ---------- 2. 构建球心亮核粒子（静止 + CSS 脉冲动画） ----------
    for (var c = 0; c < CORE_COUNT; c++) {
      var cel = document.createElement("div");
      cel.className = "cv-core-particle";
      var csize = 2 + Math.random() * 2;
      cel.style.width = csize + "px";
      cel.style.height = csize + "px";
      cel.style.left = CENTER_X + "px";
      cel.style.top = CENTER_Y + "px";
      // 核粒子围绕中心做小幅度随机漂移（JS 固定偏移，CSS 做呼吸脉冲）
      var cx = (Math.random() - 0.5) * 10;
      var cy = (Math.random() - 0.5) * 10;
      cel.style.transform = "translate3d(" + cx.toFixed(1) + "px, " + cy.toFixed(1) + "px, 0)";
      container.appendChild(cel);
    }

    // ---------- 3. 构建曲线粒子流（从球心向外延伸的二次贝塞尔曲线） ----------
    var curves = [];
    var TWO_PI = Math.PI * 2;

    for (var cvi = 0; cvi < CURVE_COUNT; cvi++) {
      // 曲线方向角：均匀分布 + 微抖动，避免曲线重叠
      var baseAngle = (cvi / CURVE_COUNT) * TWO_PI + (Math.random() - 0.5) * 0.3;
      var endR = CURVE_END_R + Math.random() * (isMobile2 ? 25 : 40);
      var ctrlR = endR * (0.4 + Math.random() * 0.4);
      var ctrlAngle = baseAngle + (Math.random() - 0.5) * 1.4;
      var endX = Math.cos(baseAngle) * endR;
      var endY = Math.sin(baseAngle) * endR;
      var ctrlX = Math.cos(ctrlAngle) * ctrlR;
      var ctrlY = Math.sin(ctrlAngle) * ctrlR;

      // 流速：每条不同（0.04-0.12，对应循环时间约 8-25s）
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

    // ---------- 4. rAF 驱动的动画循环（单个循环，同时更新球体 + 曲线） ----------
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

      // --- 球体粒子：聚散呼吸（每粒子独立相位） ---
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

      // --- 曲线粒子：沿二次贝塞尔曲线流动 ---
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
      lastTs = 0;   // 重置时间基准，避免切换标签页后的大 dt 跳跃
      rafId = requestAnimationFrame(animate);
    }
    function stopLoop() {
      if (rafId != null) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
    }

    // 页面隐藏时暂停 rAF，恢复时继续（节省 CPU + 避免时间跳跃）
    document.addEventListener("visibilitychange", function () {
      if (document.hidden) { stopLoop(); } else { startLoop(); }
    });

    startLoop();
  })();

  // ---------- 状态刷新（世界观察中心：场景 / 时段 / 天气 / 粒子） ----------
  function refreshState() {
    if (!window.API || !window.API.getState) return;
    window.API.getState().then(function (s) {
      if (!s) return;
      if (window.Scene && window.Scene.update) window.Scene.update(s);
      if (window.WorldClock && s.world) window.WorldClock.update(s.world.time_of_day, s.world.day);
      // 时段氛围光：依据 world.time_of_day 切换场景光晕
      if (window.TimeLighting && s.world) window.TimeLighting.update(s.world.time_of_day);
      // 天气特效：依据 world.weather 切换晴 / 雨 / 雪 / 阴 / 风
      if (window.WeatherEffects && s.world) window.WeatherEffects.update(s.world.weather);
      // 侧边栏底部：时间 / 天气（与 WorldClock / WeatherEffects 同源数据）
      if (s.world) {
        var sbTime = document.getElementById("sidebarTime");
        var sbWeather = document.getElementById("sidebarWeather");
        if (sbTime) sbTime.textContent = "第 " + (s.world.day != null ? s.world.day : "--") + " 天 · " + (s.world.time_of_day || "--");
        if (sbWeather) sbWeather.textContent = s.world.weather || "--";
      }
      // 顶部胶囊信息条：世界日 / 时段 / 天气 / 时间
      if (s.world) {
        var stDay = document.getElementById("stDay");
        var stPhase = document.getElementById("stPhase");
        var stWeather = document.getElementById("stWeather");
        var stTime = document.getElementById("stTime");
        if (stDay) stDay.textContent = s.world.day != null ? s.world.day : "--";
        if (stPhase) stPhase.textContent = s.world.time_of_day || "--";
        if (stWeather) stWeather.textContent = s.world.weather || "--";
        if (stTime) {
          var now = new Date();
          stTime.textContent = ("0" + now.getHours()).slice(-2) + ":" + ("0" + now.getMinutes()).slice(-2);
        }
      }
      // 情绪粒子：依据情绪值调整颜色 / 速度 / 方向 / 密度
      if (window.EmotionParticles) window.EmotionParticles.update(s.emotion);
    }).catch(function () { /* 静默失败 */ });
  }

  // ---------- 初始化 ----------
  function init() {
    // 初始化保留模块（场景 / 时钟 / 时段光 / 粒子 / 天气）
    if (window.Scene && window.Scene.init) window.Scene.init();
    if (window.WorldClock) window.WorldClock.init();
    if (window.EmotionParticles) window.EmotionParticles.init();
    if (window.TimeLighting) window.TimeLighting.init();
    if (window.WeatherEffects) window.WeatherEffects.init();
    if (window.SearchPanel) window.SearchPanel.init();   // 全局搜索面板（侧边栏入口 / Ctrl+K）

    renderActiveCharacters();   // 活跃角色快捷区（动态加载，静态回退）
    refreshState();
    setInterval(refreshState, 2000);
  }

  // ---------- 侧边栏：移动端抽屉切换 ----------
  var sidebar = document.getElementById("sidebar");
  var sidebarMask = document.getElementById("sidebarMask");

  // 移动端遮罩点击关闭侧边栏
  if (sidebarMask && sidebar) {
    sidebarMask.addEventListener("click", function () {
      sidebar.classList.remove("open");
      sidebarMask.classList.remove("show");
    });
  }

  // 搜索入口：唤起全局搜索面板（模块存在才绑定）
  var searchTrigger = document.getElementById("searchTrigger");
  if (searchTrigger) {
    searchTrigger.addEventListener("click", function () {
      if (window.SearchPanel && window.SearchPanel.open) window.SearchPanel.open();
    });
  }

  // ---------- 通知抽屉（侧边栏右上角铃铛图标） ----------
  var sidebarNotify = document.getElementById("sidebarNotify");
  var notifyDrawer = document.getElementById("notifyDrawer");
  var notifyClose = document.getElementById("notifyClose");
  if (sidebarNotify && notifyDrawer) {
    sidebarNotify.addEventListener("click", function (e) {
      e.stopPropagation();
      notifyDrawer.classList.toggle("open");
    });
  }
  if (notifyClose && notifyDrawer) {
    notifyClose.addEventListener("click", function () {
      notifyDrawer.classList.remove("open");
    });
  }

  // 当前页高亮：依据 pathname 匹配对应 .nav-link
  (function highlightSidebar() {
    var links = document.querySelectorAll("#sidebar .nav-link");
    if (!links.length) return;
    var current = window.location.pathname.replace(/\/+$/, "") || "/";
    var onIndex = current === "/" || current.indexOf("index.html") !== -1;
    var matched = false;
    Array.prototype.forEach.call(links, function (a) {
      a.classList.remove("active");
      try {
        var path = new URL(a.href).pathname.replace(/\/+$/, "") || "/";
        var isIndexLink = path.indexOf("index.html") !== -1;
        if ((onIndex && isIndexLink) || (!onIndex && path === current)) {
          a.classList.add("active");
          matched = true;
        }
      } catch (err) { /* href 解析失败则跳过 */ }
    });
    if (!matched) links[0].classList.add("active");   // 兜底：世界入口
  })();

  // ---------- 活跃角色快捷区（基于 .char-item 静态占位） ----------
  // 角色列表在 index.html 中已静态声明（冷旭帆 / 黄景云 / 叶清辞），
  // 此处为 .char-item 绑定点击跳转，兼容未来 API 动态刷新。
  function bindCharItemClicks() {
    var items = document.querySelectorAll("#sbCharList .char-item");
    Array.prototype.forEach.call(items, function (el) {
      el.addEventListener("click", function () {
        var charId = el.getAttribute("data-char");
        if (charId) {
          window.location.href = "chat.html?char=" + encodeURIComponent(charId);
        }
      });
    });
  }
  // 保留旧接口兼容：标记当前角色高亮（基于 .char-item）
  function highlightCurrentChar() {
    var p = new URLSearchParams(window.location.search);
    var charId = p.get("char");
    if (!charId) return;
    var items = document.querySelectorAll("#sbCharList .char-item");
    Array.prototype.forEach.call(items, function (el) {
      if (el.getAttribute("data-char") === charId) el.classList.add("current");
    });
  }
  function renderActiveCharacters() {
    var container = document.getElementById("sbCharList");
    if (!container) {
      // 旧版 #sidebarCharacters 兼容
      var oldContainer = document.getElementById("sidebarCharacters");
      if (oldContainer) {
        if (!window.API || typeof window.API.getActiveCharacters !== "function") {
          highlightCurrentChar();
          return;
        }
        window.API.getActiveCharacters().then(function (chars) {
          if (!chars || !chars.length) { highlightCurrentChar(); return; }
          var allLink = oldContainer.querySelector(".char-link.all");
          Array.prototype.forEach.call(oldContainer.querySelectorAll(".char-link:not(.all)"), function (el) { el.remove(); });
          chars.slice(0, 3).forEach(function (c) {
            var a = document.createElement("a");
            a.href = "chat.html?char=" + encodeURIComponent(c.id || c.key || "");
            a.className = "char-link";
            a.setAttribute("data-char-id", c.id || c.key || "");
            var avatar = document.createElement("div");
            avatar.className = "char-avatar";
            avatar.textContent = (c.name || c.id || "?").slice(0, 1);
            var span = document.createElement("span");
            span.className = "char-name";
            span.textContent = c.name || c.id;
            a.appendChild(avatar);
            a.appendChild(span);
            if (allLink && allLink.parentNode) {
              allLink.parentNode.insertBefore(a, allLink);
            } else {
              oldContainer.appendChild(a);
            }
          });
          highlightCurrentChar();
        }).catch(function () { highlightCurrentChar(); });
      }
      return;
    }
    // 新版：动态加载角色列表
    function loadCharacters(list) {
      if (!list || !list.length) return false;
      // 移除所有 .char-item（保留 .sb-entry-link 等非 char-item 元素）
      var oldItems = container.querySelectorAll(".char-item");
      Array.prototype.forEach.call(oldItems, function (el) { el.remove(); });
      // 根据返回结果重新生成
      list.forEach(function (c) {
        var id = c.id || c.key || "";
        var name = c.name || id;
        var div = document.createElement("div");
        div.className = "char-item";
        div.setAttribute("data-char", id);
        var dot = document.createElement("span");
        dot.className = "char-dot";
        var nameSpan = document.createElement("span");
        nameSpan.className = "char-name";
        nameSpan.textContent = name;
        var emotion = document.createElement("span");
        emotion.className = "char-emotion";
        emotion.textContent = "--";
        div.appendChild(dot);
        div.appendChild(nameSpan);
        div.appendChild(emotion);
        // 点击跳转 chat.html?char=对应id
        div.addEventListener("click", function () {
          if (id) window.location.href = "chat.html?char=" + encodeURIComponent(id);
        });
        // 插入到 .sb-entry-link 之前
        var entryLink = container.querySelector(".sb-entry-link");
        if (entryLink) {
          container.insertBefore(div, entryLink);
        } else {
          container.appendChild(div);
        }
      });
      return true;
    }

    // 尝试 API 获取，兼容数组和 {value: [...]} 两种返回格式
    var api = window.API;
    if (api && typeof api.getCharacters === "function") {
      api.getCharacters().then(function (res) {
        if (!res) { highlightCurrentChar(); bindCharItemClicks(); return; }
        var list = Array.isArray(res) ? res : (res.value || null);
        if (!loadCharacters(list)) {
          // API 返回空 → 保留静态兜底
          highlightCurrentChar();
          bindCharItemClicks();
        }
      }).catch(function () {
        // API 失败 → 保留静态兜底
        highlightCurrentChar();
        bindCharItemClicks();
      });
    } else {
      // 无 API → 直接使用静态兜底
      highlightCurrentChar();
      bindCharItemClicks();
    }
  }

  // 三栏骨架联动：第一栏 rail 切换第二栏多面板
  (function initRailSwitching() {
    var railItems = document.querySelectorAll('.rail-item');
    var panelMap = {
      world: '[data-panel="world"]',
      roster: '[data-panel="characters"]',
      chat: '[data-panel="chat"]',
      memory: '[data-panel="memory"]',
      settings: '[data-panel="settings"]'
    };
    function switchPanel(view) {
      var selector = panelMap[view];
      if (!selector) return;
      // 隐藏所有面板
      document.querySelectorAll('.sb-panel').forEach(function (p) {
        p.classList.remove('active');
      });
      // 显示目标面板
      var target = document.querySelector(selector);
      if (target) target.classList.add('active');
      // 更新第一栏高亮
      railItems.forEach(function (item) {
        item.classList.toggle('active', item.getAttribute('data-view') === view);
      });
    }
    railItems.forEach(function (item) {
      item.addEventListener('click', function () {
        var view = item.getAttribute('data-view');
        if (view) switchPanel(view);
      });
    });
    // 暴露全局接口，供其他模块程序化切换
    window.switchPanel = switchPanel;
    // 默认激活"世界"
    switchPanel('world');
  })();

  // 启动
  init();
})();


// ---------- 移动端独立汉堡按钮 ----------
(function bindMobileMenuBtn() {
  var btn = document.getElementById('mobileMenuBtn');
  var sidebar = document.getElementById('sidebar');
  var mask = document.getElementById('sidebarMask');
  if (!btn || !sidebar) return;
  btn.addEventListener('click', function (e) {
    e.stopPropagation();
    var willOpen = !sidebar.classList.contains('open');
    sidebar.classList.toggle('open', willOpen);
    if (mask) mask.classList.toggle('show', willOpen);
  });
})();