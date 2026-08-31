/* 情绪曲线图独立模块：init 构建结构，update/render 渲染数据 */
(function () {
  "use strict";

  var SVG_NS = "http://www.w3.org/2000/svg";
  var MAX_POINTS = 20;

  var els = { container: null, value: null, svg: null, ball: null, labels: null };

  // ---------- 结构构建 ----------
  function init(containerId) {
    var container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML =
      '<div class="chart-header">' +
        '<span class="chart-title">情绪曲线</span>' +
        '<span class="chart-value" id="chartValue">--</span>' +
      '</div>' +
      '<div class="chart-body">' +
        '<svg id="chartSvg" viewBox="0 0 600 120" preserveAspectRatio="none"></svg>' +
        '<div class="chart-ball" id="chartBall"></div>' +
      '</div>' +
      '<div class="chart-labels" id="chartLabels"></div>';

    els.container = container;
    els.value = document.getElementById("chartValue");
    els.svg = document.getElementById("chartSvg");
    els.ball = document.getElementById("chartBall");
    els.labels = document.getElementById("chartLabels");
  }

  // ---------- 数据映射 ----------
  // 情绪值 -100~100 → SVG y 坐标 110~10（越高兴越靠上）
  function valueToY(v) {
    v = Math.max(-100, Math.min(100, Number(v) || 0));
    return 110 - ((v + 100) / 200) * 100;
  }

  // 渐变定义：rgba(88,166,255,0.3) → transparent（垂直向下渐隐）
  function ensureDefs(svg) {
    var defs = document.createElementNS(SVG_NS, "defs");
    var grad = document.createElementNS(SVG_NS, "linearGradient");
    grad.setAttribute("id", "chartGradient");
    grad.setAttribute("x1", "0"); grad.setAttribute("y1", "0");
    grad.setAttribute("x2", "0"); grad.setAttribute("y2", "1");
    var s1 = document.createElementNS(SVG_NS, "stop");
    s1.setAttribute("offset", "0");
    s1.setAttribute("stop-color", "rgba(88,166,255,0.3)");
    var s2 = document.createElementNS(SVG_NS, "stop");
    s2.setAttribute("offset", "1");
    s2.setAttribute("stop-color", "rgba(88,166,255,0)");
    grad.appendChild(s1);
    grad.appendChild(s2);
    defs.appendChild(grad);
    svg.appendChild(defs);
  }

  // ---------- 渲染 ----------
  // history: [{time:"HH:MM", value:Number}]，最多渲染最近 20 个点
  function render(history) {
    if (!els.svg) return;
    var pts = (history || []).slice(-MAX_POINTS);

    // 清空旧图层后重建
    while (els.svg.firstChild) els.svg.removeChild(els.svg.firstChild);
    ensureDefs(els.svg);

    // 无数据态
    if (pts.length === 0) {
      if (els.value) els.value.textContent = "暂无数据";
      if (els.ball) els.ball.style.opacity = "0";
      if (els.labels) els.labels.innerHTML = "";
      return;
    }

    var n = pts.length;
    var xOf = function (i) { return n > 1 ? (i / (n - 1)) * 600 : 300; };
    var linePts = pts.map(function (p, i) {
      return xOf(i).toFixed(1) + "," + valueToY(p.value).toFixed(1);
    });

    // 面积填充（渐变）
    var polygon = document.createElementNS(SVG_NS, "polygon");
    polygon.setAttribute("points", linePts.join(" ") + " 600,120 0,120");
    polygon.setAttribute("fill", "url(#chartGradient)");
    els.svg.appendChild(polygon);

    // 折线（描边生长动画由 animations.css 的 .chart-line 类提供）
    var polyline = document.createElementNS(SVG_NS, "polyline");
    polyline.setAttribute("points", linePts.join(" "));
    polyline.setAttribute("stroke", "#58a6ff");
    polyline.setAttribute("stroke-width", "2");
    polyline.setAttribute("fill", "none");
    polyline.setAttribute("class", "chart-line");
    els.svg.appendChild(polyline);

    // 当前数值（带符号显示，如 +62）
    var cur = Math.round(Number(pts[n - 1].value) || 0);
    if (els.value) els.value.textContent = (cur >= 0 ? "+" : "") + cur;

    // 端点球：left 百分比（与折线末端对齐），top 像素（按容器实际高度换算，移动端不错位）
    if (els.ball) {
      var y = valueToY(pts[n - 1].value);
      var body = els.svg.parentNode;
      var bodyH = (body && body.clientHeight) ? body.clientHeight : 120;
      els.ball.style.left = (n > 1 ? 100 : 50) + "%";
      els.ball.style.top = (y / 120 * bodyH).toFixed(1) + "px";
      els.ball.style.opacity = "1";
    }

    // 底部时间标签（最近 3 个）
    if (els.labels) {
      els.labels.innerHTML = "";
      pts.slice(-3).forEach(function (p) {
        var sp = document.createElement("span");
        sp.textContent = p.time;
        els.labels.appendChild(sp);
      });
    }
  }

  function update(history) {
    render(history);
  }

  window.EmotionChart = { init: init, update: update, render: render };
})();
