/* ============================================================
   relation-map.js — 星光交织图谱（独立页面脚本）
   仅操作本页 #rm* 元素，依赖 css/relation-map.css 的类名
   ============================================================ */
(function () {
  'use strict';

  // ===== 占位数据：亲密度 0-100，控制线条亮度与流速 =====
  var NODES = [
    { id: 'lxf', name: '冷旭帆', x: 500, y: 285, size: 30 },
    { id: 'hjy', name: '黄景云', x: 255, y: 180, size: 24 },
    { id: 'yqc', name: '叶清辞', x: 745, y: 175, size: 24 },
    { id: 'you', name: '你',    x: 505, y: 470, size: 26 }
  ];

  // 共 6 条：角色之间 + 角色与用户之间
  var LINKS = [
    { a: 'lxf', b: 'you', intimacy: 85 },
    { a: 'lxf', b: 'hjy', intimacy: 60 },
    { a: 'lxf', b: 'yqc', intimacy: 45 },
    { a: 'hjy', b: 'you', intimacy: 50 },
    { a: 'yqc', b: 'you', intimacy: 40 },
    { a: 'hjy', b: 'yqc', intimacy: 30 }
  ];

  var SVG_NS = 'http://www.w3.org/2000/svg';
  var XLINK_NS = 'http://www.w3.org/1999/xlink';

  var state = {
    focusedId: null,
    nodeEls: {},
    chipEls: {},
    lineEls: []
  };

  function nodeById(id) {
    for (var i = 0; i < NODES.length; i++) {
      if (NODES[i].id === id) return NODES[i];
    }
    return null;
  }

  function init() {
    var stage = document.getElementById('rmStage');
    var world = document.getElementById('rmWorld');
    var svg = document.getElementById('rmSvg');
    var chips = document.getElementById('rmChips');
    if (!stage || !world || !svg) return;

    buildLines(svg);
    buildNodes(world);
    buildChips(chips);

    stage.addEventListener('click', function () { setFocus(null); });

    fitWorld(stage, world);
    window.addEventListener('resize', function () { fitWorld(stage, world); });
  }

  // 移动端自动缩放：1000x600 世界坐标按视口等比缩放
  function fitWorld(stage, world) {
    var rect = stage.getBoundingClientRect();
    var scale = Math.min(1, (rect.width - 32) / 1000, (rect.height - 32) / 600);
    world.style.transform = 'scale(' + scale + ')';
  }

  // 绘制 6 条连线 + 每条线上的流动光点
  function buildLines(svg) {
    LINKS.forEach(function (link, i) {
      var na = nodeById(link.a);
      var nb = nodeById(link.b);

      var path = document.createElementNS(SVG_NS, 'path');
      path.setAttribute('d', 'M ' + na.x + ' ' + na.y + ' L ' + nb.x + ' ' + nb.y);
      path.setAttribute('class', 'rm-line');
      path.setAttribute('id', 'rmPath' + i);
      // 亲密度 → 亮度与粗细
      path.style.opacity = (0.25 + (link.intimacy / 100) * 0.55).toFixed(2);
      path.style.strokeWidth = (1.2 + (link.intimacy / 100) * 0.8).toFixed(2);
      // 亲密度 → 流速（越亲密流动越快）
      var dur = (0.8 + (100 - link.intimacy) / 100 * 3).toFixed(2) + 's';
      path.style.animationDuration = dur;
      svg.appendChild(path);

      // 流动光点：SVG circle + animateMotion 沿线飞行
      var spark = document.createElementNS(SVG_NS, 'circle');
      spark.setAttribute('class', 'rm-spark');
      spark.setAttribute('r', (1.8 + (link.intimacy / 100) * 1.4).toFixed(2));
      var motion = document.createElementNS(SVG_NS, 'animateMotion');
      motion.setAttribute('dur', dur);
      motion.setAttribute('repeatCount', 'indefinite');
      var mpath = document.createElementNS(SVG_NS, 'mpath');
      mpath.setAttribute('href', '#rmPath' + i);
      mpath.setAttributeNS(XLINK_NS, 'xlink:href', '#rmPath' + i);
      motion.appendChild(mpath);
      spark.appendChild(motion);
      svg.appendChild(spark);

      state.lineEls.push({ link: link, path: path, spark: spark });
    });
  }

  // 创建 4 个角色节点（冷旭帆居中，其他围绕）
  function buildNodes(world) {
    NODES.forEach(function (n) {
      var el = document.createElement('div');
      el.className = 'rm-node';
      el.dataset.id = n.id;
      el.style.left = n.x + 'px';
      el.style.top = n.y + 'px';
      el.innerHTML =
        '<div class="rm-node-core" style="width:' + n.size + 'px;height:' + n.size + 'px"></div>' +
        '<div class="rm-node-label">' + n.name + '</div>';

      el.addEventListener('click', function (e) {
        e.stopPropagation();
        setFocus(state.focusedId === n.id ? null : n.id);
      });
      // 悬停：临时高亮相连线条
      el.addEventListener('mouseenter', function () { hoverLines(n.id, true); });
      el.addEventListener('mouseleave', function () { hoverLines(n.id, false); });

      world.appendChild(el);
      state.nodeEls[n.id] = el;
    });
  }

  // 底部角色名列表，点击切换焦点
  function buildChips(host) {
    if (!host) return;
    NODES.forEach(function (n) {
      var chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'rm-chip';
      chip.dataset.id = n.id;
      chip.textContent = n.name;
      chip.addEventListener('click', function () {
        setFocus(state.focusedId === n.id ? null : n.id);
      });
      host.appendChild(chip);
      state.chipEls[n.id] = chip;
    });
  }

  // 悬停时临时高亮相连线条（不改变持久焦点）
  function hoverLines(id, on) {
    state.lineEls.forEach(function (item) {
      var hit = item.link.a === id || item.link.b === id;
      if (on && hit) {
        item.path.classList.add('is-active');
        item.spark.classList.add('is-active');
      } else {
        applyFocusToLine(item);
      }
    });
  }

  // 按当前焦点状态刷新单条线
  function applyFocusToLine(item) {
    var focused = state.focusedId;
    var hit = item.link.a === focused || item.link.b === focused;
    item.path.classList.toggle('is-active', !!focused && hit);
    item.spark.classList.toggle('is-active', !!focused && hit);
    item.path.classList.toggle('is-dim', !!focused && !hit);
    item.spark.classList.toggle('is-dim', !!focused && !hit);
  }

  // 点击节点：高亮该节点，显示与该角色相连的所有线条
  function setFocus(id) {
    state.focusedId = id;
    Object.keys(state.nodeEls).forEach(function (nid) {
      state.nodeEls[nid].classList.toggle('is-focus', nid === id);
      state.nodeEls[nid].classList.toggle('is-dim', !!id && nid !== id);
    });
    Object.keys(state.chipEls).forEach(function (cid) {
      state.chipEls[cid].classList.toggle('is-active', cid === id);
    });
    state.lineEls.forEach(applyFocusToLine);
  }

  window.RelationMap = { init: init };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
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
