// Input: .next/lesson-source.json, extracted read-only from the DOCX files.
// Every answer below is curated against both Lesson and Answer Key. Never auto-guess answers.
import fs from "node:fs";
const sources = JSON.parse(fs.readFileSync(".next/lesson-source.json", "utf8").replace(/^\uFEFF/, ""));
const output = [];
const audit = [];
const topicNotes = {
  vocabulary: "Chọn từ/cụm từ đúng nghĩa trong ngữ cảnh và kiểm tra dạng của từ.",
  questions: "Câu hỏi dùng trợ động từ trước chủ ngữ; sau do/does/did dùng động từ nguyên mẫu. Với be, đảo be lên trước chủ ngữ.",
  present: "Hiện tại đơn diễn tả thói quen; hiện tại tiếp diễn dùng am/is/are + V-ing cho việc đang diễn ra. Kiểm tra thêm mốc thời gian trong đoạn.",
  frequency: "Trạng từ tần suất thường đứng trước động từ thường, sau be. Phần trăm trong bài chỉ là thang gợi ý, không phải định nghĩa cố định.",
  past: "Quá khứ đơn dùng V2/ed; phủ định và nghi vấn dùng did + động từ nguyên mẫu. Quá khứ tiếp diễn: was/were + V-ing cho hành động đang diễn ra.",
  linking: "And thêm ý; but diễn tả tương phản; because nêu nguyên nhân; so nêu kết quả; when nối với một thời điểm/sự việc.",
  greetings: "Chọn mẫu câu chào hỏi/tạm biệt phù hợp ngữ cảnh; chú ý to + động từ trong nice to see/meet.",
  travel: "Câu hỏi trực tiếp đảo trợ động từ; sau Could you tell me…, mệnh đề hỏi gián tiếp dùng thứ tự chủ ngữ + động từ.",
  perfect: "Hiện tại hoàn thành: have/has + V3 cho trải nghiệm hoặc kết quả liên quan hiện tại. Quá khứ đơn dùng với thời điểm quá khứ đã kết thúc. Already thường trước V3; yet thường cuối câu hỏi/phủ định.",
  collocations: "Học cả cụm: make a decision/a donation/friends; do shopping/volunteer work/someone a favour; give advice/directions.",
  shopping: "Dùng Can I help you? để đề nghị giúp; I'll take it để quyết định mua; on second thoughts để đổi ý.",
  future: "Hiện tại tiếp diễn cho lịch đã sắp xếp; be going to + V cho dự định; will + V cho lời hứa/quyết định tức thời; shall I/we + V cho đề nghị/gợi ý.",
  invitations: "Would you like + to V; How about + V-ing; Shall we + V; look forward to + V-ing; let me + V.",
  countability: "Money, advice, information, furniture, luggage và clothing không đếm được trong nghĩa của bài. Dùng much/a little; danh từ đếm được số nhiều dùng many/a few.",
  modals: "Must/have to diễn tả bắt buộc; mustn't là bị cấm; don't have to là không bắt buộc; can là được phép. Sau động từ khuyết thiếu dùng động từ nguyên mẫu.",
  offers: "Shall I / Let me / I'll + V là lời đề nghị giúp. How about + V-ing; Why don't you / You could / You should + V là lời gợi ý.",
};
function lines(lesson) {
  const all = sources.find(x => x.lesson === lesson && !x.key).lines;
  const start = all.findIndex(s => /^[AB]\.\s+BÀI TẬP/.test(s));
  const end = all.findIndex((s, i) => i > start && /^\d+\.\s*BÀI TẬP (PHÁT ÂM|KỸ NĂNG)/.test(s));
  return all.slice(start, end < 0 ? undefined : end);
}
function section(lesson, exercise) {
  const all = lines(lesson), start = all.findIndex(s => new RegExp(`^Bài tập ${exercise}[.:]`).test(s));
  if (start < 0) throw Error(`Missing exercise ${lesson}/${exercise}`);
  let end = all.findIndex((s, i) => i > start && /^Bài tập \d+[.:]/.test(s));
  if (end < 0) end = all.length;
  return all.slice(start, end).filter(s => !/^Nguồn:/.test(s));
}
function aliases(s) { return s.split("|").map(s => s.trim()); }
function add(lesson, exercise, topic, prompt, answers, options = {}) {
  const count = output.filter(q => q.lessonId === lesson && q.exercise === `Bài tập ${exercise}`).length + 1;
  const q = { id: `pre-intermediate-l${String(lesson).padStart(2, "0")}-e${exercise}-q${String(count).padStart(2, "0")}-v1`, levelId: "pre-intermediate", lessonId: lesson, topicId: topic,
    kind: topic === "vocabulary" || topic === "collocations" ? "vocabulary" : "grammar", source: "original", exercise: `Bài tập ${exercise}`,
    prompt: prompt.trim(), instruction: "Gõ đáp án vào từng ô theo thứ tự chỗ trống.", answers: answers.map(aliases), explanationVi: topicNotes[topic],
    sourceRef: `docs/lesson/Lesson ${lesson}/[SSAG_IELTS_Pre] Lesson ${lesson}.docx · Bài tập ${exercise} · câu ${count}; đối chiếu Answer Key`, scoreable: true, ...options };
  output.push(q); return q;
}
function gap(lesson, exercise, topic, values, options = {}) {
  const sec = section(lesson, exercise), prompts = sec.slice(1).filter(s => /_{3,}/.test(s) && /[A-Za-z]/.test(s) && !/^Follow-up/.test(s));
  const answers = values.split(";"); let cursor = 0;
  for (const prompt of prompts) {
    const count = [...prompt.matchAll(/_{3,}/g)].length;
    add(lesson, exercise, topic, prompt, answers.slice(cursor, cursor + count), options); cursor += count;
  }
  if (cursor !== answers.length || prompts.length === 0) throw Error(`Gap alignment ${lesson}/${exercise}: ${cursor} != ${answers.length}`);
}
function direct(lesson, exercise, topic, prompts, values, instruction, options = {}) {
  const answers = values.split(";");
  if (answers.length !== prompts.length) throw Error(`Alignment ${lesson}/${exercise}: ${prompts.length} != ${answers.length}`);
  prompts.forEach((prompt, i) => add(lesson, exercise, topic, prompt.replace(/_{3,}/g, "").trim(), [answers[i]], { instruction, ...options }));
}
const range = (lesson, a, b) => lines(lesson).slice(a, b);
const rewrite = "Gõ lại cả câu đúng, giữ nguyên ý và các từ còn lại.";
const word = "Gõ từ hoặc cụm từ phù hợp (không gõ chữ cái A/B/C).";

