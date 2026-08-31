(function () {
  // 场景列表（占位，后续从后端获取）
  var scenes = ['307室', '天台', '训练场', '后山', '防空洞'];
  var currentIndex = 0;
  var hintEl = null;
  var hideTimer = null;

  function getAvailableScenes() {
    return scenes.slice();
  }

  function createHintElement() {
    var el = document.createElement('div');
    el.className = 'scene-hint';
    el.innerHTML = '<span class="arrow"></span><span class="name"></span>';
    document.body.appendChild(el);
    return el;
  }

  function showHint(sceneName, direction) {
    if (!hintEl) hintEl = createHintElement();

    var arrowEl = hintEl.querySelector('.arrow');
    var nameEl = hintEl.querySelector('.name');

    var arrowChar = direction === 'left' ? '◀' : '▶';
    if (arrowEl) arrowEl.textContent = arrowChar;
    if (nameEl) nameEl.textContent = sceneName;

    hintEl.classList.add('visible');

    if (hideTimer) {
      clearTimeout(hideTimer);
    }
    hideTimer = setTimeout(function () {
      hintEl.classList.remove('visible');
    }, 500);
  }

  function hideHint() {
    if (hintEl) hintEl.classList.remove('visible');
    if (hideTimer) {
      clearTimeout(hideTimer);
      hideTimer = null;
    }
  }

  function switchScene(direction) {
    // 当前场景索引循环变化
    if (direction === 'left') {
      currentIndex = (currentIndex - 1 + scenes.length) % scenes.length;
    } else {
      currentIndex = (currentIndex + 1) % scenes.length;
    }

    var newScene = scenes[currentIndex];
    showHint(newScene, direction);

    // 调用 window.SceneTransition.switchScene（如果存在）更新场景显示
    if (window.SceneTransition && typeof window.SceneTransition.switchScene === 'function') {
      window.SceneTransition.switchScene(newScene);
    }
  }

  function handleKeyDown(e) {
    var key = e.key;

    if (key === 'Escape') {
      hideHint();
      return;
    }

    if (key === 'ArrowLeft') {
      e.preventDefault();
      switchScene('left');
    } else if (key === 'ArrowRight') {
      e.preventDefault();
      switchScene('right');
    }
  }

  // 移动端：监听左右滑动
  var touchStartX = 0;
  var touchStartY = 0;

  function handleTouchStart(e) {
    var touch = e.touches[0];
    touchStartX = touch.clientX;
    touchStartY = touch.clientY;
  }

  function handleTouchEnd(e) {
    var touch = e.changedTouches[0];
    var dx = touch.clientX - touchStartX;
    var dy = touch.clientY - touchStartY;

    // 水平滑动距离 >50px 触发切换
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) {
      if (dx > 0) {
        switchScene('right');
      } else {
        switchScene('left');
      }
    }
  }

  function init() {
    hintEl = createHintElement();

    document.addEventListener('keydown', handleKeyDown);

    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });
  }

  window.SceneShortcut = {
    init: init,
    getAvailableScenes: getAvailableScenes
  };
})();
