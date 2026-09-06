import { build } from "esbuild";
import { chmod, copyFile, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const dicePackage = resolve(root, "node_modules/@3d-dice/dice-box-threejs");
const textureNames = [
  "astral.webp", "cloudy.alt.webp", "dragon.webp", "dragon-bump.webp",
  "fire.webp", "ice.webp", "marble.webp", "metal.webp", "metal-bump.webp",
  "paper.webp", "paper-bump.webp", "speckles.webp", "stars.webp", "wood.webp"
];

await build({
  entryPoints: [resolve(root, "src/vendor/dice-runtime.js")],
  outfile: resolve(root, "dist/vendor/dice-runtime.js"),
  bundle: true,
  format: "esm",
  minify: true,
  sourcemap: false,
  target: ["es2022"],
  legalComments: "none"
});

const copies = [
  ...textureNames.map(name => [resolve(dicePackage, "public/textures", name), resolve(root, "dist/assets/dice/textures", name)]),
  [resolve(dicePackage, "LICENSE"), resolve(root, "dist/vendor/LICENSE.dice-box-threejs.txt")],
  [resolve(root, "node_modules/three-nebula/LICENSE.md"), resolve(root, "dist/vendor/LICENSE.three-nebula.txt")],
  [resolve(root, "node_modules/three/LICENSE"), resolve(root, "dist/vendor/LICENSE.three.txt")],
  [resolve(root, "node_modules/cannon-es/LICENSE"), resolve(root, "dist/vendor/LICENSE.cannon-es.txt")]
];

for (const [source, destination] of copies) {
  await mkdir(dirname(destination), { recursive: true });
  await copyFile(source, destination);
  await chmod(destination, 0o644);
}
