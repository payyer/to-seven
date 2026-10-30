import type { GrammarTopic } from "@/lib/courses/types";
const bc = (slug: string) =>
  `https://learnenglish.britishcouncil.org/free-resources/grammar/${slug}`;
const cam = (slug: string) =>
  `https://dictionary.cambridge.org/grammar/british-grammar/${slug}`;
function topic(
  id: string,
  title: string,
  lessonIds: number[],
  useVi: string,
  forms: string[],
  examples: [string, string][],
  mistakes: [string, string, string][],
  compareVi: string,
  url: string,
): GrammarTopic {
  return {
    id,
    title,
    lessonRefs: lessonIds.map((lesson) => ({
      levelId: "pre-intermediate",
      lesson,
    })),
    useVi,
    forms,
    examples: examples.map(([en, vi]) => ({ en, vi })),
    mistakes: mistakes.map(([wrong, correct, why]) => ({
      wrong,
      correct,
      why,
    })),
    compareVi,
    sources: [
      {
        title: url.includes("cambridge")
          ? "Cambridge · English Grammar Today"
          : "British Council · LearnEnglish",
        url,
      },
    ],
  };
}
export const GRAMMAR_TOPICS: GrammarTopic[] = [
  topic(
    "questions",
    "Cách đặt câu hỏi",
    [1, 5],
    "Dùng câu hỏi Yes/No để xác nhận và Wh- để hỏi thông tin cụ thể. Xác định động từ chính là be, động từ thường hay động từ khuyết thiếu trước khi sắp xếp câu.",
    [
      "Be: (Wh-) + am/is/are/was/were + S …?",
      "Động từ thường: (Wh-) + do/does/did + S + V nguyên mẫu …?",
      "Khuyết thiếu: (Wh-) + can/will/should + S + V …?",
      "Hỏi chủ ngữ: Who/What + động từ …? Không thêm do nếu Who/What chính là chủ ngữ.",
    ],
    [
      ["Where does Mai work?", "Mai làm việc ở đâu?"],
      ["Why did you leave early?", "Tại sao bạn về sớm?"],
      ["Who called you?", "Ai đã gọi cho bạn?"],
    ],
    [
      [
        "Where does she works?",
        "Where does she work?",
        "Does đã mang dấu hiệu ngôi thứ ba; work trở về nguyên mẫu.",
      ],
      [
        "Why you are late?",
        "Why are you late?",
        "Với be, đảo be lên trước chủ ngữ.",
      ],
    ],
    "Who did you call? hỏi người bạn gọi (tân ngữ). Who called you? hỏi người đã gọi bạn (chủ ngữ). What is it like? hỏi đặc điểm; What does he like? hỏi sở thích.",
    cam("questions-wh-questions"),
  ),
  topic(
    "present",
    "Hiện tại đơn và hiện tại tiếp diễn",
    [1],
    "Hiện tại đơn nói về thói quen, sự thật và trạng thái. Hiện tại tiếp diễn nói về hành động đang diễn ra hoặc tình huống tạm thời quanh hiện tại.",
    [
      "Hiện tại đơn: S + V(s/es). Phủ định: S + don't/doesn't + V.",
      "Câu hỏi: Do/Does + S + V …? Be dùng am/is/are, không đi với do/does.",
      "Tiếp diễn: S + am/is/are + V-ing. Phủ định: thêm not sau be.",
      "Câu hỏi tiếp diễn: Am/Is/Are + S + V-ing …?",
    ],
    [
      ["She works in a bank.", "Cô ấy làm việc ở ngân hàng."],
      [
        "She is working from home this week.",
        "Tuần này cô ấy tạm làm việc ở nhà.",
      ],
      ["Does he like this book?", "Anh ấy có thích cuốn sách này không?"],
    ],
    [
      ["She don't work here.", "She doesn't work here.", "She đi với doesn't."],
      [
        "I am knowing the answer.",
        "I know the answer.",
        "Know thường là động từ trạng thái, không dùng tiếp diễn trong nghĩa này.",
      ],
    ],
    "Every day/usually thường gợi ý thói quen; now/at the moment thường gợi ý đang diễn ra. Đây là dấu hiệu hỗ trợ, cần xét ngữ cảnh. Like, know, want thường dùng dạng đơn khi diễn tả trạng thái.",
    bc("a1-a2/present-simple"),
  ),
  topic(
    "frequency",
    "Trạng từ tần suất và mức độ",
    [1, 5],
    "Always, usually, often, sometimes, rarely, hardly ever và never cho biết mức độ thường xuyên. Absolutely, really, particularly và pretty giúp nhấn mạnh hoặc điều chỉnh mức độ.",
    [
      "Tần suất: S + trạng từ + động từ thường; S + be + trạng từ.",
      "Có trợ động từ: trạng từ thường sau trợ động từ đầu tiên, ví dụ have never been.",
      "Really/particularly thường trước động từ được bổ nghĩa; pretty thường trước tính từ.",
      "Never/hardly ever đã mang nghĩa phủ định; không thêm don't để diễn tả cùng ý phủ định.",
    ],
    [
      ["I usually walk to class.", "Tôi thường đi bộ đến lớp."],
      ["She is never late.", "Cô ấy không bao giờ đến muộn."],
      ["I'm pretty sure.", "Tôi khá chắc."],
    ],
    [
      [
        "I don't never eat fish.",
        "I never eat fish.",
        "Tránh phủ định kép trong tiếng Anh chuẩn.",
      ],
      [
        "She visits hardly ever us.",
        "She hardly ever visits us.",
        "Đặt hardly ever trước động từ thường.",
      ],
    ],
    "Các tỷ lệ như 70% hay 5% trong bài là thang luyện tập gần đúng. Usually và often không có tỷ lệ phần trăm cố định cho mọi ngữ cảnh. Absolutely delicious dùng để nhấn mạnh ngon tuyệt.",
    cam("adverbs-and-adverb-phrases-position"),
  ),
  topic(
    "past",
    "Quá khứ đơn và quá khứ tiếp diễn",
    [3, 5],
    "Quá khứ đơn kể sự việc hoàn tất hoặc các sự việc nối tiếp. Quá khứ tiếp diễn mô tả hành động đang diễn ra tại một thời điểm quá khứ; thường làm nền cho một sự việc xen vào.",
    [
      "Đơn: S + V2/ed. Phủ định: S + didn't + V. Hỏi: Did + S + V …?",
      "Be quá khứ: I/he/she/it + was; you/we/they + were.",
      "Tiếp diễn: S + was/were + V-ing. Phủ định: wasn't/weren't + V-ing.",
      "Hỏi: Was/Were + S + V-ing …?",
    ],
    [
      ["We left home at seven.", "Chúng tôi rời nhà lúc bảy giờ."],
      [
        "We were driving when it started to rain.",
        "Chúng tôi đang lái xe thì trời bắt đầu mưa.",
      ],
      ["What were you doing at eight?", "Lúc tám giờ bạn đang làm gì?"],
    ],
    [
      ["Did you went?", "Did you go?", "Sau did dùng nguyên mẫu."],
      ["They was waiting.", "They were waiting.", "They đi với were."],
    ],
    "While thường đi với hành động kéo dài nhưng không tự động quyết định thì. When we arrived, she was cooking: cô ấy đã bắt đầu nấu trước lúc chúng tôi đến. When we arrived, she cooked: cô ấy bắt đầu nấu sau khi chúng tôi đến.",
    bc("a1-a2/past-continuous-past-simple"),
  ),
  topic(
    "linking",
    "Từ nối: and, but, so, because, when",
    [4, 5, 11],
    "Chọn từ nối theo quan hệ ý nghĩa giữa hai ý: bổ sung, tương phản, kết quả, nguyên nhân hoặc thời gian. Because là liên từ phụ thuộc, không thuộc nhóm FANBOYS.",
    [
      "Ý 1 + and + ý bổ sung.",
      "Ý 1 + but + ý tương phản.",
      "Nguyên nhân + so + kết quả.",
      "Kết quả + because + nguyên nhân.",
      "When + mệnh đề thời gian, mệnh đề chính; hoặc mệnh đề chính + when …",
    ],
    [
      ["It was raining, so we took a taxi.", "Trời mưa nên chúng tôi đi taxi."],
      [
        "We took a taxi because it was raining.",
        "Chúng tôi đi taxi vì trời mưa.",
      ],
      [
        "The room was small, but it was comfortable.",
        "Phòng nhỏ nhưng thoải mái.",
      ],
    ],
    [
      [
        "Because it rained, so we stayed home.",
        "Because it rained, we stayed home.",
        "Không dùng đồng thời because và so để nối cùng một cặp nguyên nhân–kết quả trong cấu trúc này.",
      ],
    ],
    "Because + mệnh đề có chủ ngữ và động từ; because of + danh từ/cụm danh từ. And không nhất thiết diễn tả nguyên nhân. But thể hiện sự tương phản có ý nghĩa.",
    cam("conjunctions"),
  ),
  topic(
    "greetings",
    "Chào hỏi, bắt chuyện và tạm biệt",
    [2],
    "Dùng mẫu câu giao tiếp để mở đầu cuộc trò chuyện, hỏi thăm, giới thiệu người khác và kết thúc lịch sự. Chọn theo quan hệ giữa người nói và tình huống.",
    [
      "Nice to meet you: gặp lần đầu. Nice to see you again: gặp lại.",
      "Long time no see! / What a lovely surprise! / How nice!",
      "I'd like to introduce you to + người.",
      "I really must go. / It was great seeing you. / We must meet again soon.",
    ],
    [
      ["Nice to meet you, Linh.", "Rất vui được gặp bạn, Linh."],
      ["What a lovely surprise!", "Thật là một bất ngờ thú vị!"],
      ["It was great seeing you again.", "Thật vui được gặp lại bạn."],
    ],
    [
      ["Nice meet you.", "Nice to meet you.", "Nice + to V trong mẫu câu này."],
      [
        "I must to go.",
        "I must go.",
        "Sau must dùng động từ nguyên mẫu không to.",
      ],
    ],
    "What + a/an + tính từ + danh từ đếm được số ít: What a surprise! How + tính từ: How nice! News không đếm được nên nói fantastic news, không phải a fantastic news.",
    cam("exclamations"),
  ),
  topic(
    "travel",
    "Hỏi thông tin lịch sự và câu hỏi gián tiếp",
    [4],
    "Dùng Could you tell me…? / Do you know…? để hỏi thông tin lịch sự tại nhà ga hoặc trong giao tiếp hằng ngày.",
    [
      "Trực tiếp: Where is the ticket office?",
      "Gián tiếp: Could you tell me + where + the ticket office + is?",
      "Yes/No gián tiếp: Could you tell me if/whether + S + V …?",
      "Can I + V …? để xin phép; Can I help you with + danh từ? để đề nghị giúp.",
    ],
    [
      [
        "Could you tell me where the bus stop is?",
        "Bạn có thể cho tôi biết trạm xe buýt ở đâu không?",
      ],
      [
        "Do you know what time the train leaves?",
        "Bạn có biết tàu rời ga lúc mấy giờ không?",
      ],
      ["Can I pay by card?", "Tôi có thể trả bằng thẻ không?"],
    ],
    [
      [
        "Could you tell me where is the station?",
        "Could you tell me where the station is?",
        "Mệnh đề hỏi gián tiếp không đảo be.",
      ],
      [
        "Do you know when does it leave?",
        "Do you know when it leaves?",
        "Không giữ does trong mệnh đề hỏi gián tiếp.",
      ],
    ],
    "Phần Could you tell me vẫn là câu hỏi, nhưng mệnh đề thông tin bên trong dùng thứ tự câu trần thuật. Where can I buy a ticket? → Could you tell me where I can buy a ticket?",
    "https://downloads.bbc.co.uk/worldservice/learningenglish/grammarchallenge/pdfs/gc_36_indirect_questions_explanation.pdf",
  ),
  topic(
    "perfect",
    "Hiện tại hoàn thành, quá khứ đơn, already và yet",
    [6, 10],
    "Hiện tại hoàn thành liên kết quá khứ với hiện tại: trải nghiệm tới nay, kết quả hiện tại, hoặc khoảng thời gian chưa kết thúc. Quá khứ đơn dùng khi định vị sự việc trong một thời gian quá khứ đã kết thúc.",
    [
      "S + have/has + V3. Phủ định: haven't/hasn't + V3.",
      "Have/Has + S + V3 …? Have you ever + V3 …?",
      "Already thường giữa have/has và V3; yet thường cuối câu hỏi/phủ định.",
      "Yesterday, last week, two years ago thường đi với quá khứ đơn khi nói việc đã xảy ra lúc đó.",
    ],
    [
      ["I've already paid for the tickets.", "Tôi đã thanh toán vé rồi."],
      ["Have you booked the hotel yet?", "Bạn đã đặt khách sạn chưa?"],
      ["I booked it yesterday.", "Tôi đã đặt hôm qua."],
    ],
    [
      [
        "I have bought it yesterday.",
        "I bought it yesterday.",
        "Yesterday xác định thời gian quá khứ đã kết thúc.",
      ],
      [
        "She has choose a gift.",
        "She has chosen a gift.",
        "Hiện tại hoàn thành cần V3: choose–chose–chosen.",
      ],
    ],
    "Have you ever been…? hỏi trải nghiệm tới hiện tại. When did you go…? hỏi thời điểm một chuyến đi đã xảy ra. Chưa hết tháng không có nghĩa mọi câu có this month đều bắt buộc dùng hiện tại hoàn thành; còn tùy cách nhìn thời gian/ngữ cảnh.",
    bc("b1-b2/present-perfect"),
  ),
  topic(
    "collocations",
    "Cụm từ với make, do và give",
    [6, 10],
    "Collocation là cách kết hợp từ tự nhiên. Học cả cụm và ý nghĩa, sau đó chia động từ chính theo thì/ngôi của câu.",
    [
      "Make: make friends / make a decision / make a donation.",
      "Do: do some shopping / do volunteer work / do someone a favour.",
      "Give: give someone advice / give directions.",
      "Quá khứ và V3: make–made–made; do–did–done; give–gave–given.",
    ],
    [
      ["Could you do me a favour?", "Bạn có thể giúp tôi một việc không?"],
      ["She gave me useful advice.", "Cô ấy cho tôi lời khuyên hữu ích."],
      ["We've made a decision.", "Chúng tôi đã đưa ra quyết định."],
    ],
    [
      [
        "Can you make me a favour?",
        "Can you do me a favour?",
        "Do someone a favour là cụm đúng.",
      ],
      [
        "He gave me an advice.",
        "He gave me some advice.",
        "Advice không đếm được; dùng some advice/a piece of advice.",
      ],
    ],
    "Make thường gắn với tạo ra kết quả và do với hoạt động, nhưng đây chỉ là mẹo. Cần nhớ cụm cố định: make a donation và give a donation đều có thể tự nhiên; do a donation không phù hợp.",
    cam("do-or-make"),
  ),
  topic(
    "shopping",
    "Giao tiếp mua sắm và đổi ý",
    [7, 10],
    "Dùng mẫu câu để hỏi giá, nhờ nhân viên giúp, quyết định mua và đổi phương thức thanh toán. Chú ý sự khác nhau giữa hỏi giúp và xin phép.",
    [
      "Can I help you? / I'm looking for + danh từ.",
      "Do you have anything + tính từ so sánh hơn?",
      "I'll take + món hàng. / On second thoughts, I'll take … instead.",
      "How would you like to pay? — In cash / By card.",
    ],
    [
      ["Do you have anything cheaper?", "Bạn có món nào rẻ hơn không?"],
      [
        "On second thoughts, I'll take the blue one.",
        "Nghĩ lại thì tôi sẽ lấy cái màu xanh.",
      ],
      ["I'll pay by card.", "Tôi sẽ thanh toán bằng thẻ."],
    ],
    [
      [
        "I'll to take it.",
        "I'll take it.",
        "Sau will dùng nguyên mẫu không to.",
      ],
      [
        "I'll pay by cash.",
        "I'll pay in cash.",
        "Cách nói chuẩn cần học là in cash; by card.",
      ],
    ],
    "Receipt là chứng từ mua hàng; refund là tiền hoàn lại. Can I help you? là đề nghị giúp; Can you help me? là nhờ người khác giúp.",
    cam("offers"),
  ),
  topic(
    "future",
    "Tương lai: will, going to, hiện tại tiếp diễn, shall",
    [8, 10, 11],
    "Chọn dạng tương lai theo ý nghĩa. Will thường dùng cho quyết định lúc nói, dự đoán hoặc lời hứa. Be going to diễn tả dự định đã có hoặc dự đoán dựa trên dấu hiệu. Hiện tại tiếp diễn dùng cho lịch đã sắp xếp.",
    [
      "S + will/won't + V; Will + S + V …?",
      "S + am/is/are + going to + V; Are you going to + V …?",
      "S + am/is/are + V-ing + thời gian tương lai khi nói lịch hẹn.",
      "Shall I + V …? đề nghị giúp; Shall we + V …? gợi ý cùng làm.",
    ],
    [
      [
        "The phone is ringing. I'll answer it.",
        "Điện thoại đang reo. Tôi sẽ nghe.",
      ],
      [
        "I'm going to study tonight; that's my plan.",
        "Tôi định học tối nay; đó là kế hoạch của tôi.",
      ],
      [
        "We're meeting at six. We've agreed on the time.",
        "Chúng tôi sẽ gặp lúc sáu giờ; đã thống nhất giờ rồi.",
      ],
    ],
    [
      [
        "She is going buy a dress.",
        "She is going to buy a dress.",
        "Thiếu to trong be going to + V.",
      ],
      [
        "Shall we visiting the museum?",
        "Shall we visit the museum?",
        "Sau shall dùng V nguyên mẫu.",
      ],
    ],
    "Các dạng này có thể chồng lấn về ý nghĩa. Đừng chỉ nhìn tomorrow để chọn will. Chú ý bằng chứng như We've booked/We've agreed hoặc I promise. Hiện tại tiếp diễn còn dùng để hỏi dự định một cách tự nhiên.",
    bc("b1-b2/future-forms-will-be-going-present-continuous"),
  ),
  topic(
    "invitations",
    "Lời mời, sắp xếp lịch và phản hồi",
    [9, 10],
    "Mời ai làm gì, nhận hoặc từ chối lịch sự, đề xuất lịch khác và xin thời gian kiểm tra lịch. Phân biệt chức năng của cả câu, không chỉ nhìn một vài từ.",
    [
      "Would you like + to V …? / I'd like to invite you + to V.",
      "How about + V-ing / danh từ? Shall we + V …?",
      "I'd love to, but … / I'm afraid I can't …",
      "Hang on a minute. Let me check my calendar.",
      "Look forward to + V-ing / danh từ; let + người + V nguyên mẫu.",
    ],
    [
      [
        "Would you like to come round for dinner?",
        "Bạn có muốn ghé nhà ăn tối không?",
      ],
      [
        "I'm afraid I can't. How about Friday instead?",
        "Tiếc là tôi không được. Thứ Sáu thay vào đó nhé?",
      ],
      ["I'm looking forward to seeing you.", "Tôi mong được gặp bạn."],
    ],
    [
      [
        "How about to meet at six?",
        "How about meeting at six?",
        "Sau how about dùng V-ing.",
      ],
      [
        "I look forward to see you.",
        "I look forward to seeing you.",
        "To ở đây là giới từ, theo sau là V-ing.",
      ],
    ],
    "Could we do another day? là đề nghị đổi lịch. Hang on/Let me check là xin thời gian suy nghĩ. I'd love to có to vì động từ chính đã được lược bỏ từ lời mời trước đó.",
    cam("invitations"),
  ),
  topic(
    "countability",
    "Danh từ đếm được, không đếm được và lượng từ",
    [10],
    "Xét danh từ theo nghĩa đang dùng. Danh từ đếm được có số ít/số nhiều; danh từ không đếm được thường không dùng a/an hoặc dạng số nhiều trong nghĩa đó.",
    [
      "A/an + danh từ đếm được số ít; many/a few + danh từ đếm được số nhiều.",
      "Much/a little + danh từ không đếm được.",
      "Some/any dùng được với cả số nhiều đếm được và danh từ không đếm được.",
      "Một đơn vị: a piece of advice/information; a bottle of water.",
    ],
    [
      ["How much money do you need?", "Bạn cần bao nhiêu tiền?"],
      ["There are a few tickets left.", "Còn lại một ít vé."],
      ["Can you give me some advice?", "Bạn có thể cho tôi lời khuyên không?"],
    ],
    [
      [
        "I need an information.",
        "I need some information.",
        "Information không đếm được trong nghĩa thông tin.",
      ],
      ["How many money?", "How much money?", "Money không đếm được."],
    ],
    "Advice, information, furniture, luggage, clothing, money và accommodation (nơi ở, Anh-Anh) không đếm được. A few/a little mang nghĩa còn một ít; few/little thường nhấn mạnh ít, không đủ. Nghĩa khác có thể làm thay đổi cách đếm: a coffee có thể là một suất/cốc cà phê.",
    bc("english-grammar-reference/uncount-nouns"),
  ),
  topic(
    "modals",
    "Bắt buộc, cấm và được phép",
    [11],
    "Must/have to diễn tả yêu cầu bắt buộc; mustn't diễn tả bị cấm; don't have to diễn tả không cần thiết; can diễn tả được phép trong ngữ cảnh nội quy.",
    [
      "S + must/mustn't/can/can't + V nguyên mẫu.",
      "I/you/we/they have to + V; he/she/it has to + V.",
      "Phủ định không bắt buộc: don't/doesn't have to + V.",
      "Câu hỏi: Do/Does + S + have to + V …? / Can + S + V …?",
    ],
    [
      ["Visitors must wear a badge.", "Khách bắt buộc đeo thẻ."],
      [
        "You mustn't use your phone here.",
        "Bạn không được dùng điện thoại ở đây.",
      ],
      ["You don't have to bring lunch.", "Bạn không bắt buộc mang bữa trưa."],
    ],
    [
      ["He musts leave.", "He must leave.", "Must không thêm s."],
      [
        "You mustn't bring lunch; the café is optional.",
        "You don't have to bring lunch; the café is available.",
        "Không cần mang khác với cấm mang.",
      ],
    ],
    "Mustn't không phải dạng đối nghĩa 'không cần' của must. Must và have to thường chồng lấn; không nên coi phân biệt nội tâm/bên ngoài là quy tắc tuyệt đối. Quá khứ bắt buộc thường dùng had to.",
    bc("b1-b2/modals-permission-obligation"),
  ),
  topic(
    "predictions",
    "Dự đoán: will, may, might và bị động đơn giản",
    [11],
    "Will diễn tả dự đoán hoặc điều người nói tin sẽ xảy ra. May, might và could diễn tả một khả năng chưa chắc chắn. Khi chủ ngữ chịu tác động của hành động, có thể dùng dạng bị động sau động từ khuyết thiếu.",
    [
      "S + will/may/might/could + V nguyên mẫu.",
      "Phủ định: won't + V; may not/might not + V.",
      "Câu hỏi tương lai thông dụng: Will + S + V …?",
      "Bị động: S + may/might/will + be + V3; có thể thêm by + người/vật thực hiện.",
    ],
    [
      [
        "More people might work from home.",
        "Có thể sẽ có nhiều người làm việc ở nhà hơn.",
      ],
      [
        "Some dangerous jobs might be done by robots.",
        "Một số công việc nguy hiểm có thể được robot thực hiện.",
      ],
      [
        "Healthcare workers will remain important.",
        "Nhân viên y tế sẽ tiếp tục giữ vai trò quan trọng.",
      ],
    ],
    [
      [
        "He might works from home.",
        "He might work from home.",
        "Sau might dùng động từ nguyên mẫu, không thêm s.",
      ],
      [
        "The job might done by a robot.",
        "The job might be done by a robot.",
        "Bị động sau might cần be + V3.",
      ],
    ],
    "Will thể hiện một dự đoán hoặc niềm tin, không bảo đảm điều đó chắc chắn xảy ra. Không gán tỷ lệ phần trăm cố định cho may/might/could. Để giải thích dự đoán, nối với because + mệnh đề nguyên nhân; because không thuộc FANBOYS.",
    bc("b1-b2/future-degrees-certainty"),
  ),
  topic(
    "offers",
    "Đề nghị giúp, gợi ý và trấn an",
    [12],
    "Offer: người nói đề nghị tự làm việc gì để giúp người nghe. Suggestion: đưa ra ý tưởng hoặc lời khuyên để ai đó cân nhắc làm.",
    [
      "Offer: Shall I + V? / I'll + V. / Let me + V.",
      "Offer: Would you like me + to V …?",
      "Suggestion: Why don't you + V? / You could/should + V.",
      "Suggestion: How about + V-ing? / Shall we + V?",
      "Nhận giúp: Yes, please. That would be great. Trấn an: Never mind. Don't worry.",
    ],
    [
      ["Shall I carry your bag?", "Để tôi mang túi giúp bạn nhé?"],
      ["Why don't you ask your manager?", "Sao bạn không hỏi quản lý?"],
      [
        "Would you like me to book a room?",
        "Bạn có muốn tôi đặt phòng giúp không?",
      ],
    ],
    [
      ["Let me to help.", "Let me help.", "Sau let me dùng V nguyên mẫu."],
      [
        "Would you like me helping?",
        "Would you like me to help?",
        "Would you like me + to V.",
      ],
      ["You should to ask.", "You should ask.", "Sau should không có to."],
    ],
    "Shall I…? thường là offer; Shall we…? thường gợi ý cùng làm. Why don't I book…? cũng có thể là offer vì người nói nhận làm; Why don't you…? thường là suggestion cho người nghe.",
    cam("offers"),
  ),
];
export const GRAMMAR_BY_ID = Object.fromEntries(
  GRAMMAR_TOPICS.map((t) => [t.id, t]),
);
