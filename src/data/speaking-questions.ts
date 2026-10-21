import type { TopicId } from "@/lib/types";

export interface SpeakingQuestion {
  id: string;
  topic: TopicId;
  question: string;
}

/** Câu hỏi IELTS Speaking Part 1 thường gặp, cùng 14 chủ đề với kho từ. */
// Chủ đề "mylist" (từ người học tự thêm) và "class" (từ trên lớp) không có câu hỏi riêng.
const RAW: Record<Exclude<TopicId, "mylist" | "class">, string[]> = {
  work: [
    "Do you work or are you a student?",
    "Why did you choose that job?",
    "What do you like most about your job?",
    "Is there anything you don't like about your job?",
    "Would you like to change your job in the future?",
  ],
  study: [
    "What subject did you study at university?",
    "Why did you choose that subject?",
    "Do you like learning English? Why?",
    "What was your favourite subject at school?",
    "Do you prefer studying alone or with other people?",
  ],
  home: [
    "Do you live in a house or an apartment?",
    "What is your favourite room in your home? Why?",
    "Who do you live with?",
    "What would you like to change about your home?",
    "Do you plan to live there for a long time?",
  ],
  hometown: [
    "Where is your hometown?",
    "What is your hometown famous for?",
    "What do you like most about your hometown?",
    "How has your hometown changed in recent years?",
    "Would you like to live in your hometown in the future?",
  ],
  routine: [
    "What is your daily routine like?",
    "What do you usually do in the morning?",
    "Do you prefer mornings or evenings? Why?",
    "Has your daily routine changed recently?",
    "What do you usually do after work?",
  ],
  hobbies: [
    "What do you do in your free time?",
    "Do you have the same hobbies as when you were a child?",
    "Do you prefer indoor or outdoor activities?",
    "Is there a new hobby you would like to try?",
    "Do you spend your free time alone or with friends?",
  ],
  food: [
    "What is your favourite food?",
    "Do you like cooking? Why or why not?",
    "How often do you eat out?",
    "Is there any food you don't like?",
    "What do people in your country usually eat for breakfast?",
  ],
  travel: [
    "Do you like travelling?",
    "Where did you go on your last holiday?",
    "Do you prefer travelling alone or with other people?",
    "How do you usually get to work?",
    "Where would you like to travel in the future?",
  ],
  technology: [
    "How often do you use your phone?",
    "What apps do you use every day?",
    "Do you think you spend too much time online?",
    "What technology is most useful in your job?",
    "Did you use computers much when you were a child?",
  ],
  health: [
    "Do you do any exercise?",
    "What do you do to stay healthy?",
    "Do you prefer team sports or individual sports?",
    "Do you think you get enough sleep?",
    "Is it easy to eat healthy food where you live?",
  ],
  weather: [
    "What is the weather like in your hometown?",
    "What is your favourite season? Why?",
    "Does the weather affect your mood?",
    "What do you like to do on rainy days?",
    "Do you prefer hot or cold weather?",
  ],
  shopping: [
    "Do you like shopping?",
    "Do you prefer shopping online or in shops?",
    "What was the last thing you bought?",
    "Do you like to buy expensive brands?",
    "Who do you usually go shopping with?",
  ],
  people: [
    "Do you spend much time with your family?",
    "Who are you closest to in your family?",
    "How often do you see your friends?",
    "What do you usually do with your friends?",
    "Do you prefer having a few close friends or many friends?",
  ],
  entertainment: [
    "What kind of films do you like?",
    "How often do you go to the cinema?",
    "Do you like reading books?",
    "What kind of music do you listen to?",
    "Do you prefer watching films at home or at the cinema?",
  ],
};

export const SPEAKING_QUESTIONS: SpeakingQuestion[] = Object.entries(RAW).flatMap(([topic, list]) =>
  list.map((question, i) => ({ id: `${topic}-${i + 1}`, topic: topic as TopicId, question })),
);

export const SPEAKING_BY_ID = Object.fromEntries(SPEAKING_QUESTIONS.map((q) => [q.id, q]));
