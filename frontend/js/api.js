/* 封装所有后端 fetch 请求 */
(function () {
  "use strict";

  // 聊天类请求失败时在聊天区提示（用户可见）
  function showChatError() {
    if (window.UI && UI.addMessage) {
      UI.addMessage("世界暂时模糊了，请稍后再试", "ai");
    }
  }

  window.API = {
    // GET /api/state —— 返回原始 Promise，错误由调用方静默处理（避免每 2s 刷屏）
    getState: function () {
      window.LoadingBar.start();
      return fetch("/api/state")
        .then(function (r) { return r.json(); })
        .finally(function () { window.LoadingBar.finish(); });
    },

    // GET /api/characters —— 兼容数组与 {value:[...]} 两种返回
    getCharacters: function () {
      window.LoadingBar.start();
      return fetch("/api/characters")
        .then(function (r) { return r.json(); })
        .finally(function () { window.LoadingBar.finish(); });
    },

    // POST /api/chat —— 失败提示并返回 null
    chat: function (message, charId) {
      window.LoadingBar.start();
      return fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: message, char_id: charId })
      })
        .then(function (r) { return r.json(); })
        .catch(function () { showChatError(); return null; })
        .finally(function () { window.LoadingBar.finish(); });
    },

    // POST /api/group_chat —— 失败提示并返回 null
    groupChat: function (message) {
      window.LoadingBar.start();
      return fetch("/api/group_chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: message })
      })
        .then(function (r) { return r.json(); })
        .catch(function () { showChatError(); return null; })
        .finally(function () { window.LoadingBar.finish(); });
    },

    // 【预留】获取指定角色的状态详情
    // 当前后端尚未支持 /api/state?char_id=xxx，返回 null 占位
    getCharacterStatus: function (charId) {
      // 未来实现：fetch("/api/state?char_id=" + encodeURIComponent(charId))
      return Promise.resolve(null);
    }
  };
})();
