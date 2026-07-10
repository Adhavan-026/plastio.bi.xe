let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const AudioContextCtor =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextCtor) return null;
  if (!audioContext) audioContext = new AudioContextCtor();
  if (audioContext.state === "suspended") void audioContext.resume();
  return audioContext;
}

const MIN_FREQ = 500;
const MAX_FREQ = 1100;

/**
 * A short, quiet, percussive "tick" at a randomized pitch within a fixed
 * range, so a run of clicks sounds like a tactile keyboard/typewriter
 * rather than the same beep repeating.
 */
export function playClickSound() {
  const ctx = getAudioContext();
  if (!ctx) return;

  const frequency = MIN_FREQ + Math.random() * (MAX_FREQ - MIN_FREQ);
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();

  oscillator.type = "triangle";
  oscillator.frequency.value = frequency;

  const now = ctx.currentTime;
  gain.gain.setValueAtTime(0.6, now);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.09);

  oscillator.connect(gain).connect(ctx.destination);
  oscillator.start(now);
  oscillator.stop(now + 0.1);
  oscillator.onended = () => {
    oscillator.disconnect();
    gain.disconnect();
  };
}
