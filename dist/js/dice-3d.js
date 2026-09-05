import { faceIndexForValue, labelForFace, shapeForSides } from "./dice-shapes.js?v=1.3.1";
import { createMotionPaths, motionPosition } from "./dice-motion.js?v=1.3.2";
import { drawRollEffect, labelPalette, materialById, paintFace } from "./dice-materials.js?v=1.4.0";

export function createDiceTray(canvas) {
  const ctx = canvas.getContext("2d", { alpha: true });
  let dice = [];
  let frame = null;
  let running = false;
  let appearance = materialById("amber");
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
    const motionPaths = createMotionPaths(total, rect.width, rect.height, maxSize);
    dice = results.map((result, index) => {
      const resolved = shapeForSides(result.sides);
      const resultFace = faceIndexForValue(resolved.shape, result.sides, result.value);
      return {
        sides: Number(result.sides), shape: resolved.shape, value: result.value, resultFace,
        material: appearance, size: maxSize, trail: [], effects: !motionReduced,
        motion: motionPaths[index],
        startRotation: quaternionFromEuler(Math.random()*6, Math.random()*6, Math.random()*6),
        endRotation: resultRotation(resolved.shape, resultFace, index),
        delay: index * 42, duration: motionReduced ? 40 : 1250 + Math.random() * 420,
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
    dice.forEach((die, index) => drawDie(die, progress(die, now, started), ctx, index, now - started >= die.delay));
  }

  function destroy() {
    cancelAnimationFrame(frame);
    resizeObserver.disconnect();
  }

  function setAppearance(materialId) {
    appearance = materialById(materialId);
    dice.forEach(die => { die.material = appearance; });
    draw(performance.now());
  }

  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(canvas);
  return { roll, resize, destroy, setAppearance, get running() { return running; } };
}

function drawDie(die, t, ctx, index, active) {
  const position = motionPosition(die.motion, t);
  const x = position.x;
  const y = position.y;
  const turns = die.motion.spin * (1 - t);
  const settled = slerp(die.startRotation, die.endRotation, easeOut(t));
  const spin = quaternionFromEuler(turns*.52, turns*.73, turns*.39);
  const rotation = normalizeQuaternion(multiplyQuaternion(spin, settled));
  const points = die.shape.vertices.map(vertex => rotateByQuaternion(vertex, rotation));
  const faces = die.shape.faces.map((face, faceIndex) => {
    const vertices = face.map(i => points[i]);
    const center = average(vertices);
    return { vertices, center, centerZ: center[2], faceIndex };
  }).filter(face => face.centerZ > -.04).sort((a, b) => a.centerZ - b.centerZ);
  const scale = die.size * (.78 + .22 * easeOut(t));
  if (active && t < .99) {
    die.trail.push(position);
    if (die.trail.length > 12) die.trail.shift();
  }
  drawRollEffect(ctx, die.material, die, position, t, performance.now(), active);
  ctx.save();
  ctx.translate(x, y);
  ctx.globalAlpha = die.used ? 1 : .36;
  ctx.shadowColor = "rgba(0,0,0,.35)";
  ctx.shadowBlur = 12;
  ctx.shadowOffsetY = 7;
  faces.forEach(face => {
    const normal = normalize(face.center);
    const light = clamp(.32 + Math.max(0, normal[0]*-.35 + normal[1]*-.55 + normal[2]*.8) * .72, .2, 1);
    const projected = face.vertices.map(point => project(point, scale));
    ctx.beginPath();
    projected.forEach((p, i) => {
      if (i) ctx.lineTo(p[0], p[1]); else ctx.moveTo(p[0], p[1]);
    });
    ctx.closePath();
    paintFace(ctx, die.material, projected, light, die.sides * 100 + face.faceIndex * 17 + index, performance.now());
    ctx.shadowColor = "transparent";
    ctx.strokeStyle = face.faceIndex === die.resultFace && t > .78 ? "rgba(255,213,116,.9)" : "rgba(255,255,255,.32)";
    ctx.lineWidth = face.faceIndex === die.resultFace && t > .78 ? 2 : 1;
    ctx.stroke();
  });
  if (t > .22) faces.forEach(face => drawFaceLabel(ctx, die, face, scale, t));
  ctx.restore();
}

function drawFaceLabel(ctx, die, face, scale, t) {
  const projected = face.vertices.map(point => project(point, scale));
  const center = average(projected);
  const area = polygonArea(projected);
  if (area < 55) return;
  const frontness = clamp((face.centerZ + .15) / 1.2, .12, 1);
  const alpha = clamp((t - .22) / .2, 0, 1) * (die.used ? 1 : .48) * clamp(frontness*1.5, .3, 1);
  const label = labelForFace(die.shape, die.sides, face.faceIndex, die.value, die.resultFace);
  const fontSize = clamp(Math.sqrt(area) * .31, 9, die.size * .34);
  ctx.globalAlpha = alpha;
  ctx.shadowColor = "rgba(0,0,0,.55)";
  ctx.shadowBlur = 3;
  ctx.lineJoin = "round";
  const palette = labelPalette(die.material);
  ctx.strokeStyle = palette.stroke;
  ctx.lineWidth = Math.max(2, fontSize * .15);
  ctx.fillStyle = palette.fill;
  ctx.font = `800 ${fontSize}px ui-monospace, SFMono-Regular, Menlo, monospace`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.strokeText(label, center[0], center[1] + 1);
  ctx.fillText(label, center[0], center[1] + 1);
  ctx.shadowBlur = 0;
}

function project([x,y,z], scale) {
  const perspective = 3.8 / (4.8 - z);
  return [x * scale * perspective, y * scale * perspective];
}

function resultRotation(shape, faceIndex, index) {
  const face = shape.faces[faceIndex];
  const direction = normalize(average(face.map(vertexIndex => shape.vertices[vertexIndex])));
  const target = normalize([index % 2 ? .1 : -.1, -.13, 1]);
  const align = quaternionFromTo(direction, target);
  const twist = quaternionFromAxisAngle(target, ((index * 1.71) % 1 - .5) * .7);
  return normalizeQuaternion(multiplyQuaternion(twist, align));
}

function quaternionFromTo(from, to) {
  let w = 1 + dot(from, to);
  let xyz;
  if (w < .000001) {
    xyz = Math.abs(from[0]) > Math.abs(from[2]) ? [-from[1], from[0], 0] : [0, -from[2], from[1]];
    w = 0;
  } else xyz = cross(from, to);
  return normalizeQuaternion([...xyz, w]);
}

function quaternionFromAxisAngle(axis, angle) {
  const half = angle / 2;
  const sine = Math.sin(half);
  return [axis[0]*sine, axis[1]*sine, axis[2]*sine, Math.cos(half)];
}

function quaternionFromEuler(x,y,z) {
  const cx=Math.cos(x/2), sx=Math.sin(x/2), cy=Math.cos(y/2), sy=Math.sin(y/2), cz=Math.cos(z/2), sz=Math.sin(z/2);
  return [sx*cy*cz-cx*sy*sz, cx*sy*cz+sx*cy*sz, cx*cy*sz-sx*sy*cz, cx*cy*cz+sx*sy*sz];
}

function multiplyQuaternion(a,b) {
  return [
    a[3]*b[0]+a[0]*b[3]+a[1]*b[2]-a[2]*b[1],
    a[3]*b[1]-a[0]*b[2]+a[1]*b[3]+a[2]*b[0],
    a[3]*b[2]+a[0]*b[1]-a[1]*b[0]+a[2]*b[3],
    a[3]*b[3]-a[0]*b[0]-a[1]*b[1]-a[2]*b[2]
  ];
}

function rotateByQuaternion(vector, quaternion) {
  const qVector = [quaternion[0], quaternion[1], quaternion[2]];
  const uv = cross(qVector, vector);
  const uuv = cross(qVector, uv);
  return vector.map((value,index) => value + 2*(quaternion[3]*uv[index] + uuv[index]));
}

function slerp(a,b,t) {
  let target = b;
  let cosine = dot(a,b);
  if (cosine < 0) { cosine = -cosine; target = b.map(value => -value); }
  if (cosine > .9995) return normalizeQuaternion(a.map((value,index) => value + t*(target[index]-value)));
  const theta = Math.acos(clamp(cosine,-1,1));
  const sine = Math.sin(theta);
  const first = Math.sin((1-t)*theta)/sine;
  const second = Math.sin(t*theta)/sine;
  return a.map((value,index) => value*first + target[index]*second);
}

function normalizeQuaternion(quaternion) {
  const length = Math.hypot(...quaternion) || 1;
  return quaternion.map(value => value / length);
}

function easeOut(t) { return 1 - Math.pow(1 - clamp(t, 0, 1), 3); }
function progress(die, now, started) { return clamp((now - started - die.delay) / die.duration, 0, 1); }
function mix(a,b,t) { return a + (b-a)*t; }
function clamp(value,min,max) { return Math.max(min,Math.min(max,value)); }
function average(points) { return points[0].map((_,axis) => points.reduce((sum,point) => sum+point[axis],0)/points.length); }
function dot(a,b) { return a.reduce((sum,value,index) => sum+value*b[index],0); }
function cross(a,b) { return [a[1]*b[2]-a[2]*b[1], a[2]*b[0]-a[0]*b[2], a[0]*b[1]-a[1]*b[0]]; }
function normalize(vector) { const length=Math.hypot(...vector)||1; return vector.map(value => value/length); }
function polygonArea(points) { return Math.abs(points.reduce((sum,point,index) => { const next=points[(index+1)%points.length]; return sum+point[0]*next[1]-next[0]*point[1]; },0))/2; }

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
