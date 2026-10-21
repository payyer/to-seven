import type { Topic, TopicId } from "@/lib/types";

export const TOPICS: Topic[] = [
  { id: "work", name: "Công việc", sampleQuestion: "What do you do? Do you enjoy your job?" },
  { id: "study", name: "Học tập", sampleQuestion: "What subject did you study? Do you like learning English?" },
  { id: "home", name: "Nhà cửa", sampleQuestion: "Do you live in a house or an apartment?" },
  { id: "hometown", name: "Quê hương & thành phố", sampleQuestion: "Where is your hometown? What is it famous for?" },
  { id: "routine", name: "Thói quen hằng ngày", sampleQuestion: "What is your daily routine like?" },
  { id: "hobbies", name: "Sở thích", sampleQuestion: "What do you do in your free time?" },
  { id: "food", name: "Đồ ăn", sampleQuestion: "What is your favourite food? Do you like cooking?" },
  { id: "travel", name: "Du lịch & đi lại", sampleQuestion: "Do you like travelling? Where did you go last time?" },
  { id: "technology", name: "Công nghệ", sampleQuestion: "How often do you use your phone? Which apps do you use?" },
  { id: "health", name: "Sức khoẻ & thể thao", sampleQuestion: "Do you do any exercise? How do you stay healthy?" },
  { id: "weather", name: "Thời tiết & thiên nhiên", sampleQuestion: "What is the weather like in your hometown?" },
  { id: "shopping", name: "Mua sắm", sampleQuestion: "Do you like shopping? Do you prefer shopping online?" },
  { id: "people", name: "Gia đình & bạn bè", sampleQuestion: "Do you spend much time with your family?" },
  { id: "entertainment", name: "Phim, nhạc & sách", sampleQuestion: "What kind of films do you like?" },
  { id: "mylist", name: "Từ bạn thêm", sampleQuestion: "How has your city changed in recent years?" },
];

export const TOPIC_BY_ID = Object.fromEntries(TOPICS.map((t) => [t.id, t])) as Record<TopicId, Topic>;
