/* 聊天核心逻辑：发送、接收、独白渲染 */
(function () {
  "use strict";

  var sendBtn = document.getElementById("send");
  var inputEl = document.getElementById("input");

  function autoResize() {
    inputEl.style.height = "auto";
    inputEl.style.height = Math.min(inputEl.scrollHeight, 120) + "px";
  }
  inputEl.addEventListener("input", autoResize);

  // 群聊模式开关：切换状态、按钮样式与文案、系统提示
  function toggleGroup() {
    var v = !State.isGroupMode();
    State.setGroupMode(v);
    var btn = document.getElementById("groupToggle");
    if (btn) {
      btn.classList.toggle("on", v);
      btn.textContent = "群聊模式：" + (v ? "开" : "关");
    }
    UI.addSysMsg(v ? "已开启群聊模式，所有角色都会回应" : "已关闭群聊模式");
  }

  function setSending(v) {
    State.setSending(v);
    sendBtn.disabled = v;
    inputEl.disabled = v;
    if (!v) inputEl.focus();
  }

  // 分支选择：关键词命中时弹出的预设选项组
  var BRANCH_KEYWORDS = ["选择", "怎么办", "去哪", "决定"];
  var presetOptions = [
    { id: "out", text: "去天台吹吹风" },
    { id: "stay", text: "就在宿舍待着" },
    { id: "walk", text: "去训练场走走" }
  ];

  // 关键词命中则弹出分支选择浮层，选项文字将作为用户消息继续发送
  function maybeShowBranch(text) {
    if (!window.ChoiceBranch || !window.ChoiceBranch.show) return;
    var hit = BRANCH_KEYWORDS.some(function (k) { return text.indexOf(k) !== -1; });
    if (!hit) return;
    window.ChoiceBranch.show(presetOptions, function (optionId) {
      var opt = presetOptions.filter(function (o) { return o.id === optionId; })[0];
      if (!opt) return;
      // 等待本轮请求结束后，将选项文字作为新的用户消息发送
      var timer = setInterval(function () {
        if (!State.isSending()) {
          clearInterval(timer);
          inputEl.value = opt.text;
          send();
        }
      }, 200);
    });
  }

  function send() {
    var text = inputEl.value.trim();
    if (!text || State.isSending()) return;

    UI.addMessage(text, "user");
    inputEl.value = "";
    autoResize();
    setSending(true);
    UI.showTyping();

    // 用户消息发出后：关键词命中则弹出分支选择
    maybeShowBranch(text);

    // 先显示“对方正在输入...”，延迟 1 秒后请求
    setTimeout(function () {
      UI.removeTyping();

      if (State.isGroupMode()) {
        API.groupChat(text).then(function (data) {
          if (!data) return; // 错误已提示
          var replies = data.replies || [];
          if (replies.length === 0) { UI.addMessage("……（没有回应）", "ai"); return; }
          replies.forEach(function (rp) {
            var name = rp.name || rp.char_id || "角色";
            UI.addMessage(rp.reply || "……", "ai", { name: name });
          });
          if (window.refreshState) window.refreshState();
        }).finally(function () { setSending(false); });
      } else {
        API.chat(text, State.getCurrentChar().id).then(function (data) {
          if (!data) return; // 错误已提示
          UI.addMessage(data.reply || "……（他沉默着，没有回答）", "ai");
          if (window.refreshState) window.refreshState();
        }).finally(function () { setSending(false); });
      }
    }, 1000);
  }

  function init() {
    sendBtn.addEventListener("click", send);
    inputEl.addEventListener("input", autoResize);
    inputEl.addEventListener("keydown", function (e) {
      if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
    });
  }

  window.Chat = { send: send, init: init, toggleGroup: toggleGroup };
})();
