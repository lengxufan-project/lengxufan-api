/* 全局状态：当前角色、群聊模式、发送状态、角色列表 */
(function () {
  "use strict";

  var state = {
    currentChar: { id: "lengxufan", name: "冷旭帆" },
    groupMode: false,
    sending: false,
    characters: []
  };

  window.State = {
    getCurrentChar: function () { return state.currentChar; },
    setCurrentChar: function (c) { state.currentChar = c; },

    isGroupMode: function () { return state.groupMode; },
    setGroupMode: function (v) { state.groupMode = v; },

    isSending: function () { return state.sending; },
    setSending: function (v) { state.sending = v; },

    getCharacters: function () { return state.characters; },
    setCharacters: function (list) { state.characters = list; }
  };
})();
