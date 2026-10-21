import type { Level } from "@/lib/types";

export interface PlacementItem {
  word: string;
  /** Đáp án đúng đứng đầu; thứ tự sẽ được xáo khi làm bài. */
  options: [string, string, string, string];
}

export interface PlacementBand {
  band: number;
  label: string;
  /** Nhóm từ trong kho nên học nếu người học còn hổng ở band này. */
  bankLevel: Level;
  items: PlacementItem[];
}

/**
 * 30 từ, 6 band tần suất × 5 từ, từ dễ (≈1.000 từ thông dụng nhất) đến khó (≈6.000).
 * Mỗi band đại diện khoảng 1.000 word family.
 */
export const PLACEMENT_BANDS: PlacementBand[] = [
  {
    band: 1,
    label: "A1 · 1.000 từ đầu",
    bankLevel: "A1",
    items: [
      { word: "buy", options: ["mua", "bán", "vay", "trả"] },
      { word: "early", options: ["sớm", "muộn", "nhanh", "chậm"] },
      { word: "kitchen", options: ["nhà bếp", "phòng ngủ", "phòng tắm", "sân vườn"] },
      { word: "angry", options: ["tức giận", "buồn bã", "mệt mỏi", "sợ hãi"] },
      { word: "weather", options: ["thời tiết", "mùa", "nhiệt độ", "bầu trời"] },
    ],
  },
  {
    band: 2,
    label: "A2 · 1.000–2.000",
    bankLevel: "A2",
    items: [
      { word: "borrow", options: ["mượn", "trả lại", "đánh mất", "mua"] },
      { word: "invite", options: ["mời", "từ chối", "gặp gỡ", "chào hỏi"] },
      { word: "dangerous", options: ["nguy hiểm", "an toàn", "khó khăn", "đắt đỏ"] },
      { word: "repair", options: ["sửa chữa", "thay thế", "làm hỏng", "lau chùi"] },
      { word: "rarely", options: ["hiếm khi", "thường xuyên", "luôn luôn", "đôi khi"] },
    ],
  },
  {
    band: 3,
    label: "B1 · 2.000–3.000",
    bankLevel: "B1",
    items: [
      { word: "convenient", options: ["thuận tiện", "đắt đỏ", "chật chội", "ồn ào"] },
      { word: "afford", options: ["có đủ tiền chi trả", "tiết kiệm", "vay mượn", "lãng phí"] },
      { word: "reliable", options: ["đáng tin cậy", "dễ thương", "nổi tiếng", "thông minh"] },
      { word: "crowded", options: ["đông đúc", "vắng vẻ", "sạch sẽ", "rộng rãi"] },
      { word: "forecast", options: ["dự báo", "báo cáo", "quảng cáo", "tin tức"] },
    ],
  },
  {
    band: 4,
    label: "B1+ · 3.000–4.000",
    bankLevel: "B1",
    items: [
      { word: "persuade", options: ["thuyết phục", "thông báo", "phàn nàn", "đề nghị"] },
      { word: "fragile", options: ["dễ vỡ", "nặng nề", "cứng cáp", "trơn trượt"] },
      { word: "household", options: ["hộ gia đình", "khu phố", "toà nhà", "họ hàng"] },
      { word: "reluctant", options: ["miễn cưỡng", "háo hức", "lo lắng", "tự tin"] },
      { word: "obstacle", options: ["trở ngại", "mục tiêu", "cơ hội", "lối thoát"] },
    ],
  },
  {
    band: 5,
    label: "B2 · 4.000–5.000",
    bankLevel: "B2",
    items: [
      { word: "thrive", options: ["phát triển mạnh", "suy giảm", "tồn tại", "thay đổi"] },
      { word: "vague", options: ["mơ hồ", "rõ ràng", "chi tiết", "sai lầm"] },
      { word: "cramped", options: ["chật chội", "rộng rãi", "ẩm thấp", "tối tăm"] },
      { word: "hectic", options: ["bận rộn, hối hả", "yên tĩnh", "nhàm chán", "nhẹ nhàng"] },
      { word: "deteriorate", options: ["xấu đi", "cải thiện", "duy trì", "biến mất"] },
    ],
  },
  {
    band: 6,
    label: "B2+ · 5.000–6.000",
    bankLevel: "B2",
    items: [
      { word: "meticulous", options: ["tỉ mỉ", "cẩu thả", "vội vàng", "nhút nhát"] },
      { word: "frugal", options: ["tiết kiệm, căn cơ", "hoang phí", "giàu có", "hào phóng"] },
      { word: "tedious", options: ["tẻ nhạt, chán ngắt", "thú vị", "khó khăn", "nguy hiểm"] },
      { word: "ubiquitous", options: ["có mặt khắp nơi", "hiếm có", "cổ xưa", "đắt đỏ"] },
      { word: "alleviate", options: ["làm giảm bớt", "làm tăng", "gây ra", "che giấu"] },
    ],
  },
];

export const BAND_SIZE = 1000;
