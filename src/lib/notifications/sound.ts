/**
 * NanoLabs Standard Web Audio Chime Synthesizer
 * Zero-dependency, offline-ready, instant playback on mobile and desktop browsers.
 */

type ChimeType = 'notification' | 'slot_alert' | 'success' | 'order_incoming' | 'cash';

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return null;
    if (!audioCtx) {
      audioCtx = new AudioContextClass();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }
    return audioCtx;
  } catch {
    return null;
  }
}

export function playChime(type: ChimeType = 'notification') {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'slot_alert' || type === 'notification') {
      // Pleasant two-tone chime: 880Hz (A5) -> 1320Hz (E6)
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.exponentialRampToValueAtTime(1320, now + 0.12);

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.25, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

      osc.start(now);
      osc.stop(now + 0.45);
    } else if (type === 'success' || type === 'cash') {
      // Ascending major arpeggio chime (C6 -> E6 -> G6)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.connect(gain2);
      gain2.connect(ctx.destination);

      osc.type = 'sine';
      osc.frequency.setValueAtTime(1046.5, now); // C6
      osc.frequency.setValueAtTime(1318.5, now + 0.08); // E6

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(1567.98, now + 0.15); // G6
      gain2.gain.setValueAtTime(0.25, now + 0.15);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

      osc.start(now);
      osc.stop(now + 0.35);
      osc2.start(now + 0.15);
      osc2.stop(now + 0.5);
    } else if (type === 'order_incoming') {
      // Double attention beep (common in restaurant kitchen displays)
      osc.type = 'square';
      osc.frequency.setValueAtTime(950, now);
      osc.frequency.setValueAtTime(950, now + 0.1);
      osc.frequency.setValueAtTime(1200, now + 0.18);

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.setValueAtTime(0.01, now + 0.09);
      gain.gain.setValueAtTime(0.2, now + 0.18);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

      osc.start(now);
      osc.stop(now + 0.5);
    }
  } catch {
    // Graceful fallback if Web Audio is restricted by browser policy
  }
}
