export type WritingTaskType = "letter-informal" | "letter-semiformal" | "letter-formal" | "opinion";

export interface WritingPrompt {
  id: string;
  type: WritingTaskType;
  titleVi: string;
  prompt: string;
  bullets: string[];
}

/** Hướng dẫn chung theo dạng đề (IELTS General Training, rút gọn còn 80–120 từ). */
export const TASK_GUIDE: Record<WritingTaskType, { label: string; tipsVi: string[]; phrases: string[] }> = {
  "letter-informal": {
    label: "Thư thân mật (gửi bạn bè)",
    tipsVi: [
      "Mở đầu: Dear + tên (Dear Tom,)",
      "Trả lời đủ 3 gạch đầu dòng, mỗi ý 1–2 câu",
      "Giọng thân thiện, được viết tắt (I'm, can't)",
      "Kết thư: Best wishes, hoặc Love, + tên bạn",
    ],
    phrases: ["It was great to hear from you.", "I'm writing to tell you about…", "Why don't you…?", "I can't wait to see you!"],
  },
  "letter-semiformal": {
    label: "Thư bán trang trọng (hàng xóm, quản lý, giáo viên)",
    tipsVi: [
      "Mở đầu: Dear Mr / Ms + họ (Dear Mr Brown,)",
      "Lịch sự nhưng không quá cứng nhắc",
      "Trả lời đủ 3 gạch đầu dòng",
      "Kết thư: Kind regards, + họ tên",
    ],
    phrases: ["I'm writing to let you know that…", "I would be grateful if you could…", "I hope this is not a problem.", "Thank you for your understanding."],
  },
  "letter-formal": {
    label: "Thư trang trọng (công ty, cơ quan)",
    tipsVi: [
      "Mở đầu: Dear Sir or Madam,",
      "Câu đầu nêu ngay lý do viết thư",
      "Không viết tắt: I am, I would (không dùng I'm, I'd)",
      "Kết thư: Yours faithfully, + họ tên",
    ],
    phrases: ["I am writing to complain about…", "I am writing to apply for…", "I would like to request…", "I look forward to hearing from you."],
  },
  opinion: {
    label: "Đoạn văn nêu ý kiến (Task 2 rút gọn)",
    tipsVi: [
      "Câu 1: nêu rõ ý kiến (I agree / I disagree that…)",
      "Câu 2–3: một lý do và giải thích",
      "Câu 4–5: một ví dụ từ chính cuộc sống của bạn",
      "Câu cuối: nhắc lại ý kiến",
    ],
    phrases: ["In my opinion, …", "The main reason is that…", "For example, …", "For these reasons, I believe that…"],
  },
};

const OPINION_BULLETS = ["give your opinion", "give one reason", "give one example from your own life"];

const letter = (id: string, type: WritingTaskType, titleVi: string, prompt: string, bullets: string[]): WritingPrompt => ({
  id,
  type,
  titleVi,
  prompt: `${prompt}\nWrite a letter (80–120 words). In your letter:`,
  bullets,
});

const opinion = (id: string, titleVi: string, statement: string): WritingPrompt => ({
  id,
  type: "opinion",
  titleVi,
  prompt: `${statement}\nWrite a short paragraph (80–120 words) to:`,
  bullets: OPINION_BULLETS,
});

