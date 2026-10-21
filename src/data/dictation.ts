import type { Level } from "@/lib/types";

export interface DictationItem {
  id: string;
  level: Exclude<Level, "B2">;
  title: string;
  text: string;
  vi: string;
}

/**
 * Bài nghe chép tự soạn. Phần lớn viết theo kiểu câu trả lời IELTS Speaking Part 1,
 * nên chép xong cũng là học được một câu trả lời mẫu.
 */
export const DICTATIONS: DictationItem[] = [
  // A1: một câu ngắn
  { id: "a1-name", level: "A1", title: "Giới thiệu", text: "My name is Lan and I live in Hanoi.", vi: "Tên tôi là Lan và tôi sống ở Hà Nội." },
  { id: "a1-job", level: "A1", title: "Công việc", text: "I work in an office from Monday to Friday.", vi: "Tôi làm việc ở văn phòng từ thứ Hai đến thứ Sáu." },
  { id: "a1-breakfast", level: "A1", title: "Bữa sáng", text: "I usually have bread and coffee for breakfast.", vi: "Tôi thường ăn bánh mì và uống cà phê vào bữa sáng." },
  { id: "a1-family", level: "A1", title: "Gia đình", text: "There are four people in my family.", vi: "Gia đình tôi có bốn người." },
  { id: "a1-weekend", level: "A1", title: "Cuối tuần", text: "On Sundays, I clean my room and watch films.", vi: "Vào Chủ nhật, tôi dọn phòng và xem phim." },
  { id: "a1-weather", level: "A1", title: "Thời tiết", text: "It is very hot and sunny in the summer.", vi: "Mùa hè trời rất nóng và nắng." },
  { id: "a1-pet", level: "A1", title: "Thú cưng", text: "My sister has a small white cat.", vi: "Chị tôi có một con mèo trắng nhỏ." },
  { id: "a1-bus", level: "A1", title: "Đi lại", text: "I go to work by bus every morning.", vi: "Sáng nào tôi cũng đi làm bằng xe buýt." },

  // A2: một hoặc hai câu, có thì quá khứ / so sánh
  { id: "a2-hometown", level: "A2", title: "Quê hương", text: "My hometown is a small city in the north. It is quiet, but the food is delicious.", vi: "Quê tôi là một thành phố nhỏ ở miền Bắc. Nơi đó yên tĩnh nhưng đồ ăn rất ngon." },
  { id: "a2-study", level: "A2", title: "Học tập", text: "I studied computer science at university. My favourite subject was programming.", vi: "Tôi học khoa học máy tính ở đại học. Môn tôi thích nhất là lập trình." },
  { id: "a2-hobby", level: "A2", title: "Sở thích", text: "In my free time, I like reading books and playing badminton with my friends.", vi: "Lúc rảnh, tôi thích đọc sách và chơi cầu lông với bạn bè." },
  { id: "a2-trip", level: "A2", title: "Chuyến đi", text: "Last summer, my family went to Da Nang. We swam in the sea every day.", vi: "Mùa hè năm ngoái, gia đình tôi đi Đà Nẵng. Ngày nào chúng tôi cũng tắm biển." },
  { id: "a2-apartment", level: "A2", title: "Nơi ở", text: "I live in an apartment on the fifth floor. It has two bedrooms and a small balcony.", vi: "Tôi sống trong một căn hộ ở tầng năm. Căn hộ có hai phòng ngủ và một ban công nhỏ." },
  { id: "a2-phone", level: "A2", title: "Điện thoại", text: "I use my phone to check emails and listen to music on the way to work.", vi: "Tôi dùng điện thoại để kiểm tra email và nghe nhạc trên đường đi làm." },
  { id: "a2-cooking", level: "A2", title: "Nấu ăn", text: "My mother is a better cook than me. She can make many traditional dishes.", vi: "Mẹ tôi nấu ăn giỏi hơn tôi. Bà nấu được nhiều món truyền thống." },
  { id: "a2-rain", level: "A2", title: "Mùa mưa", text: "It rains a lot in September, so I always carry an umbrella.", vi: "Tháng Chín mưa nhiều nên tôi luôn mang theo ô." },

  // B1: đoạn ngắn 2–3 câu, có liên từ và thì hiện tại hoàn thành
  {
    id: "b1-work",
    level: "B1",
    title: "Công việc",
    text: "I work as a frontend developer for a software company. I enjoy my job because I can be creative, but the deadlines are sometimes very tight.",
    vi: "Tôi làm lập trình viên frontend cho một công ty phần mềm. Tôi thích công việc vì được sáng tạo, nhưng đôi khi hạn chót rất gấp.",
  },
  {
    id: "b1-english",
    level: "B1",
    title: "Học tiếng Anh",
    text: "I have been learning English for about two years. I think listening is the most difficult skill, so I try to watch videos in English every day.",
    vi: "Tôi đã học tiếng Anh khoảng hai năm. Tôi nghĩ nghe là kỹ năng khó nhất, nên tôi cố gắng xem video tiếng Anh mỗi ngày.",
  },
  {
    id: "b1-neighbourhood",
    level: "B1",
    title: "Khu phố",
    text: "My neighbourhood is quite crowded, especially in the evening. However, it is very convenient because there are many shops and restaurants nearby.",
    vi: "Khu phố tôi khá đông đúc, nhất là buổi tối. Tuy vậy, nó rất tiện lợi vì gần đó có nhiều cửa hàng và nhà hàng.",
  },
  {
    id: "b1-exercise",
    level: "B1",
    title: "Tập thể dục",
    text: "I don't have much time to exercise during the week. At the weekend, I usually go jogging in the park near my house to relax.",
    vi: "Trong tuần tôi không có nhiều thời gian tập thể dục. Cuối tuần, tôi thường chạy bộ ở công viên gần nhà để thư giãn.",
  },
  {
    id: "b1-shopping",
    level: "B1",
    title: "Mua sắm",
    text: "I prefer shopping online because it saves time. The only problem is that sometimes the clothes look different from the pictures.",
    vi: "Tôi thích mua sắm trực tuyến hơn vì tiết kiệm thời gian. Vấn đề duy nhất là đôi khi quần áo trông khác với hình.",
  },
  {
    id: "b1-technology",
    level: "B1",
    title: "Công nghệ",
    text: "Technology has changed the way people communicate. Nowadays, most of my friends send messages instead of making phone calls.",
    vi: "Công nghệ đã thay đổi cách mọi người giao tiếp. Ngày nay, phần lớn bạn bè tôi nhắn tin thay vì gọi điện.",
  },
  {
    id: "b1-travel",
    level: "B1",
    title: "Du lịch",
    text: "I have never travelled abroad, but I would love to visit Japan one day. I am interested in its culture and I want to try real Japanese food.",
    vi: "Tôi chưa bao giờ đi nước ngoài, nhưng tôi rất muốn đến Nhật Bản một ngày nào đó. Tôi quan tâm đến văn hoá của họ và muốn thử đồ ăn Nhật chính gốc.",
  },
  {
    id: "b1-friends",
    level: "B1",
    title: "Bạn bè",
    text: "My best friend and I have known each other since primary school. Although we live in different cities now, we still keep in touch every week.",
    vi: "Bạn thân và tôi quen nhau từ hồi tiểu học. Dù giờ sống ở hai thành phố khác nhau, chúng tôi vẫn giữ liên lạc mỗi tuần.",
  },
];

export const DICTATION_BY_ID = Object.fromEntries(DICTATIONS.map((d) => [d.id, d]));
