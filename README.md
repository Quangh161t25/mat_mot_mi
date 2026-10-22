# 📷 MẮT MỘT MÍ MEDIA – HỆ THỐNG QUẢN LÝ THIẾT BỊ & MÁY ẢNH CƯỚI

Web App quản lý toàn bộ thiết bị, máy ảnh, lens, đèn, máy tính và phụ kiện quay chụp cưới cho **Mắt Một Mí Media**. Tối ưu trải nghiệm sử dụng trên cả **điện thoại di động (iPhone / Android)** và **máy tính (Desktop)**.

---

## 📱 CÀI ĐẶT APP TRÊN ĐIỆN THOẠI (PWA - KHÔNG CẦN QUA APP STORE / CH PLAY)

Hệ thống đã được đóng gói chuẩn **Progressive Web App (PWA)** với icon studio riêng biệt, mở toàn màn hình (không có thanh URL trình duyệt) như app tải từ App Store:

### 1. Trên iPhone (iOS Safari):
1. Mở link web app bằng trình duyệt **Safari** trên iPhone.
2. Bấm nút **Chia sẻ** (biểu tượng hình vuông có mũi tên đi lên 📤 ở thanh dưới cùng Safari).
3. Cuộn xuống và chọn **"Thêm vào Màn hình chính"** (Add to Home Screen ➕).
4. Bấm **"Thêm"** (Add) ở góc trên bên phải.
👉 Icon **Mắt Một Mí Media** sẽ xuất hiện ngay trên màn hình chính của iPhone!

### 2. Trên điện thoại Android (Google Chrome):
1. Mở link web app bằng trình duyệt **Chrome**.
2. Trên màn hình sẽ hiện nút **"Cài Đặt App Ngay (1 Chạm)"** hoặc bấm menu **3 chấm (⋮)** góc trên bên phải.
3. Chọn **"Cài đặt ứng dụng"** (Install App).
👉 App sẽ được cài thẳng vào danh sách ứng dụng điện thoại như 1 file APK native!

---

## 🔔 TÍNH NĂNG CHUÔNG & THÔNG BÁO TỚI NGƯỜI MƯỢN TRÊN ĐIỆN THOẠI

- **Thông báo đẩy (Web Push Notification) & Rung**:
  - Khi nhân sự A tạo yêu cầu mượn hoặc bàn giao máy ảnh/lens cho nhân sự B: **Điện thoại của nhân sự B sẽ lập tức đổ chuông, rung và hiện thông báo**:
    > *🔔 Yêu cầu nhận thiết bị mới: [Tên người giao] đã chuyển giao [Tên thiết bị + Mã máy] cho bạn. Bấm để kiểm tra và xác nhận nhận máy!*
  - Khi nhân sự B bấm nhận: **Điện thoại của nhân sự A cũng sẽ nhận thông báo hoàn tất bàn giao**.
- **Trung tâm thông báo (Notification Drawer)**:
  - Bấm vào biểu tượng chuông trên thanh tiêu đề để xem toàn bộ danh sách thông báo.
  - Tích hợp nút **"Bật thông báo"** và nút **"Thử chuông & Rung"** để kiểm tra ngay trên máy.

---

## 🌟 TÍNH NĂNG NỔI BẬT KHÁC

1. **Quản lý nhân sự**: Admin, Quản lý, Nhân sự. Không chia team cố định. Khóa tài khoản khi nghỉ việc nhưng lưu vĩnh viễn toàn bộ lịch sử bàn giao.
2. **Quản lý tài sản studio**: Mỗi máy ảnh, lens, đèn đều có mã tài sản riêng, ảnh thực tế, mã QR và phân biệt rõ *Người phụ trách* vs *Người đang giữ*.
3. **Quét mã QR bằng Camera**: Quét trực tiếp bằng camera điện thoại hoặc tải ảnh tem QR lên.
4. **In tem dán mã QR**: In tem decal sắc nét có logo "MẮT MỘT MÍ MEDIA", mã QR, mã tài sản và tên máy để dán lên thiết bị.
5. **Quy trình mượn - trả 2 bên**: Bắt buộc chụp ảnh hiện trạng lúc giao/nhận. Người trả không được tự bấm xác nhận; chỉ hoàn tất khi người nhận bấm xác nhận.
6. **Hệ thống 4 màu trạng thái**: 🟢 Sẵn sàng, 🟡 Đang giữ, 🟠 Chờ xác nhận, 🔴 Cần xử lý / Quá hạn.
7. **Kiểm kê thực tế & Đối soát sai lệch**: Quét QR kiểm kê đối soát, tự động bật cảnh báo đỏ nếu phát hiện sai lệch vị trí hoặc người giữ. Xuất file Excel CSV.

---

## 🚀 HƯỚNG DẪN CHẠY DỰ ÁN

```bash
# Khởi động môi trường phát triển
npm run dev
```
Truy cập: `http://localhost:3000`