/** 26 đề (đủ khoảng 6 tháng), xen kẽ thư và đoạn ý kiến. */
export const WRITING_PROMPTS: WritingPrompt[] = [
  letter("inf-visit", "letter-informal", "Bạn sắp đến thăm thành phố của bạn", "A friend is coming to visit your city for the first time.", [
    "suggest the best time to come",
    "recommend some places to visit",
    "offer to help with something",
  ]),
  opinion("op-online-shopping", "Mua sắm online hay ở cửa hàng", "Some people prefer shopping online, while others prefer shopping in stores. Which do you prefer?"),
  letter("formal-damaged", "letter-formal", "Khiếu nại hàng bị hỏng", "You bought something online, but it arrived damaged.", [
    "say what you bought and when",
    "describe the problem",
    "say what you want the company to do",
  ]),
  opinion("op-phones-children", "Trẻ em và điện thoại", "Children should not have a smartphone before the age of 12. Do you agree or disagree?"),
  letter("semi-noise", "letter-semiformal", "Hàng xóm ồn ào", "Your neighbour often plays loud music late at night.", [
    "explain the problem",
    "say how it affects you",
    "suggest a solution",
  ]),
  opinion("op-work-home", "Làm việc ở nhà", "Working from home is better than working in an office. Do you agree or disagree?"),
  letter("inf-thanks", "letter-informal", "Cảm ơn bạn đã cho ở nhờ", "Last month you stayed at a friend's house for a few days.", [
    "thank your friend",
    "say what you enjoyed most",
    "invite your friend to visit you",
  ]),
  opinion("op-free-transport", "Phương tiện công cộng miễn phí", "Public transport in cities should be free for everyone. Do you agree or disagree?"),
  letter("formal-job", "letter-formal", "Xin việc bán thời gian", "You saw an advertisement for a part-time job at a local café.", [
    "say which job you are applying for and where you saw it",
    "describe your experience and skills",
    "say when you are available for an interview",
  ]),
  opinion("op-online-learning", "Học tiếng Anh online", "Learning English online is as effective as learning in a classroom. Do you agree or disagree?"),
  letter("semi-day-off", "letter-semiformal", "Xin quản lý cho nghỉ một ngày", "You need to take a day off work next week.", [
    "explain why you need the day off",
    "say which day you want",
    "explain how your work will be done",
  ]),
  opinion("op-city-country", "Thành phố hay nông thôn", "Living in a city is better than living in the countryside. Do you agree or disagree?"),
  letter("inf-hobby", "letter-informal", "Khuyên bạn chọn sở thích mới", "A friend wants to start a new hobby and has asked for your advice.", [
    "recommend a hobby",
    "explain why it is a good choice",
    "give some advice on how to start",
  ]),
  opinion("op-fast-food", "Đánh thuế đồ ăn nhanh", "Fast food should be more expensive to protect people's health. Do you agree or disagree?"),
  letter("formal-gym", "letter-formal", "Phòng gym đóng cửa sớm", "Your local gym is planning to close early at the weekend.", [
    "explain why the gym is important to you",
    "describe the problem this change will cause",
    "suggest what the gym could do instead",
  ]),
  opinion("op-social-media", "Mạng xã hội và các mối quan hệ", "Social media brings people closer together. Do you agree or disagree?"),
  letter("semi-landlord", "letter-semiformal", "Báo chủ nhà sửa đồ hỏng", "Something in the flat you rent is broken.", [
    "describe the problem",
    "say when it started",
    "say what you would like your landlord to do",
  ]),
  opinion("op-travel-culture", "Du lịch để hiểu văn hoá", "Travelling abroad is the best way to learn about other cultures. Do you agree or disagree?"),
  letter("inf-move", "letter-informal", "Kể về căn hộ mới", "You have recently moved to a new apartment.", [
    "describe the apartment",
    "say what you like about the neighbourhood",
    "invite your friend for dinner",
  ]),
  opinion("op-exercise", "Tập thể dục mỗi ngày", "Everyone should do some exercise every day. Do you agree or disagree?"),
  letter("formal-council", "letter-formal", "Góp ý giao thông công cộng", "The public transport in your area is not good enough.", [
    "describe the problem",
    "explain how it affects local people",
    "suggest an improvement",
  ]),
  opinion("op-books-films", "Đọc sách hay xem phim", "Reading books is more useful than watching films. Do you agree or disagree?"),
  letter("semi-teacher", "letter-semiformal", "Báo giáo viên sẽ nghỉ học", "You will miss some of your English classes next month.", [
    "explain why you will miss the classes",
    "say how long you will be away",
    "ask how you can catch up",
  ]),
  opinion("op-ai-jobs", "AI và công việc", "Artificial intelligence will make people's jobs easier. Do you agree or disagree?"),
  letter("inf-course", "letter-informal", "Rủ bạn học cùng khoá tiếng Anh", "You are taking an English course and a friend wants to join it.", [
    "describe the course",
    "say what you like about it",
    "give your friend some advice",
  ]),
  opinion("op-live-parents", "Sống cùng bố mẹ", "It is better for young adults to live with their parents. Do you agree or disagree?"),
];
