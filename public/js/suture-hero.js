/* Homepage hero: a needle passes straight down through a wound, the
   forceps grasps the tail, then the suture wraps once around the driver.
   Pauses off-screen. One still frame if motion is reduced. */
(function () {
  'use strict';

  var canvas = document.getElementById('suture-hero');
  if (!canvas || !canvas.getContext) return;
  var ctx = canvas.getContext('2d');
  var box = canvas.parentNode;

  var W = 1440;
  var H = 560;
  var BITE_X = 740;
  var APPROACH = 0.9;
  var ENTER = 2.6;
  var EXIT = 5.8;
  var GRAB = 8.2;
  var PULL = 10.4;
  var WRAP = 13.6;
  var CINCH = 15.4;
  var HOLD = 16.8;
  var END = 18.6;
  var STILL = 15.6;
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
    var u = (x - BITE_X) / 210;
    var e = Math.max(0, 1 - u * u);
    return e * e;
  }

  function closure(t) {
    return smooth(ramp(t, GRAB + 0.15, PULL)) * (1 - smooth(ramp(t, HOLD + 0.4, END)));
  }

  function upperY(x, t) {
    var y = MID - (1 - closure(t)) * 96 * opening(x);
    var press = 0;
    if (t >= APPROACH && t <= EXIT) press = Math.sin(ramp(t, APPROACH, EXIT) * Math.PI);
    return y + press * 18 * Math.exp(-Math.pow((x - BITE_X) / 32, 2));
  }

  function lowerY(x, t) {
    var y = MID + (1 - closure(t)) * 96 * opening(x);
    var press = 0;
    if (t >= ENTER && t <= GRAB) press = Math.sin(ramp(t, ENTER, GRAB) * Math.PI);
    return y - press * 16 * Math.exp(-Math.pow((x - BITE_X) / 32, 2));
  }

  function entryPt(t) { return [BITE_X, upperY(BITE_X, t)]; }
  function exitPt(t) { return [BITE_X, lowerY(BITE_X, t)]; }
  function tailPt(t) {
    var exit = exitPt(t);
    return [BITE_X, exit[1] + 58];
  }

  function samples(fn, t) {
    var pts = [];
    var x;
    for (x = 280; x <= 1180; x += 14) pts.push([x, fn(x, t)]);
    return pts;
  }

  function driverJaw(t) {
    var k = smooth(ramp(t, 0.3, ENTER));
    var x = lerp(500, 590, k);
    var y = lerp(118, 140, k);
    var into = smooth(ramp(t, GRAB + 0.2, PULL));
    x = lerp(x, 620, into);
    y = lerp(y, 96, into);
    var aside = smooth(ramp(t, CINCH, HOLD));
    return [lerp(x, 560, aside), lerp(y, 124, aside)];
  }

  function needleTip(t) {
    var entry = entryPt(t);
    var tail = tailPt(t);
    if (t < ENTER) {
      var k = smooth(ramp(t, APPROACH, ENTER));
      return [lerp(548, BITE_X, k), lerp(146, entry[1], k)];
    }
    if (t < EXIT) {
      var k2 = smooth(ramp(t, ENTER, EXIT));
      return [BITE_X, lerp(entry[1], tail[1], k2)];
    }
    if (t < GRAB) return tail;
    var jaw = driverJaw(t);
    var k3 = smooth(ramp(t, GRAB, GRAB + 0.7));
    return [lerp(tail[0], jaw[0] + 16, k3), lerp(tail[1], jaw[1] + 4, k3)];
  }

  function loopGeom(t) {
    var jaw = driverJaw(t);
    var cinch = smooth(ramp(t, WRAP, CINCH));
    var turns = smooth(ramp(t, PULL, WRAP));
    var a0 = Math.PI / 2;
    return {
      cx: lerp(jaw[0], BITE_X, cinch),
      cy: lerp(jaw[1], MID, cinch),
      radius: lerp(78, 6.5, cinch),
      a0: a0,
      a1: a0 + turns * Math.PI * 2,
      turns: turns,
      cinch: cinch
    };
  }

  function forcepsPinch(t) {
    var tail = tailPt(t);
    var wait = [1160, 150];
    if (t < EXIT) return wait;
    if (t < GRAB) {
      var k = smooth(ramp(t, EXIT, GRAB));
      return [lerp(wait[0], tail[0], k), lerp(wait[1], tail[1], k)];
    }
    if (t < PULL) {
      var k2 = smooth(ramp(t, GRAB, PULL));
      return [lerp(tail[0], 900, k2), lerp(tail[1], 210, k2)];
    }
    var loop = loopGeom(t);
    var hold = [loop.cx + loop.radius + 36, loop.cy];
    var k3 = smooth(ramp(t, PULL, PULL + 0.5));
    return [lerp(900, hold[0], k3), lerp(210, hold[1], k3)];
  }

  function paintSilk(trace) {
    trace();
    ctx.strokeStyle = 'rgba(0,0,0,0.4)';
    ctx.lineWidth = 6.4;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
    trace();
    ctx.strokeStyle = SILK;
    ctx.lineWidth = 3.15;
    ctx.stroke();
  }

  function drawThread(t, jaw) {
    var entry = entryPt(t);
    var exit = exitPt(t);
    var tip = needleTip(t);
    if (t < ENTER - 0.05) return;

    if (t < PULL) {
      var lead = [jaw[0] + 14, jaw[1] + 6];
      paintSilk(function () {
        var y;
        ctx.beginPath();
        ctx.moveTo(lead[0], lead[1]);
        ctx.quadraticCurveTo((lead[0] + BITE_X) / 2, Math.min(lead[1], entry[1]) - 6, BITE_X, entry[1]);
        y = t < EXIT ? Math.max(entry[1], tip[1]) : exit[1];
        ctx.lineTo(BITE_X, y);
        if (t >= EXIT) ctx.lineTo(t < GRAB ? tailPt(t)[0] : forcepsPinch(t)[0], t < GRAB ? tailPt(t)[1] : forcepsPinch(t)[1]);
      });
      return;
    }

    var loop = loopGeom(t);
    var pinch = forcepsPinch(t);
    paintSilk(function () {
      var sx = loop.cx + Math.cos(loop.a0) * loop.radius;
      var sy = loop.cy + Math.sin(loop.a0) * loop.radius;
      var ex = loop.cx + Math.cos(loop.a1) * loop.radius;
      var ey = loop.cy + Math.sin(loop.a1) * loop.radius;
      ctx.beginPath();
      ctx.moveTo(BITE_X, (entry[1] + exit[1]) / 2);
      ctx.lineTo(sx, sy);
      if (loop.turns > 0.02) ctx.arc(loop.cx, loop.cy, Math.max(1, loop.radius), loop.a0, loop.a1);
      ctx.lineTo(loop.turns > 0.02 ? ex : sx, loop.turns > 0.02 ? ey : sy);
      ctx.lineTo(pinch[0], pinch[1]);
    });
  }

  function drawNeedlePoint(x, y) {
    ctx.strokeStyle = '#f7f4ee';
    ctx.lineWidth = 2.7;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x, y - 15);
    ctx.quadraticCurveTo(x - 9, y - 5, x, y);
    ctx.stroke();
  }

  function drawDriver(jaw, tip, t) {
    var reach = t >= PULL ? 78 : 16;
    ctx.strokeStyle = METAL;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(140, 52);
    ctx.quadraticCurveTo(300, 36, jaw[0] - reach, jaw[1]);
    ctx.stroke();
    ctx.strokeStyle = METAL;
    ctx.lineWidth = 2.8;
    ctx.beginPath();
    ctx.moveTo(jaw[0] - reach, jaw[1] - 7);
    ctx.lineTo(jaw[0] + 16, jaw[1] - 2);
    ctx.moveTo(jaw[0] - reach, jaw[1] + 7);
    ctx.lineTo(jaw[0] + 16, jaw[1] + 2);
    ctx.stroke();
    if (t >= GRAB && t < PULL) {
      ctx.strokeStyle = '#f7f4ee';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(jaw[0] + 10, jaw[1]);
      ctx.quadraticCurveTo(jaw[0] + 28, jaw[1] + 14, jaw[0] + 22, jaw[1] - 4);
      ctx.stroke();
    }
    if (t < EXIT) {
      var entry = entryPt(t);
      ctx.strokeStyle = '#f7f4ee';
      ctx.lineWidth = 2.6;
      ctx.beginPath();
      ctx.moveTo(jaw[0] + 12, jaw[1] + 2);
      ctx.quadraticCurveTo((jaw[0] + entry[0]) / 2, jaw[1] + 26, entry[0], entry[1] - 2);
      ctx.stroke();
    }
  }

  function drawForceps(pinch, open) {
    var anchor = [1340, 58];
    var angle = Math.atan2(pinch[1] - anchor[1], pinch[0] - anchor[0]);
    var bx = pinch[0] - Math.cos(angle) * 38;
    var by = pinch[1] - Math.sin(angle) * 38;
    ctx.strokeStyle = METAL;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(anchor[0], anchor[1]);
    ctx.quadraticCurveTo(Math.max(bx, 980), anchor[1], bx, by);
    ctx.stroke();
    ctx.save();
    ctx.translate(bx, by);
    ctx.rotate(angle);
    ctx.lineWidth = 3.1;
    ctx.beginPath();
    ctx.moveTo(0, -4 - open * 11);
    ctx.lineTo(46, -2 - open * 16);
    ctx.moveTo(0, 4 + open * 11);
    ctx.lineTo(46, 2 + open * 16);
    ctx.stroke();
    ctx.restore();
  }

  function draw(t) {
    var upper = samples(upperY, t);
    var lower = samples(lowerY, t);
    var jaw = driverJaw(t);
    var tip = needleTip(t);
    var pinch = forcepsPinch(t);
    var openJaw = 1 - smooth(ramp(t, GRAB - 0.55, GRAB));
    if (t >= GRAB) openJaw = 0.1;
    var show = ramp(t, 0.15, 0.85) * (1 - ramp(t, END - 1.05, END));
    var knot = smooth(ramp(t, WRAP + 0.2, CINCH)) * (1 - smooth(ramp(t, HOLD + 0.35, END)));
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

    ctx.strokeStyle = 'rgba(184, 96, 82, 0.75)';
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

    ctx.globalAlpha = show;
    if (t < HOLD + 1.1) drawDriver(jaw, tip, t);
    ctx.globalAlpha = 1;

    if (t > APPROACH) drawThread(t, jaw);

    if (t < GRAB) drawNeedlePoint(tip[0], tip[1]);

    if (knot > 0.55) {
      ctx.globalAlpha = smooth(ramp(knot, 0.55, 1));
      ctx.fillStyle = SILK;
      ctx.beginPath();
      ctx.arc(BITE_X, MID, 5.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    ctx.globalAlpha = show;
    if (t > EXIT - 0.15 && t < HOLD + 1.1) drawForceps(pinch, openJaw);
    ctx.globalAlpha = 1;

    label = t < EXIT ? 'Bite' : t < PULL ? 'Grasp' : t < CINCH ? 'Wrap' : 'Knot';
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
