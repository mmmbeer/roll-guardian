const PHI = (1 + Math.sqrt(5)) / 2;

const SHAPES = {
  4: {
    vertices: [[1,1,1],[-1,-1,1],[-1,1,-1],[1,-1,-1]],
    faces: [[0,1,2],[0,3,1],[0,2,3],[1,3,2]]
  },
  6: {
    vertices: [[-1,-1,-1],[1,-1,-1],[1,1,-1],[-1,1,-1],[-1,-1,1],[1,-1,1],[1,1,1],[-1,1,1]],
    faces: [[0,3,2,1],[4,5,6,7],[0,1,5,4],[3,7,6,2],[1,2,6,5],[0,4,7,3]]
  },
  8: {
    vertices: [[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]],
    faces: [[0,2,4],[2,1,4],[1,3,4],[3,0,4],[2,0,5],[1,2,5],[3,1,5],[0,3,5]]
  },
  10: makeBipyramid(5),
  12: makeIcosahedron(),
  20: makeIcosahedron(),
  100: makeBipyramid(5)
};

export function createDiceTray(canvas) {
  const ctx = canvas.getContext("2d", { alpha: true });
  let dice = [];
  let frame = null;
  let running = false;
  const motionReduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

  function resize() {
    const rect = canvas.getBoundingClientRect();
    const ratio = Math.min(2, devicePixelRatio || 1);
    canvas.width = Math.max(1, Math.round(rect.width * ratio));
    canvas.height = Math.max(1, Math.round(rect.height * ratio));
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    draw(performance.now());
  }

  function roll(results, options = {}) {
    cancelAnimationFrame(frame);
    const rect = canvas.getBoundingClientRect();
    const total = results.length;
    const maxSize = total <= 2 ? 72 : total <= 5 ? 56 : 44;
    dice = results.map((result, index) => {
      const grid = layout(index, total, rect.width, rect.height);
      return {
        sides: supportedSides(result.sides), value: result.value,
        color: colorFor(result.sides, index), size: maxSize,
        startX: rect.width * (.18 + Math.random() * .64), startY: -70 - Math.random() * 80,
        x: grid.x, y: grid.y,
        startRot: [Math.random()*6, Math.random()*6, Math.random()*6],
        endRot: [Math.random()*3+.3, Math.random()*3+.4, Math.random()*3+.2],
        delay: index * 48, duration: motionReduced ? 40 : 850 + Math.random() * 330,
        sign: result.sign || 1, used: options.usedResults?.includes(result) ?? true
      };
    });
    running = true;
    const started = performance.now();
    const animate = now => {
      draw(now, started);
      const done = dice.every(die => now - started >= die.delay + die.duration);
      if (!done) frame = requestAnimationFrame(animate);
      else {
        running = false;
        draw(now, started);
        options.onDone?.();
      }
    };
    frame = requestAnimationFrame(animate);
    return Math.max(...dice.map(d => d.delay + d.duration), 0);
  }

  function draw(now = performance.now(), started = now - 9999) {
    const rect = canvas.getBoundingClientRect();
    ctx.clearRect(0, 0, rect.width, rect.height);
    dice.forEach((die, index) => drawDie(die, progress(die, now, started), ctx, index));
  }

  function destroy() {
    cancelAnimationFrame(frame);
    resizeObserver.disconnect();
  }

  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(canvas);
  return { roll, resize, destroy, get running() { return running; } };
}

function drawDie(die, t, ctx, index) {
  const bounce = Math.abs(Math.sin(t * Math.PI * 3.1)) * (1 - t) * 45;
  const x = mix(die.startX, die.x, easeOut(t));
  const y = mix(die.startY, die.y, easeOut(t)) - bounce;
  const turns = 9 * (1 - t);
  const rotation = die.startRot.map((value, i) => mix(value + turns * (i + 1) * .45, die.endRot[i], easeOut(t)));
  const shape = SHAPES[die.sides] || SHAPES[20];
  const points = shape.vertices.map(vertex => rotate(vertex, rotation));
  const faces = shape.faces.map(face => {
    const vertices = face.map(i => points[i]);
    const centerZ = vertices.reduce((sum, vertex) => sum + vertex[2], 0) / vertices.length;
    return { vertices, centerZ };
  }).sort((a, b) => a.centerZ - b.centerZ);
  const scale = die.size * (.78 + .22 * easeOut(t));
  ctx.save();
  ctx.translate(x, y);
  ctx.globalAlpha = die.used ? 1 : .36;
  ctx.shadowColor = "rgba(0,0,0,.35)";
  ctx.shadowBlur = 12;
  ctx.shadowOffsetY = 7;
  faces.forEach((face, faceIndex) => {
    const normal = faceNormal(face.vertices);
    const light = clamp(.34 + Math.max(0, normal[0]*-.35 + normal[1]*-.55 + normal[2]*.8) * .7, .22, 1);
    ctx.beginPath();
    face.vertices.forEach((point, i) => {
      const p = project(point, scale);
      if (i) ctx.lineTo(p[0], p[1]); else ctx.moveTo(p[0], p[1]);
    });
    ctx.closePath();
    ctx.fillStyle = shade(die.color, light + faceIndex * .006);
    ctx.fill();
    ctx.shadowColor = "transparent";
    ctx.strokeStyle = "rgba(255,255,255,.28)";
    ctx.lineWidth = 1;
    ctx.stroke();
  });
  if (t > .72) drawValue(ctx, die, t, index);
  ctx.restore();
}

