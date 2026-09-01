/* 角色展示条：头像文字、情绪、说话状态更新 */
(function () {
  "use strict";

  function emotionColor(value) {
    value = Number(value) || 0;
    if (value > 50) return "#66e08b";
    if (value < -50) return "#b58cf5";
    return "#7fb8ff";
  }

  function emotionCategory(value) {
    value = Number(value) || 0;
    if (value > 50) return "positive";
    if (value < -50) return "negative";
    return "neutral";
  }

  // 根据情绪值范围设置 data-emotion 属性
  // 更新情绪标签文字
  // 更新情绪进度条宽度和颜色
  function setEmotion(value, label) {
    value = Number(value) || 0;
    var cat = emotionCategory(value);
    var elabel = document.getElementById("ciLabel");
    var eFill = document.getElementById("ciFill");
    var eVal = document.getElementById("ciVal");

    if (elabel) {
      elabel.dataset.emotion = cat;
      elabel.textContent = (label != null && label !== "") ? label : "--";
    }
    if (eFill) {
      // 将 -100~100 映射为 0~100 百分比
      var percent = Math.max(0, Math.min(100, ((value + 100) / 200) * 100));
      eFill.style.width = percent + "%";
      eFill.style.background = emotionColor(value);
    }
    if (eVal) {
      eVal.textContent = Math.round(value);
    }
  }

  // 说话状态：isSpeaking=true 时添加 .speaking 类，300ms 后移除
  var speakingTimer = null;
  function setSpeaking(isSpeaking) {
    var avatar = document.getElementById("ciAvatar");
    if (!avatar) return;
    if (isSpeaking) {
      avatar.classList.add("speaking");
      if (speakingTimer) { clearTimeout(speakingTimer); speakingTimer = null; }
      speakingTimer = setTimeout(function () {
        avatar.classList.remove("speaking");
        speakingTimer = null;
      }, 300);
    } else {
      avatar.classList.remove("speaking");
      if (speakingTimer) { clearTimeout(speakingTimer); speakingTimer = null; }
    }
  }

  // 更新头像首字 + 情绪
  function updateAvatar(name, emotionValue, emotionLabel) {
    var avatar = document.getElementById("ciAvatar");
    if (avatar) {
      avatar.textContent = (name || "?").charAt(0);
    }
    setEmotion(emotionValue, emotionLabel);
  }

  // 初始化：监听角色切换事件，更新头像文字和初始情绪
  function init() {
    document.addEventListener("char:switched", function (e) {
      var detail = e.detail || {};
      updateAvatar(detail.name, detail.emotion || 0, detail.emotion_label || "");
    });
    // 初始化一次：读取当前状态中的角色名和情绪
    try {
      var curChar = window.State && typeof window.State.getCurrentChar === "function"
        ? window.State.getCurrentChar()
        : null;
      var name = (curChar && curChar.name) || "冷旭帆";
      var avatarEl = document.getElementById("ciAvatar");
      if (avatarEl && !avatarEl.textContent) {
        avatarEl.textContent = name.charAt(0);
      }
      var elabel = document.getElementById("ciLabel");
      if (elabel && !elabel.dataset.emotion) {
        elabel.dataset.emotion = "neutral";
      }
    } catch (_) { /* noop */ }
  }

  window.CharacterDisplay = {
    init: init,
    setEmotion: setEmotion,
    setSpeaking: setSpeaking,
    updateAvatar: updateAvatar
  };
})();
