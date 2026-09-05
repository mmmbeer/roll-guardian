// Proton v7.1.5 adapter. Emitter behavior follows the library's MIT-licensed
// flame, sparks, snow, drift, and custom-renderer examples.
export const PARTICLE_PROFILES = Object.freeze({
  shimmer: profile({ rate: [1,2], interval: [.05,.085], life: [.22,.42], radius: [.7,2.1], speed: [.08,.34], angle: [0,360], color: ["#e9ffd2","#62d89a"], alpha: [.55,0], scale: [1.35,.1], drift: [5,5,.06], shape: "flare", blend: "lighter", blur: 3, stopAt: .79 }),
  comet: profile({ rate: [2,4], interval: [.026,.046], life: [.28,.55], radius: [.65,2.4], speed: [.05,.32], angle: [0,360], color: ["#ffffff","#72aaff"], alpha: [.82,0], scale: [1.3,.08], drift: [3,3,.05], shape: "star", blend: "lighter", blur: 4, stopAt: .82 }),
  embers: profile({ rate: [1,3], interval: [.038,.07], life: [.36,.74], radius: [.7,2.3], speed: [.55,1.25], angle: [-24,24], color: ["#ffe58a","#e74419"], alpha: [.88,0], scale: [1.15,.06], drift: [9,4,.045], gravity: -.12, shape: "ember", blend: "lighter", blur: 4, stopAt: .76 }),
  snow: profile({ rate: [1,2], interval: [.055,.09], life: [.48,.86], radius: [1.2,2.7], speed: [.18,.58], angle: [155,205], color: ["#ffffff","#8ed9ef"], alpha: [.68,0], scale: [.9,.18], drift: [7,3,.08], shape: "snow", blend: "screen", blur: 1.5, stopAt: .74 }),
  lightning: profile({ rate: [1,2], interval: [.026,.052], life: [.12,.26], radius: [.75,1.65], speed: [1.2,2.7], angle: [0,360], color: ["#ffffff","#69bfff"], alpha: [.96,0], scale: [1,.12], drift: [18,18,.025], shape: "electric", blend: "lighter", blur: 5, stopAt: .84 }),
  glyphs: profile({ rate: [1,1], interval: [.085,.13], life: [.42,.72], radius: [3.2,5.2], speed: [.3,.68], angle: [0,360], color: ["#fff1af","#c88bff"], alpha: [.72,0], scale: [.75,.2], cyclone: ["right",.55], rotate: [0,7], shape: "glyph", blend: "lighter", blur: 2.5, stopAt: .72 })
});

export function particleProfile(effectId) {
  return PARTICLE_PROFILES[effectId] || null;
}

export function createDiceParticleSystem(canvas) {
  const reduced = globalThis.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  if (!canvas || reduced || typeof globalThis.Proton !== "function") return noParticleSystem();
  return new DiceParticleSystem(canvas, globalThis.Proton);
}

class DiceParticleSystem {
  constructor(canvas, Proton) {
    this.canvas = canvas;
    this.Proton = Proton;
    this.proton = new Proton();
    this.emitters = [];
    this.frame = null;
    this.profile = null;
    this.ratio = 1;
    Proton.USE_CLOCK = true;
    this.renderer = createRenderer(canvas, Proton, () => this.ratio);
    this.proton.addRenderer(this.renderer);
    this.resize();
  }

  resize(width, height) {
    const rect = this.canvas.getBoundingClientRect();
    const cssWidth = Math.max(1, width || rect.width);
    const cssHeight = Math.max(1, height || rect.height);
    this.ratio = Math.min(2, globalThis.devicePixelRatio || 1);
    this.canvas.width = Math.round(cssWidth * this.ratio);
    this.canvas.height = Math.round(cssHeight * this.ratio);
  }

  begin(effectId, count, size) {
    this.clear();
    this.profile = particleProfile(effectId);
    if (!this.profile) return;
    this.emitters = Array.from({ length: count }, () => this.makeEmitter(count, size));
  }

  track(index, position, progress, active) {
    const emitter = this.emitters[index];
    if (!emitter || !active) return;
    emitter.p.x = position.x;
    emitter.p.y = position.y;
    if (progress < this.profile.stopAt && !emitter.started) {
      emitter.started = true;
      emitter.emit();
      this.ensureLoop();
    } else if (progress >= this.profile.stopAt && !emitter.stoped) emitter.stop();
  }

