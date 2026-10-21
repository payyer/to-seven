// Phát âm: ưu tiên audio người thật từ Free Dictionary API (nếu bật), dự phòng bằng SpeechSynthesis.

const DICTIONARY_URL = "https://api.dictionaryapi.dev/api/v2/entries/en/";
const audioCache = new Map<string, Promise<string | null>>();

export function canSpeak(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

function pickVoice(): SpeechSynthesisVoice | undefined {
  const voices = window.speechSynthesis.getVoices();
  return (
    voices.find((v) => v.lang === "en-GB" && /natural|online|google/i.test(v.name)) ??
    voices.find((v) => v.lang === "en-GB") ??
    voices.find((v) => v.lang === "en-US") ??
    voices.find((v) => v.lang.startsWith("en"))
  );
}

export function speak(text: string, rate = 0.95): void {
  if (!canSpeak()) return;
  const synth = window.speechSynthesis;
  synth.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  const voice = pickVoice();
  if (voice) utterance.voice = voice;
  utterance.lang = voice?.lang ?? "en-GB";
  utterance.rate = rate;
  synth.speak(utterance);
}

interface DictionaryEntry {
  phonetics?: { audio?: string }[];
}

/** URL file mp3 phát âm (ưu tiên giọng Anh-Anh), null nếu không có. Chỉ áp dụng cho từ đơn. */
export function getDictionaryAudio(word: string): Promise<string | null> {
  const key = word.toLowerCase();
  if (/\s/.test(key)) return Promise.resolve(null);
  let cached = audioCache.get(key);
  if (!cached) {
    cached = fetch(DICTIONARY_URL + encodeURIComponent(key))
      .then((res) => (res.ok ? (res.json() as Promise<DictionaryEntry[]>) : []))
      .then((entries) => {
        const urls = entries.flatMap((e) => e.phonetics ?? []).map((p) => p.audio ?? "").filter(Boolean);
        return urls.find((u) => /-uk\.mp3$/.test(u)) ?? urls[0] ?? null;
      })
      .catch(() => null);
    audioCache.set(key, cached);
  }
  return cached;
}

let currentAudio: HTMLAudioElement | null = null;

/** Phát âm một từ. `slow` = đọc chậm để nghe rõ trọng âm. */
export async function playWord(word: string, options: { preferReal: boolean; slow?: boolean }): Promise<void> {
  const { preferReal, slow = false } = options;
  if (preferReal) {
    const url = await getDictionaryAudio(word);
    if (url) {
      currentAudio?.pause();
      currentAudio = new Audio(url);
      currentAudio.playbackRate = slow ? 0.7 : 1;
      try {
        await currentAudio.play();
        return;
      } catch {
        // Trình duyệt chặn phát audio → dùng giọng đọc máy.
      }
    }
  }
  speak(word, slow ? 0.6 : 0.9);
}
