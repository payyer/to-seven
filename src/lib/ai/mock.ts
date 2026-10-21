import "server-only";

import type { SentenceFeedback, SentenceIssue, SpeakingFeedback, WeeklyPlan, WritingFeedback } from "@/lib/types";

/**
 * Bộ chấm giả cho môi trường phát triển (AI_MOCK=1), không gọi API.
 * Chỉ bắt vài lỗi cố định để thử giao diện — không dùng cho học thật.
 */

function findIssues(text: string): { issues: SentenceIssue[]; corrected: string } {
  const issues: SentenceIssue[] = [];
  let corrected = text;
  const fix = (pattern: RegExp, replace: (m: string) => string, rule: string, hintVi: string, explanationVi: string) => {
    const match = pattern.exec(corrected);
    if (!match) return;
    const correction = replace(match[0]);
    issues.push({ rule, wrong: match[0], correction, hintVi, explanationVi });
    corrected = corrected.slice(0, match.index) + correction + corrected.slice(match.index + match[0].length);
  };
  fix(
    /\b(he|she|it|my \w+) (go|have|do|like|work)\b/i,
    (m) => {
      const s = m.slice(0, m.lastIndexOf(" "));
      const v = m.slice(m.lastIndexOf(" ") + 1);
      return `${s} ${v === "have" ? "has" : v === "go" || v === "do" ? `${v}es` : `${v}s`}`;
    },
    "agreement-third-person-s",
    "Chủ ngữ là ngôi thứ 3 số ít, động từ cần đổi thế nào?",
    "Chủ ngữ số ít nên động từ thêm -s/-es.",
  );
  fix(/\byesterday i go\b/i, (m) => m.replace(/go$/, "went"), "tense-past-simple", "“Yesterday” là quá khứ — động từ chia thì gì?", "Việc đã xong trong quá khứ dùng quá khứ đơn: go → went.");
  fix(/(?<![A-Za-z])i(?![A-Za-z])/, () => "I", "capitalization", "Đại từ này có cách viết đặc biệt.", "Đại từ “I” luôn viết hoa.");
  fix(/\bbecuase\b/i, () => "because", "spelling", "Kiểm tra lại thứ tự các chữ cái.", "Viết đúng là “because”.");
  fix(/\bhave (car|job|laptop)\b/i, (m) => m.replace("have ", "have a "), "article-missing", "Danh từ đếm được số ít cần thêm gì phía trước?", "Danh từ đếm được số ít cần mạo từ a/an.");
  return { issues, corrected };
}

export function mockSentenceFeedback(input: { word: string; sentence: string }): SentenceFeedback {
  const { issues, corrected } = findIssues(input.sentence);
  const stem = input.word.toLowerCase().slice(0, Math.max(3, input.word.length - 2));
  return {
    original: input.sentence,
    corrected,
    isCorrect: issues.length === 0,
    usesTargetWord: input.sentence.toLowerCase().includes(stem),
    issues,
    commentVi: issues.length ? "(Chấm thử) Ý câu rõ ràng, chỉ còn vài lỗi nhỏ." : "(Chấm thử) Câu đúng rồi, tốt lắm!",
    similar: { en: `My brother uses this ${input.word} every day.`, vi: `(Câu luyện thử với từ ${input.word})` },
  };
}

export function mockSpeakingFeedback(input: { answer: string; recentWords: { word: string }[] }): SpeakingFeedback {
  const { issues, corrected } = findIssues(input.answer);
  const sentences = input.answer.split(/[.!?]+/).filter((s) => s.trim()).length;
  const hasExample = /for example|for instance|last (week|weekend|year)/i.test(input.answer);
  const recent = input.recentWords[0];
  return {
    answer: input.answer,
    peer: {
      point: { status: "good", commentVi: "(Chấm thử) Bạn trả lời thẳng vào câu hỏi." },
      explain: { status: sentences >= 2 ? "good" : "weak", commentVi: "(Chấm thử) Thêm lý do: “I like it because …”" },
      example: { status: hasExample ? "good" : "missing", commentVi: "(Chấm thử) Thêm ví dụ: “For example, last weekend I …”" },
      result: { status: "weak", commentVi: "(Chấm thử) Kết bằng cảm nghĩ: “That's why I really enjoy it.”" },
    },
    issues,
    vocabUpgrades: /very good/i.test(input.answer) ? [{ original: "very good", better: "fantastic", whyVi: "Tự nhiên và mạnh hơn khi nói." }] : [],
    recentWordIdeas: recent ? [{ word: recent.word, sentence: `(Chấm thử) I could also say something with “${recent.word}”.` }] : [],
    improvedAnswer: `${corrected.trim()} For example, last weekend I did it with my friends. That's why I really enjoy it.`,
    commentVi: "(Chấm thử) Câu trả lời ngắn gọn, hãy thêm ví dụ cụ thể.",
    practice: { en: "She goes to the gym every morning.", vi: "Cô ấy đến phòng tập mỗi sáng." },
  };
}

export function mockWritingFeedback(input: { text: string }): WritingFeedback {
  const { issues, corrected } = findIssues(input.text);
  return {
    text: input.text,
    issues,
    registerSuggestions: /a lot of/i.test(input.text)
      ? [{ original: "a lot of", better: "a large number of", whyVi: "Trang trọng hơn trong thư / bài nghị luận." }]
      : [],
    correctedText: corrected,
    taskCommentVi: "(Chấm thử) Bài có mở đầu và kết thúc, kiểm tra xem đã đủ các ý của đề chưa.",
    commentVi: "(Chấm thử) Bố cục rõ ràng, cố gắng giảm lỗi ngữ pháp cơ bản.",
    practice: { en: "My manager has a lot of experience.", vi: "Quản lý của tôi có nhiều kinh nghiệm." },
  };
}

export function mockWeeklyPlan(): WeeklyPlan {
  const days = ["Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy", "Chủ nhật"];
  return {
    summaryVi: "(Chấm thử) Tuần này bạn học đều đặn. Cần ôn kỹ hơn lỗi hoà hợp chủ ngữ – động từ.",
    focusAreas: [
      { titleVi: "Hoà hợp chủ ngữ – động từ", whyVi: "(Chấm thử) Lỗi lặp lại nhiều nhất.", actionVi: "Ôn Sổ lỗi mỗi ngày, viết 3 câu với he/she." },
      { titleVi: "Nói nhiều hơn", whyVi: "(Chấm thử) Ít lượt Speaking.", actionVi: "Trả lời 2 câu Speaking mỗi ngày." },
    ],
    days: days.map((dayVi, i) => ({
      dayVi,
      tasksVi: i === 5 ? ["Ôn tập", "Writing đề tuần"] : i === 6 ? ["Ôn tập nhẹ"] : ["Ôn tập", "Học mới 8 từ", "Speaking 2 câu"],
    })),
    suggestedDailyNewWords: 8,
  };
}
