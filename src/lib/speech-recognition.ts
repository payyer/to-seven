// Bọc Web Speech API (SpeechRecognition). TypeScript DOM chưa có đủ kiểu nên khai báo tối thiểu ở đây.

interface RecognitionAlternative {
  transcript: string;
}
interface RecognitionResult {
  readonly isFinal: boolean;
  readonly length: number;
  [index: number]: RecognitionAlternative;
}
interface RecognitionEvent {
  readonly resultIndex: number;
  readonly results: { readonly length: number; [index: number]: RecognitionResult };
}
interface RecognitionErrorEvent {
  readonly error: string;
}
interface NativeRecognition {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((e: RecognitionEvent) => void) | null;
  onerror: ((e: RecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}
type RecognitionCtor = new () => NativeRecognition;

function getCtor(): RecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: RecognitionCtor; webkitSpeechRecognition?: RecognitionCtor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function isRecognitionSupported(): boolean {
  return getCtor() !== null;
}

const ERROR_MESSAGES: Record<string, string> = {
  "not-allowed": "Trình duyệt chưa được phép dùng micro. Hãy cho phép micro rồi thử lại.",
  "service-not-allowed": "Trình duyệt chưa được phép dùng micro. Hãy cho phép micro rồi thử lại.",
  "audio-capture": "Không tìm thấy micro.",
  network: "Nhận giọng nói cần kết nối mạng.",
  "language-not-supported": "Trình duyệt không hỗ trợ nhận giọng nói tiếng Anh.",
};

export interface Recognizer {
  stop(): void;
}

/**
 * Bắt đầu nghe. `onText` nhận phần đã chốt (final) và phần đang nghe (interim).
 * Trình duyệt di động hay tự dừng khi người nói ngập ngừng — tự khởi động lại
 * cho tới khi người dùng bấm dừng, phần đã nghe được giữ nguyên.
 */
export function startRecognition(options: {
  lang?: string;
  onText: (finalText: string, interim: string) => void;
  onError: (message: string) => void;
  onStop: () => void;
}): Recognizer | null {
  const Ctor = getCtor();
  if (!Ctor) return null;

  let finalText = "";
  let stopped = false;
  let restarts = 0;
  let current: NativeRecognition | null = null;

  const run = () => {
    const rec = new Ctor();
    current = rec;
    rec.lang = options.lang ?? "en-GB";
    rec.continuous = true;
    rec.interimResults = true;
    rec.onresult = (e) => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) finalText = `${finalText} ${r[0].transcript}`.trim();
        else interim += r[0].transcript;
      }
      options.onText(finalText, interim.trim());
    };
    rec.onerror = (e) => {
      if (e.error === "no-speech" || e.error === "aborted") return;
      stopped = true;
      options.onError(ERROR_MESSAGES[e.error] ?? `Lỗi nhận giọng nói (${e.error}).`);
    };
    rec.onend = () => {
      if (!stopped && restarts < 20) {
        restarts++;
        try {
          run();
          return;
        } catch {
          // không khởi động lại được → dừng hẳn
        }
      }
      options.onText(finalText, "");
      options.onStop();
    };
    rec.start();
  };

  try {
    run();
  } catch {
    options.onError("Không bật được nhận giọng nói.");
    return null;
  }

  return {
    stop() {
      stopped = true;
      current?.stop();
    },
  };
}
