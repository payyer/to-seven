# Ôn theo cấp độ

Mở `/courses`, chọn **Pre-intermediate**. Phiên bản đầu có Lesson 1–12, 475 nhóm câu gốc, 120 câu bổ sung và 16 chủ điểm ngữ pháp. Nhóm câu có nhiều chỗ trống được giữ nguyên ngữ cảnh và tính đúng khi mọi ô đều đúng.

## Dùng hằng ngày

- Chọn một hoặc nhiều lesson, chủ điểm, nguồn bài và số câu. Bài gốc được mặc định; câu bổ sung có nhãn riêng.
- **Luyện học** hiện kết quả sau từng câu. **Tự kiểm tra** hiện đáp án sau khi nộp cả lượt. Không có đồng hồ giới hạn thời gian.
- Bài đang làm tự lưu, tiếp tục sau khi tải lại hoặc chuyển thiết bị. “Chọn bài khác” giữ bản đang làm cho tới khi bắt đầu một lượt mới.
- Câu sai đi vào sổ lỗi của cấp độ. Trả lời đúng ở lượt sau sẽ đưa câu ra khỏi danh sách cần sửa. Giữ thống kê theo câu và 100 bản tổng kết lượt làm gần nhất.
- Bài mở hoặc đáp án chưa đủ chắc chắn được ghi “Tự đối chiếu”, không tính điểm hoặc đưa vào sổ lỗi.

## Ba phần dữ liệu độc lập

1. **Kho từ gốc:** giữ nguyên ID từ, thẻ SRS, kế hoạch, chuỗi ngày và lịch sử. Bổ sung 236 thẻ từ/nghĩa chưa có; không đánh dấu đã học hoặc tự đổi ưu tiên. `experience` (kinh nghiệm) và `experience-event` (một trải nghiệm), `change` (tiền lẻ) và `change-verb` (thay đổi) được phân biệt.
2. **Ngữ pháp:** nội dung tĩnh lâu dài tại `/grammar`, có giải thích Việt, cấu trúc, ví dụ, lỗi, so sánh và nguồn tham khảo. Mỗi liên kết lesson có cả mã cấp độ, nên cùng một chủ điểm có thể được dùng ở các lesson khác nhau của các cấp độ khác nhau.
3. **Ôn theo cấp độ:** bảng `course_progress`, API `/api/course-progress/[levelId]` và hàng đợi lưu riêng. Dùng cùng phiên mở khóa nhưng không khởi tạo kho tiến độ gốc khi chỉ mở `/courses` hoặc `/grammar`.

Xuất/nhập/xóa trong một cấp độ chỉ tác động cấp độ đó. Các nút dữ liệu trong Cài đặt chỉ tác động kho gốc. Trước khi nhập hoặc xóa kết quả, app xuất bản sao lưu hiện tại. Khi có xung đột giữa thiết bị, tải bản khôi phục rồi mới tải lại dữ liệu máy chủ.

## Cài đặt cơ sở dữ liệu

Sau migration tiến độ gốc, chạy `supabase/migrations/20261030093225_course_progress.sql`. Migration đã được áp dụng cho dự án Supabase đang cấu hình trong phiên triển khai này. Nó tạo riêng bảng/RPC, không sửa snapshot hoặc revision của `study_progress`.

RLS được bật, quyền của `anon` và `authenticated` bị thu hồi; chỉ server dùng `service_role`. RPC dùng khóa dòng, revision và mutation ID để chống ghi đè và gửi trùng. Không đưa khóa Supabase bí mật xuống trình duyệt.

GET trả `{ snapshot, revision }` và không tạo bản ghi. PATCH nhận `{ snapshot, revision, mutationId }`; trả 409 khi revision cũ. Sao lưu cấp độ có dạng `{ type: "course-practice-backup", levelId, snapshot }`, được kiểm tra cấp độ trước khi nhập. Dữ liệu cấp độ không thêm vào `StudySnapshot` gốc.

## Bổ sung tài liệu và kiểm chứng

Thêm cặp Lesson/Answer Key vào `docs/lesson`. Công cụ trích xuất chỉ đọc Word; cần kiểm tra và biên soạn đáp án trước khi phát hành, không tự suy đoán từ XML.

```powershell
./scripts/extract-lesson-source.ps1
node scripts/build-course-data.mjs
node scripts/build-lesson-vocabulary.mjs
node scripts/verify-lesson-vocabulary.mjs
node scripts/build-lesson-vocabulary.mjs
```

Các file trích xuất trung gian nằm trong `.next` và được tạo lại khi cần; `next build` có thể xóa chúng. Ngân hàng đã biên soạn nằm trong `src/data/courses`; từ mới và liên kết lesson nằm trong `src/data/lesson-words.json` và `lesson-word-refs.json`.

- `lesson-content-audit.json`: các câu đã sửa hoặc cần chú thích. Bao gồm lỗi mạo từ với accommodation, nhầm nhóm chức năng lời mời, thiếu Would, hướng dẫn nhầm thì và suy diễn từ “không đề cập”.
- `lesson-vocabulary-audit.json`: đối chiếu từ có sẵn, từ bổ sung, nguồn lesson và sửa dữ liệu.
- `lesson-vocabulary-references.json`: nguồn Oxford đã truy cập, từ mục, từ loại, phiên âm Anh-Anh và nhãn CEFR khi có. Cụm không có mục riêng được đối chiếu bằng thành phần liên quan; nhãn độ khó chưa được xác nhận được hiển thị “tham khảo”.

Khi thêm Lesson 13, giữ ID các câu hiện tại và thêm ID mới. Khi thêm Intermediate, đăng ký mã cấp độ mới và dữ liệu lesson/câu hỏi; không đổi mã `pre-intermediate`. Liên kết chủ điểm dùng `{ levelId, lesson }`; nhãn cấp độ giáo trình độc lập với A1–B2 của từng từ.

Khi sửa câu đã phát hành, giữ lịch sử và cấp phiên bản ID mới nếu đáp án/ý nghĩa thay đổi; không gán ID cũ cho một câu khác. Cập nhật metadata `LESSONS` và phạm vi trích xuất có chủ đích, rồi chạy test, lint và build.
