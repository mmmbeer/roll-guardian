const LANDING_MARGIN = .08;

export function createMotionPaths(total, width, height, size, random = Math.random) {
  const bounds = frameBounds(width, height, size);
  const offset = 1 + Math.floor(random() * 29);
  return Array.from({ length: total }, (_, index) => {
    const landing = landingPoint(index + offset, bounds, width, height, random);
    return createPath(index, landing, bounds, size, random);
  });
}

export function motionPosition(path, progress) {
  const t = clamp(progress, 0, 1);
  const points = path.points;
  let segment = points.length - 2;
  for (let index = 0; index < points.length - 1; index += 1) {
    if (t <= points[index + 1].t) { segment = index; break; }
  }
  const from = points[segment];
  const to = points[segment + 1];
  const span = Math.max(.001, to.t - from.t);
  const local = clamp((t - from.t) / span, 0, 1);
  const travel = segment === points.length - 2 ? easeOut(local) : local;
  const arc = Math.sin(local * Math.PI) * path.arc * (segment === points.length - 2 ? .7 : 1);
  return { x: mix(from.x, to.x, travel), y: mix(from.y, to.y, travel) - arc };
}

export function frameBounds(width, height, size) {
  const horizontal = Math.min(size * 1.22 + 8, width * .24);
  const vertical = Math.min(size * 1.22 + 8, height * .24);
  const left = horizontal;
  const right = Math.max(left, width - horizontal);
  const top = vertical;
  const bottom = Math.max(top, height - vertical);
  const safeTop = Math.max(top, Math.min(138, height * .28));
  const safeBottom = Math.max(safeTop, Math.min(bottom, height - Math.max(112, size * 1.5)));
  return { left, right, top, bottom, safeTop, safeBottom };
}

function createPath(index, landing, bounds, size, random) {
  const entryEdge = Math.floor(random() * 4);
  const collisionCount = random() < .58 ? 2 : 3;
  const collisionEdges = [];
  let edge = entryEdge;
  for (let bounce = 0; bounce < collisionCount; bounce += 1) {
    edge = nextEdge(edge, random);
    collisionEdges.push(edge);
  }
  const start = outsidePoint(entryEdge, bounds, size, random);
  const collisions = collisionEdges.map(hit => edgePoint(hit, bounds, random));
  const times = collisionCount === 2 ? [0, .29, .58, 1] : [0, .22, .43, .66, 1];
  const points = [start, ...collisions, landing].map((point, pointIndex) => ({ ...point, t: times[pointIndex] }));
  return {
    points, collisionEdges, landing, bounds,
    arc: Math.min(34, Math.max(10, size * (.24 + random() * .2))),
    spin: 9 + index % 4 + random() * 3
  };
}

function landingPoint(slot, bounds, width, height, random) {
  const xRatio = LANDING_MARGIN + halton(slot, 2) * (1 - LANDING_MARGIN * 2);
  const yRatio = LANDING_MARGIN + halton(slot, 3) * (1 - LANDING_MARGIN * 2);
  let x = mix(bounds.left, bounds.right, xRatio);
  let y = mix(bounds.safeTop, bounds.safeBottom, yRatio);
  const jitter = Math.min(14, (bounds.right - bounds.left) * .025);
  x += (random() - .5) * jitter;
  y += (random() - .5) * jitter;
  if (x > width * .67 && y > height * .62) y = Math.min(y, height * .58);
  return { x: clamp(x, bounds.left, bounds.right), y: clamp(y, bounds.safeTop, bounds.safeBottom) };
}

function outsidePoint(edge, bounds, size, random) {
  const point = edgePoint(edge, bounds, random);
  const outside = size * 1.65;
  if (edge === 0) point.y = bounds.top - outside;
  if (edge === 1) point.x = bounds.right + outside;
  if (edge === 2) point.y = bounds.bottom + outside;
  if (edge === 3) point.x = bounds.left - outside;
  return point;
}

function edgePoint(edge, bounds, random) {
  const along = .08 + random() * .84;
  if (edge === 0) return { x: mix(bounds.left, bounds.right, along), y: bounds.top };
  if (edge === 1) return { x: bounds.right, y: mix(bounds.top, bounds.bottom, along) };
  if (edge === 2) return { x: mix(bounds.left, bounds.right, along), y: bounds.bottom };
  return { x: bounds.left, y: mix(bounds.top, bounds.bottom, along) };
}

function nextEdge(previous, random) {
  const step = 1 + Math.floor(random() * 3);
  return (previous + step) % 4;
}

function halton(index, base) {
  let fraction = 1;
  let result = 0;
  let value = index;
  while (value > 0) {
    fraction /= base;
    result += fraction * (value % base);
    value = Math.floor(value / base);
  }
  return result;
}

function easeOut(t) { return 1 - Math.pow(1 - t, 3); }
function mix(a,b,t) { return a + (b-a)*t; }
function clamp(value,min,max) { return Math.max(min,Math.min(max,value)); }
