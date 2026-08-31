(function () {
  'use strict';

  var MAX_ITEMS = 5;
  var REMOVE_DELAY = 4000;
  var MIN_INTERVAL = 15000;
  var MAX_INTERVAL = 30000;

  var EVENT_TEMPLATES = [
    '冷旭帆看向窗外，不知道在想什么',
    '黄景云笑了一下，糖纸在指间折出响',
    '叶清辞抬头看了你一眼，又低头看表',
    '室内安静了一瞬，只有台灯的嗡嗡声'
  ];

  var container = null;
  var timer = null;

  function pad(n) {
    return n < 10 ? '0' + n : '' + n;
  }

  function nowStr() {
    var d = new Date();
    return pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds());
  }

  function init() {
    if (container) {
      return container;
    }
    container = document.createElement('div');
    container.className = 'event-log';
    document.body.appendChild(container);
    scheduleNext();
    return container;
  }

  function push(text, timeStr) {
    if (!container) {
      init();
    }
    var item = document.createElement('div');
    item.className = 'event-item';

    var time = document.createElement('span');
    time.className = 'time';
    time.textContent = timeStr || nowStr();

    var desc = document.createElement('span');
    desc.className = 'highlight';
    desc.textContent = text;

    item.appendChild(time);
    item.appendChild(desc);

    container.insertBefore(item, container.firstChild);

    while (container.children.length > MAX_ITEMS) {
      container.removeChild(container.lastChild);
    }

    (function (node) {
      setTimeout(function () {
        if (node.parentNode === container) {
          container.removeChild(node);
        }
      }, REMOVE_DELAY);
    })(item);
  }

  function triggerRandom() {
    var text = EVENT_TEMPLATES[Math.floor(Math.random() * EVENT_TEMPLATES.length)];
    push(text);
  }

  function scheduleNext() {
    var delay = MIN_INTERVAL + Math.floor(Math.random() * (MAX_INTERVAL - MIN_INTERVAL));
    if (timer) {
      clearTimeout(timer);
    }
    timer = setTimeout(function () {
      triggerRandom();
      scheduleNext();
    }, delay);
  }

  window.EventLog = {
    init: init,
    push: push
  };
})();
