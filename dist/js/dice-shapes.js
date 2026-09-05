const PHI = (1 + Math.sqrt(5)) / 2;

const TETRAHEDRON = makeShape(
  [[1,1,1],[-1,-1,1],[-1,1,-1],[1,-1,-1]],
  [[0,1,2],[0,3,1],[0,2,3],[1,3,2]]
);

const CUBE = makeShape(
  [[-1,-1,-1],[1,-1,-1],[1,1,-1],[-1,1,-1],[-1,-1,1],[1,-1,1],[1,1,1],[-1,1,1]],
  [[0,3,2,1],[4,5,6,7],[0,1,5,4],[3,7,6,2],[1,2,6,5],[0,4,7,3]]
);

const OCTAHEDRON = makeShape(
  [[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]],
  [[0,2,4],[2,1,4],[1,3,4],[3,0,4],[2,0,5],[1,2,5],[3,1,5],[0,3,5]]
);

const ICOSAHEDRON = makeShape(
  [
    [-1,PHI,0],[1,PHI,0],[-1,-PHI,0],[1,-PHI,0],
    [0,-1,PHI],[0,1,PHI],[0,-1,-PHI],[0,1,-PHI],
    [PHI,0,-1],[PHI,0,1],[-PHI,0,-1],[-PHI,0,1]
  ],
  [
    [0,11,5],[0,5,1],[0,1,7],[0,7,10],[0,10,11],
    [1,5,9],[5,11,4],[11,10,2],[10,7,6],[7,1,8],
    [3,9,4],[3,4,2],[3,2,6],[3,6,8],[3,8,9],
    [4,9,5],[2,4,11],[6,2,10],[8,6,7],[9,8,1]
  ]
);

const D10 = dualShape(makePentagonalAntiprism());
const D12 = dualShape(ICOSAHEDRON);

export const DICE_SHAPES = Object.freeze({
  4: withValues(TETRAHEDRON, 4),
  6: withValues(CUBE, 6),
  8: withValues(OCTAHEDRON, 8),
  10: withValues(D10, 10),
  12: withValues(D12, 12),
  20: withValues(ICOSAHEDRON, 20),
  100: withValues(D10, 10)
});

export function shapeForSides(sides) {
  const n = Number(sides);
  const supported = DICE_SHAPES[n] ? n : n <= 4 ? 4 : n <= 6 ? 6 : n <= 8 ? 8 : n <= 10 ? 10 : n <= 12 ? 12 : 20;
  return { sides: supported, shape: DICE_SHAPES[supported] };
}

export function faceIndexForValue(shape, sides, value) {
  if (Number(sides) === 100) return Math.abs(Number(value || 1) - 1) % shape.faces.length;
  const index = shape.values.indexOf(Number(value));
  return index >= 0 ? index : 0;
}

export function labelForFace(shape, sides, faceIndex, resultValue, resultFaceIndex) {
  if (Number(sides) !== 100) return String(shape.values[faceIndex]);
  if (faceIndex === resultFaceIndex) return String(resultValue).padStart(2, "0");
  return String((shape.values[faceIndex] % 10) * 10).padStart(2, "0");
}

function makeShape(vertices, faces) {
  const radius = Math.max(...vertices.map(point => Math.hypot(...point))) || 1;
  return { vertices: vertices.map(point => point.map(value => value * 1.12 / radius)), faces };
}

function makePentagonalAntiprism() {
  const vertices = [];
  for (let i = 0; i < 5; i += 1) vertices.push([Math.cos(i*Math.PI*2/5), Math.sin(i*Math.PI*2/5), .5]);
  for (let i = 0; i < 5; i += 1) vertices.push([Math.cos((i+.5)*Math.PI*2/5), Math.sin((i+.5)*Math.PI*2/5), -.5]);
  const faces = [[0,1,2,3,4],[9,8,7,6,5]];
  for (let i = 0; i < 5; i += 1) {
    const next = (i + 1) % 5;
    const previousBottom = 5 + ((i + 4) % 5);
    faces.push([i, 5+i, next], [i, previousBottom, 5+i]);
  }
  return makeShape(vertices, faces);
}

function dualShape(source) {
  const vertices = source.faces.map(face => {
    const points = face.map(index => source.vertices[index]);
    const center = average(points);
    let normal = normalize(cross(subtract(points[1], points[0]), subtract(points[2], points[0])));
    if (dot(normal, center) < 0) normal = normal.map(value => -value);
    const distance = Math.max(.001, dot(normal, points[0]));
    return normal.map(value => value / distance);
  });
  const faces = source.vertices.map((vertex, vertexIndex) => {
    const adjacent = source.faces.map((face, index) => face.includes(vertexIndex) ? index : -1).filter(index => index >= 0);
    return sortAroundAxis(adjacent, vertices, normalize(vertex));
  });
  return makeShape(vertices, faces);
}

function withValues(shape, sides) {
  const values = Array(shape.faces.length);
  const centers = shape.faces.map(face => normalize(average(face.map(index => shape.vertices[index]))));
  const unassigned = new Set(shape.faces.map((_, index) => index));
  let low = 1;
  while (unassigned.size) {
    const first = unassigned.values().next().value;
    unassigned.delete(first);
    let opposite = first;
    let lowestDot = Infinity;
    unassigned.forEach(index => {
      const similarity = dot(centers[first], centers[index]);
      if (similarity < lowestDot) { lowestDot = similarity; opposite = index; }
    });
    values[first] = low;
    if (opposite !== first) { values[opposite] = sides + 1 - low; unassigned.delete(opposite); }
    low += 1;
  }
  return Object.freeze({ vertices: shape.vertices, faces: shape.faces, values: Object.freeze(values) });
}

function sortAroundAxis(indices, points, axis) {
  const helper = Math.abs(axis[2]) < .9 ? [0,0,1] : [0,1,0];
  const tangent = normalize(cross(axis, helper));
  const bitangent = cross(axis, tangent);
  return indices.sort((a,b) => angle(points[a]) - angle(points[b]));
  function angle(point) { return Math.atan2(dot(point, bitangent), dot(point, tangent)); }
}

function average(points) {
  return points[0].map((_, axis) => points.reduce((sum, point) => sum + point[axis], 0) / points.length);
}

function subtract(a,b) { return a.map((value,index) => value - b[index]); }
function dot(a,b) { return a.reduce((sum,value,index) => sum + value*b[index], 0); }
function cross(a,b) { return [a[1]*b[2]-a[2]*b[1], a[2]*b[0]-a[0]*b[2], a[0]*b[1]-a[1]*b[0]]; }
function normalize(vector) {
  const length = Math.hypot(...vector) || 1;
  return vector.map(value => value / length);
}
