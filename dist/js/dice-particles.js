import {
  Alpha, Color, Emitter, Force, GPURenderer, Life, Mass, Position,
  RadialVelocity, Radius, RandomDrift, Rate, Rotate, Scale, Span,
  SphereZone, System, Texture, THREE, Vector3D
} from "../vendor/dice-runtime.js";
import { particleProfile } from "./dice-particle-profiles.js?v=1.5.0";

export function createDiceParticleSystem(box) {
  const reduced = globalThis.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  if (!box?.scene || reduced) return noParticleSystem();
  return new DiceParticleSystem(box);
}

class DiceParticleSystem {
  constructor(box) {
    this.box = box;
    this.system = null;
    this.emitters = [];
    this.frame = null;
    this.stopTimer = null;
    this.lastFrame = 0;
  }

  begin(effectId, diceCount) {
    this.clear();
    const spec = particleProfile(effectId);
    if (!spec) return;
    try {
      this.start(spec, diceCount);
    } catch (error) {
      this.clear();
      console.error("GPU particle renderer could not initialize", error);
    }
  }

  start(spec, diceCount) {
    const density = diceCount > 10 ? .42 : diceCount > 6 ? .58 : diceCount > 3 ? .76 : 1;
    const renderer = new GPURenderer(this.box.scene, THREE, {
      camera: this.box.camera,
      maxParticles: Math.max(96, Math.round(420 * density)),
      baseColor: 0xffffff,
      blending: spec.blend,
      depthTest: true,
      depthWrite: false,
      transparent: true
    });
    this.renderer = renderer;
    this.system = new System(180).addRenderer(renderer);
    const texture = makeParticleTexture(spec.shape);
    this.emitters = this.box.diceList.slice(0, diceCount).map(die => {
      const emitter = makeEmitter(spec, texture, density);
      emitter.followedDie = die;
      emitter.setPosition(die.position || die.body?.position).emit();
      this.system.addEmitter(emitter);
      return emitter;
    });
    this.stopTimer = setTimeout(() => this.emitters.forEach(emitter => emitter.stopEmit()), spec.duration * 1000);
    this.lastFrame = performance.now();
    this.frame = requestAnimationFrame(time => this.tick(time));
  }

  tick(time) {
    if (!this.system) return;
    const delta = Math.min(.05, Math.max(0, (time - this.lastFrame) / 1000));
    this.lastFrame = time;
    this.emitters.forEach(emitter => {
      const position = emitter.followedDie?.body?.position || emitter.followedDie?.position;
      if (position) emitter.setPosition(position);
    });
    if (this.renderer) this.renderer.camera = this.box.camera;
    this.system.tick(delta);
    this.box.renderer?.render(this.box.scene, this.box.camera);
    if (this.system.getCount() || this.emitters.some(emitter => emitter.isEmitting)) {
      this.frame = requestAnimationFrame(next => this.tick(next));
    } else this.clear();
  }

  finish() {
    this.emitters.forEach(emitter => emitter.stopEmit());
  }

  clear() {
    if (this.frame) cancelAnimationFrame(this.frame);
    if (this.stopTimer) clearTimeout(this.stopTimer);
    this.frame = null;
    this.stopTimer = null;
    this.emitters = [];
    this.system?.destroy();
    this.system = null;
    this.renderer = null;
  }

  destroy() { this.clear(); }
}

function makeEmitter(spec, texture, density) {
  const amount = [
    Math.max(1, Math.round(spec.rate[0] * density)),
    Math.max(1, Math.round(spec.rate[1] * density))
  ];
  const emitter = new Emitter().setRate(new Rate(new Span(...amount), new Span(...spec.interval)));
  emitter.damping = .012;
  emitter.setInitializers([
    new Position(new SphereZone(0, 0, 0, 10)),
    new Mass(1),
    new Radius(spec.radius[0] * 4.5, spec.radius[1] * 4.5),
    new Life(...spec.life),
    new RadialVelocity(new Span(...spec.speed), new Vector3D(0, 0, 1), spec.spread),
    new Texture(THREE, texture, { transparent: true, depthWrite: false })
  ]);
  const behaviours = [
    new Alpha(...spec.alpha),
    new Scale(...spec.scale),
    new Color(...spec.color)
  ];
  if (spec.drift) behaviours.push(new RandomDrift(...spec.drift));
  if (spec.force) behaviours.push(new Force(...spec.force));
  if (spec.rotate) behaviours.push(new Rotate(spec.rotate[0], spec.rotate[1], spec.rotate[1]));
  return emitter.setBehaviours(behaviours);
}

function makeParticleTexture(shape) {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 128;
  const ctx = canvas.getContext("2d");
  ctx.translate(64, 64);
  const glow = ctx.createRadialGradient(0, 0, 2, 0, 0, 58);
  glow.addColorStop(0, "rgba(255,255,255,1)");
  glow.addColorStop(.16, "rgba(255,255,255,.9)");
  glow.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = glow;
  if (shape === "star") drawStar(ctx);
  else if (shape === "ember" || shape === "electric") drawStreak(ctx, shape === "electric");
  else if (shape === "crystal") drawCrystal(ctx);
  else if (shape === "glyph") drawGlyph(ctx);
  else { ctx.beginPath(); ctx.arc(0, 0, 58, 0, Math.PI * 2); ctx.fill(); }
  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

function drawStar(ctx) {
  ctx.beginPath();
  for (let index = 0; index < 16; index += 1) {
    const radius = index % 2 ? 13 : index % 4 ? 33 : 58;
    const angle = index * Math.PI / 8 - Math.PI / 2;
    ctx[index ? "lineTo" : "moveTo"](Math.cos(angle) * radius, Math.sin(angle) * radius);
  }
  ctx.closePath(); ctx.fill();
}

function drawStreak(ctx, electric) {
  ctx.rotate(-.58);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.strokeStyle = "white";
  ctx.lineWidth = electric ? 9 : 15;
  ctx.shadowColor = "white";
  ctx.shadowBlur = 18;
  ctx.beginPath();
  ctx.moveTo(-54, electric ? 18 : 0);
  if (electric) { ctx.lineTo(-18, -10); ctx.lineTo(5, 8); ctx.lineTo(52, -16); }
  else ctx.lineTo(52, 0);
  ctx.stroke();
}

function drawCrystal(ctx) {
  ctx.strokeStyle = "white"; ctx.lineWidth = 6; ctx.lineCap = "round";
  for (let arm = 0; arm < 3; arm += 1) {
    ctx.rotate(Math.PI / 3); ctx.beginPath(); ctx.moveTo(-42, 0); ctx.lineTo(42, 0); ctx.stroke();
  }
  ctx.beginPath(); ctx.arc(0, 0, 11, 0, Math.PI * 2); ctx.fill();
}

function drawGlyph(ctx) {
  ctx.strokeStyle = "white"; ctx.lineWidth = 6; ctx.lineJoin = "round";
  ctx.beginPath(); ctx.moveTo(0, -48); ctx.lineTo(38, 0); ctx.lineTo(0, 48); ctx.lineTo(-38, 0); ctx.closePath();
  ctx.moveTo(-23, 0); ctx.lineTo(23, 0); ctx.moveTo(0, -27); ctx.lineTo(0, 27); ctx.stroke();
}

function noParticleSystem() {
  return { begin() {}, finish() {}, destroy() {} };
}