gap(1, 1, "vocabulary", "delicious;rude;cancel;into;communication");
gap(1, 2, "vocabulary", "boring;delicious;perfect;strange;all right;awful;amazing;rude");
gap(1, 3, "frequency", "always;never;usually|often;rarely|hardly ever|seldom;sometimes");
direct(1, 4, "frequency", section(1,4).slice(1), "She hardly ever visits her grandparents now that she lives in another city.;My brother particularly enjoys listening to classical music.;I absolutely hate it when people cancel plans at the last minute.;We usually go to the local coffee shop, but sometimes we try new cafes.;They are pretty sure the museum opens at 9 AM, but I need to double-check.;I really hope she brings her funny friend to the gathering!", rewrite);
direct(1, 5, "questions", section(1,5).slice(2), "Does she work in a hospital?;Why did you go to London last week?;What is that new Japanese restaurant like?;Who was that woman with your teacher?;What type of movies do you watch?;Which subject did you study at university?;How much did you pay for the laptop?", "Sắp xếp và gõ câu hỏi hoàn chỉnh.");
gap(1, 6, "present", "is Liam doing;is buying|'s buying;don't buy|do not buy;search;save;don't use|do not use;is getting|'s getting;did Tom and Alex do;spent;doesn't like|does not like;is", { context: section(1,6).slice(1).join("\n"), noteVi: "Câu 8–9 của key dùng quá khứ đơn, dù hướng dẫn chỉ nêu hiện tại. Giữ đáp án theo ngữ cảnh đã hoàn tất của key; phần này được ghi chú khi ôn." });
gap(2, 1, "vocabulary", "keep in touch;heard from;replied;get in touch;these days;By the way;lost touch;catch up;host family;abroad;meet for a chat;message");
direct(2, 2, "vocabulary", section(2,2).slice(1), "greet;colleague;socialise|socialize;challenge;introduce;conversation;experience;news", word);
direct(2, 3, "greetings", section(2,3).slice(1), "Long;What a;to see you;these days;how;news;meet;must;seeing;soon", word);
gap(3, 1, "vocabulary", "broke down;traffic jam;missed;delayed;lost;passport;set off;sightseeing;accommodation;broke down");
// Matching is converted to typing the missing phrase, with the original pairs retained.
const pairs3 = ["sightseeing around the city to take photos of famous landmarks", "accommodation near the city center for their holiday", "the plane at Gate 4 before the flight departed", "campsite because they love sleeping in tents under the stars", "guidebook to read about local restaurants and attractions", "while driving through the isolated mountain pass", "luggage allowance before packing for the trip", "at 6:00 AM so we can reach the beach before noon", "because they didn't have a map of the old streets", "traffic jam on the way to the airport"];
direct(3,2,"vocabulary", section(3,2).filter(s=>/^\d+\./.test(s)), pairs3.join(";"), "Gõ phần còn thiếu ở cột B, bỏ dấu ba chấm.", { context: section(3,2).slice(1).join("\n") });
const luxury = output.find(q=>q.lessonId===3&&q.exercise==="Bài tập 2"&&q.prompt.startsWith("2."));
luxury.prompt = "2. Their family booked luxury…";
luxury.noteVi = "Đã bỏ 'a' trước luxury accommodation: accommodation là danh từ không đếm được khi chỉ nơi ở trong tiếng Anh-Anh. Key gốc có lỗi mạo từ.";
gap(3,3,"past","went;bought;didn't leave|did not leave;Did;visit;spent;did;stay;was not|wasn't;took");
gap(3,4,"past","were waiting;was reading;was not flying|wasn't flying;Were;taking;were staying;was;doing;was not shining|wasn't shining;were looking");
gap(3,5,"past","were travelling|were traveling;were driving;started;stopped;were waiting;noticed;was looking;found",{ context:section(3,5).slice(1).join("\n") });
gap(4,1,"vocabulary","platform;information desk;fare;timetable;return ticket;coach;neighbourhood|neighborhood;crowded");
direct(4,2,"travel",range(4,14,22),"What time does the next train leave?;Could you tell me where the ticket office is?;How much is a return ticket?;Where can I buy a magazine?;How often do the trains leave?;Can I pay by card?;How can I get to the airport?;Can I help you with anything else?",rewrite);
gap(4,3,"travel","help;Could you;from;What time;and;over there;Thanks;anything else",{context:range(4,25,37).join("\n")});
direct(4,4,"linking",range(4,39,47),"but;because;when;so;and;When;because;but",word);
gap(5,1,"vocabulary","gorgeous;delicious;awful;strange;relaxed;crowded;perfect;rude");
gap(5,2,"vocabulary","set off;travelled around|traveled around|went away to;get to;change;go away;did;checked out");
direct(5,3,"questions",range(5,25,32),"Where did you go last summer?;Was your holiday enjoyable?;How often do you travel?;What did your friends visit?;How did you get to the airport?;Where were you last night?;What time does the next train leave?",rewrite);
gap(5,4,"past","travelled|traveled;left;was driving;were listening;broke;were waiting;stopped;repaired");
gap(5,5,"linking","so;but;and;because;When;but;because;so");
gap(6,1,"vocabulary","afford;bargain;discount;lend;borrow;owe;save up;pay back;bank account;loan");
direct(6,2,"collocations",range(6,17,25),"made;made;do;gave;do;made;do;gave",word);
gap(6,3,"perfect","received;hasn't paid back|has not paid back;Have;already;made;already;yet;yet;already;yet;yet;already;yet");
gap(6,4,"perfect","have never bought;bought;Have;given;went;did;spend;hasn't borrowed|has not borrowed;found;Have;met",{instruction:"Điền Present Perfect hoặc Past Simple theo ngữ cảnh.",noteVi:"Hướng dẫn gốc ghi nhầm hiện tại đơn/tiếp diễn. Đã sửa theo nội dung và đáp án: hiện tại hoàn thành/quá khứ đơn."});
gap(7,1,"vocabulary","present;cheaper;discount;till;PIN;receipt;raise money;donate;volunteers;support");
direct(7,2,"vocabulary",range(7,16,20),"volunteer;pay by card;customer;receipt","Gõ từ/cụm từ khác nhóm.");
direct(7,3,"shopping",range(7,21,29),"Can I help you?;Do you have anything cheaper?;I'll take it.|I will take it.;On second thoughts|On second thoughts, ...;How would you like to pay?;Can you show me something else?;Would you like a receipt?;Actually, I'll pay by card.|Actually, I will pay by card.",word);
add(7,4,"shopping","Gõ thứ tự các chữ cái của đoạn hội thoại, cách nhau bằng dấu cách.",["B F D A G C E H"],{context:range(7,34,58).filter(s=>s!=="____").join("\n"),instruction:"Sắp xếp toàn bộ hội thoại."});
direct(8,1,"vocabulary",["Jewellery worn around the wrist","A piece of clothing worn around the neck with a shirt","Close-fitting clothing covering the legs and feet","A matching jacket and trousers often worn for sports","Jewellery worn on the ears","Clothing worn over the hands to keep them warm","Shoes with high, raised heels","A warm, long-sleeved top, often made of thick cotton","Light, open shoes commonly worn in warm weather","Shoes that have little or no heel"],"bracelet;tie;tights;tracksuit;earrings;gloves;high heels;sweatshirt;sandals;flat shoes","Gõ mục từ khớp định nghĩa.");
direct(8,2,"vocabulary",["Formal Events","Sports / Casual Activities","Cold Weather"],"tie, bracelet, earrings, high heels, flat shoes, formal jacket;tracksuit, sandals, sweatshirt, flat shoes, T-shirt;gloves, sweatshirt, scarf","Tự phân loại các từ theo tình huống rồi xem gợi ý.",{scoreable:false,context:range(8,18,20).join("\n"),noteVi:"Một món đồ có thể thuộc nhiều nhóm; đây là gợi ý của key, không chấm cứng. Phần viết câu mở dùng để tự đối chiếu."});
direct(8,3,"vocabulary",range(8,40,48),"modern;wide;ordinary;peaceful;empty;outdoor;low;huge","Gõ tính từ trái nghĩa theo bảng lựa chọn.",{context:lines(8)[48]});
direct(8,4,"future",range(8,51,59),"A;I;O;D;P;S;A;I","Gõ mã: A = lịch hẹn; I = dự định; D = quyết định tức thời; P = lời hứa; O = đề nghị giúp; S = gợi ý.");
direct(8,5,"future",range(8,60,68),"I'm meeting my cousins at six tomorrow.|I am meeting my cousins at six tomorrow.;She is going to buy a new dress for the ceremony.;Shall we visit the night market tonight?;He won't forget your birthday.|He will not forget your birthday.;Are they going to attend the celebration next weekend?;I think I'll take the bus instead.|I think I will take the bus instead.;We are having dinner with Tom tomorrow. We already booked a table yesterday, so everything is arranged.;Shall I help you carry those bags?",rewrite);
gap(8,6,"future","are;doing;am meeting|'m meeting;will watch|'ll watch;Shall;show;will buy|'ll buy;are;going to wear;am going to choose|'m going to choose;will send|'ll send",{context:range(8,69,82).join("\n")});
direct(9,1,"vocabulary",range(9,27,37).map(s=>s.replace(/^[A-J]\.\s*/,"")),"guest;reschedule;appointment;invitation;come round;confirm;barbecue;available;host;catch up","Gõ từ/cụm từ khớp định nghĩa.");
const expr9=lines(9)[39].split(" – ");
direct(9,2,"invitations",expr9,"I;D;T;A;I;T;I;D;I;T;A;I","Gõ I = mời/sắp xếp; A = nhận lời; D = từ chối; T = xin thời gian suy nghĩ.",{noteVi:"Đã sửa phân loại 'Could we do another day?': đề nghị đổi lịch (I), không phải câu xin thời gian suy nghĩ như key gốc."});
add(9,3,"invitations","Gõ thứ tự chữ cái hội thoại, cách nhau bằng dấu cách.",["C A D F H E B G"],{context:range(9,60,84).filter(s=>s!=="____").join("\n"),instruction:"Sắp xếp toàn bộ hội thoại."});
direct(9,4,"invitations",range(9,86,94),"Would you like to come round for dinner on Saturday?;I'm afraid I can't meet you tomorrow.|I am afraid I cannot meet you tomorrow.;How about going to the cinema on Friday?;Shall we meet outside the restaurant at seven?;I'd love to, but I'm busy this evening.|I would love to, but I am busy this evening.;Are you doing anything next Thursday?;Let me check my calendar first.;We're looking forward to seeing you next week.|We are looking forward to seeing you next week.",rewrite);
direct(9,5,"invitations",range(9,95,107).filter(s=>!/^→/.test(s)),"Would you like to have dinner at my house on Friday?;Hang on, let me check my calendar before answering.;I can't come on Wednesday. How about meeting on Friday?;Are you doing anything on Saturday afternoon?;Shall we meet outside the station at ten?;I'm afraid I have other plans on Sunday.",rewrite,{scoreable:false,noteVi:"Câu viết lại có nhiều đáp án hợp lệ; tự đối chiếu cấu trúc và ý nghĩa, không tính điểm."});
direct(10,1,"vocabulary",["borrow","earrings","donation","tracksuit","receipt","bracelet","arrange a meeting","afford","charity","housewarming party","discount","gloves","raise money","reschedule","lend"],"M;C;S;C;M;C;S;M;S;S;M;C;S;S;M","Gõ M = tiền/mua sắm; C = quần áo/phụ kiện; S = giao tiếp/từ thiện.");
direct(10,1,"vocabulary",range(10,28,32),"receipt;sweatshirt;discount;receipt","Gõ từ/cụm từ khác nhóm.");
direct(10,2,"collocations",range(10,36,44),"a decision;some shopping;someone advice;money for charity;for a new phone;by card;an invitation;a birthday celebration","Gõ phần ghép còn thiếu từ cột A–H.",{context:range(10,44,52).join("\n")});
direct(10,3,"countability",range(10,57,67),"U;C;U;U;C;U;U;C;U;C","Gõ C = đếm được; U = không đếm được.");
direct(10,3,"countability",range(10,69,81).filter((_,i)=>i%2===0),"much;some;many;a few;some;a little",word);
direct(10,4,"future",range(10,91,107).filter((_,i)=>i%2===0),"PP;PC;GT;W;PP;PC;W;GT","Gõ PP = hiện tại hoàn thành; PC = hiện tại tiếp diễn; GT = be going to; W = will/won't.");
direct(10,4,"future",range(10,109,117),"have already spent;are having|are going to have;has never visited;am going to look;will carry|'ll carry;Have / bought|Have bought;are meeting;will not be|won't be","Gõ phần thiếu; nếu có hai chỗ trống, ngăn cách bằng dấu /.");
direct(10,5,"future",range(10,118,126),"She bought a new dress yesterday.;I haven't finished my shopping yet.;We're going to meet our friends at the cinema.;He will buy the tickets tomorrow.;How much money did you spend at the shopping centre?;Could you give me some advice about choosing a present?|Could you give me a piece of advice about choosing a present?;Are you meeting Lucy for dinner this evening?;She hasn't bought her birthday present yet, but she's already chosen the gift she wants.",rewrite);
direct(10,6,"invitations",range(10,131,139),"F;C;D;G;B;H;E;A","Gõ chữ cái của chức năng trong bảng.",{context:range(10,139,147).join("\n"),noteVi:"Đã sửa câu 2: Would you like to come round for dinner? là lời mời (C). Key gốc ghi D."});
direct(10,6,"invitations",range(10,149,152),"I'd love to come, but I'm busy this weekend. How about meeting next Saturday instead?;Do you have anything cheaper than this one?;Hang on a minute, let me check my calendar first.","Tự viết một câu phù hợp tình huống rồi đối chiếu gợi ý.",{scoreable:false});
add(10,7,"invitations","Gõ thứ tự chữ cái hội thoại, cách nhau bằng dấu cách.",["C G H B E A F D"],{context:range(10,157,181).filter(s=>s!=="____").join("\n"),instruction:"Sắp xếp toàn bộ hội thoại."});
gap(11,1,"vocabulary","receptionist;plumber;accountant;pilot;electrician;instructor;engineer;lawyer");
direct(11,2,"vocabulary",range(11,14,26).filter((_,i)=>i%2===0),"full-time|full time;rewarding;careers fair;apply for;customers;responsibilities",word);
const adContext=range(11,27,33).join("\n");
direct(11,3,"vocabulary",["Job A — Job title","Job B — Job title","Job C — Job title","Job A — Qualification required?","Job B — Qualification required?","Job C — Qualification required?","Job A — Training provided?","Job B — Training provided?","Job C — Training provided?","Job A — Special working hours","Job B — Special working hours","Job C — Special working hours","Job A — One useful personal quality","Job B — One useful personal quality","Job C — One useful personal quality"],"hotel receptionist;junior accountant;outdoor activity instructor;not mentioned|not necessary;yes|accounting qualification;not mentioned;yes;not mentioned;yes;some evenings;regular working hours;weekends;friendly;good computer skills;energetic|confident","Đọc tin tuyển dụng và gõ thông tin; dùng 'not mentioned' khi văn bản không nói rõ.",{context:adContext,scoreable:false,noteVi:"Không coi 'không đề cập' là 'không yêu cầu'. Key suy diễn một số ô; bảng này chỉ dùng tự đối chiếu. Good computer skills là kỹ năng, không phải tính cách."});
direct(11,4,"modals",range(11,58,70).filter((_,i)=>i%2===0),"must;mustn't|must not;don't have to|do not have to;can;has to;don't have to|do not have to",word);
gap(11,5,"modals","mustn't|must not;can;must;don't have to|do not have to");
direct(11,6,"linking",range(11,79,82),"C;A;B","Gõ chữ cái lý do khớp dự đoán.",{context:range(11,82,85).join("\n"),noteVi:"Because nối mệnh đề nguyên nhân, không thuộc nhóm FANBOYS. Phần hướng dẫn gốc dùng nhầm tên nhóm liên từ."});
direct(12,1,"vocabulary",range(12,11,19).map(s=>s.replace(/^[A-H]\.\s*/,"")),"interview;working hours;job advertisement;applicant;CV;vacancy;attach;customer service","Gõ từ/cụm từ khớp định nghĩa.");
direct(12,1,"vocabulary",range(12,41,45),"CV;vacancy;interview;working hours",word);
gap(12,2,"vocabulary","organise|organize;help out;reliable;suitable;list;opportunity;confident;take care of");
direct(12,3,"offers",range(12,58,66),"O;S;S;O;S;O;S;O","Gõ O = đề nghị giúp; S = gợi ý.");
direct(12,3,"offers",[lines(12)[67],lines(12)[71]],"Yes, please. That would be great.;Never mind. We can arrange another one.","Gõ câu trả lời phù hợp.",{context:range(12,67,75).join("\n")});
direct(12,4,"offers",range(12,77,85).filter(s=>!/^→/.test(s)),"Would you like me to help?;Why don't you ask the manager?;You could talk to your colleague.;Let me finish the list.",rewrite,{noteVi:"Câu đầu thiếu 'Would' trong bộ từ gốc; đã bổ sung Would để tạo câu hỏi đúng."});
direct(12,5,"offers",range(12,87,99).filter(s=>!/^→/.test(s)),"Shall I help you with the report?;How about taking a taxi?;Would you like me to help you?;Why don't you call the manager?;You should ask for more information.;Let me check the meeting time.",rewrite);

