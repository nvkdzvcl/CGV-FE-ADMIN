# 🎬 CGV Admin Portal (CGV-FE-ADMIN)

> Hệ Thống Quản Trị Trung Tâm Dành Cho Quản Trị Viên (Admin) và Nhân Viên Rạp (Box Office Staff).
> Tương thích kiến trúc Backend Microservices CGV Enterprise.

---

## 🛠️ Các Phân Hệ Chức Năng

1. **Dashboard Tổng quan:** KPI thời gian thực, biểu đồ doanh thu tuần, Top phim ăn khách.
2. **Quản lý Phim:** CRUD phim điện ảnh, phân loại độ tuổi (P, T13, T16, T18), upload poster, trailer.
3. **Cụm rạp & Phòng chiếu:** Danh sách cụm rạp, quản lý phòng chiếu (2D, 3D, IMAX, 4DX), cấu hình phụ thu ghế (Normal, VIP, Sweetbox).
4. **Điều phối Lịch chiếu:** Xếp suất chiếu theo ngày/phòng, thuật toán phát hiện và ngăn trùng giờ chiếu.
5. **Bán vé & Soát vé Quầy:** Tra cứu đơn đặt vé, soát vé QR bằng mã hoặc camera, duyệt đơn thuê rạp sự kiện (Cinema Rentals).
6. **Voucher & Khuyến mãi:** Quản lý mã giảm giá, mô phỏng Spring Batch Import 1.000.000 voucher.
7. **Khách hàng & Phân quyền:** Quản lý tài khoản, cấp bậc thành viên (MEMBER, VIP, VVIP), phân quyền STAFF/ADMIN.
8. **Đối soát Thanh toán:** Kiểm tra giao dịch VNPay/MoMo, Idempotency Key và xác nhận Webhook.

---

## 🚀 Khởi Chạy Ứng Dụng

```bash
# 1. Cài đặt thư viện
npm install

# 2. Khởi chạy dev server
npm run dev

# 3. Build bundle sản phẩm
npm run build
```