  finish() {
    this.emitters.forEach(emitter => emitter.stop());
    if (!this.proton.getCount()) this.clear();
  }

  destroy() {
    this.clear();
    this.proton.destroy();
  }

  makeEmitter(count, size) {
    const P = this.Proton;
    const spec = this.profile;
    const density = count > 10 ? .48 : count > 6 ? .66 : count > 3 ? .82 : 1;
    const emitter = new P.Emitter();
    emitter.damping = .014;
    const burst = [Math.max(1, Math.round(spec.rate[0] * density)), Math.max(1, Math.round(spec.rate[1] * density))];
    const intervalScale = count > 8 ? 1.3 : count > 4 ? 1.14 : 1;
    emitter.rate = new P.Rate(new P.Span(...burst), new P.Span(spec.interval[0] * intervalScale, spec.interval[1] * intervalScale));
    emitter.addInitialize(new P.Mass(1), new P.Radius(spec.radius[0] * size / 56, spec.radius[1] * size / 56), new P.Life(...spec.life), new P.Velocity(new P.Span(...spec.speed), new P.Span(...spec.angle), "polar"));
    emitter.addBehaviour(new P.Color(...spec.color), new P.Alpha(...spec.alpha, Infinity, P.easeOutCubic), new P.Scale(...spec.scale, Infinity, P.easeOutQuart));
    if (spec.drift) emitter.addBehaviour(new P.RandomDrift(...spec.drift));
    if (spec.gravity) emitter.addBehaviour(new P.Gravity(spec.gravity));
    if (spec.cyclone) emitter.addBehaviour(new P.Cyclone(...spec.cyclone));
    if (spec.rotate) emitter.addBehaviour(new P.Rotate(spec.rotate[0], spec.rotate[1], "add"));
    emitter.effectId = spec.shape;
    emitter.renderProfile = spec;
    emitter.started = false;
    this.proton.addEmitter(emitter);
    return emitter;
  }

  ensureLoop() {
    if (this.frame) return;
    const tick = () => {
      this.proton.update();
      const emitting = this.emitters.some(emitter => emitter.started && !emitter.stoped);
      if (!emitting && !this.proton.getCount()) { this.clear(); return; }
      this.frame = requestAnimationFrame(tick);
    };
    this.frame = requestAnimationFrame(tick);
  }

  clear() {
    if (this.frame) cancelAnimationFrame(this.frame);
    this.frame = null;
    this.emitters.forEach(emitter => {
      emitter.removeAllParticles();
      if (emitter.parent) this.proton.removeEmitter(emitter);
    });
    this.emitters = [];
    clearCanvas(this.canvas);
  }
}

function createRenderer(canvas, Proton, getRatio) {
  const renderer = new Proton.CustomRenderer(canvas);
  const ctx = canvas.getContext("2d", { alpha: true });
  renderer.onProtonUpdate = () => {
    ctx.setTransform(1,0,0,1,0,0);
    ctx.clearRect(0,0,canvas.width,canvas.height);
    const ratio = getRatio();
    ctx.setTransform(ratio,0,0,ratio,0,0);
  };
  renderer.onParticleCreated = particle => {
    particle.data.seed = Math.random() * Math.PI * 2;
    particle.data.shape = particle.parent.effectId;
    particle.data.profile = particle.parent.renderProfile;
  };
  renderer.onParticleUpdate = particle => drawParticle(ctx, particle);
  return renderer;
}

function drawParticle(ctx, particle) {
  const shape = particle.data.shape;
  const color = `rgb(${particle.rgb.r},${particle.rgb.g},${particle.rgb.b})`;
  const radius = Math.max(.45, particle.radius);
  const profile = particle.data.profile;
  ctx.save();
  ctx.globalAlpha = particle.alpha;
  ctx.globalCompositeOperation = profile?.blend || "source-over";
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.shadowColor = color;
  ctx.shadowBlur = radius * (profile?.blur || 2);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  if (shape === "star") drawStar(ctx, particle.p.x, particle.p.y, radius, particle.data.seed);
  else if (shape === "ember") drawEmber(ctx, particle, radius);
  else if (shape === "snow") drawSnow(ctx, particle.p.x, particle.p.y, radius, particle.data.seed);
  else if (shape === "electric") drawElectric(ctx, particle, radius);
  else if (shape === "glyph") drawGlyph(ctx, particle.p.x, particle.p.y, radius, particle.rotation);
  else drawFlare(ctx, particle.p.x, particle.p.y, radius, particle.data.seed);
  ctx.restore();
}

