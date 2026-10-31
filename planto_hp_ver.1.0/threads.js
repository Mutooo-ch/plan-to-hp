/*
 * Hero background: flowing threads (vanilla WebGL2 port of React Bits "Threads").
 * Usage: <canvas class="hero-threads" data-color="#4D7BFF" data-accent="#FE9200"></canvas>
 */
(function () {
  var canvas = document.querySelector('.hero-threads');
  if (!canvas) return;
  var gl = canvas.getContext('webgl2', { alpha: true, premultipliedAlpha: true, antialias: true });
  if (!gl) { canvas.remove(); return; }

  var S = {
    amplitude: 1.7, distance: 0.4, lineCount: 70, thickness: 0.6, softness: 1.3,
    speed: 0.5, waves: 1.05, split: 0.04, fray: 0.5, angle: 18, taper: 0.85
  };

  var VERT = '#version 300 es\n' +
    'precision highp float;\n' +
    'in vec2 aPoint;\n' +
    'uniform float uTime, uAmplitude, uDistance, uCount, uThickness, uSoftness, uWaves, uSplit, uFray, uTaper;\n' +
    'uniform vec2 uResolution, uFrame, uMouse, uTurn;\n' +
    'out float vEdge, vBand, vDraw, vAlpha, vIndex;\n' +
    'float Perlin2D(vec2 P){vec2 Pi=floor(P);vec4 Pf=P.xyxy-vec4(Pi,Pi+1.0);vec4 Pt=vec4(Pi.xy,Pi.xy+1.0);' +
    'Pt=Pt-floor(Pt*(1.0/71.0))*71.0;Pt+=vec2(26.0,161.0).xyxy;Pt*=Pt;Pt=Pt.xzxz*Pt.yyww;' +
    'vec4 hx=fract(Pt*(1.0/951.135664))-0.49999;vec4 hy=fract(Pt*(1.0/642.949883))-0.49999;' +
    'vec4 g=inversesqrt(hx*hx+hy*hy)*(hx*Pf.xzxz+hy*Pf.yyww)*1.4142135623730950;' +
    'vec2 b=Pf.xy*Pf.xy*Pf.xy*(Pf.xy*(Pf.xy*6.0-15.0)+10.0);vec4 b2=vec4(b,vec2(1.0-b));' +
    'return dot(g,b2.zxzx*b2.wwyy);}\n' +
    'void main(){\n' +
    ' float perc=float(gl_InstanceID)/uCount; float x=aPoint.x;\n' +
    ' float pixel=1.0/max(uResolution.x,uResolution.y);\n' +
    ' float sp=uSplit+perc*uFray;\n' +
    ' float amp=smoothstep(sp,max(0.7,sp+0.2),x)*0.5*uAmplitude*(1.0+(uMouse.y-0.5)*0.2);\n' +
    ' float t=uTime/10.0+(uMouse.x-0.5);\n' +
    ' float blur=smoothstep(sp,sp+0.05,x)*perc;\n' +
    ' float n=mix(Perlin2D(vec2(t*2.5,(x*uWaves+perc)*2.5)),Perlin2D(vec2(t*3.5,(x*uWaves+t)*3.5))/1.5,x*0.3);\n' +
    ' float y=0.5+(perc-0.5)*uDistance+n/2.0*amp;\n' +
    ' vec2 local=vec2((x-0.5)*uFrame.x,(y-0.5)*uFrame.y);\n' +
    ' float width=7.0*uThickness*pixel*(1.0-perc);\n' +
    ' float band=(width/2.0+10.0*uSoftness*pixel*blur)*uFrame.y;\n' +
    ' float draw=max(band,1.0);\n' +
    ' local.y+=aPoint.y*draw;\n' +
    ' vec2 r=vec2(local.x*uTurn.x-local.y*uTurn.y,local.x*uTurn.y+local.y*uTurn.x);\n' +
    ' gl_Position=vec4(r/(uResolution*0.5),0.0,1.0);\n' +
    ' vEdge=aPoint.y*draw; vBand=band; vDraw=draw;\n' +
    ' vAlpha=1.0-smoothstep(0.0,1.0,pow(perc,0.3))*uTaper; vIndex=perc;\n' +
    '}';

  var FRAG = '#version 300 es\n' +
    'precision highp float;\n' +
    'in float vEdge, vBand, vDraw, vAlpha, vIndex;\n' +
    'uniform vec3 uColor, uAccent;\n' +
    'out vec4 outColor;\n' +
    'void main(){\n' +
    ' float c=(1.0-smoothstep(0.0,vDraw,abs(vEdge)))*(vBand/vDraw)*vAlpha;\n' +
    ' c=clamp(c*1.6,0.0,1.0);\n' +
    ' outColor=vec4(mix(uColor,uAccent,vIndex)*c,c);\n' +
    '}';

  function compile(type, src) {
    var s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : null;
  }
  var vs = compile(gl.VERTEX_SHADER, VERT), fs = compile(gl.FRAGMENT_SHADER, FRAG);
  if (!vs || !fs) { canvas.remove(); return; }
  var prog = gl.createProgram();
  gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) { canvas.remove(); return; }

  var U = {};
  ['uTime', 'uAmplitude', 'uDistance', 'uCount', 'uThickness', 'uSoftness', 'uWaves', 'uSplit', 'uFray',
    'uTaper', 'uResolution', 'uFrame', 'uMouse', 'uTurn', 'uColor', 'uAccent'].forEach(function (n) {
    U[n] = gl.getUniformLocation(prog, n);
  });

  function hex(h) {
    h = h.replace('#', '');
    return [0, 2, 4].map(function (i) { return parseInt(h.substr(i, 2), 16) / 255; });
  }
  var color = hex(canvas.dataset.color || '#4D7BFF');
  var accent = hex(canvas.dataset.accent || '#FE9200');

  var vao = gl.createVertexArray();
  var buf = gl.createBuffer();
  gl.bindVertexArray(vao);
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  var loc = gl.getAttribLocation(prog, 'aPoint');
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  gl.bindVertexArray(null);

  var segments = 0;
  function buildStrip(n) {
    if (n === segments) return;
    segments = n;
    var p = new Float32Array((n + 1) * 4);
    for (var i = 0; i <= n; i++) { var u = i / n; p.set([u, -1, u, 1], i * 4); }
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, p, gl.STATIC_DRAW);
  }

  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var time = 3, last = 0, raf = 0, visible = true;
  var mouse = [0.5, 0.5], target = [0.5, 0.5];

  function resize() {
    var w = Math.max(1, canvas.clientWidth), h = Math.max(1, canvas.clientHeight);
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    if (Math.max(w, h) * dpr > 1920) dpr = 1920 / Math.max(w, h);
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    buildStrip(Math.min(640, Math.max(96, Math.round(w / 3))));
    render();
  }

  function render() {
    var w = canvas.width, h = canvas.height;
    var rad = S.angle * Math.PI / 180, cos = Math.cos(rad), sin = Math.sin(rad);
    gl.viewport(0, 0, w, h);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.useProgram(prog);
    gl.uniform1f(U.uTime, time);
    gl.uniform2f(U.uResolution, w, h);
    gl.uniform2f(U.uFrame, Math.abs(w * cos) + Math.abs(h * sin), Math.abs(w * sin) + Math.abs(h * cos));
    gl.uniform2f(U.uMouse, mouse[0], mouse[1]);
    gl.uniform2f(U.uTurn, cos, sin);
    gl.uniform1f(U.uAmplitude, S.amplitude);
    gl.uniform1f(U.uDistance, S.distance);
    gl.uniform1f(U.uCount, S.lineCount);
    gl.uniform1f(U.uThickness, S.thickness);
    gl.uniform1f(U.uSoftness, S.softness);
    gl.uniform1f(U.uWaves, S.waves);
    gl.uniform1f(U.uSplit, S.split);
    gl.uniform1f(U.uFray, S.fray);
    gl.uniform1f(U.uTaper, S.taper);
    gl.uniform3fv(U.uColor, color);
    gl.uniform3fv(U.uAccent, accent);
    gl.bindVertexArray(vao);
    gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, (segments + 1) * 2, S.lineCount);
    gl.bindVertexArray(null);
  }

  function frame(now) {
    raf = 0;
    if (!visible || document.hidden) return;
    var dt = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60;
    last = now;
    time += dt * S.speed;
    var f = 1 - Math.exp(-dt * 3);
    mouse[0] += (target[0] - mouse[0]) * f;
    mouse[1] += (target[1] - mouse[1]) * f;
    render();
    raf = requestAnimationFrame(frame);
  }
  function wake() {
    if (!reduce && !raf && visible && !document.hidden) { last = 0; raf = requestAnimationFrame(frame); }
  }

  new ResizeObserver(resize).observe(canvas);
  new IntersectionObserver(function (e) { visible = e[0].isIntersecting; wake(); }).observe(canvas);
  document.addEventListener('visibilitychange', wake);
  window.addEventListener('pointermove', function (e) {
    var r = canvas.getBoundingClientRect();
    var x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
    target = (x >= 0 && x <= 1 && y >= 0 && y <= 1) ? [x, 1 - y] : [0.5, 0.5];
  }, { passive: true });
  resize();
  wake();
})();
