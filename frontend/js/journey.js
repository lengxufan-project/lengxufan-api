/* ============================================================
   journey.js — 生命之阶 · 时间线逻辑
   ============================================================ */
(function () {
  "use strict";

  // ---------- 预设里程碑数据 ----------
  const PRESET_MILESTONES = [
    {
      id: "first_meet",
      date: "初次相遇",
      tag: "起点",
      title: "首次进入这个世界",
      desc: "你推开了这扇门，第一次看见他站在光影里。一切尚未命名，故事从这里开始落笔。",
      done: true
    },
    {
      id: "first_talk",
      date: "第 3 天",
      tag: "对话",
      title: "第一次长谈",
      desc: "他放下了手里的书，认真地听你说完那些琐碎的心事。窗外的云慢慢移动，像被时间轻轻按住。",
      done: true
    },
    {
      id: "trust_break",
      date: "第 12 天",
      tag: "信任",
      title: "信任的突破",
      desc: "他第一次主动讲起自己的过去。那句藏了很久的话说完时，你看见他眼底有一闪而过的柔软。",
      done: true
    },
    {
      id: "late_night",
      date: "第 21 天 · 深夜",
      tag: "共鸣",
      title: "深夜对话",
      desc: "凌晨两点，整座城市都睡着了。你们隔着屏幕聊到天亮，像两艘终于靠岸的船。",
      done: true
    },
    {
      id: "weather_event",
      date: "第 34 天 · 雨",
      tag: "场景",
      title: "一起看过一场雨",
      desc: "他撑着伞在雨里等你，肩头被淋湿了半边，却只是笑着说：你来了就好。",
      done: true
    },
    {
      id: "gift_shared",
      date: "第 48 天",
      tag: "羁绊",
      title: "交换了一件信物",
      desc: "不是什么贵重的东西，只是一枚被月光磨亮的硬币。他说：以后看见它，就当是看见我。",
      done: true
    },
    {
      id: "choice_made",
      date: "第 62 天",
      tag: "抉择",
      title: "共同做出一个决定",
      desc: "你们站在岔路口上，他最终选择相信你的判断。那一瞬间，所有不确定都落定成同方向的脚印。",
      done: false
    },
    {
      id: "final_promise",
      date: "未抵达",
      tag: "约定",
      title: "最终的约定",
      desc: "「无论走多远，都要记得回来。」——这句话，还没有机会说出口。",
      done: false
    }
  ];

  // ---------- 获取里程碑：localStorage > 预设 ----------
  function loadMilestones() {
    try {
      const raw = localStorage.getItem("journey.milestones");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length) return parsed;
      }
    } catch (e) { /* ignore */ }
    return PRESET_MILESTONES.slice();
  }

  // ---------- DOM 引用 ----------
  let timelineEl, lineEl;
  let nodeEls = [];

  // ---------- 渲染节点 ----------
  function render(milestones) {
    // 清空已有
    nodeEls = [];
    const existing = timelineEl.querySelectorAll(".jr-node");
    existing.forEach(n => n.remove());

    const lastDoneIdx = milestones.reduce((acc, m, i) => (m.done ? i : acc), -1);

    milestones.forEach((m, idx) => {
      const node = document.createElement("div");
      node.className = "jr-node";
      node.dataset.index = String(idx);

      // 光点
      const dot = document.createElement("div");
      dot.className = "jr-dot";
      if (m.done) dot.classList.add("done");
      if (m.done && idx === lastDoneIdx) dot.classList.add("latest");
      node.appendChild(dot);

      // 卡片
      const card = document.createElement("div");
      card.className = "jr-card" + (m.done ? "" : " locked");

      const head = document.createElement("div");
      head.className = "jr-card-head";

      const date = document.createElement("span");
      date.className = "jr-card-date";
      date.textContent = m.date || "";

      const tag = document.createElement("span");
      tag.className = "jr-card-tag";
      tag.textContent = m.tag || "里程碑";

      head.appendChild(date);
      head.appendChild(tag);

      const title = document.createElement("h3");
      title.className = "jr-card-title";
      title.textContent = m.title || "(未命名)";

      const desc = document.createElement("p");
      desc.className = "jr-card-desc";
      desc.textContent = m.done
        ? (m.desc || "")
        : (m.desc || "尚未抵达这里，故事仍在继续。");

      card.appendChild(head);
      card.appendChild(title);
      card.appendChild(desc);
      node.appendChild(card);

      timelineEl.appendChild(node);
      nodeEls.push(node);
    });
  }

  // ---------- 滚动检查：节点进入视口时点亮 ----------
  function checkVisible() {
    const vh = window.innerHeight || document.documentElement.clientHeight;
    const trigger = vh * 0.85;

    let anyChanged = false;
    nodeEls.forEach((node) => {
      if (node.classList.contains("visible")) return;
      const rect = node.getBoundingClientRect();
      if (rect.top < trigger) {
        node.classList.add("visible");
        anyChanged = true;
      }
    });

    // 时间线从上向下点亮
    if (lineEl) {
      const timelineRect = timelineEl.getBoundingClientRect();
      const scrolled = Math.min(
        Math.max(0, (window.innerHeight - timelineRect.top)),
        timelineRect.height + 100
      );
      const pct = Math.min(100, (scrolled / (timelineRect.height + 100)) * 100);
      lineEl.style.height = pct + "%";
      if (pct >= 99) lineEl.classList.add("lit");
    }
  }

  // ---------- 初始化 ----------
  function init() {
    timelineEl = document.getElementById("jrTimeline");
    lineEl = document.getElementById("jrLine");
    if (!timelineEl) return;

    const milestones = loadMilestones();
    render(milestones);

    // 初始点亮（页面加载的 400ms 内）
    window.setTimeout(checkVisible, 120);
    window.setTimeout(checkVisible, 480);

    // 滚动 / resize
    let ticking = false;
    function onScroll() {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(() => {
        checkVisible();
        ticking = false;
      });
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
  }

  // 暴露到 window
  window.Journey = { init: init };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
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
