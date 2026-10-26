# Demo phụ đề trực tiếp Việt → Anh

Tiện ích Chrome thu âm thanh đang phát trong tab, gửi âm thanh thành các đoạn ngắn tới máy chủ Colab để nhận dạng và dịch, sau đó phủ phụ đề lên trang web. Đây là demo minh họa, không phải dịch vụ chạy liên tục.

## Cách hoạt động

```text
Âm thanh tab → AudioWorklet (PCM mono 16 kHz, đoạn khoảng 6 giây)
             → POST /translate qua HTTPS → máy chủ Colab
             → PhoWhisper-small (vi) + OPUS-MT fine-tuned (en)
               hoặc SeamlessM4T-v2-large (en)
             → phụ đề phủ trên trang
```

| Thành phần | File | Vai trò |
|---|---|---|
| Máy chủ | `server_cell.py` | Mã chạy trong một ô Colab; tải model, mở API và Cloudflare quick tunnel |
| Extension | `extension/` | Popup, thu âm tab trong offscreen document và hiển thị phụ đề |

Trong popup chọn một chế độ: **B** dùng PhoWhisper-small để nhận dạng rồi OPUS-MT để dịch; **C** dùng SeamlessM4T-v2-large dịch trực tiếp từ âm thanh. Máy chủ chỉ nạp nhánh được chọn, và giải phóng nhánh trước khi chuyển sang nhánh kia.

## Yêu cầu

- Google Chrome trên máy tính.
- Google Colab với GPU T4. Nhánh B nạp hai model (PhoWhisper + OPUS-MT); nhánh C chỉ nạp SeamlessM4T. VRAM cần thiết còn tùy runtime và model.
- Hugging Face token có quyền tải model riêng `trthDux/opus-mt-vi-en-asr-ft`. Nếu repo đổi hoặc không có quyền truy cập, sửa tên model trong `server_cell.py`.
- Kết nối mạng ổn định. Thời gian xử lý phụ thuộc tải GPU và độ trễ mạng.

## Cài đặt và sử dụng

### 1. Khởi động máy chủ Colab

1. Tạo notebook Colab và chọn **Runtime → Change runtime type → T4 GPU**.
2. Mở `server_cell.py`, sao chép toàn bộ nội dung vào một ô Colab rồi chạy. Khi được hỏi, nhập Hugging Face token (token không được lưu trong extension).
3. Chờ ô in ra `DIA CHI MAY CHU` cùng URL `https://....trycloudflare.com`. Giữ nguyên ô đang chạy trong suốt buổi demo.
4. Model được nạp lần đầu khi có âm thanh cần xử lý. Nếu đổi lựa chọn B/C, máy chủ giải phóng model cũ rồi nạp nhánh mới; lần xử lý đầu sau khi đổi sẽ lâu hơn do phải tải model.

> Cloudflare quick tunnel tạo URL mới khi máy chủ khởi động lại. Hãy dùng URL mới trong extension mỗi lần.

### 2. Cài extension vào Chrome

1. Đặt thư mục dự án ở vị trí cố định trên máy.
2. Mở `chrome://extensions` và bật **Developer mode**.
3. Chọn **Load unpacked**, rồi chọn thư mục `ext_demo/extension` (thư mục có `manifest.json`).
4. Ghim extension từ biểu tượng Extensions trên thanh công cụ nếu muốn mở nhanh.

### 3. Bật phụ đề

1. Phát âm thanh tiếng Việt trong tab cần phụ đề. Hãy bắt đầu phát trước khi bật thu âm.
2. Mở extension, dán URL HTTPS `trycloudflare.com` từ Colab vào ô máy chủ.
3. Chọn **B · PhoWhisper + OPUS-MT** hoặc **C · SeamlessM4T trực tiếp**.
4. Bấm **Bắt đầu**. Cho phép Chrome truy cập âm thanh tab nếu trình duyệt hỏi.
5. Phụ đề xuất hiện trong bảng ở cạnh dưới trang sau khi xử lý từng đoạn; bảng giữ lịch sử trong phiên và tự cuộn xuống đoạn mới nhất. Kéo thanh tiêu đề để di chuyển bảng; kéo góc dưới bên phải để đổi kích thước. Bảng hiển thị tiếng Việt và bản dịch thành các dòng riêng; có thể bấm **Thu gọn/Mở rộng**. Bấm **Tải .txt** để tải toàn bộ phụ đề đã nhận trong phiên hiện tại. Popup có trạng thái kết nối; bấm **Dừng** để kết thúc thu âm.
6. Nếu Colab khởi động lại, dán URL mới vào popup và bấm bắt đầu lại.

