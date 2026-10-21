# IELTS Vocab

Web app học từ vựng IELTS cá nhân: kiểm tra đầu vào, học 5–15 từ mới mỗi ngày theo chủ đề Speaking Part 1, ôn tập ngắt quãng bằng cách **tự gõ lại từ** (active recall), rồi **dùng từ**: tự đặt câu cho AI chữa, ôn sổ lỗi sai, nghe – chép, Speaking Part 1, Writing General Training hằng tuần và báo cáo tuần.

## Chạy

```bash
npm install
cp .env.example .env.local   # điền ANTHROPIC_API_KEY để dùng AI chữa câu
npm run dev                  # http://localhost:3000
npm test                     # unit test (SRS, chấm điểm, sổ lỗi, diff, dữ liệu kho từ)
npm run build                # build production
```

Cần Node.js ≥ 20.9.

### Biến môi trường (`.env.example`)

| Biến | Ý nghĩa |
|---|---|
| `ANTHROPIC_API_KEY` | **Bắt buộc** cho tính năng chữa câu. Chỉ đọc ở server (`src/lib/ai/`, có `import "server-only"`), không bao giờ gửi xuống trình duyệt |
| `ANTHROPIC_MODEL` | Mặc định `claude-opus-5-5` |
| `ANTHROPIC_EFFORT` | Mặc định `low` (nhanh, rẻ). Tăng lên `medium` nếu thấy AI bỏ sót lỗi |
| `APP_ACCESS_CODE` | **Nên đặt khi deploy công khai.** Route AI chỉ nhận request có header đúng mã; người dùng nhập mã ở trang Cài đặt |
| `AI_MOCK=1` | Chỉ để phát triển giao diện: chấm câu giả, không gọi API |

## Tính năng

| Trang | Nội dung |
|---|---|
| `/` Tổng quan | Việc hôm nay (ôn → học mới → dùng từ), số từ đã học / đã thuộc, chuỗi ngày, thẻ cần ôn, biểu đồ 8 tuần |
| `/placement` | 30 từ chia 6 band tần suất (A1 → B2+), có nút “Tôi không biết”, trừ điểm đoán mò, ước lượng word family + level + nhóm từ nên học |
| `/learn` | Thẻ 4 mặt: Nghĩa → Cách đọc (IPA, trọng âm, nghe thường/chậm) → Cách dùng (2 collocation, câu ví dụ) → **Đặt câu** (AI chữa). Phím ← → |
| `/review` | Hiện nghĩa tiếng Việt → gõ từ → so từng chữ cái → tự chấm Quên/Khó/Nhớ/Dễ (phím 1–4, Enter = mức gợi ý). Từ bị quên được hỏi lại cuối phiên |
| `/practice/write` | Đặt câu với từ đã học. AI tô chỗ sai + gợi ý → **bạn tự sửa trước** → mới hiện giải thích, câu đúng (diff), câu tương tự để dịch lại |
| `/practice/speaking` | Speaking Part 1: 70 câu hỏi / 14 chủ đề, nói (Web Speech API, tự bật lại khi trình duyệt ngắt) hoặc gõ, sửa transcript trước khi gửi. AI góp ý PEER, sửa thì / hoà hợp chủ ngữ – động từ (tự sửa trước), từ hay hơn, gợi ý dùng từ mới học 14 ngày gần nhất, câu trả lời mẫu để đọc theo |
| `/practice/writing` | Mỗi tuần 1 đề General Training 80–120 từ (26 đề xoay vòng: thư thân mật / bán trang trọng / trang trọng, đoạn ý kiến). Đếm từ trực tiếp, tự lưu nháp, tối đa 3 lần nộp/tuần. AI sửa lỗi (tự sửa trước), gợi ý giọng văn, bài đã sửa giữ nguyên ý |
| `/report` | Báo cáo tuần: ngày học, từ mới, từ đã thuộc, độ chính xác khi ôn, số câu / lượt nói / bài viết / dictation, 3 lỗi hay gặp, so với tuần trước. Kế hoạch tuần sau do AI soạn (hoặc gợi ý theo luật nếu không có AI), nút áp dụng số từ mới/ngày |
| `/practice/mistakes` | Sổ lỗi sai: thống kê theo loại, lỗi hay lặp lại, danh sách có lọc, nút xoá khi AI chấm nhầm, **chế độ ôn**: sửa đoạn bị tô đỏ |
| `/practice/dictation` | Nghe – chép 24 bài có sẵn (A1–B1, câu trả lời kiểu Part 1), câu ví dụ của từ đã học, hoặc văn bản tự dán. So theo từ, tô đỏ chỗ sai |
| `/words` | 240 từ, lọc theo chủ đề / level / trạng thái, tìm kiếm |
| `/settings` | Số từ mỗi ngày, nhóm level ưu tiên, chủ đề ưu tiên, mã truy cập AI, giọng đọc, xuất/nhập/xoá dữ liệu |

