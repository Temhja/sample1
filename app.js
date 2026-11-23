(function () {
  'use strict';
  var T = window.THREE;
  var root = document.documentElement;
  var canvas = document.getElementById('stage');
  var clamp = function (x) { return Math.max(0, Math.min(1, x)); };
  var s = function (x) { x = clamp(x); return x * x * (3 - 2 * x); };
  var lerp = function (a, b, t) { return a + (b - a) * t; };

  var THEMES = {
    night: { shell: 0x1b1d24, inner: 0x0b0c10, bud: 0x20232b, e: 0.2, name: 'أسود ليلي' },
    pearl: { shell: 0xf1f0ec, inner: 0xcfd2d8, bud: 0xf7f6f3, e: 0.6, name: 'أبيض لؤلؤي' },
    cobalt: { shell: 0x2545e6, inner: 0x0c1a66, bud: 0x2d50f2, e: 0.45, name: 'أزرق كوبالت' }
  };
  var theme = 'night';

  function setTheme(id) {
    theme = id;
    if (id === 'night') root.removeAttribute('data-c'); else root.setAttribute('data-c', id);
    var b = document.querySelectorAll('.sw');
    for (var i = 0; i < b.length; i++) b[i].setAttribute('aria-pressed', b[i].getAttribute('data-c') === id ? 'true' : 'false');
    var n = THEMES[id].name;
    document.getElementById('barc').textContent = n + ' · 89,000 د.ع';
    var href = 'https://wa.me/9647736797122?text=' + encodeURIComponent('أريد أطلب نبض برو، اللون: ' + n);
    document.getElementById('buy').href = href;
    document.getElementById('cta').href = href;
  }
  var sws = document.querySelectorAll('.sw');
  for (var i = 0; i < sws.length; i++) sws[i].addEventListener('click', function () { setTheme(this.getAttribute('data-c')); });
  setTheme('night');

  // ---------- scroll bookkeeping ----------
  var ids = ['hero', 'inside', 'specs', 'colours', 'range'];
  var sec = {};
  ids.forEach(function (id) { sec[id] = { el: document.getElementById(id), p: 0, enter: 0 }; });
  var rail = document.getElementById('rail');
  var bar = document.getElementById('bar');
  var fades = document.querySelectorAll('#hero .fade');
  var counted = false;

  function measure() {
    var vh = window.innerHeight;
    ids.forEach(function (id) {
      var r = sec[id].el.getBoundingClientRect();
      sec[id].p = clamp(-r.top / Math.max(1, r.height - vh));
      sec[id].enter = clamp(1 - r.top / vh);
    });
    for (var i = 0; i < fades.length; i++) fades[i].style.setProperty('--out', s(sec.hero.p * 3).toFixed(3));
    var ord = document.getElementById('order').getBoundingClientRect();
    bar.classList.toggle('on', sec.hero.p > 0.45 && ord.top > vh * 0.75);
    var over = Math.max(0, rail.scrollWidth - window.innerWidth);
    rail.style.transform = 'translateX(' + (s(sec.range.p) * over).toFixed(1) + 'px)';
    if (!counted && sec.specs.p > 0.3) { counted = true; countUp(); }
  }
  function countUp() {
    var els = document.querySelectorAll('[data-count]');
    var t0 = performance.now();
    (function tick(now) {
      var k = s((now - t0) / 1100);
      for (var i = 0; i < els.length; i++) els[i].textContent = Math.round(k * +els[i].getAttribute('data-count'));
      if (k < 1) requestAnimationFrame(tick);
    })(t0);
  }
  window.addEventListener('scroll', measure, { passive: true });
  window.addEventListener('resize', measure);
  measure();

  if (!T) return;
  var renderer;
  try { renderer = new T.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true }); } catch (e) { return; }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputEncoding = T.sRGBEncoding;
  renderer.toneMapping = T.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.localClippingEnabled = true;
  var pm = new T.PMREMGenerator(renderer);
  var env = pm.fromScene(new T.RoomEnvironment(), 0.04).texture;

  function phys(color, o) {
    o = o || {};
    return new T.MeshPhysicalMaterial({ color: color, roughness: o.r == null ? 0.32 : o.r, metalness: o.m || 0, clearcoat: o.cc == null ? 0.7 : o.cc, clearcoatRoughness: 0.25, envMapIntensity: o.e || 0.55, side: o.side || T.FrontSide });
  }
  function rrect(w, d, r) {
    var sh = new T.Shape(), x = -w / 2, y = -d / 2;
    sh.moveTo(x + r, y); sh.lineTo(x + w - r, y); sh.absarc(x + w - r, y + r, r, -Math.PI / 2, 0, false);
    sh.lineTo(x + w, y + d - r); sh.absarc(x + w - r, y + d - r, r, 0, Math.PI / 2, false);
    sh.lineTo(x + r, y + d); sh.absarc(x + r, y + d - r, r, Math.PI / 2, Math.PI, false);
    sh.lineTo(x, y + r); sh.absarc(x + r, y + r, r, Math.PI, Math.PI * 1.5, false);
    return sh;
  }
  function slab(w, d, r, h, mat) {
    var g = new T.ExtrudeGeometry(rrect(w, d, r), { depth: h, bevelEnabled: true, bevelSize: 0.015, bevelThickness: 0.015, bevelSegments: 2, curveSegments: 24 });
    g.rotateX(-Math.PI / 2);
    return new T.Mesh(g, mat);
  }

  // ---------- main scene ----------
  var scene = new T.Scene();
  scene.environment = env;
  var cam = new T.PerspectiveCamera(32, 1, 0.1, 100);
  var key = new T.DirectionalLight(0xffffff, 1.0); key.position.set(4, 6, 5); scene.add(key);
  var rim = new T.PointLight(0x7c88ff, 2.6, 30); rim.position.set(-5, 2.5, -4); scene.add(rim);
  var rim2 = new T.PointLight(0xffffff, 1.6, 30); rim2.position.set(5, -1, -5); scene.add(rim2);

  var W = 2.4, H = 1.5, D = 1.3, R = 0.55, SEAM = 0.2;
  var mShell = phys(0x1b1d24, { side: T.DoubleSide });
  var mLid = phys(0x1b1d24, { side: T.DoubleSide });
  var mInner = phys(0x0b0c10, { r: 0.6, cc: 0.1 });
  var mBud = phys(0x20232b, { r: 0.25, cc: 1 });
  var mTip = phys(0x101114, { r: 0.75, cc: 0 });
  var mMetal = phys(0xc9ccd4, { r: 0.28, m: 1, cc: 0.2 });
  var mCopper = phys(0xd08a4e, { r: 0.3, m: 1, cc: 0 });
  var mPcb = phys(0x0f5a4c, { r: 0.5, cc: 0.4 });
  var mChip = phys(0x15161a, { r: 0.4, cc: 0.3 });
  var mLed = new T.MeshBasicMaterial({ color: 0x7c88ff });

  var product = new T.Group(); scene.add(product);
  var shellGeo = new T.RoundedBoxGeometry(W, H, D, 12, R);

  var body = new T.Group(); product.add(body);
  var bodyMesh = new T.Mesh(shellGeo, mShell); body.add(bodyMesh);
  var pBody = new T.Plane(); mShell.clippingPlanes = [pBody];
  var led = new T.Mesh(new T.SphereGeometry(0.035, 16, 12), mLed); led.position.set(0, -0.12, D / 2 + 0.005); body.add(led);
  var hinge = new T.Mesh(new T.CylinderGeometry(0.05, 0.05, 0.9, 20), mMetal); hinge.rotation.z = Math.PI / 2; hinge.position.set(0, SEAM, -D / 2 + 0.02); body.add(hinge);

  var tray = new T.Group(); product.add(tray);
  var trayPlate = slab(W - 0.08, D - 0.08, R - 0.05, 0.06, mInner); trayPlate.position.y = SEAM - 0.07; tray.add(trayPlate);
  [-0.55, 0.55].forEach(function (x) {
    var ring = new T.Mesh(new T.TorusGeometry(0.27, 0.02, 12, 40), mMetal); ring.rotation.x = Math.PI / 2; ring.position.set(x, SEAM + 0.012, 0.02); tray.add(ring);
    var hole = new T.Mesh(new T.CylinderGeometry(0.26, 0.26, 0.01, 40), mChip); hole.position.set(x, SEAM + 0.011, 0.02); tray.add(hole);
  });

  var lidPivot = new T.Group(); lidPivot.position.set(0, SEAM, -D / 2 + 0.04); product.add(lidPivot);
  var lidHold = new T.Group(); lidHold.position.set(0, -SEAM, D / 2 - 0.04); lidPivot.add(lidHold);
  var lidMesh = new T.Mesh(shellGeo, mLid); lidHold.add(lidMesh);
  var pLid = new T.Plane(); mLid.clippingPlanes = [pLid];
  var lidPlate = slab(W - 0.08, D - 0.08, R - 0.05, 0.04, mInner); lidPlate.position.y = SEAM + 0.01; lidHold.add(lidPlate);

  function makeBud(side) {
    var g = new T.Group();
    var head = new T.Mesh(new T.SphereGeometry(0.27, 40, 28), mBud); head.scale.set(1, 0.92, 0.9); head.position.y = 0.22; g.add(head);
    var stem = new T.Mesh(new T.CapsuleGeometry(0.095, 0.62, 8, 24), mBud); stem.position.set(0, -0.2, 0.02); g.add(stem);
    var tip = new T.Mesh(new T.SphereGeometry(0.15, 28, 20), mTip); tip.scale.set(1, 0.9, 0.75); tip.position.set(-side * 0.2, 0.26, 0.12); g.add(tip);
    var cap = new T.Mesh(new T.CylinderGeometry(0.06, 0.06, 0.02, 20), mMetal); cap.position.set(0, -0.6, 0.02); g.add(cap);
    return g;
  }
  var budL = makeBud(-1), budR = makeBud(1); product.add(budL); product.add(budR);

  var battery = new T.Group(); product.add(battery);
  var cell = new T.Mesh(new T.RoundedBoxGeometry(1.45, 0.42, 0.72, 4, 0.1), mMetal); battery.add(cell);
  var band = new T.Mesh(new T.RoundedBoxGeometry(0.5, 0.43, 0.73, 4, 0.1), phys(0x7c88ff, { r: 0.5, cc: 0.2 })); band.position.x = -0.3; battery.add(band);
  var mBand = band.material;

  var pcb = new T.Group(); product.add(pcb);
  pcb.add(slab(1.75, 0.82, 0.28, 0.04, mPcb));
  [[-0.55, 0.12, 0.22, 0.22], [-0.2, -0.18, 0.3, 0.16], [-0.62, -0.2, 0.14, 0.14]].forEach(function (c) {
    var ch = new T.Mesh(new T.BoxGeometry(c[2], 0.05, c[3]), mChip); ch.position.set(c[0], 0.07, c[1]); pcb.add(ch);
  });
  for (var k = 0; k < 4; k++) { var coil = new T.Mesh(new T.TorusGeometry(0.16 + k * 0.045, 0.014, 8, 48), mCopper); coil.rotation.x = Math.PI / 2; coil.position.set(0.42, 0.06, 0); pcb.add(coil); }

  // soft contact shadow
  var sc = document.createElement('canvas'); sc.width = sc.height = 256; var sx = sc.getContext('2d');
  var gr = sx.createRadialGradient(128, 128, 0, 128, 128, 128); gr.addColorStop(0, 'rgba(0,0,0,.55)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); sx.fillStyle = gr; sx.fillRect(0, 0, 256, 256);
  var shadow = new T.Mesh(new T.PlaneGeometry(4.6, 3), new T.MeshBasicMaterial({ map: new T.CanvasTexture(sc), transparent: true, depthWrite: false }));
  shadow.rotation.x = -Math.PI / 2; shadow.position.y = -H / 2 - 0.04; product.add(shadow);

  // labels for the exploded view
  var labelsEl = document.getElementById('labels');
  var LABELS = [
    { t: 'الغطاء', o: lidHold, y: 0.5, side: 1 }, { t: 'السماعتان', o: budL, y: 0.1, side: -1 }, { t: 'الحاضنة', o: tray, y: SEAM, side: 1 },
    { t: 'البطارية', o: battery, y: 0, side: -1 }, { t: 'لوحة الشحن', o: pcb, y: 0, side: 1 }, { t: 'القاعدة', o: body, y: -0.35, side: -1 }
  ];
  LABELS.forEach(function (l, i) {
    l.el = document.createElement('div'); l.el.className = 'lab' + (l.side < 0 ? ' r' : '');
    l.el.innerHTML = '<span>' + l.t + '</span><b>0' + (i + 1) + '</b>'; labelsEl.appendChild(l.el);
  });

  // ---------- range thumbnails (rendered once) ----------
  function thumbs() {
    var sc2 = new T.Scene(); sc2.environment = env;
    var l = new T.DirectionalLight(0xffffff, 1.2); l.position.set(3, 5, 4); sc2.add(l);
    var c2 = new T.PerspectiveCamera(30, 1, 0.1, 50); c2.position.set(3.2, 2.4, 6); c2.lookAt(0, 0, 0);
    var dark = phys(0x23262e, { r: 0.3, cc: 0.9 }), acc = new T.MeshBasicMaterial({ color: 0x7c88ff }), white = phys(0xf1f0ec, { r: 0.3 });
    var models = [];
    var a = new T.Group(); a.add(new T.Mesh(new T.RoundedBoxGeometry(1.5, 2.8, 0.5, 8, 0.22), dark));
    for (var i = 0; i < 4; i++) { var d = new T.Mesh(new T.SphereGeometry(0.045, 12, 8), acc); d.position.set(-0.3 + i * 0.2, 1.0, 0.255); a.add(d); }
    a.rotation.set(0.1, -0.5, 0.25); models.push(a);
    var b = new T.Group(); b.add(new T.Mesh(new T.RoundedBoxGeometry(1.7, 1.7, 1.5, 8, 0.32), white));
    [-0.3, 0.3].forEach(function (x) { var p = new T.Mesh(new T.RoundedBoxGeometry(0.12, 0.34, 0.75, 3, 0.04), mMetal); p.position.set(x, 0, -1.05); b.add(p); });
    var port = new T.Mesh(new T.RoundedBoxGeometry(0.5, 0.16, 0.05, 3, 0.06), mChip); port.position.set(0, 0.25, 0.76); b.add(port);
    var port2 = port.clone(); port2.position.y = -0.2; b.add(port2);
    b.rotation.set(0.15, 0.7, 0); models.push(b);
    var c = new T.Group(); var pts = [];
    for (var j = 0; j <= 120; j++) { var t = j / 120, an = t * Math.PI * 5; pts.push(new T.Vector3(Math.cos(an) * (0.6 + t * 0.55), (t - 0.5) * 0.5, Math.sin(an) * (0.6 + t * 0.55))); }
    c.add(new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(pts), 300, 0.055, 12, false), dark));
    [pts[0], pts[120]].forEach(function (p) { var h = new T.Mesh(new T.RoundedBoxGeometry(0.2, 0.42, 0.14, 3, 0.05), mMetal); h.position.copy(p); h.position.y += 0.2; c.add(h); });
    c.rotation.set(0.75, 0.3, 0); c.scale.setScalar(1.15); models.push(c);
    var e = new T.Group(); e.add(new T.Mesh(new T.CapsuleGeometry(0.85, 1.3, 12, 40), phys(0x2545e6, { r: 0.7, cc: 0.1 })));
    var ringT = new T.Mesh(new T.TorusGeometry(0.86, 0.03, 10, 60), mMetal); ringT.rotation.x = Math.PI / 2; ringT.position.y = 0.65; e.add(ringT);
    var ringB = ringT.clone(); ringB.position.y = -0.65; e.add(ringB);
    e.rotation.set(0, 0, Math.PI / 2 - 0.25); e.scale.setScalar(0.9); models.push(e);
    renderer.setPixelRatio(1); renderer.setSize(640, 640, false);
    models.forEach(function (m, i) {
      sc2.add(m); renderer.render(sc2, c2);
      var im = document.getElementById('t' + i); if (im) im.src = canvas.toDataURL('image/png');
      sc2.remove(m);
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  }
  try { thumbs(); } catch (e) { /* cards keep their text */ }

  // ---------- frame loop ----------
  var portrait = false;
  function resize() {
    var w = window.innerWidth, h = window.innerHeight;
    renderer.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix(); portrait = w / h < 0.9;
  }
  window.addEventListener('resize', resize); resize();

  var ghost = document.getElementById('ghost');
  var GH = { night: 'ليلي', pearl: 'لؤلؤي', cobalt: 'كوبالت' };
  var still = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var mx = 0, my = 0;
  window.addEventListener('pointermove', function (e) { mx = e.clientX / window.innerWidth - 0.5; my = e.clientY / window.innerHeight - 0.5; });
  var cShell = new T.Color(), cInner = new T.Color(), cBud = new T.Color(), cAcc = new T.Color();
  var v = new T.Vector3(), pos = new T.Vector3(), look = new T.Vector3();
  var A = { p: [0, 1.0, 8.2], l: [0, 0.35, 0] }, B = { p: [4.2, 1.2, 13.6], l: [0, -0.25, 0] }, C = { p: [-2.4, 2.0, 6.4], l: [0, 0.95, 0] };

  function frame(now) {
    var t = now / 1000;
    var hero = sec.hero.p, ins = sec.inside.p, sp = sec.specs.p, col = sec.colours.p;
    var closing = s(col / 0.45);
    var open = s(hero * 1.5 - 0.15) * (1 - closing);
    var rise = s(hero * 1.7 - 0.6) * (1 - s(col / 0.35));
    var ex = s(ins / 0.55) * (1 - s(sp / 0.3));
    var focus = s((sp - 0.3) / 0.3) * (1 - s(col / 0.3));

    lidPivot.rotation.x = -open * 1.75 * (1 - ex);
    lidPivot.position.y = SEAM + ex * 2.6;
    tray.position.y = ex * 0.55;
    battery.position.y = -0.33 - ex * 0.55;
    pcb.position.y = -0.62 - ex * 1.15;
    body.position.y = -ex * 2.5;
    shadow.material.opacity = (1 - ex) * (theme === 'pearl' ? 0.5 : 0.9);
    shadow.position.y = -H / 2 - 0.04 - ex * 2.5;
    [budL, budR].forEach(function (b, i) {
      var sd = i ? 1 : -1;
      b.position.set(sd * (0.55 + rise * 0.3 * (1 - ex)), SEAM - 0.02 + rise * 1.55 * (1 - ex) + ex * 1.55, 0.02 + rise * 0.25 * (1 - ex));
      b.rotation.set(rise * 0.25 * (1 - ex), sd * rise * -0.5, sd * rise * -0.22 * (1 - ex));
    });

    var th = THEMES[theme];
    cShell.set(th.shell); cInner.set(th.inner); cBud.set(th.bud);
    cAcc.set(getComputedStyle(root).getPropertyValue('--accent').trim() || '#7c88ff');
    mShell.color.lerp(cShell, 0.08); mLid.color.copy(mShell.color); mInner.color.lerp(cInner, 0.08); mBud.color.lerp(cBud, 0.08);
    mShell.envMapIntensity = lerp(mShell.envMapIntensity, th.e, 0.08); mLid.envMapIntensity = mBud.envMapIntensity = mShell.envMapIntensity;
    mLed.color.lerp(cAcc, 0.1); mBand.color.copy(mLed.color); rim.color.copy(mLed.color);

    var sway = still ? 0 : Math.sin(t * 0.5) * 0.1;
    product.rotation.y = -0.45 + sway + hero * 0.5 + ex * 0.25 - focus * 0.2 + col * Math.PI * 2 + mx * 0.25;
    product.rotation.x = 0.12 + my * 0.12 - ex * 0.05;
    var intro = 1 - s(hero * 2.5);
    product.position.y = -0.25 - intro * 0.8 + (still ? 0 : Math.sin(t * 0.9) * 0.04);

    pos.set(A.p[0], A.p[1], A.p[2]).lerp(v.set(B.p[0], B.p[1], B.p[2]), ex).lerp(v.set(C.p[0], C.p[1], C.p[2]), focus);
    look.set(A.l[0], A.l[1], A.l[2]).lerp(v.set(B.l[0], B.l[1], B.l[2]), ex).lerp(v.set(C.l[0], C.l[1], C.l[2]), focus);
    pos.z += intro * 3.6;
    if (portrait) { pos.x *= 0.5; pos.z *= lerp(1.75, 1.9, focus); look.y += ex * 0.7 - focus * 1.1; }
    cam.position.copy(pos); cam.lookAt(look);

    product.updateMatrixWorld(true);
    pBody.set(v.set(0, -1, 0), SEAM).applyMatrix4(bodyMesh.matrixWorld);
    pLid.set(v.set(0, 1, 0), -SEAM).applyMatrix4(lidMesh.matrixWorld);

    var out = s(sec.range.enter * 1.4);
    canvas.style.opacity = (1 - out).toFixed(3);
    var la = s((ex - 0.7) / 0.25) * (1 - out) * (1 - s((sec.specs.enter - 0.25) / 0.4));
    var w = window.innerWidth, h = window.innerHeight;
    LABELS.forEach(function (l) {
      v.set(0, l.y, 0); l.o.localToWorld(v); v.project(cam);
      var half = portrait ? 0.17 : 0.16;
      l.el.style.left = ((v.x * 0.5 + 0.5 + l.side * half) * w).toFixed(1) + 'px';
      l.el.style.top = ((-v.y * 0.5 + 0.5) * h).toFixed(1) + 'px';
      l.el.style.opacity = la.toFixed(3);
    });

    var gv = s((sec.colours.enter - 0.6) / 0.4) * (1 - out);
    ghost.style.opacity = (gv * 0.09).toFixed(3);
    if (ghost.textContent !== GH[theme]) ghost.textContent = GH[theme];
    if (out < 1) renderer.render(scene, cam);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
