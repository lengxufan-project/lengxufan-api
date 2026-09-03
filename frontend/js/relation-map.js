/* ============================================================
   relation-map.js — 关系图谱（独立页面脚本）
   Canvas 引擎：图模式（缩放/拖拽/节点点击）+ 列表模式
   ============================================================ */
(function () {
  'use strict';

  // ===== 数据 =====
  var NODES = [
    { id: 'lxf', name: '冷旭帆', x: 500, y: 300, size: 30, desc: '故事的主角，一个在末日中努力生存的少年。' },
    { id: 'hjy', name: '黄景云', x: 240, y: 170, size: 24, desc: '冷旭帆的同学，性格开朗，总能在困境中找到希望。' },
    { id: 'yqc', name: '叶清辞', x: 760, y: 170, size: 24, desc: '神秘而冷静的少女，似乎知道许多不为人知的秘密。' },
    { id: 'you', name: '你',    x: 500, y: 470, size: 26, desc: '在这个世界中的自己，与角色们产生各种联系。' }
  ];

  var LINKS = [
    { a: 'lxf', b: 'you', intimacy: 85, stage: '知己',    desc: '你们之间建立了深厚的信任，他愿意向你敞开心扉。' },
    { a: 'lxf', b: 'hjy', intimacy: 60, stage: '好友',    desc: '多年的同窗情谊，在末日中更加牢固。' },
    { a: 'lxf', b: 'yqc', intimacy: 45, stage: '熟识',    desc: '逐渐熟悉起来，但彼此之间仍有未解开的谜团。' },
    { a: 'hjy', b: 'you', intimacy: 50, stage: '好友',    desc: '黄景云总能用他的乐观感染你。' },
    { a: 'yqc', b: 'you', intimacy: 40, stage: '熟识',    desc: '叶清辞偶尔会主动找你说话，但总是欲言又止。' },
    { a: 'hjy', b: 'yqc', intimacy: 30, stage: '初识',    desc: '两人之间有一种微妙的疏离感，似乎发生过什么。' }
  ];

  function getNode(id) {
    for (var i = 0; i < NODES.length; i++) {
      if (NODES[i].id === id) return NODES[i];
    }
    return null;
  }

  // ===== Canvas 状态 =====
  var canvas, ctx, wrap;
  var W = 0, H = 0;
  var dpr = 1;

  // 变换状态
  var tx = 0, ty = 0, scale = 1;
  var MIN_SCALE = 0.3, MAX_SCALE = 3;

  // 交互状态
  var isDragging = false;
  var dragStartX = 0, dragStartY = 0;
  var dragOriginTX = 0, dragOriginTY = 0;
  var focusedId = null;
  var hoveredNodeId = null;
  var animId = null;
  var clickTimer = null;          // 单击/双击检测
  var sidePanelOpen = false;      // 侧栏是否打开
  var sidePanelOriginTX = 0;      // 打开侧栏前的 tx
  var sidePanelOriginScale = 1;   // 打开侧栏前的 scale

  // 流动粒子
  var flows = [];
  var flowTime = 0;

  // 列表引用
  var listView, listCards, chips, toggleBtn, legend, hint, infoCard, stage;
  // 侧栏引用
  var sidePanel, sideClose, sideAvatar, sideName, sideStage, sideBarFill, sideBarLabel, sideDesc;

  // ===== 初始化 =====
  function init() {
    canvas = document.getElementById('rmCanvas');
    wrap = document.getElementById('rmCanvasWrap');
    stage = document.getElementById('rmStage');
    listView = document.getElementById('rmListView');
    listCards = document.getElementById('rmListCards');
    chips = document.getElementById('rmChips');
    toggleBtn = document.getElementById('rmToggle');
    legend = document.getElementById('rmLegend');
    hint = document.getElementById('rmHint');
    infoCard = document.getElementById('rmInfoCard');
    sidePanel = document.getElementById('rmSidePanel');
    sideClose = document.getElementById('rmSideClose');
    sideAvatar = document.getElementById('rmSideAvatar');
    sideName = document.getElementById('rmSideName');
    sideStage = document.getElementById('rmSideStage');
    sideBarFill = document.getElementById('rmSideBarFill');
    sideBarLabel = document.getElementById('rmSideBarLabel');
    sideDesc = document.getElementById('rmSideDesc');

    if (!canvas || !wrap) return;

    ctx = canvas.getContext('2d');
    dpr = window.devicePixelRatio || 1;

    // 初始化变换 —— 居中显示
    resize();
    centerTransform();

    // 构建流动粒子
    buildFlows();

    // 事件绑定
    bindEvents();

    // 构建 chips
    buildChips();

    // 结果模式切换
    toggleBtn.addEventListener('click', toggleMode);

    // 关闭信息卡
    document.getElementById('rmInfoClose').addEventListener('click', function (e) {
      e.stopPropagation();
      closeInfo();
    });

    // 点击舞台空白关闭信息卡
    stage.addEventListener('click', function (e) {
      if (e.target === stage || e.target === wrap || e.target === canvas) {
        closeInfo();
        setFocus(null);
      }
    });

    // 开始动画
    animId = requestAnimationFrame(render);
  }

  function resize() {
    var rect = wrap.getBoundingClientRect();
    W = rect.width;
    H = rect.height;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function centerTransform() {
    // 让世界坐标 (500, 300) 居中
    scale = Math.min(W / 1200, H / 700, 1);
    scale = Math.max(scale, MIN_SCALE);
    tx = W / 2 - 500 * scale;
    ty = H / 2 - 300 * scale;
  }

  // ===== 移动画布使节点居中 =====
  function panToNode(nodeId) {
    var node = getNode(nodeId);
    if (!node) return;
    // 世界坐标转换为需要的平移：node 中心居中屏幕
    // 屏幕中心坐标 = node 世界坐标 * scale + tx
    // 要求屏幕中心为 (W/2, H/2)
    // => tx = W/2 - node.x * scale
    // => ty = H/2 - node.y * scale
    var targetTx = W / 2 - node.x * scale;
    var targetTy = H / 2 - node.y * scale;
    // 平滑过渡 — 使用 requestAnimationFrame 动画
    var startTx = tx;
    var startTy = ty;
    var duration = 300;
    var startTime = performance.now();
    function animate(now) {
      var t = Math.min(1, (now - startTime) / duration);
      t = t * (2 - t); // ease out
      tx = startTx + (targetTx - startTx) * t;
      ty = startTy + (targetTy - startTy) * t;
      clampTransform();
      if (t < 1) {
        requestAnimationFrame(animate);
      }
    }
    requestAnimationFrame(animate);
  }

  // ===== 流动粒子 =====
  function buildFlows() {
    flows = [];
    LINKS.forEach(function (link) {
      var speed = 0.002 + (link.intimacy / 100) * 0.006;
      // 每条线 2 个粒子，错开相位
      for (var i = 0; i < 2; i++) {
        flows.push({
          link: link,
          t: i * 0.5,
          speed: speed + (Math.random() * 0.001)
        });
      }
    });
  }

  // ===== 渲染循环 =====
  function render(ts) {
    ctx.clearRect(0, 0, W, H);

    // 更新流动粒子
    flowTime = ts || 0;
    updateFlows();

    // 绘制连线
    drawLinks();

    // 绘制流动粒子
    drawFlows();

    // 绘制节点
    drawNodes();

    // 绘制标签
    drawLabels();

    animId = requestAnimationFrame(render);
  }

  function updateFlows() {
    for (var i = 0; i < flows.length; i++) {
      var f = flows[i];
      f.t += f.speed;
      if (f.t > 1) f.t -= 1;
    }
  }

  // ===== 世界坐标 ↔ 屏幕坐标 =====
  function worldToScreen(wx, wy) {
    return { x: wx * scale + tx, y: wy * scale + ty };
  }

  function screenToWorld(sx, sy) {
    return { x: (sx - tx) / scale, y: (sy - ty) / scale };
  }

  // ===== 绘制连线 =====
  function drawLinks() {
    LINKS.forEach(function (link) {
      var na = getNode(link.a);
      var nb = getNode(link.b);
      if (!na || !nb) return;

      var p1 = worldToScreen(na.x, na.y);
      var p2 = worldToScreen(nb.x, nb.y);

      var opacity = 0.25 + (link.intimacy / 100) * 0.45;
      var lineWidth = (1.2 + (link.intimacy / 100) * 0.8) * scale;

      // 焦点高亮/变暗
      var isFocused = focusedId !== null;
      var isConnected = focusedId && (link.a === focusedId || link.b === focusedId);

      if (isFocused) {
        opacity = isConnected ? 0.85 : 0.08;
        lineWidth = isConnected ? lineWidth * 1.5 : lineWidth * 0.5;
      }

      ctx.save();
      ctx.globalAlpha = opacity;
      ctx.strokeStyle = '#58a6ff';
      ctx.lineWidth = lineWidth;
      ctx.shadowColor = 'rgba(88, 166, 255, 0.4)';
      ctx.shadowBlur = isConnected ? 12 : 4;

      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();

      // 流动虚线效果（叠加一层虚线）
      ctx.setLineDash([6 * scale, 8 * scale]);
      ctx.lineDashOffset = -flowTime * 0.08;
      ctx.strokeStyle = 'rgba(88, 166, 255, 0.3)';
      ctx.lineWidth = lineWidth * 0.6;
      ctx.shadowBlur = 0;
      ctx.stroke();

      ctx.restore();
    });
  }

  // ===== 绘制流动粒子 =====
  function drawFlows() {
    flows.forEach(function (f) {
      var na = getNode(f.link.a);
      var nb = getNode(f.link.b);
      if (!na || !nb) return;

      var px = na.x + (nb.x - na.x) * f.t;
      var py = na.y + (nb.y - na.y) * f.t;
      var sp = worldToScreen(px, py);

      var isFocused = focusedId !== null;
      var isConnected = focusedId && (f.link.a === focusedId || f.link.b === focusedId);
      var opacity = isFocused ? (isConnected ? 1 : 0.08) : 0.8;
      var r = (1.5 + (f.link.intimacy / 100) * 1.2) * scale;

      ctx.save();
      ctx.globalAlpha = opacity;
      ctx.fillStyle = '#cfe7ff';
      ctx.shadowColor = 'rgba(88, 166, 255, 0.9)';
      ctx.shadowBlur = 6 * scale;
      ctx.beginPath();
      ctx.arc(sp.x, sp.y, Math.max(r, 1.5), 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
  }

  // ===== 绘制节点 =====
  function drawNodes() {
    NODES.forEach(function (n) {
      var sp = worldToScreen(n.x, n.y);
      var r = n.size * scale;
      var isFocused = focusedId !== null;
      var isFocus = n.id === focusedId;
      var isHover = n.id === hoveredNodeId;

      var opacity = 1;
      var scaleMul = 1;

      if (isFocused) {
        opacity = isFocus ? 1 : 0.25;
        scaleMul = isFocus ? 1.4 : 1;
      } else if (isHover) {
        scaleMul = 1.2;
      }

      var drawR = Math.max(r * scaleMul, 4);

      ctx.save();
      ctx.globalAlpha = opacity;

      // 外层光晕
      var glow = ctx.createRadialGradient(sp.x, sp.y, 0, sp.x, sp.y, drawR * 3);
      glow.addColorStop(0, 'rgba(88, 166, 255, 0.15)');
      glow.addColorStop(0.5, 'rgba(88, 166, 255, 0.05)');
      glow.addColorStop(1, 'rgba(88, 166, 255, 0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(sp.x, sp.y, drawR * 3, 0, Math.PI * 2);
      ctx.fill();

      // 核心球体
      var grad = ctx.createRadialGradient(
        sp.x - drawR * 0.25, sp.y - drawR * 0.25, 0,
        sp.x, sp.y, drawR
      );
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(0.3, '#e8f4ff');
      grad.addColorStop(0.6, '#9cc8ff');
      grad.addColorStop(0.85, '#58a6ff');
      grad.addColorStop(1, 'rgba(88, 166, 255, 0.3)');

      ctx.shadowColor = isFocus ? 'rgba(88, 166, 255, 0.8)' : 'rgba(88, 166, 255, 0.4)';
      ctx.shadowBlur = isFocus ? 30 * scale : 14 * scale;

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(sp.x, sp.y, drawR, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    });
  }

  // ===== 绘制标签 =====
  function drawLabels() {
    NODES.forEach(function (n) {
      var sp = worldToScreen(n.x, n.y);
      var r = n.size * scale;
      var isFocused = focusedId !== null;
      var opacity = isFocused ? (n.id === focusedId ? 1 : 0.2) : 0.8;
      var fontSize = Math.max(11 * scale, 8);

      ctx.save();
      ctx.globalAlpha = opacity;
      ctx.fillStyle = '#cfe4ff';
      ctx.font = fontSize + 'px "PingFang SC","Microsoft YaHei",sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.shadowColor = 'rgba(88, 166, 255, 0.5)';
      ctx.shadowBlur = 6 * scale;

      var labelY = sp.y + r + 8 * scale;
      ctx.fillText(n.name, sp.x, labelY);

      ctx.restore();
    });
  }

  // ===== 交互事件 =====
  function bindEvents() {
    // 鼠标滚轮缩放
    wrap.addEventListener('wheel', onWheel, { passive: false });

    // 鼠标拖拽
    wrap.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    // 点击节点
    canvas.addEventListener('click', onCanvasClick);
    // 双击节点
    canvas.addEventListener('dblclick', onCanvasDblClick);

    // 悬停检测
    canvas.addEventListener('mousemove', onCanvasHover);

    // 触摸事件
    wrap.addEventListener('touchstart', onTouchStart, { passive: false });
    wrap.addEventListener('touchmove', onTouchMove, { passive: false });
    wrap.addEventListener('touchend', onTouchEnd, { passive: false });

    // 窗口大小变化
    window.addEventListener('resize', function () {
      var oldScale = scale;
      var oldTx = tx, oldTy = ty;
      resize();
      scale = oldScale;
      tx = oldTx;
      ty = oldTy;
      clampTransform();
    });

    // 侧栏关闭
    if (sideClose) {
      sideClose.addEventListener('click', closeSidePanel);
    }
  }

  // ---- 滚轮缩放 ----
  function onWheel(e) {
    e.preventDefault();
    var rect = wrap.getBoundingClientRect();
    var mx = e.clientX - rect.left;
    var my = e.clientY - rect.top;

    var delta = e.deltaY > 0 ? 0.9 : 1.1;
    var newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, scale * delta));

    // 以鼠标位置为中心缩放
    var world = screenToWorld(mx, my);
    scale = newScale;
    var newScreen = worldToScreen(world.x, world.y);
    tx += mx - newScreen.x;
    ty += my - newScreen.y;

    clampTransform();
  }

  // ---- 鼠标拖拽 ----
  function onMouseDown(e) {
    if (e.button !== 0) return;
    isDragging = true;
    dragStartX = e.clientX;
    dragStartY = e.clientY;
    dragOriginTX = tx;
    dragOriginTY = ty;
  }

  function onMouseMove(e) {
    if (isDragging) {
      var dx = e.clientX - dragStartX;
      var dy = e.clientY - dragStartY;
      tx = dragOriginTX + dx;
      ty = dragOriginTY + dy;
      clampTransform();
    }
  }

  function onMouseUp() {
    isDragging = false;
  }

  // ---- Canvas 点击检测（单击 vs 双击） ----
  function onCanvasClick(e) {
    if (isDragging) return;
    // 双击检测：重置计时器表示有单击发生，等 280ms 后执行
    if (clickTimer) {
      clearTimeout(clickTimer);
      clickTimer = null;
      // 双击已经触发，忽略单击
      return;
    }
    clickTimer = setTimeout(function () {
      clickTimer = null;
      if (isDragging) return;
      // 执行单击动作
      var rect = canvas.getBoundingClientRect();
      var mx = e.clientX - rect.left;
      var my = e.clientY - rect.top;
      var world = screenToWorld(mx, my);
      var hit = hitTestNode(world.x, world.y);
      if (hit) {
        setFocus(hit);
        // 居中该节点
        panToNode(hit);
        // 如果侧栏打开，关闭侧栏并恢复
        if (sidePanelOpen) {
          closeSidePanel();
        }
      } else {
        if (!sidePanelOpen) {
          closeInfo();
          setFocus(null);
        }
      }
    }, 280);
  }

  // ---- Canvas 双击检测 ----
  function onCanvasDblClick(e) {
    if (isDragging) return;
    if (clickTimer) {
      clearTimeout(clickTimer);
      clickTimer = null;
    }
    var rect = canvas.getBoundingClientRect();
    var mx = e.clientX - rect.left;
    var my = e.clientY - rect.top;
    var world = screenToWorld(mx, my);
    var hit = hitTestNode(world.x, world.y);
    if (hit) {
      setFocus(hit);
      // 先居中
      centerNodeImmediate(hit);
      // 图谱向左缩小约20%
      sidePanelOriginTX = tx;
      sidePanelOriginScale = scale;
      var shiftPx = W * 0.12;
      tx -= shiftPx;
      // 缩小 20%
      scale = scale * 0.8;
      scale = Math.max(scale, MIN_SCALE);
      clampTransform();
      // 显示侧栏
      sidePanelOpen = true;
      showSidePanel(hit);
    }
  }

  function centerNodeImmediate(nodeId) {
    var node = getNode(nodeId);
    if (!node) return;
    tx = W / 2 - node.x * scale;
    ty = H / 2 - node.y * scale;
    clampTransform();
  }

  function onCanvasHover(e) {
    if (isDragging) return;
    var rect = canvas.getBoundingClientRect();
    var mx = e.clientX - rect.left;
    var my = e.clientY - rect.top;
    var world = screenToWorld(mx, my);

    var hit = hitTestNode(world.x, world.y);
    hoveredNodeId = hit;
    canvas.style.cursor = hit ? 'pointer' : 'grab';
  }

  function hitTestNode(wx, wy) {
    for (var i = 0; i < NODES.length; i++) {
      var n = NODES[i];
      var dx = wx - n.x;
      var dy = wy - n.y;
      var hitR = n.size + 10; // 命中半径比视觉半径大
      if (dx * dx + dy * dy <= hitR * hitR) {
        return n.id;
      }
    }
    return null;
  }

  // ---- 触摸事件 ----
  var touchData = { startX: 0, startY: 0, startTX: 0, startTY: 0, dist: 0, moved: false, touchId: null };

  function onTouchStart(e) {
    if (e.touches.length === 1) {
      // 单指拖拽
      touchData.moved = false;
      touchData.startX = e.touches[0].clientX;
      touchData.startY = e.touches[0].clientY;
      touchData.startTX = tx;
      touchData.startTY = ty;
      touchData.touchId = e.touches[0].identifier;
    } else if (e.touches.length === 2) {
      // 双指缩放
      var dx = e.touches[0].clientX - e.touches[1].clientX;
      var dy = e.touches[0].clientY - e.touches[1].clientY;
      touchData.dist = Math.sqrt(dx * dx + dy * dy);
      touchData.startScale = scale;
    }
  }

  function onTouchMove(e) {
    e.preventDefault();
    if (e.touches.length === 1) {
      var dx = e.touches[0].clientX - touchData.startX;
      var dy = e.touches[0].clientY - touchData.startY;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) touchData.moved = true;
      tx = touchData.startTX + dx;
      ty = touchData.startTY + dy;
      clampTransform();
    } else if (e.touches.length === 2) {
      var ddx = e.touches[0].clientX - e.touches[1].clientX;
      var ddy = e.touches[0].clientY - e.touches[1].clientY;
      var newDist = Math.sqrt(ddx * ddx + ddy * ddy);
      var pinchRatio = newDist / touchData.dist;
      var newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, touchData.startScale * pinchRatio));

      // 以双指中心缩放
      var cx = (e.touches[0].clientX + e.touches[1].clientX) / 2;
      var cy = (e.touches[0].clientY + e.touches[1].clientY) / 2;
      var rect = wrap.getBoundingClientRect();
      var mx = cx - rect.left;
      var my = cy - rect.top;

      var world = screenToWorld(mx, my);
      scale = newScale;
      var newScreen = worldToScreen(world.x, world.y);
      tx += mx - newScreen.x;
      ty += my - newScreen.y;
      clampTransform();
    }
  }

  function onTouchEnd(e) {
    if (e.touches.length === 0 && !touchData.moved) {
      // 点击检测
      var rect = wrap.getBoundingClientRect();
      var mx = touchData.startX - rect.left;
      var my = touchData.startY - rect.top;
      var world = screenToWorld(mx, my);
      var hit = hitTestNode(world.x, world.y);
      if (hit) {
        setFocus(hit);
        panToNode(hit);
        showInfo(hit);
        if (sidePanelOpen) {
          closeSidePanel();
        }
      } else {
        if (!sidePanelOpen) {
          closeInfo();
          setFocus(null);
        }
      }
    }
  }

  // ===== 变换边界 =====
  function clampTransform() {
    // 限制缩放范围
    scale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, scale));
    // 限制平移不让画布完全移出视野
    var margin = 200;
    var minTx = -(1000 * scale) + margin;
    var maxTx = W - margin;
    var minTy = -(600 * scale) + margin;
    var maxTy = H - margin;
    tx = Math.max(minTx, Math.min(maxTx, tx));
    ty = Math.max(minTy, Math.min(maxTy, ty));
  }

  // ===== 焦点控制 =====
  function setFocus(id) {
    focusedId = id;
    // 更新 chips
    var allChips = chips.querySelectorAll('.rm-chip');
    allChips.forEach(function (c) {
      c.classList.toggle('is-active', c.dataset.id === id);
    });
  }

  // ===== 信息卡片 =====
  function showInfo(id) {
    var node = getNode(id);
    if (!node) return;

    // 找到与 "你" 的关系
    var link = null;
    for (var i = 0; i < LINKS.length; i++) {
      if ((LINKS[i].a === id && LINKS[i].b === 'you') ||
          (LINKS[i].b === id && LINKS[i].a === 'you')) {
        link = LINKS[i];
        break;
      }
    }
    // 如果没有与 "你" 的关系，找第一条
    if (!link) {
      for (var j = 0; j < LINKS.length; j++) {
        if (LINKS[j].a === id || LINKS[j].b === id) {
          link = LINKS[j];
          break;
        }
      }
    }

    document.getElementById('rmInfoAvatar').textContent = node.name.charAt(0);
    document.getElementById('rmInfoName').textContent = node.name;
    document.getElementById('rmInfoDesc').textContent = link ? link.desc : node.desc;

    if (link) {
      document.getElementById('rmInfoStage').textContent = link.stage;
      document.getElementById('rmInfoStage').style.display = 'inline-block';
      document.getElementById('rmInfoBarFill').style.width = link.intimacy + '%';
      document.getElementById('rmInfoBarLabel').textContent = link.intimacy;
    } else {
      document.getElementById('rmInfoStage').style.display = 'none';
      document.getElementById('rmInfoBarFill').style.width = '0%';
      document.getElementById('rmInfoBarLabel').textContent = '';
    }

    infoCard.classList.add('visible');
    hint.style.display = 'none';
  }

  function closeInfo() {
    infoCard.classList.remove('visible');
    hint.style.display = '';
  }

  // ===== 侧栏（双击弹窗） =====
  function showSidePanel(id) {
    var node = getNode(id);
    if (!node) return;

    // 找到与 "你" 的关系
    var link = null;
    for (var i = 0; i < LINKS.length; i++) {
      if ((LINKS[i].a === id && LINKS[i].b === 'you') ||
          (LINKS[i].b === id && LINKS[i].a === 'you')) {
        link = LINKS[i];
        break;
      }
    }
    if (!link) {
      for (var j = 0; j < LINKS.length; j++) {
        if (LINKS[j].a === id || LINKS[j].b === id) {
          link = LINKS[j];
          break;
        }
      }
    }

    if (sideAvatar) sideAvatar.textContent = node.name.charAt(0);
    if (sideName) sideName.textContent = node.name;
    if (sideDesc) sideDesc.textContent = link ? link.desc : node.desc;

    if (link && sideStage) {
      sideStage.textContent = link.stage;
      sideStage.style.display = 'inline-block';
    } else if (sideStage) {
      sideStage.style.display = 'none';
    }

    if (link && sideBarFill) {
      sideBarFill.style.width = link.intimacy + '%';
    } else if (sideBarFill) {
      sideBarFill.style.width = '0%';
    }
    if (link && sideBarLabel) {
      sideBarLabel.textContent = link.intimacy;
    } else if (sideBarLabel) {
      sideBarLabel.textContent = '';
    }

    if (sidePanel) sidePanel.classList.add('open');
    hint.style.display = 'none';
  }

  function closeSidePanel() {
    if (!sidePanelOpen) return;
    sidePanelOpen = false;
    if (sidePanel) sidePanel.classList.remove('open');
    hint.style.display = '';
    // 恢复图谱位置
    tx = sidePanelOriginTX;
    scale = sidePanelOriginScale;
    clampTransform();
    setFocus(null);
  }

  // ===== 模式切换 =====
  function toggleMode() {
    // 关闭侧栏
    if (sidePanelOpen) closeSidePanel();
    var isGraph = listView.classList.contains('active');
    if (isGraph) {
      // 切换到图模式
      listView.classList.remove('active');
      // 重新显示 stage
      stage.style.display = '';
      legend.style.display = '';
      toggleBtn.textContent = '列表模式';
      toggleBtn.classList.remove('active');
      // 重置 Canvas 尺寸
      var oldScale = scale;
      var oldTx = tx, oldTy = ty;
      resize();
      scale = oldScale;
      tx = oldTx;
      ty = oldTy;
      centerTransform();
    } else {
      // 切换到列表模式
      listView.classList.add('active');
      stage.style.display = 'none';
      legend.style.display = 'none';
      toggleBtn.textContent = '图谱模式';
      toggleBtn.classList.add('active');
      closeInfo();
      setFocus(null);
      buildListCards();
    }
  }

  // ===== 列表卡片 =====
  function buildListCards() {
    listCards.innerHTML = '';
    NODES.forEach(function (n) {
      // 找到与 "你" 的关系
      var link = null;
      for (var i = 0; i < LINKS.length; i++) {
        if ((LINKS[i].a === n.id && LINKS[i].b === 'you') ||
            (LINKS[i].b === n.id && LINKS[i].a === 'you')) {
          link = LINKS[i];
          break;
        }
      }

      var card = document.createElement('div');
      card.className = 'rm-list-card';
      card.innerHTML =
        '<div class="rm-list-avatar"></div>' +
        '<div class="rm-list-info">' +
          '<div class="rm-list-name">' + n.name + '</div>' +
          (link ? '<div class="rm-list-stage">' + link.stage + '</div>' : '<div class="rm-list-stage" style="color:#6c7ea3">待同步</div>') +
          '<div class="rm-list-bar-wrap">' +
            '<div class="rm-list-bar-bg">' +
              '<div class="rm-list-bar-fill" style="width:' + (link ? link.intimacy : 0) + '%"></div>' +
            '</div>' +
            '<span class="rm-list-bar-label">' + (link ? link.intimacy : '--') + '</span>' +
          '</div>' +
        '</div>';

      card.addEventListener('click', function () {
        window.location.href = 'character-profile.html?char=' + n.id;
      });

      listCards.appendChild(card);
    });
  }

  // ===== 底部 Chips =====
  function buildChips() {
    chips.innerHTML = '';
    NODES.forEach(function (n) {
      var chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'rm-chip';
      chip.dataset.id = n.id;
      chip.textContent = n.name;
      chip.addEventListener('click', function () {
        if (focusedId === n.id) {
          setFocus(null);
          closeInfo();
        } else {
          setFocus(n.id);
          showInfo(n.id);
        }
      });
      chips.appendChild(chip);
    });
  }

  // ===== 导出 =====
  window.RelationMap = {
    init: init,
    toggleMode: toggleMode,
    closeInfo: closeInfo
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();

/* 统一返回逻辑 */
window.goBack = function () {
  if (document.referrer && document.referrer.includes(window.location.host)) {
    history.back();
  } else {
    window.location.href = "index.html?skipIntro=1";
  }
};