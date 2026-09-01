/* 关系温度计组件：展示各角色与用户的信任值进度条 */
(function () {
  "use strict";

  var rows = {}; // charId -> { fill, value, lastTrust }

  // 从 relationship 字符串提取信任值，如 "关系: 陌生人（信任2/100）" -> 2
  function parseTrust(rel) {
    rel = rel || "";
    var m = rel.match(/信任\s*(\d+)/);
    if (m) return parseInt(m[1], 10);
    m = rel.match(/(\d+)\s*\/\s*100/);
    if (m) return parseInt(m[1], 10);
    return 0;
  }

  function clamp(v) {
    return Math.max(0, Math.min(100, v));
  }

  function init(containerId) {
    var container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML =
      '<div class="relation-thermo" id="relationThermo">' +
      '  <div class="title">关系温度</div>' +
      '  <div id="relationRows"></div>' +
      '</div>';
  }

  function buildRow(char) {
    var rowsEl = document.getElementById("relationRows");

    var row = document.createElement("div");
    row.className = "relation-row";

    var name = document.createElement("div");
    name.className = "relation-name";
    name.textContent = char.name || char.id;
    row.appendChild(name);

    var track = document.createElement("div");
    track.className = "relation-track";
    var fill = document.createElement("div");
    fill.className = "relation-fill";
    fill.style.width = "0%";
    track.appendChild(fill);
    row.appendChild(track);

    var value = document.createElement("div");
    value.className = "relation-value";
    value.textContent = "--";
    row.appendChild(value);

    rowsEl.appendChild(row);
    return { fill: fill, value: value, lastTrust: null };
  }

  // states：来自 /api/state。当前简化：所有角色共用当前状态；
  // 若为 { charId: state } 的映射则按角色取用（便于未来扩展为多角色）。
  function stateFor(states, charId) {
    if (!states) return null;
    if (states[charId] && typeof states[charId] === "object") return states[charId];
    if (typeof states.relationship === "string") return states;
    return null;
  }

  function update(characters, states) {
    var rowsEl = document.getElementById("relationRows");
    if (!rowsEl) return;

    // 兼容 {value:[...]} 与数组两种返回格式
    var list = characters && characters.value ? characters.value
      : (Array.isArray(characters) ? characters : []);
    if (!list.length) return;

    for (var i = 0; i < list.length; i++) {
      var char = list[i];
      var id = String(char.id);

      var entry = rows[id];
      if (!entry) {
        entry = buildRow(char);
        rows[id] = entry;
      }

      var st = stateFor(states, id);
      var trust = st ? clamp(parseTrust(st.relationship)) : 0;

      entry.fill.style.width = trust + "%";
      entry.value.textContent = String(trust);
      if (entry.lastTrust !== null && entry.lastTrust !== trust) {
        entry.value.classList.remove("pulse");
        void entry.value.offsetWidth; // 强制重排以重启动画
        entry.value.classList.add("pulse");
      }
      entry.lastTrust = trust;
    }
  }

  window.RelationThermometer = { init: init, update: update };
})();
