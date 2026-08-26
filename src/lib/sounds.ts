/**
 * Sound effects via Web Audio API — no external files needed.
 * Generates synthesized sounds for game feedback.
 */

let audioCtx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext();
  }
  return audioCtx;
}

function playTone(frequency: number, duration: number, type: OscillatorType = "sine", volume = 0.15) {
  try {
    const ctx = getCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = frequency;
    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch {
    /* Web Audio not available */
  }
}

/** Correct answer — bright ascending ding */
export function playCorrect() {
  playTone(523, 0.1, "sine", 0.12);   // C5
  setTimeout(() => playTone(659, 0.15, "sine", 0.12), 80);  // E5
}

/** Wrong answer — low buzz */
export function playWrong() {
  playTone(220, 0.2, "sawtooth", 0.08);
}

/** Level up — triumphant fanfare */
export function playLevelUp() {
  playTone(392, 0.15, "sine", 0.15);  // G4
  setTimeout(() => playTone(523, 0.15, "sine", 0.15), 120);  // C5
  setTimeout(() => playTone(659, 0.15, "sine", 0.15), 240);  // E5
  setTimeout(() => playTone(784, 0.3, "sine", 0.18), 360);   // G5
}

/** XP gained — quick pop */
export function playXpGain() {
  playTone(880, 0.08, "sine", 0.1);
}

/** Battle win — victory jingle */
export function playBattleWin() {
  const notes = [523, 659, 784, 1047];
  notes.forEach((freq, i) => {
    setTimeout(() => playTone(freq, 0.15, "sine", 0.12), i * 100);
  });
}

/** Battle lose — descending tone */
export function playBattleLose() {
  playTone(440, 0.2, "sine", 0.1);
  setTimeout(() => playTone(349, 0.3, "sine", 0.1), 150);
}

/** Quiz passed — celebration */
export function playQuizPassed() {
  playTone(523, 0.12, "sine", 0.12);
  setTimeout(() => playTone(659, 0.12, "sine", 0.12), 100);
  setTimeout(() => playTone(784, 0.2, "sine", 0.15), 200);
}

/** Button click — subtle tap */
export function playClick() {
  playTone(600, 0.04, "sine", 0.06);
}

/** Badge earned — special chime */
export function playBadgeEarned() {
  playTone(784, 0.1, "sine", 0.12);
  setTimeout(() => playTone(988, 0.1, "sine", 0.12), 100);
  setTimeout(() => playTone(1175, 0.25, "sine", 0.15), 200);
}

/** Duel challenge received — alert */
export function playDuelAlert() {
  playTone(660, 0.1, "square", 0.08);
  setTimeout(() => playTone(880, 0.15, "square", 0.08), 120);
}
