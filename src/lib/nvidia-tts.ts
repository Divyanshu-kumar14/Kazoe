/**
 * NVIDIA Magpie TTS — REST client via NVCF Cloud Functions.
 *
 * Model: magpie-tts-multilingual
 * Function ID: 877104f7-e885-42b9-8de8-f6e4c6303969
 * Docs: https://build.nvidia.com/nvidia/magpie-tts-multilingual
 *
 * Optional — requires VITE_NVIDIA_API_KEY env var.
 */

const FUNCTION_ID = '877104f7-e885-42b9-8de8-f6e4c6303969';
const NVCF_URL = `https://api.nvcf.nvidia.com/v2/nvcf/pexec/functions/${FUNCTION_ID}`;

export function hasNvidiaApiKey(): boolean {
  return (
    typeof import.meta.env.VITE_NVIDIA_API_KEY === 'string' &&
    import.meta.env.VITE_NVIDIA_API_KEY.length > 0
  );
}

export interface TtsOptions {
  voice?: string;
  language?: string;
  sampleRate?: number;
}

/**
 * Call the NVIDIA Magpie TTS API and return raw PCM audio data.
 *
 * @param text — sentence to synthesize
 * @param options — voice, language, sample rate overrides
 * @param signal — AbortSignal for cancellation
 * @returns ArrayBuffer of 16-bit mono PCM audio
 */
export async function synthesizeSpeech(
  text: string,
  options: TtsOptions = {},
  signal?: AbortSignal,
): Promise<ArrayBuffer> {
  const apiKey = import.meta.env.VITE_NVIDIA_API_KEY;
  if (!apiKey) {
    throw new Error('VITE_NVIDIA_API_KEY is not set');
  }

  const body = {
    requestBody: {
      text,
      voice_name: options.voice ?? 'Magpie-Multilingual.EN-US.Aria',
      language_code: options.language ?? 'en-US',
      sample_rate_hz: options.sampleRate ?? 24000,
      encoding: 'LINEAR_PCM',
    },
  };

  const response = await fetch(NVCF_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
    signal,
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    throw new Error(`NVIDIA TTS error ${response.status}: ${errorText}`);
  }

  const contentType = response.headers.get('content-type') ?? '';

  if (contentType.includes('application/json')) {
    // Some NVCF functions wrap binary in JSON
    const json = await response.json();
    const raw = json.audio ?? json.data ?? json.audio_base64;
    if (!raw) {
      throw new Error('NVIDIA TTS: no audio data in JSON response');
    }
    const binaryStr = atob(raw);
    const bytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) {
      bytes[i] = binaryStr.charCodeAt(i);
    }
    return bytes.buffer;
  }

  // Binary response (raw PCM)
  return response.arrayBuffer();
}