function drawValue(ctx, die, t) {
  const alpha = clamp((t - .72) / .18, 0, 1);
  const label = die.sides === 100 && die.value !== 100 ? String(die.value).padStart(2, "0") : String(die.value);
  ctx.globalAlpha = alpha * (die.used ? 1 : .55);
  ctx.shadowColor = "rgba(0,0,0,.7)";
  ctx.shadowBlur = 8;
  ctx.fillStyle = "rgba(8,13,19,.78)";
  ctx.beginPath();
  ctx.arc(0, 0, Math.max(18, die.size * .34), 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fillStyle = "#fff7e6";
  ctx.font = `800 ${Math.max(16, die.size * .34)}px ui-monospace, monospace`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(label, 0, 1);
}

function layout(index, total, width, height) {
  const cols = total <= 2 ? total : Math.min(4, Math.ceil(Math.sqrt(total)));
  const rows = Math.ceil(total / cols);
  const col = index % cols;
  const row = Math.floor(index / cols);
  const usableWidth = Math.min(width - 60, cols * 110);
  const usableHeight = Math.min(height - 80, rows * 104);
  return {
    x: width / 2 - usableWidth / 2 + usableWidth * (col + .5) / cols,
    y: height / 2 - usableHeight / 2 + usableHeight * (row + .5) / rows + 8
  };
}

function makeBipyramid(half) {
  const vertices = [[0,-1.2,0],[0,1.2,0]];
  for (let i = 0; i < half * 2; i += 1) {
    const angle = i * Math.PI / half;
    vertices.push([Math.cos(angle), 0, Math.sin(angle)]);
  }
  const faces = [];
  for (let i = 0; i < half * 2; i += 1) {
    const next = 2 + ((i + 1) % (half * 2));
    faces.push([0, 2 + i, next], [1, next, 2 + i]);
  }
  return { vertices, faces };
}

function makeIcosahedron() {
  const vertices = [
    [-1,PHI,0],[1,PHI,0],[-1,-PHI,0],[1,-PHI,0],
    [0,-1,PHI],[0,1,PHI],[0,-1,-PHI],[0,1,-PHI],
    [PHI,0,-1],[PHI,0,1],[-PHI,0,-1],[-PHI,0,1]
  ];
  const faces = [
    [0,11,5],[0,5,1],[0,1,7],[0,7,10],[0,10,11],
    [1,5,9],[5,11,4],[11,10,2],[10,7,6],[7,1,8],
    [3,9,4],[3,4,2],[3,2,6],[3,6,8],[3,8,9],
    [4,9,5],[2,4,11],[6,2,10],[8,6,7],[9,8,1]
  ];
  return { vertices, faces };
}

function rotate([x,y,z], [rx,ry,rz]) {
  let ny = y*Math.cos(rx)-z*Math.sin(rx), nz = y*Math.sin(rx)+z*Math.cos(rx); y=ny; z=nz;
  let nx = x*Math.cos(ry)+z*Math.sin(ry); nz = -x*Math.sin(ry)+z*Math.cos(ry); x=nx; z=nz;
  nx = x*Math.cos(rz)-y*Math.sin(rz); ny = x*Math.sin(rz)+y*Math.cos(rz);
  return [nx,ny,z];
}

function project([x,y,z], scale) {
  const perspective = 3.8 / (4.8 - z);
  return [x * scale * perspective, y * scale * perspective];
}

function faceNormal(vertices) {
  const a = vertices[0], b = vertices[1], c = vertices[2];
  const u = [b[0]-a[0], b[1]-a[1], b[2]-a[2]];
  const v = [c[0]-a[0], c[1]-a[1], c[2]-a[2]];
  const n = [u[1]*v[2]-u[2]*v[1], u[2]*v[0]-u[0]*v[2], u[0]*v[1]-u[1]*v[0]];
  const length = Math.hypot(...n) || 1;
  return n.map(value => value / length);
}

function colorFor(sides, index) {
  const colors = ["#dba046", "#4ca8ba", "#b66464", "#718fcb", "#9b73bd", "#65a77e"];
  return colors[(index + sides) % colors.length];
}

function shade(hex, amount) {
  const value = parseInt(hex.slice(1), 16);
  const channels = [value >> 16, value >> 8 & 255, value & 255].map(c => Math.round(clamp(c * amount, 0, 255)));
  return `rgb(${channels.join(",")})`;
}

function supportedSides(sides) {
  const n = Number(sides);
  return SHAPES[n] ? n : n <= 4 ? 4 : n <= 6 ? 6 : n <= 8 ? 8 : n <= 10 ? 10 : n <= 12 ? 12 : 20;
}

function easeOut(t) { return 1 - Math.pow(1 - clamp(t, 0, 1), 3); }
function progress(die, now, started) { return clamp((now - started - die.delay) / die.duration, 0, 1); }
function mix(a,b,t) { return a + (b-a)*t; }
function clamp(value,min,max) { return Math.max(min,Math.min(max,value)); }

export function playDiceSound(enabled = true) {
  if (!enabled || !globalThis.AudioContext && !globalThis.webkitAudioContext) return;
  const Audio = globalThis.AudioContext || globalThis.webkitAudioContext;
  const audio = new Audio();
  const now = audio.currentTime;
  [0,.08,.17,.29].forEach((delay, index) => {
    const osc = audio.createOscillator();
    const gain = audio.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(115 + index * 42, now + delay);
    gain.gain.setValueAtTime(.0001, now + delay);
    gain.gain.exponentialRampToValueAtTime(.035, now + delay + .006);
    gain.gain.exponentialRampToValueAtTime(.0001, now + delay + .055);
    osc.connect(gain).connect(audio.destination);
    osc.start(now + delay);
    osc.stop(now + delay + .065);
  });
  setTimeout(() => audio.close(), 600);
}
