# 📚 Hệ thống Quản lý Thư viện

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Status: Completed](https://img.shields.io/badge/Status-Completed-brightgreen.svg)]()

## 📖 Giới thiệu

Hệ thống Quản lý Thư viện là một ứng dụng web được phát triển để hỗ trợ các thư viện trong việc quản lý hiệu quả các hoạt động hàng ngày, bao gồm quản lý sách, độc giả, và các giao dịch mượn/trả. Với giao diện thân thiện và các tính năng mạnh mẽ, hệ thống này giúp tối ưu hóa quy trình làm việc và nâng cao trải nghiệm cho cả thủ thư và độc giả.

Dự án này được xây dựng như một minh chứng cho khả năng ứng dụng các công nghệ web cơ bản để giải quyết các vấn đề thực tế, đặc biệt là trong lĩnh vực quản lý dữ liệu.

## ✨ Tính năng nổi bật

* **Quản lý Sách**:
    * Thêm, sửa, xóa thông tin sách (tên, tác giả, nhà xuất bản, năm xuất bản, thể loại, giá, số lượng).
    * Hiển thị danh sách tất cả các đầu sách hiện có.
    * Tìm kiếm sách theo tên hoặc mã ISBN.
* **Quản lý Độc giả**:
    * Thêm, sửa, xóa thông tin độc giả (tên, CMND, ngày sinh, giới tính, email, địa chỉ, ngày lập thẻ, ngày hết hạn).
    * Hiển thị danh sách độc giả.
    * Tìm kiếm độc giả.
* **Quản lý Mượn/Trả**:
    * Ghi nhận giao dịch mượn sách.
    * Ghi nhận giao dịch trả sách.
    * Quản lý độc giả mượn quá hạn và tính phí phạt.
* **Thống kê & Báo cáo**:
    * Tổng quan về số lượng sách, độc giả, và các giao dịch mượn/trả.
    * Báo cáo về sách được mượn nhiều nhất, độc giả tích cực.

## 🛠️ Công nghệ sử dụng

Dự án này được phát triển bằng các công nghệ web cơ bản:

* **HTML5**: Cấu trúc trang web.
* **CSS3**: Định dạng và tạo kiểu cho giao diện.
* **JavaScript (Vanilla JS)**: Xử lý logic, tương tác người dùng, và quản lý dữ liệu phía client.
* **Dữ liệu lưu trữ dạng file Text**: Dữ liệu được lưu trữ đơn giản trong các tệp `.txt` (ví dụ: `books.txt`, `readers.txt`, `borrows.txt`) để dễ dàng minh họa và quản lý mà không cần cơ sở dữ liệu phức tạp.

## 🚀 Hướng dẫn cài đặt và chạy ứng dụng

Để chạy ứng dụng này trên máy cục bộ của bạn, hãy làm theo các bước sau:

1.  **Clone repository:**
    ```bash
    git clone [https://github.com/your-username/qlythuvien.git](https://github.com/your-username/qlythuvien.git)
    ```
    *(Thay `your-username` bằng tên người dùng GitHub của bạn nếu đây là fork của bạn, hoặc URL repository gốc nếu có.)*

2.  **Di chuyển vào thư mục dự án:**
    ```bash
    cd qlythuvien
    ```

3.  **Mở file `index.html`:**
    * Đơn giản là mở file `index.html` trong trình duyệt web của bạn (ví dụ: Chrome, Firefox, Edge).
    * Bạn không cần máy chủ web hay bất kỳ cấu hình phức tạp nào vì đây là một ứng dụng tĩnh với logic JavaScript thuần túy.

## 📂 Cấu trúc dự án
