/* WebGL hero: a living "market terrain" of gold particles with a price trace running across it.
   Needs three.js r128 (cdnjs). Falls back silently to the 2D candlestick canvas when WebGL is unavailable. */
(function () {
  "use strict";
  var host = document.querySelector(".hero__webgl");
  if (!host || !window.THREE) return;
  var THREE = window.THREE;

  // Feature-detect WebGL before committing.
  try {
    var test = document.createElement("canvas");
    if (!(test.getContext("webgl") || test.getContext("experimental-webgl"))) return;
  } catch (e) { return; }

  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var renderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
  } catch (e) { return; }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
  renderer.setClearColor(0x000000, 0);
  host.appendChild(renderer.domElement);
  var hero = host.closest(".hero");
  if (hero) hero.classList.add("has-webgl");

  var scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x07080a, 0.045);
  var camera = new THREE.PerspectiveCamera(48, 1, 0.1, 100);
  var camBase = new THREE.Vector3(0, 2.4, 8.6);
  camera.position.copy(camBase);

  /* ---- round soft sprite for points ---- */
  function spriteTexture() {
    var c = document.createElement("canvas"); c.width = c.height = 64;
    var g = c.getContext("2d");
    var grd = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    grd.addColorStop(0, "rgba(255,255,255,1)");
    grd.addColorStop(0.25, "rgba(255,255,255,0.85)");
    grd.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = grd; g.fillRect(0, 0, 64, 64);
    var t = new THREE.CanvasTexture(c);
    return t;
  }
  var sprite = spriteTexture();

  /* ---- particle terrain ---- */
  var small = window.innerWidth < 700;
  var COLS = small ? 90 : 150, ROWS = small ? 46 : 70;
  var W = 26, D = 14;
  var count = COLS * ROWS;
  var pos = new Float32Array(count * 3);
  var col = new Float32Array(count * 3);
  var base = new Float32Array(count * 2);
  var k = 0;
  for (var r = 0; r < ROWS; r++) {
    for (var c2 = 0; c2 < COLS; c2++) {
      var x = (c2 / (COLS - 1) - 0.5) * W;
      var z = (r / (ROWS - 1) - 0.5) * D - 2;
      base[k * 2] = x; base[k * 2 + 1] = z;
      pos[k * 3] = x; pos[k * 3 + 1] = 0; pos[k * 3 + 2] = z;
      k++;
    }
  }
  var geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
  var mat = new THREE.PointsMaterial({
    size: small ? 0.1 : 0.085, map: sprite, vertexColors: true, transparent: true,
    depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true
  });
  var terrain = new THREE.Points(geo, mat);
  scene.add(terrain);

  var gold = new THREE.Color(0xe8b33a), deep = new THREE.Color(0x6b4d10), hot = new THREE.Color(0xfff1c4);
  var tmp = new THREE.Color();

  function heightAt(x, z, t) {
    return Math.sin(x * 0.42 + t * 0.55) * 0.38
      + Math.sin(z * 0.75 - t * 0.4) * 0.28
      + Math.sin((x + z) * 0.23 + t * 0.3) * 0.45
      + Math.cos(x * 0.11 - t * 0.2) * 0.35;
  }

  /* ---- price trace: an upward-drifting line that rides above the terrain ---- */
  var TRACE_N = 220;
  var traceY = new Float32Array(TRACE_N);
  var seed = 11;
  function rnd() { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }
  var v = 0;
  for (var i = 0; i < TRACE_N; i++) { v += (rnd() - 0.47) * 0.16; traceY[i] = v; }
  var tracePos = new Float32Array(TRACE_N * 3);
  var traceGeo = new THREE.BufferGeometry();
  traceGeo.setAttribute("position", new THREE.BufferAttribute(tracePos, 3));
  var trace = new THREE.Line(traceGeo, new THREE.LineBasicMaterial({ color: 0xf3d58a, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending }));
  scene.add(trace);
  var head = new THREE.Sprite(new THREE.SpriteMaterial({ map: sprite, color: 0xfff1c4, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
  head.scale.set(0.55, 0.55, 1);
  scene.add(head);
  var halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: sprite, color: 0xe8b33a, transparent: true, opacity: 0.35, blending: THREE.AdditiveBlending, depthWrite: false }));
  halo.scale.set(1.8, 1.8, 1);
  scene.add(halo);

  function updateTrace(t) {
    var progress = reduce ? 1 : Math.min(1, (t % 14) / 9);   // draw across, hold, restart
    var visible = Math.max(2, Math.floor(TRACE_N * progress));
    var x0 = -W * 0.42, x1 = W * 0.42, zLine = 0.6;
    var lastX = 0, lastY = 0;
    for (var i = 0; i < TRACE_N; i++) {
      var j = Math.min(i, visible - 1);
      var x = x0 + (x1 - x0) * (j / (TRACE_N - 1));
      var trend = (j / (TRACE_N - 1)) * 2.2;                  // upward drift
      var y = 0.15 + trend * 0.75 + traceY[j] * 0.5 + heightAt(x, zLine, t) * 0.25;
      tracePos[i * 3] = x; tracePos[i * 3 + 1] = y; tracePos[i * 3 + 2] = zLine;
      lastX = x; lastY = y;
    }
    traceGeo.attributes.position.needsUpdate = true;
    head.position.set(lastX, lastY, zLine);
    halo.position.copy(head.position);
    var pulse = 1 + Math.sin(t * 4) * 0.12;
    halo.scale.set(1.8 * pulse, 1.8 * pulse, 1);
  }

  function updateTerrain(t) {
    for (var n = 0; n < count; n++) {
      var x = base[n * 2], z = base[n * 2 + 1];
      var y = heightAt(x, z, t) - 1.0;
      pos[n * 3 + 1] = y;
      var h = (y + 2.3) / 2.6;                       // 0..1-ish
      h = h < 0 ? 0 : h > 1 ? 1 : h;
      if (h > 0.82) tmp.copy(gold).lerp(hot, (h - 0.82) / 0.18);
      else tmp.copy(deep).lerp(gold, h / 0.82);
      col[n * 3] = tmp.r; col[n * 3 + 1] = tmp.g; col[n * 3 + 2] = tmp.b;
    }
    geo.attributes.position.needsUpdate = true;
    geo.attributes.color.needsUpdate = true;
  }

  /* ---- sizing ---- */
  function resize() {
    var w = host.clientWidth || 1, h = host.clientHeight || 1;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // Pull back on narrow screens so the terrain still fills the frame.
    camera.fov = w < 700 ? 62 : 48;
    camera.updateProjectionMatrix();
  }
  resize();
  var rt;
  window.addEventListener("resize", function () { clearTimeout(rt); rt = setTimeout(resize, 120); });

  /* ---- pointer parallax ---- */
  var mx = 0, my = 0, tx = 0, ty = 0;
  window.addEventListener("pointermove", function (e) {
    tx = (e.clientX / window.innerWidth - 0.5);
    ty = (e.clientY / window.innerHeight - 0.5);
  }, { passive: true });

  /* ---- loop (paused off-screen / hidden tab) ---- */
  var start = performance.now(), running = true, raf = null;
  function frame(now) {
    var t = (now - start) / 1000;
    mx += (tx - mx) * 0.04; my += (ty - my) * 0.04;
    camera.position.set(camBase.x + mx * 1.6, camBase.y - my * 0.8, camBase.z);
    camera.lookAt(0, 0.9, 0);
    updateTerrain(t);
    updateTrace(t);
    renderer.render(scene, camera);
    if (running && !reduce) raf = requestAnimationFrame(frame); else raf = null;
  }
  function play() { if (!raf && !reduce) raf = requestAnimationFrame(frame); }
  if (reduce) { frame(start + 9000); return; }
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (en) { running = en[0].isIntersecting && !document.hidden; if (running) play(); }).observe(host);
  }
  document.addEventListener("visibilitychange", function () { running = !document.hidden; if (running) play(); });
  play();
})();
