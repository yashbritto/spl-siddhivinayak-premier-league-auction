let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new AudioContext();
  }
  return audioContext;
}

export function playBidSound(): void {
  try {
    const ctx = getAudioContext();
    if (ctx.state === "suspended") {
      ctx.resume();
    }

    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(880, ctx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(
      1200,
      ctx.currentTime + 0.1,
    );

    gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.3);
  } catch {
    // Audio not supported or blocked
  }
}

export function playSoldSound(): void {
  try {
    const ctx = getAudioContext();
    if (ctx.state === "suspended") {
      ctx.resume();
    }

    // Fanfare: three ascending notes
    const notes = [523.25, 659.25, 783.99, 1046.5];
    const duration = 0.15;

    notes.forEach((freq, i) => {
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.type = "triangle";
      oscillator.frequency.setValueAtTime(freq, ctx.currentTime + i * duration);

      gainNode.gain.setValueAtTime(0, ctx.currentTime + i * duration);
      gainNode.gain.linearRampToValueAtTime(
        0.4,
        ctx.currentTime + i * duration + 0.02,
      );
      gainNode.gain.exponentialRampToValueAtTime(
        0.01,
        ctx.currentTime + i * duration + duration,
      );

      oscillator.start(ctx.currentTime + i * duration);
      oscillator.stop(ctx.currentTime + i * duration + duration + 0.05);
    });
  } catch {
    // Audio not supported or blocked
  }
}

export function unlockAudio(): void {
  try {
    const ctx = getAudioContext();
    if (ctx.state === "suspended") {
      ctx.resume();
    }
  } catch {
    // ignore
  }
}
