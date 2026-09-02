/* 世界状态刷新 + 角色列表渲染 */
(function () {
  "use strict";

  function refreshState() {
    if (!window.API || !window.API.getState) return;
    window.API.getState().then(function (s) {
      if (!s) return;
      if (window.Scene && window.Scene.update) window.Scene.update(s);
      if (window.WorldClock && s.world) window.WorldClock.update(s.world.time_of_day, s.world.day);
      if (window.TimeLighting && s.world) window.TimeLighting.update(s.world.time_of_day);
      if (window.WeatherEffects && s.world) window.WeatherEffects.update(s.world.weather);
      if (s.world) {
        var sbTime = document.getElementById("sidebarTime");
        var sbWeather = document.getElementById("sidebarWeather");
        if (sbTime) sbTime.textContent = "第 " + (s.world.day != null ? s.world.day : "--") + " 天 · " + (s.world.time_of_day || "--");
        if (sbWeather) sbWeather.textContent = s.world.weather || "--";
      }
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
      if (window.EmotionParticles) window.EmotionParticles.update(s.emotion);
      if (window.NotificationCenter && window.NotificationCenter.refresh) {
        window.NotificationCenter.refresh(s);
      }
      if (window.WorldActivities && window.WorldActivities.update) {
        window.WorldActivities.update(s);
      }
    }).catch(function () { /* 静默失败 */ });
  }

  // ---------- 活跃角色快捷区 ----------
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

    function loadCharacters(list, stateMap) {
      if (!list || !list.length) return false;
      var oldItems = container.querySelectorAll(".char-item");
      Array.prototype.forEach.call(oldItems, function (el) { el.remove(); });
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
        var stateInfo = stateMap && stateMap[id];
        if (stateInfo && stateInfo.emotionLabel) {
          var text = stateInfo.emotionLabel;
          var stage = null;
          if (stateInfo.relationshipStage) {
            stage = stateInfo.relationshipStage;
          } else if (stateInfo.relationship) {
            var m = stateInfo.relationship.match(/关系[:：]\s*([^\s（(]+)/);
            if (m) stage = m[1];
          }
          if (stage) {
            text += " · " + stage;
          }
          emotion.textContent = text;
          emotion.setAttribute('data-emotion', stateInfo.emotionLabel);
        } else {
          emotion.textContent = "--";
        }
        div.appendChild(dot);
        div.appendChild(nameSpan);
        div.appendChild(emotion);
        div.addEventListener("click", function () {
          if (id) window.location.href = "chat.html?char=" + encodeURIComponent(id);
        });
        var entryLink = container.querySelector(".sb-entry-link");
        if (entryLink) {
          container.insertBefore(div, entryLink);
        } else {
          container.appendChild(div);
        }
      });
      return true;
    }

    var api = window.API;
    if (api && typeof api.getCharacters === "function") {
      Promise.all([
        api.getCharacters(),
        api.getState().catch(function () { return null; })
      ]).then(function (results) {
        var res = results[0];
        var state = results[1];
        if (!res) { highlightCurrentChar(); bindCharItemClicks(); return; }
        var list = Array.isArray(res) ? res : (res.value || null);

        var stateMap = null;

        if (!loadCharacters(list, stateMap)) {
          highlightCurrentChar();
          bindCharItemClicks();
        } else {
          highlightCurrentChar();
        }
      }).catch(function () {
        highlightCurrentChar();
        bindCharItemClicks();
      });
    } else {
      highlightCurrentChar();
      bindCharItemClicks();
    }
  }

  function init() {
    renderActiveCharacters();
    refreshState();
  }

  window.World = {
    init: init,
    refresh: refreshState
  };
})();