for (const q of output) {
  if(q.lessonId===11&&q.exercise==="Bài tập 6"){q.topicId="predictions";q.explanationVi="Will diễn tả dự đoán; might + V diễn tả khả năng; might be + V3 là bị động. Ghép dự đoán với lý do giải thích hợp lý, có thể nối bằng because.";}
  if(q.lessonId===8&&q.exercise==="Bài tập 6"){
    for(const a of q.answers){if(a.includes('going to wear'))a.push('wearing');if(a.includes('am going to choose'))a.push('will choose',"'ll choose");if(a.includes('will watch'))a.push('are going to watch',"'re going to watch");}
  }
  if(q.lessonId===1&&q.exercise==="Bài tập 6"&&q.answers.some(a=>a.includes("did Tom and Alex do")||a.includes("spent"))){q.scoreable=false;q.noteVi="Hướng dẫn nêu hai thì hiện tại nhưng key dùng quá khứ đơn. 'This morning' có thể còn hoặc đã kết thúc; câu này chỉ dùng tự đối chiếu vì ngữ cảnh thời gian chưa đủ rõ.";}
  if(q.lessonId===3&&q.exercise==="Bài tập 2"){
    if(q.context)q.context=q.context.replace("booked a luxury","booked luxury");
    if(q.prompt.startsWith("4.")){q.prompt="4. They prefer staying at a campsite…";q.answers=[["because they love sleeping in tents under the stars"]];q.noteVi="Đã bổ sung campsite vào vế đầu để hai vế ghép thành câu đầy đủ.";}
  }
  if(q.lessonId===11&&q.exercise==="Bài tập 3"){
    if(q.prompt==="Job A — Qualification required?"||q.prompt==="Job B — One useful personal quality")q.answers=[["not mentioned"]];
  }
  if (!q.answers.length || q.answers.some(a=>!a.length||a.some(v=>!v.trim()))) throw Error(`Missing answers: ${q.id}`);
  if (q.noteVi) audit.push({ questionId:q.id, note:q.noteVi });
}
fs.mkdirSync("src/data/courses", { recursive:true });
fs.writeFileSync("src/data/courses/original.json", JSON.stringify(output, null, 2)+"\n");
fs.writeFileSync("docs/lesson-content-audit.json", JSON.stringify({ correctedOrAnnotated:audit, excluded:"Listening, pronunciation drills, speaking, extended writing and open follow-ups are outside the scored vocabulary/grammar bank. Open classifications and rewritten responses are shown for self-comparison." },null,2)+"\n");
console.log(`Prepared ${output.length} original question groups; ${audit.length} annotations.`);
