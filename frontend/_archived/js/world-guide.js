/* ============================================================
   world-guide.js — 世界导览（独立页面脚本）
   水平轮播（scroll-snap）+ 场景内纵向详情 + 指示器 + 箭头导航
   ============================================================ */
(function () {
  'use strict';

  var carousel, scenes, indicators, sceneLabel;
  var arrowLeft, arrowRight;
  var currentIndex = 0;
  var ticking = false;

  // ===== 场景名称映射 =====
  var SCENE_NAMES = {
    dorm: '宿舍',
    roof: '天台',
    shelter: '防空洞'
  };

  // ===== 初始化 =====
  function init() {
    carousel = document.getElementById('wgCarousel');
    sceneLabel = document.getElementById('wgSceneLabel');
    arrowLeft = document.getElementById('wgArrowLeft');
    arrowRight = document.getElementById('wgArrowRight');

    if (!carousel) return;

    scenes = carousel.querySelectorAll('.wg-scene');
    if (scenes.length === 0) return;

    // 构建指示器
    buildIndicators();

    // 设置初始场景标签
    updateSceneLabel(0);

    // 更新箭头可见性
    updateArrows();

    // 绑定事件
    bindEvents();

    // 初始检测
    updateActiveScene();
  }

  // ===== 构建底部指示器 =====
  function buildIndicators() {
    var container = document.getElementById('wgIndicators');
    if (!container) return;

    container.innerHTML = '';
    indicators = [];

    for (var i = 0; i < scenes.length; i++) {
      var dot = document.createElement('button');
      dot.type = 'button';
      dot.className = 'wg-indicator' + (i === 0 ? ' active' : '');
      dot.setAttribute('aria-label', '跳转到场景 ' + (i + 1));

      // 使用闭包捕获 i
      (function (idx) {
        dot.addEventListener('click', function () {
          scrollToScene(idx);
        });
      })(i);

      container.appendChild(dot);
      indicators.push(dot);
    }
  }

  // ===== 滚动到指定场景 =====
  function scrollToScene(index) {
    if (index < 0 || index >= scenes.length) return;
    var target = scenes[index];
    target.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' });
  }

  // ===== 更新场景标签 =====
  function updateSceneLabel(index) {
    if (index < 0 || index >= scenes.length) return;
    var scene = scenes[index];
    var sceneId = scene.getAttribute('data-scene') || '';
    var name = SCENE_NAMES[sceneId] || '场景 ' + (index + 1);
    sceneLabel.textContent = name;

    // 更新场景标签颜色（通过切换类）
    sceneLabel.className = 'wg-scene-label';
    if (scene.classList.contains('wg-scene-dorm')) {
      sceneLabel.classList.add('wg-scene-dorm');
    } else if (scene.classList.contains('wg-scene-roof')) {
      sceneLabel.classList.add('wg-scene-roof');
    } else if (scene.classList.contains('wg-scene-shelter')) {
      sceneLabel.classList.add('wg-scene-shelter');
    }
  }

  // ===== 更新指示器 =====
  function updateIndicators(index) {
    if (!indicators) return;
    for (var i = 0; i < indicators.length; i++) {
      indicators[i].classList.toggle('active', i === index);
    }
  }

  // ===== 更新箭头可见性 =====
  function updateArrows() {
    if (!arrowLeft || !arrowRight) return;
    arrowLeft.classList.toggle('visible', currentIndex > 0);
    arrowRight.classList.toggle('visible', currentIndex < scenes.length - 1);
  }

  // ===== 检测当前活跃场景 =====
  function updateActiveScene() {
    if (!carousel) return;

    var scrollLeft = carousel.scrollLeft;
    var w = carousel.clientWidth;
    // 当前场景 = 最接近视口中心的场景
    var center = scrollLeft + w / 2;
    var bestIndex = 0;
    var bestDist = Infinity;

    for (var i = 0; i < scenes.length; i++) {
      var sceneCenter = scenes[i].offsetLeft + scenes[i].offsetWidth / 2;
      var dist = Math.abs(center - sceneCenter);
      if (dist < bestDist) {
        bestDist = dist;
        bestIndex = i;
      }
    }

    if (bestIndex !== currentIndex) {
      currentIndex = bestIndex;
      updateSceneLabel(currentIndex);
      updateIndicators(currentIndex);
      updateArrows();
    }
  }

  // ===== 滚动事件 =====
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      ticking = false;
      updateActiveScene();
    });
  }

  // ===== 箭头导航 =====
  function goPrev() {
    if (currentIndex > 0) {
      scrollToScene(currentIndex - 1);
    }
  }

  function goNext() {
    if (currentIndex < scenes.length - 1) {
      scrollToScene(currentIndex + 1);
    }
  }

  // ===== 键盘导航 =====
  function onKeyDown(e) {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      goPrev();
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      goNext();
    }
  }

  // ===== 绑定事件 =====
  function bindEvents() {
    // 轮播滚动
    carousel.addEventListener('scroll', onScroll, { passive: true });

    // 窗口大小变化
    window.addEventListener('resize', onScroll);

    // 左右箭头
    if (arrowLeft) arrowLeft.addEventListener('click', goPrev);
    if (arrowRight) arrowRight.addEventListener('click', goNext);

    // 键盘导航
    document.addEventListener('keydown', onKeyDown);

    // 触摸滑动补偿：确保 scroll-snap 后有正确的检测
    carousel.addEventListener('scrollend', function () {
      updateActiveScene();
    }, { passive: true });
  }

  // ===== 启动 =====
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