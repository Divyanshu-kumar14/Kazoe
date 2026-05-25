/**
 * Play raw PCM 16-bit mono audio using the Web Audio API.
 *
 * Shares a lazy AudioContext singleton across calls.
 */

let sharedCtx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!sharedCtx || sharedCtx.state === 'closed') {
    sharedCtx = new AudioContext();
  }
  if (sharedCtx.state === 'suspended') {
    sharedCtx.resume();
  }
  return sharedCtx;
}

/**
 * Play raw 16-bit PCM audio data.
 *
 * @param pcmData — ArrayBuffer of 16-bit signed integer PCM samples
 * @param sampleRate — sample rate in Hz (default 24000)
 * @returns Promise that resolves when playback completes
 * @throws if the AudioContext fails to decode or play
 */
export function playPcmAudio(pcmData: ArrayBuffer, sampleRate = 24000): Promise<void> {
  const ctx = getCtx();

  // Convert 16-bit int → 32-bit float
  const frameCount = Math.floor(pcmData.byteLength / 2);
  const floatData = new Float32Array(frameCount);
  const intData = new Int16Array(pcmData);

  for (let i = 0; i < frameCount; i++) {
    const sample = intData[i];
    floatData[i] = sample !== undefined ? sample / 32768 : 0;
  }

  const audioBuffer = ctx.createBuffer(1, frameCount, sampleRate);
  audioBuffer.getChannelData(0).set(floatData);

  const source = ctx.createBufferSource();
  source.buffer = audioBuffer;
  source.connect(ctx.destination);
  source.start();

  return new Promise((resolve) => {
    source.onended = () => resolve();
  });
}

/**
 * Stop any currently playing audio and reset the shared context.
 */
export function stopAudio(): void {
  if (sharedCtx && sharedCtx.state !== 'closed') {
    sharedCtx.close().catch(() => {});
    sharedCtx = null;
  }
}
