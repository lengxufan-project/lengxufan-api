/* ============================================================
   世界入口 · 关于页交互（独立页面）
   - 滚动时发光球轻微呼吸
   - 技术栈/卡片延迟上浮淡入
   - 点击返回按钮跳转 index.html
   ============================================================ */
(function () {
  'use strict';

  /* ---------- 1. 返回按钮 ---------- */
  const backBtn = document.getElementById('backBtn');
  if (backBtn) {
    backBtn.addEventListener('click', function (e) {
      e.preventDefault();
      window.goBack();
    });
  }

  /* ---------- 2. 卡片延迟上浮淡入 ---------- */
  const revealCards = document.querySelectorAll('.reveal-card');
  revealCards.forEach(function (card, i) {
    setTimeout(function () {
      card.classList.add('revealed');
    }, 200 + i * 180); // 依次延迟 200ms / 380ms / 560ms
  });

  /* ---------- 3. 滚动时发光球轻微呼吸 ---------- */
  const orb = document.getElementById('glowOrb');
  if (orb) {
    let ticking = false;
    window.addEventListener('scroll', function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        // 滚动量映射为 0.96 ~ 1.05 的轻微缩放，产生呼吸感
        const delta = Math.min(window.scrollY, 300) / 300;
        const scale = 1.05 - delta * 0.09;
        orb.style.setProperty('--breath', scale.toFixed(3));
        ticking = false;
      });
    }, { passive: true });
  }
})();

/* 统一返回逻辑：有同源来源页则回退，否则回主界面（导航闭环） */
window.goBack = function () {
  if (document.referrer && document.referrer.includes(window.location.host)) {
    history.back();
  } else {
    window.location.href = "index.html?skipIntro=1";
  }
};