function drawStar(ctx, x, y, radius, rotation) {
  ctx.save(); ctx.translate(x,y); ctx.rotate(rotation); ctx.lineWidth = Math.max(.6,radius*.38);
  ctx.beginPath(); ctx.moveTo(-radius*2.2,0); ctx.lineTo(radius*2.2,0); ctx.moveTo(0,-radius*2.2); ctx.lineTo(0,radius*2.2); ctx.stroke();
  ctx.beginPath(); ctx.arc(0,0,radius*.72,0,Math.PI*2); ctx.fill(); ctx.restore();
}

function drawEmber(ctx, particle, radius) {
  const dx = particle.p.x - particle.old.p.x;
  const dy = particle.p.y - particle.old.p.y;
  ctx.lineWidth = Math.max(.7,radius*1.05);
  ctx.beginPath(); ctx.moveTo(particle.p.x-dx*3.2,particle.p.y-dy*3.2); ctx.lineTo(particle.p.x,particle.p.y); ctx.stroke();
  ctx.beginPath(); ctx.arc(particle.p.x,particle.p.y,radius*.58,0,Math.PI*2); ctx.fill();
}

function drawSnow(ctx, x, y, radius, rotation) {
  ctx.save(); ctx.translate(x,y); ctx.rotate(rotation); ctx.lineWidth = Math.max(.45,radius*.28);
  ctx.beginPath();
  for (let arm=0; arm<3; arm+=1) { const angle=arm*Math.PI/3; ctx.moveTo(Math.cos(angle)*-radius*1.35,Math.sin(angle)*-radius*1.35); ctx.lineTo(Math.cos(angle)*radius*1.35,Math.sin(angle)*radius*1.35); }
  ctx.stroke(); ctx.restore();
}

function drawElectric(ctx, particle, radius) {
  const phase = particle.data.seed + particle.age*48;
  const length = radius*5.5;
  const angle = Math.atan2(particle.v.y,particle.v.x);
  const nx = Math.cos(angle), ny = Math.sin(angle), px = -ny, py = nx;
  ctx.lineWidth = Math.max(.7,radius*.58);
  ctx.beginPath(); ctx.moveTo(particle.p.x-nx*length*.5,particle.p.y-ny*length*.5);
  ctx.lineTo(particle.p.x+px*Math.sin(phase)*radius*1.2,particle.p.y+py*Math.sin(phase)*radius*1.2);
  ctx.lineTo(particle.p.x+nx*length*.5,particle.p.y+ny*length*.5); ctx.stroke();
}

function drawGlyph(ctx, x, y, radius, rotation) {
  ctx.save(); ctx.translate(x,y); ctx.rotate(rotation*Math.PI/180); ctx.lineWidth = Math.max(.7,radius*.24);
  ctx.beginPath(); ctx.moveTo(0,-radius); ctx.lineTo(radius*.8,0); ctx.lineTo(0,radius); ctx.lineTo(-radius*.8,0); ctx.closePath();
  ctx.moveTo(-radius*.45,0); ctx.lineTo(radius*.45,0); ctx.moveTo(0,-radius*.55); ctx.lineTo(0,radius*.55); ctx.stroke(); ctx.restore();
}

function drawFlare(ctx, x, y, radius, rotation) {
  ctx.save(); ctx.translate(x,y); ctx.rotate(rotation); ctx.lineWidth = Math.max(.5,radius*.3);
  ctx.beginPath(); ctx.moveTo(-radius*1.7,0); ctx.lineTo(radius*1.7,0); ctx.moveTo(0,-radius*.8); ctx.lineTo(0,radius*.8); ctx.stroke(); ctx.restore();
}

function clearCanvas(canvas) {
  const ctx = canvas.getContext("2d");
  ctx.setTransform(1,0,0,1,0,0);
  ctx.clearRect(0,0,canvas.width,canvas.height);
}

function noParticleSystem() {
  return { resize() {}, begin() {}, track() {}, finish() {}, destroy() {} };
}

function profile(values) { return Object.freeze(values); }
