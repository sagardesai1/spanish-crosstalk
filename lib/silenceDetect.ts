/**
 * Simple browser silence detection for continuous Crosstalk turns.
 */

export type SilenceWatcherOptions = {
  /** RMS threshold — above this counts as speech */
  speechThreshold?: number;
  /** Require this much speech before silence can end the turn */
  minSpeechMs?: number;
  /** How long silence must last after speech before firing */
  silenceDelayMs: number;
  /** Safety cap so a stuck listen can't run forever */
  maxListenMs?: number;
  onSilence: () => void;
  onMaxDuration?: () => void;
};

export type SilenceWatcher = {
  stop: () => void;
};

export function startSilenceWatcher(
  stream: MediaStream,
  options: SilenceWatcherOptions,
): SilenceWatcher {
  const speechThreshold = options.speechThreshold ?? 0.02;
  const minSpeechMs = options.minSpeechMs ?? 350;
  const maxListenMs = options.maxListenMs ?? 45_000;

  const audioContext = new AudioContext();
  const source = audioContext.createMediaStreamSource(stream);
  const analyser = audioContext.createAnalyser();
  analyser.fftSize = 2048;
  source.connect(analyser);

  const samples = new Float32Array(analyser.fftSize);
  let rafId = 0;
  let stopped = false;
  let heardSpeech = false;
  let speechStartedAt = 0;
  let silenceStartedAt: number | null = null;
  const watchStartedAt = performance.now();

  const cleanup = () => {
    if (stopped) return;
    stopped = true;
    cancelAnimationFrame(rafId);
    source.disconnect();
    void audioContext.close().catch(() => undefined);
  };

  const tick = () => {
    if (stopped) return;

    const now = performance.now();
    if (now - watchStartedAt >= maxListenMs) {
      cleanup();
      if (options.onMaxDuration) {
        options.onMaxDuration();
      } else {
        options.onSilence();
      }
      return;
    }

    analyser.getFloatTimeDomainData(samples);
    let sumSquares = 0;
    for (let i = 0; i < samples.length; i += 1) {
      const sample = samples[i] ?? 0;
      sumSquares += sample * sample;
    }
    const rms = Math.sqrt(sumSquares / samples.length);

    if (rms >= speechThreshold) {
      if (!heardSpeech) {
        heardSpeech = true;
        speechStartedAt = now;
      }
      silenceStartedAt = null;
    } else if (heardSpeech && now - speechStartedAt >= minSpeechMs) {
      if (silenceStartedAt == null) {
        silenceStartedAt = now;
      } else if (now - silenceStartedAt >= options.silenceDelayMs) {
        cleanup();
        options.onSilence();
        return;
      }
    }

    rafId = requestAnimationFrame(tick);
  };

  rafId = requestAnimationFrame(tick);

  return { stop: cleanup };
}