### Lịch ôn từ (SM-2 rút gọn) — `src/lib/srs.ts`

- Học xong → ôn sau **1 ngày**. Mỗi lần **Nhớ** đi tiếp các bậc **3 → 7 → 14** ngày, sau đó nhân với hệ số dễ (ease, mặc định 2.5).
- **Dễ**: nhảy 2 bậc, ease +0.15. **Khó**: không lên bậc, khoảng cách tăng ít (1→2, 3→5, 7→10), ease −0.15. **Quên**: về 1 ngày, ease −0.2.
- “Đã thuộc” = khoảng cách ôn ≥ 14 ngày.

### AI — `src/lib/prompts.ts`, `src/lib/ai/`, `src/app/api/*`

- **Mọi system prompt nằm trong `src/lib/prompts.ts`** (câu, Speaking, Writing, kế hoạch tuần). Dữ liệu người học đi trong user message, bọc thẻ XML.
- `src/lib/ai/schemas.ts`: schema Zod cho từng phản hồi; `client.ts`: gọi Claude + chuyển lỗi thành thông báo tiếng Việt; `guard.ts`: mã truy cập, giới hạn tần suất, kiểm tra input dùng chung cho 4 route.
- Mỗi lỗi có `hintVi` (gợi ý không lộ đáp án) và `explanationVi` (hiện sau khi thử). Server kiểm tra lại: gợi ý nào lộ đáp án bị thay bằng gợi ý theo quy tắc.
- Component `TryFirstFix` dùng chung: tô + đánh số lỗi, người học gõ cách sửa, chấm ngay trên máy (không tốn lượt gọi AI); câu/bài đã sửa và câu mẫu chỉ mở khi sửa xong hoặc chủ động xem đáp án.

#### Chi tiết route chữa câu

- Claude API qua SDK `@anthropic-ai/sdk`, **structured output** (schema Zod) nên kết quả luôn đúng dạng JSON.
- Mỗi lỗi gắn một mã quy tắc cố định (`RULES` trong `src/lib/mistakes.ts`, ví dụ `agreement-third-person-s`, `article-missing`) → suy ra 6 nhóm: Thì, Hoà hợp chủ ngữ – động từ, Mạo từ, Chính tả, Dùng từ, Ngữ pháp khác. Mã cố định giúp đếm **lỗi lặp lại** chính xác (lỗi chính tả gom theo từ đúng).
- Bật `fallbacks: "default"`: nếu model từ chối vì bộ lọc an toàn, Anthropic tự chạy lại trên model dự phòng.
- Route có kiểm tra độ dài (≤ 300 ký tự), mã truy cập, giới hạn 15 request/phút/IP.

### Sổ lỗi sai — `src/lib/mistakes.ts`

- Leitner 5 hộp: ôn đúng lên hộp (1 → 3 → 7 → 14 → 30 ngày), sai về hộp 0. Qua hộp cuối = **đã khắc phục**.
- Mắc lại lỗi cùng kiểu → các lỗi cũ cùng kiểu bị đưa về hộp 0.

### Kho từ & bài nghe — `src/data/`

