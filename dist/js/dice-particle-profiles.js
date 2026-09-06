export const PARTICLE_PROFILES = Object.freeze({
  shimmer: profile({ rate: [1, 2], interval: [.07, .1], life: [.28, .5], radius: [.8, 1.7], speed: [.1, .28], spread: 180, color: ["#eaffd7", "#58d892"], alpha: [.66, 0], scale: [1.15, .05], drift: [2.2, 2.2, .05], shape: "flare", blend: "AdditiveBlending", duration: .82 }),
  comet: profile({ rate: [1, 3], interval: [.045, .075], life: [.34, .62], radius: [.8, 2], speed: [.16, .48], spread: 150, color: ["#ffffff", "#769dff"], alpha: [.88, 0], scale: [1.35, .04], drift: [1.4, 1.4, .06], shape: "star", blend: "AdditiveBlending", duration: .94 }),
  embers: profile({ rate: [1, 3], interval: [.05, .085], life: [.4, .78], radius: [.7, 1.8], speed: [.28, .72], spread: 72, color: ["#fff0a0", "#e64717"], alpha: [.92, 0], scale: [1.25, .04], drift: [2.8, 1.2, .045], force: [0, 0, 13], shape: "ember", blend: "AdditiveBlending", duration: .9 }),
  snow: profile({ rate: [1, 2], interval: [.075, .115], life: [.52, .92], radius: [1, 2.1], speed: [.12, .38], spread: 115, color: ["#ffffff", "#8ddcf2"], alpha: [.72, 0], scale: [.85, .18], drift: [2.1, 1.1, .08], force: [0, 0, -4], shape: "crystal", blend: "NormalBlending", duration: .82 }),
  lightning: profile({ rate: [1, 2], interval: [.055, .085], life: [.13, .3], radius: [.8, 1.45], speed: [.55, 1.15], spread: 360, color: ["#ffffff", "#56b9ff"], alpha: [1, 0], scale: [1.25, .03], drift: [7, 7, .025], shape: "electric", blend: "AdditiveBlending", duration: .98 }),
  glyphs: profile({ rate: [1, 1], interval: [.11, .16], life: [.48, .82], radius: [1.7, 2.8], speed: [.16, .42], spread: 360, color: ["#fff0a5", "#b787ff"], alpha: [.76, 0], scale: [.8, .22], drift: [2.4, 2.4, .07], rotate: [-2.2, 3.8], shape: "glyph", blend: "AdditiveBlending", duration: .76 })
});

export function particleProfile(effectId) {
  return PARTICLE_PROFILES[effectId] || null;
}

function profile(values) { return Object.freeze(values); }