Để gỡ extension, vào `chrome://extensions` và chọn **Remove**. Khi đang chạy, đóng tab hoặc dừng extension cũng kết thúc luồng thu âm.

## Giới hạn và xử lý sự cố

- Demo chưa được kiểm thử end-to-end; độ trễ thực tế chưa được đo. Một đoạn âm thanh dài khoảng 6 giây được gửi mỗi lần, nên phụ đề trễ ít nhất theo độ dài đoạn cộng thời gian suy luận.
- Các đoạn được dịch độc lập, câu bị cắt ở ranh giới có thể cho kết quả kém. Xử lý streaming này không phải cấu hình đánh giá trong báo cáo.
- Đoạn im lặng ngắn hoặc có RMS thấp bị server bỏ qua để hạn chế ASR tạo chữ sai.
- Nếu popup báo lỗi: xác nhận ô Colab vẫn chạy, URL đúng và bắt đầu bằng `https://`; kiểm tra `chrome://extensions` → **Errors** và log Colab.
- Khi bắt đầu, bảng phụ đề ở trang sẽ hiện trạng thái chờ, đang xử lý, hoặc lý do lỗi. Nếu popup báo máy chủ thiếu `/health` (HTTP 404), hãy dừng cell cũ và chạy lại toàn bộ `server_cell.py` mới nhất, rồi thử URL tunnel mới.
- Nếu trạng thái báo đang xử lý nhưng chưa có chữ, chờ model tải ở lần đầu và nói tiếng Việt rõ trong ít nhất một đoạn khoảng 6 giây. Nếu báo không nhận được lời nói, kiểm tra tab đang phát tiếng và âm lượng không bị tắt.
- Nếu Colab báo `Torch not compiled with CUDA enabled`, chọn **Runtime → Change runtime type → Hardware accelerator → GPU**, lưu và chạy lại ô máy chủ. Kiểm tra trước bằng `import torch; print(torch.cuda.is_available())`; kết quả cần là `True`. Dùng nội dung `server_cell.py` mới nhất trong repo.
- Nếu thiếu VRAM ở nhánh B, hãy dùng **C** hoặc chọn runtime có nhiều VRAM hơn. Nếu model riêng báo lỗi quyền truy cập, kiểm tra Hugging Face token và quyền đọc model.
- Nếu không thấy phụ đề, đảm bảo tab đang phát tiếng, thử tải lại trang rồi bật lại extension. Một số trang nội bộ của Chrome (ví dụ `chrome://...`) không cho content script phủ giao diện.

## Quyền riêng tư và model

Âm thanh của tab được gửi qua HTTPS tới máy chủ Colab và tunnel công khai để xử lý; chỉ bật trên nội dung bạn có quyền chia sẻ và có sự đồng ý của người tham gia cuộc gọi. Dừng extension khi không còn dùng. Không nhập Hugging Face token vào extension hoặc chia sẻ URL tunnel công khai.

Model sử dụng theo lựa chọn: nhánh B gồm `vinai/PhoWhisper-small` và `trthDux/opus-mt-vi-en-asr-ft`; nhánh C dùng `facebook/seamless-m4t-v2-large`. Hãy xem model card tương ứng để biết điều khoản sử dụng.

## Cấu trúc thư mục

```text
ext_demo/
├── demo_README.md
├── server_cell.py
└── extension/
    ├── manifest.json
    ├── popup.html / popup.js
    ├── background.js
    ├── offscreen.html / offscreen.js / audio-processor.js
    └── content.js
```
