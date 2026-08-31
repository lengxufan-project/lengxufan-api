(function () {
  function init() {
    var scene = document.querySelector('.scene');
    if (!scene) return;

    var overlay = document.createElement('div');
    overlay.className = 'scene-transition-overlay';
    scene.appendChild(overlay);
  }

  function switchScene(newSceneName, newWeather, newTimeOfDay) {
    var scene = document.querySelector('.scene');
    var overlay = scene ? scene.querySelector('.scene-transition-overlay') : null;
    var sceneLabel = document.querySelector('.scene-label');
    var sceneMeta = document.querySelector('.scene-meta');
    if (!scene || !overlay || !sceneLabel || !sceneMeta) return;

    // Phase 1: Start transition
    overlay.classList.add('active');
    scene.classList.add('fading-out');
    sceneLabel.classList.add('transitioning');
    sceneMeta.classList.add('transitioning');

    // Phase 2: After 300ms, update content
    setTimeout(function () {
      sceneLabel.textContent = newSceneName;
      if (newWeather && newTimeOfDay) {
        sceneMeta.textContent = '第--天 · ' + newWeather + ' · ' + newTimeOfDay;
      } else if (newWeather) {
        sceneMeta.textContent = '第--天 · ' + newWeather;
      } else if (newTimeOfDay) {
        sceneMeta.textContent = '第--天 · ' + newTimeOfDay;
      }

      sceneLabel.classList.remove('transitioning');
      sceneMeta.classList.remove('transitioning');
      sceneLabel.classList.add('transitioned');
      sceneMeta.classList.add('transitioned');

      // Phase 3: After 100ms, fade in scene
      setTimeout(function () {
        scene.classList.remove('fading-out');
        scene.classList.add('fading-in');

        // Phase 4: After 800ms, clean up
        setTimeout(function () {
          overlay.classList.remove('active');
          scene.classList.remove('fading-in');
          sceneLabel.classList.remove('transitioned');
          sceneMeta.classList.remove('transitioned');
        }, 800);
      }, 100);
    }, 300);
  }

  window.SceneTransition = {
    init: init,
    switchScene: switchScene
  };
})();
