/* Homepage hero: two instruments close a lens-shaped wound with a suture.
   The needle driver bites both edges; the forceps pulls the thread and the
   incision approximates. Pauses off-screen. One still frame if motion is reduced. */
(function () {
  'use strict';

  var canvas = document.getElementById('suture-hero');
  if (!canvas || !canvas.getContext) return;
  var ctx = canvas.getContext('2d');
  var box = canvas.parentNode;

  var W = 1440;
  var H = 560;
  var BITE = 1.6;
  var THROUGH = 6.2;
  var PULL = 10.4;
  var HOLD = 13.6;
  var END = 16.2;
  var STILL = 11.8;
  var MID = 292;

  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var SILK = '#f0d7a6';
  var METAL = '#ece6dc';
  var GOLD = '#e2be76';
  var INK = '#171717';

  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function ramp(t, a, b) { return clamp((t - a) / (b - a), 0, 1); }
  function smooth(t) { return t * t * (3 - 2 * t); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function opening(x) {
    var u = (x - 740) / 210;
    var e = Math.max(0, 1 - u * u);
    return e * e;
  }

  function closure(t) {
    return smooth(ramp(t, THROUGH - 0.2, PULL)) * (1 - smooth(ramp(t, HOLD + 0.8, END)));
  }

  function biteP(t) { return smooth(ramp(t, BITE, THROUGH)); }

  function upperY(x, t) {
    var gap = (1 - closure(t)) * 78 * opening(x);
    var y = MID - gap;
    var p = biteP(t);
    var press = p < 0.55 ? Math.sin((p / 0.55) * Math.PI) : 0;
    y += press * 22 * Math.exp(-Math.pow((x - 660) / 42, 2));
    return y;
  }

  function lowerY(x, t) {
    var gap = (1 - closure(t)) * 78 * opening(x);
    var y = MID + gap;
    var p = biteP(t);
    var press = p > 0.35 && p < 0.9 ? Math.sin(((p - 0.35) / 0.55) * Math.PI) : 0;
    y -= press * 20 * Math.exp(-Math.pow((x - 860) / 46, 2));
    return y;
  }

  function samples(fn, t) {
    var pts = [];
    var x;
    for (x = 280; x <= 1180; x += 14) pts.push([x, fn(x, t)]);
    return pts;
  }

  function needleTip(t) {
    var p = biteP(t);
    var entry = [660, upperY(660, t) + 4];
    var exit = [860, lowerY(860, t) - 4];
    var lifted = [980, upperY(980, t) - 46];
    if (p < 0.34) return [lerp(520, entry[0], p / 0.34), lerp(168, entry[1], p / 0.34)];
    if (p < 0.72) {
      var k = (p - 0.34) / 0.38;
      return [lerp(entry[0], exit[0], k), lerp(entry[1], exit[1], k) + Math.sin(k * Math.PI) * 10];
    }
    var k2 = (p - 0.72) / 0.28;
    var out = [lerp(exit[0], lifted[0], k2), lerp(exit[1], lifted[1], k2)];
    var lift = smooth(ramp(t, PULL - 0.3, PULL + 1));
    return [lerp(out[0], 690, lift), lerp(out[1], 150, lift)];
  }

  function forcepsTip(t) {
    var grab = smooth(ramp(t, THROUGH - 0.6, THROUGH + 0.5));
    var pull = smooth(ramp(t, THROUGH + 0.2, PULL));
    var wait = [1088, 150];
    var hold = [1168, 132];
    var target = [lerp(980, hold[0], pull), lerp(upperY(980, t) - 20, hold[1], pull)];
    return [lerp(wait[0], target[0], grab), lerp(wait[1], target[1], grab)];
  }

  function threadPoints(t, tip, forceps) {
    var p = biteP(t);
    var entry = [660, upperY(660, t)];
    var exit = [860, lowerY(860, t)];
    if (p < 0.2) return [entry, tip];
    if (p < 0.7) return [entry, tip, exit];
    return [entry, [750, (entry[1] + exit[1]) / 2], exit, forceps];
  }

  function strokeSmooth(pts) {
    var i, mx, my;
    if (pts.length < 2) return;
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (i = 1; i < pts.length - 1; i++) {
      mx = (pts[i][0] + pts[i + 1][0]) / 2;
      my = (pts[i][1] + pts[i + 1][1]) / 2;
      ctx.quadraticCurveTo(pts[i][0], pts[i][1], mx, my);
    }
    ctx.lineTo(pts[pts.length - 1][0], pts[pts.length - 1][1]);
  }

  function driverJaw(t) {
    var p = Math.min(biteP(t), 1);
    return [lerp(500, 610, p), lerp(132, 158, p)];
  }

  function drawDriver(jaw, tip) {
    ctx.strokeStyle = METAL;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(140, 64);
    ctx.quadraticCurveTo(280, 56, jaw[0], jaw[1]);
    ctx.stroke();
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    ctx.moveTo(jaw[0] - 2, jaw[1] - 5);
    ctx.lineTo(jaw[0] + 16, jaw[1] + 2);
    ctx.moveTo(jaw[0] - 2, jaw[1] + 5);
    ctx.lineTo(jaw[0] + 16, jaw[1] + 6);
    ctx.stroke();
    ctx.strokeStyle = '#f7f4ee';
    ctx.lineWidth = 2.8;
    ctx.beginPath();
    ctx.moveTo(jaw[0] + 12, jaw[1] + 4);
    ctx.quadraticCurveTo((jaw[0] + tip[0]) / 2 + 22, (jaw[1] + tip[1]) / 2 + 28, tip[0], tip[1]);
    ctx.stroke();
  }

  function drawForceps(tip, open) {
    ctx.strokeStyle = METAL;
    ctx.lineCap = 'round';
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(1300, 62);
    ctx.quadraticCurveTo(1220, 70, tip[0], tip[1]);
    ctx.stroke();
    ctx.save();
    ctx.translate(tip[0], tip[1]);
    ctx.rotate(0.35);
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(30, -2 - open * 9);
    ctx.moveTo(0, 0);
    ctx.lineTo(30, 2 + open * 9);
    ctx.stroke();
    ctx.restore();
  }

  function draw(t) {
    var upper = samples(upperY, t);
    var lower = samples(lowerY, t);
    var tip = needleTip(t);
    var jaw = driverJaw(t);
    var forceps = forcepsTip(t);
    var thread = threadPoints(t, tip, forceps);
    var openJaw = 1 - smooth(ramp(t, THROUGH - 0.4, THROUGH + 0.6));
    var show = ramp(t, 0.25, 1.05) * (1 - ramp(t, END - 1.05, END));
    var i, x, y, label;

    ctx.fillStyle = INK;
    ctx.fillRect(0, 0, W, H);

    ctx.beginPath();
    ctx.moveTo(240, 168);
    ctx.lineTo(1200, 168);
    for (i = upper.length - 1; i >= 0; i--) ctx.lineTo(upper[i][0], upper[i][1]);
    ctx.closePath();
    ctx.fillStyle = '#2c2825';
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(lower[0][0], lower[0][1]);
    for (i = 1; i < lower.length; i++) ctx.lineTo(lower[i][0], lower[i][1]);
    ctx.lineTo(1200, 430);
    ctx.lineTo(240, 430);
    ctx.closePath();
    ctx.fillStyle = '#26221f';
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(upper[0][0], upper[0][1]);
    for (i = 1; i < upper.length; i++) ctx.lineTo(upper[i][0], upper[i][1]);
    for (i = lower.length - 1; i >= 0; i--) ctx.lineTo(lower[i][0], lower[i][1]);
    ctx.closePath();
    ctx.fillStyle = '#140f0e';
    ctx.fill();

    ctx.strokeStyle = 'rgba(184, 96, 82, 0.7)';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    for (i = 0; i < upper.length; i++) {
      if (i) ctx.lineTo(upper[i][0], upper[i][1]);
      else ctx.moveTo(upper[i][0], upper[i][1]);
    }
    ctx.stroke();
    ctx.beginPath();
    for (i = 0; i < lower.length; i++) {
      if (i) ctx.lineTo(lower[i][0], lower[i][1]);
      else ctx.moveTo(lower[i][0], lower[i][1]);
    }
    ctx.stroke();

    ctx.fillStyle = 'rgba(238, 228, 212, 0.32)';
    for (x = 320; x <= 1140; x += 16) {
      for (i = 0; i < 3; i++) {
        y = upperY(x, t) - 16 - i * 15;
        if (y > 176) {
          ctx.beginPath();
          ctx.arc(x, y, 1.45, 0, Math.PI * 2);
          ctx.fill();
        }
        y = lowerY(x, t) + 16 + i * 15;
        if (y < 420) {
          ctx.beginPath();
          ctx.arc(x + 4, y, 1.45, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    if (biteP(t) > 0.12 && thread.length > 1) {
      strokeSmooth(thread);
      ctx.strokeStyle = 'rgba(0,0,0,0.4)';
      ctx.lineWidth = 6.5;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();
      strokeSmooth(thread);
      ctx.strokeStyle = SILK;
      ctx.lineWidth = 3;
      ctx.stroke();
    }

    if (closure(t) > 0.78) {
      ctx.globalAlpha = smooth(ramp(closure(t), 0.78, 1));
      ctx.fillStyle = SILK;
      ctx.beginPath();
      ctx.arc(740, MID, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    ctx.globalAlpha = show;
    if (t < HOLD + 1.4) drawDriver(jaw, tip);
    if (t > THROUGH - 1.4) drawForceps(forceps, openJaw * (t < PULL ? 1 : 0.15));
    ctx.globalAlpha = 1;

    label = t < THROUGH ? 'Bite' : t < PULL ? 'Pull' : 'Close';
    ctx.globalAlpha = 0.92;
    ctx.fillStyle = GOLD;
    ctx.font = '600 28px "EB Garamond", Georgia, serif';
    ctx.fillText(label, 64, 72);
    ctx.globalAlpha = 1;
  }

  var scale = 1;
  var offX = 0;
  var offY = 0;
  var time = reduce ? STILL : 0.2;

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