- `words.ts`: 240 từ tự soạn theo 14 chủ đề Part 1 (A1: 16, A2: 72, B1: 125, B2: 27). Không nạp NGSL vì danh sách đó chỉ có headword, còn mỗi thẻ cần nghĩa Việt, IPA, trọng âm, collocation, câu ví dụ A2–B1. Test kiểm tra từng từ.
- Chủ đề "Từ bạn thêm" (`mylist` trong `words.ts`): từ người học gửi trong chat, học trước theo `MY_WORD_IDS`.
- `class-words.ts`: từ vựng trên lớp, chia theo LIST, lấy từ Google Sheet của trung tâm. Thẻ mới thuộc chủ đề "Từ trên lớp". Từ đã có trong kho chỉ được gắn nhãn LIST, không tạo thẻ trùng. Thứ tự học: từ tự gửi, rồi tới LIST 1, 2, 3…
  - `npm run class-lists`: đọc sheet và báo LIST nào mới hoặc đã bị sửa (so số dòng với `sourceRows`), kèm các dòng cần soạn. Thêm `-- --all` để in mọi LIST. Script chỉ đọc, không sửa file.
- `dictation.ts`: 24 bài A1–B1 kèm bản dịch.
- `speaking-questions.ts`: 70 câu hỏi Part 1. `writing-prompts.ts`: 26 đề General Training + hướng dẫn và mẫu câu theo dạng đề.

## Cấu trúc

```
src/
  app/                    # route (server) — mỗi page render một view client; api/ cho route AI
  components/views/       # màn hình
  components/             # Nav, Pronounce, WeeklyChart, SentencePractice, SentenceFeedbackView, DiffText, ui
  data/                   # kho từ, chủ đề, bài kiểm tra đầu vào, bài nghe chép
  lib/
    ai/                   # chỉ chạy ở server: gọi Claude, bộ chấm giả
    ai-client.ts          # gọi route AI từ trình duyệt
    srs.ts  planner.ts  stats.ts  placement.ts  mistakes.ts
    text.ts               # so khớp đáp án, diff ký tự / theo từ, tìm từ trong câu, trọng âm
    speech.ts             # SpeechSynthesis + Free Dictionary API
    store.ts              # store client (useSyncExternalStore) + các action
    repository/           # lớp truy cập dữ liệu
```

## Lưu trữ & chuyển sang Supabase

UI không gọi trực tiếp `localStorage`. Mọi dữ liệu đi qua `store.ts` → `StudyRepository` (`src/lib/repository/types.ts`), một interface async:

| Phương thức | Bảng Supabase dự kiến |
|---|---|
| `saveSettings` | `user_settings` (1 dòng / user) |
| `saveCards` | `cards` (user_id, word_id, reps, ease, interval, due, …) — upsert |
| `savePlan` | `daily_plans` (user_id, date, word_ids, extra) |
| `saveActivity` | `activity` (user_id, date, new_words, reviews, forgot, sentences, dictations, error_reviews) |
| `savePlacement` | `placement_results` |
| `appendSentence` | `sentence_attempts` (feedback lưu dạng jsonb) |
| `saveErrors` / `deleteError` | `error_entries` (có cột `source`: sentence / speaking / writing) — upsert / delete theo id |
| `appendDictation` | `dictation_results` |
| `appendSpeaking` | `speaking_attempts` (feedback jsonb) |
| `appendWriting` | `writing_submissions` (week, prompt_id, text, feedback jsonb) |
| `saveReport` | `weekly_reports` — upsert theo (user_id, week) |

Để chuyển: viết `SupabaseStudyRepository implements StudyRepository`, trả về nó trong `getRepository()` (`src/lib/repository/index.ts`). File sao lưu JSON ở trang Cài đặt có thể dùng để chuyển dữ liệu cũ lên.

## Ghi chú kỹ thuật

- Next.js 16 với `cacheComponents`: trang đã mở được giữ trạng thái khi chuyển trang (React Activity). Dữ liệu chỉ đọc phía client (server snapshot = `null` → hiện skeleton) để không lệch hydration.
- Nhận giọng nói (Speaking) cần HTTPS hoặc `localhost`; mở bằng IP LAN qua http trên điện thoại sẽ không bật được micro. Âm thanh được gửi qua dịch vụ nhận dạng của Google (Chrome) / Apple (Safari).
- Phát âm: bật “Ưu tiên giọng người thật” sẽ lấy mp3 từ dictionaryapi.dev (ưu tiên giọng UK), không có thì dùng giọng đọc của trình duyệt. Dictation luôn dùng giọng đọc trình duyệt. Chrome/Edge có nhiều giọng en-GB hơn Firefox.
- Deploy Vercel: import repo, thêm `ANTHROPIC_API_KEY` và `APP_ACCESS_CODE` trong Project Settings → Environment Variables.
