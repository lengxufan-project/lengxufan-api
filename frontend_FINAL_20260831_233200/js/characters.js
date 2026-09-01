/* 角色列表加载与切换 */
(function () {
  "use strict";

  // 切换角色：更新状态、重渲染按钮、更新展示条、系统消息
  function switchTo(c) {
    if (c.id === State.getCurrentChar().id) return;
    State.setCurrentChar({ id: c.id, name: c.name });
    UI.renderCharButtons(State.getCharacters(), switchTo);
    UI.updateCharInfo();
    UI.addSysMsg("你转向了" + c.name);
  }

  function load() {
    API.getCharacters().then(function (data) {
      var list = [];
      if (Array.isArray(data)) list = data;
      else if (data && Array.isArray(data.value)) list = data.value;
      list = list.filter(function (c) { return c && c.id && c.name; });
      if (list.length === 0) list = [{ id: "lengxufan", name: "冷旭帆" }];
      // 若当前角色不在列表，默认第一个
      if (!list.some(function (c) { return c.id === State.getCurrentChar().id; })) {
        State.setCurrentChar({ id: list[0].id, name: list[0].name });
      }
      State.setCharacters(list);
      UI.renderCharButtons(list, switchTo);
      UI.updateCharInfo();
    }).catch(function () {
      // 拉取失败：回退单角色
      State.setCharacters([{ id: "lengxufan", name: "冷旭帆" }]);
      UI.renderCharButtons(State.getCharacters(), switchTo);
      UI.updateCharInfo();
    });
  }

  function init() {
    load();
  }

  window.Characters = { load: load, init: init };
})();
