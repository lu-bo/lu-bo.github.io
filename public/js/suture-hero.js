/* Homepage hero: a suture sees an incision, passes through it, and ties a knot.
   Original canvas scene for lu-bo.github.io. Pauses off-screen and when the
   tab is hidden. Draws one still frame when the visitor prefers reduced motion. */
(function () {
  'use strict';

  var canvas = document.getElementById('suture-hero');
  if (!canvas || !canvas.getContext) return;
  var ctx = canvas.getContext('2d');
  var box = canvas.parentNode;

  var W = 1440;
  var H = 560;
  var SEE = 3.8;
  var PASS = 8.6;
  var LOOP = 12.2;
  var CINCH = 15.4;
  var END = 17.6;
  var STILL = 15.0;

  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var SILK = '#f2d7a4';
  var NEEDLE = '#f6f1e6';
  var GOLD = '#e2be76';
  var INK = '#171717';

  function clamp(v, a, b) {
    return v < a ? a : v > b ? b : v;
  }
  function ramp(t, a, b) {
    return clamp((t - a) / (b - a), 0, 1);
  }
  function smooth(t) {
    return t * t * (3 - 2 * t);
  }
  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function upperLip(x) {
    var u = (x - 700) / 320;
    return 268 - 18 * Math.exp(-u * u * 1.8) + 5 * Math.sin(x * 0.016);
  }
  function lowerLip(x) {
    var u = (x - 720) / 340;
    return 348 + 16 * Math.exp(-u * u * 1.5) + 4 * Math.cos(x * 0.014);
  }

  var dots = [];
  (function () {
    var x, row, side, edge, y;
    for (x = 180; x <= 1260; x += 14) {
      for (row = 0; row < 10; row++) {
        side = row < 5 ? -1 : 1;
        edge = side < 0 ? upperLip(x) : lowerLip(x);
        y = side < 0 ? edge - 6 - (row % 5) * 14 : edge + 8 + (row - 5) * 14;
        if (y < 48 || y > 520) continue;
        dots.push([x + ((row * 17 + x) % 7) - 3, y]);
      }
    }
  })();

  var IN_X = 500;
  var OUT_X = 860;
  var LOOP_C = [690, 188];

  function passage(p) {
    var a = [250, 150];
    var b = [IN_X, upperLip(IN_X)];
    var c = [OUT_X, lowerLip(OUT_X)];
    var d = [LOOP_C[0] + 70, LOOP_C[1] + 8];
    var k;
    if (p < 0.3) {
      k = smooth(p / 0.3);
      return [lerp(a[0], b[0], k), lerp(a[1], b[1], k)];
    }
    if (p < 0.7) {
      k = smooth((p - 0.3) / 0.4);
      return [lerp(b[0], c[0], k), lerp(b[1], c[1], k)];
    }
    k = smooth((p - 0.7) / 0.3);
    return [lerp(c[0], d[0], k), lerp(c[1], d[1], k)];
  }

  function threadPoints(t) {
    var pts = [];
    var pass = ramp(t, SEE, PASS);
    var turn = ramp(t, PASS, LOOP);
    var cinch = ramp(t, LOOP, CINCH);
    var i, n, ang, rad;
    if (pass <= 0) return pts;
    n = Math.max(2, Math.round(40 * pass));
    for (i = 0; i <= n; i++) pts.push(passage(pass * i / n));
    if (t < PASS || turn <= 0) return pts;
    ang = turn * Math.PI * 2;
    rad = lerp(108, 8, smooth(cinch));
    n = Math.max(12, Math.round(48 * turn));
    for (i = 1; i <= n; i++) {
      var p = ang * i / n;
      pts.push([
        LOOP_C[0] + Math.cos(p - Math.PI / 2) * rad,
        LOOP_C[1] + Math.sin(p - Math.PI / 2) * rad * 0.72
      ]);
    }
    return pts;
  }

  function strokeCurve(points) {
    var i, mx, my;
    if (points.length < 2) return;
    ctx.beginPath();
    ctx.moveTo(points[0][0], points[0][1]);
    for (i = 1; i < points.length - 1; i++) {
      mx = (points[i][0] + points[i + 1][0]) / 2;
      my = (points[i][1] + points[i + 1][1]) / 2;
      ctx.quadraticCurveTo(points[i][0], points[i][1], mx, my);
    }
    ctx.lineTo(points[points.length - 1][0], points[points.length - 1][1]);
  }

  function drawNeedle(tip, prev) {
    var ang = Math.atan2(tip[1] - prev[1], tip[0] - prev[0]);
    ctx.save();
    ctx.translate(tip[0], tip[1]);
    ctx.rotate(ang);
    ctx.strokeStyle = NEEDLE;
    ctx.lineWidth = 3.2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(-20, 24, 46, -1.2, 0.5);
    ctx.stroke();
    ctx.restore();
  }

  function draw(t) {
    var scanX = 240 + ramp(t, 0.2, SEE - 0.15) * 960;
    var see = 1 - ramp(t, SEE - 0.15, SEE + 0.45);
    var pass = ramp(t, SEE, PASS);
    var cinch = ramp(t, LOOP, CINCH);
    var i, d, glow, pts, label;

    ctx.fillStyle = INK;
    ctx.fillRect(0, 0, W, H);

    for (i = 0; i < dots.length; i++) {
      d = dots[i];
      glow = Math.exp(-Math.pow((d[0] - scanX) / 42, 2)) * see;
      ctx.globalAlpha = 0.28 + glow * 0.72;
      ctx.fillStyle = glow > 0.4 ? GOLD : '#ebe2d0';
      ctx.beginPath();
      ctx.arc(d[0], d[1], glow > 0.5 ? 2.6 : 1.7, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    ctx.strokeStyle = 'rgba(226, 190, 118, 0.45)';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    for (i = 200; i <= 1240; i += 20) {
      if (i === 200) ctx.moveTo(i, upperLip(i));
      else ctx.lineTo(i, upperLip(i));
    }
    ctx.stroke();
    ctx.beginPath();
    for (i = 200; i <= 1240; i += 20) {
      if (i === 200) ctx.moveTo(i, lowerLip(i));
      else ctx.lineTo(i, lowerLip(i));
    }
    ctx.stroke();

    if (see > 0.05) {
      ctx.globalAlpha = see;
      ctx.strokeStyle = GOLD;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(scanX, 70);
      ctx.lineTo(scanX, 500);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    pts = threadPoints(t);
    if (pts.length > 1) {
      strokeCurve(pts);
      ctx.strokeStyle = 'rgba(0,0,0,0.55)';
      ctx.lineWidth = 8;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.stroke();
      strokeCurve(pts);
      ctx.strokeStyle = SILK;
      ctx.lineWidth = 3.6;
      ctx.stroke();
      if (pass > 0.08 && cinch < 0.85) drawNeedle(pts[pts.length - 1], pts[Math.max(0, pts.length - 3)]);
    }

    if (pass > 0.34) {
      ctx.globalAlpha = clamp((pass - 0.34) / 0.12, 0, 1);
      ctx.fillStyle = GOLD;
      ctx.beginPath();
      ctx.arc(IN_X, upperLip(IN_X), 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
    if (pass > 0.66) {
      ctx.globalAlpha = clamp((pass - 0.66) / 0.12, 0, 1);
      ctx.fillStyle = GOLD;
      ctx.beginPath();
      ctx.arc(OUT_X, lowerLip(OUT_X), 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    if (cinch > 0.72) {
      ctx.globalAlpha = smooth(ramp(cinch, 0.72, 1));
      ctx.fillStyle = SILK;
      ctx.beginPath();
      ctx.arc(LOOP_C[0], LOOP_C[1], 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    label = t < SEE + 0.5 ? 'See' : t < PASS ? 'Thread' : 'Knot';
    ctx.globalAlpha = 0.95;
    ctx.fillStyle = GOLD;
    ctx.font = '600 28px "EB Garamond", Georgia, serif';
    ctx.fillText(label, 64, 78);
    ctx.globalAlpha = 1;
  }

  var scale = 1;
  var offX = 0;
  var offY = 0;
  var time = reduce ? STILL : 0.3;

  function paint() {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.setTransform(scale, 0, 0, scale, offX, offY);
    draw(time);
  }

  function resize() {
    var cw = box.clientWidth;
    var ch = box.clientHeight;
    var dpr, s;
    if (!cw || !ch) return;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.max(1, Math.round(cw * dpr));
    canvas.height = Math.max(1, Math.round(ch * dpr));
    s = Math.min(cw / W, ch / H);
    scale = s * dpr;
    offX = ((cw - W * s) / 2) * dpr;
    offY = ((ch - H * s) / 2) * dpr;
    paint();
  }

  var raf = 0;
  var last = null;
  var inView = true;

  function tick(ts) {
    if (last == null) last = ts;
    time = (time + Math.min(0.05, (ts - last) / 1000)) % END;
    last = ts;
    paint();
    raf = window.requestAnimationFrame(tick);
  }
  function start() {
    if (reduce || raf || !inView || document.hidden) return;
    last = null;
    raf = window.requestAnimationFrame(tick);
  }
  function stop() {
    if (raf) window.cancelAnimationFrame(raf);
    raf = 0;
  }

  resize();
  if (window.ResizeObserver) new ResizeObserver(resize).observe(box);
  else window.addEventListener('resize', resize);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(paint);
  if (reduce) return;
  if (window.IntersectionObserver) {
    new IntersectionObserver(function (entries) {
      inView = entries[0].isIntersecting;
      if (inView) start();
      else stop();
    }).observe(box);
  }
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) stop();
    else start();
  });
  start();
})();
