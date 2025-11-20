# Confusion Matrix Simulator 🧠

Ứng dụng web tương tác giúp người học và kỹ sư dữ liệu hiểu sâu về **Confusion Matrix** (Ma trận nhầm lẫn) và các chỉ số đánh giá mô hình phân loại (Classification Metrics) thông qua trực quan hóa sinh động và trí tuệ nhân tạo.

## ✨ Tính năng nổi bật

### 1. Trực quan hóa & Tương tác
*   **Biểu đồ phân phối xác suất (Probability Density):** Mô phỏng phân phối của lớp Positive và Negative (Gaussian). Cho phép kéo thả **Ngưỡng (Threshold)** để thấy ngay lập tức sự đánh đổi (Trade-off) giữa Precision và Recall.
*   **Ma trận nhầm lẫn (Confusion Matrix):** Hiển thị trực quan 4 chỉ số cơ bản (TP, TN, FP, FN) với layout chuẩn 2x2.
*   **Đường cong đánh giá:** Vẽ biểu đồ **ROC Curve** và **Precision-Recall Curve** theo thời gian thực dựa trên tham số mô phỏng.

### 2. Hai chế độ hoạt động
*   **Chế độ Mô phỏng (Simulation Mode):** Điều chỉnh các tham số vĩ mô như Độ phân tách (Separation), Độ nhiễu (Noise), và Độ mất cân bằng dữ liệu (Imbalance). Hệ thống tự động tính toán ra ma trận.
*   **Chế độ Thủ công (Manual Mode):** Nhập trực tiếp số lượng TP, TN, FP, FN. Hệ thống sẽ "kỹ thuật ngược" (Reverse Engineering) để tái tạo lại biểu đồ phân phối tương ứng với số liệu bạn nhập.

### 3. Tích hợp AI (Google Gemini) 🤖
*   **Tạo kịch bản thực tế:** Nhập một chủ đề (VD: "Phát hiện gian lận"), AI sẽ tạo ra ngữ cảnh, định nghĩa nhãn Positive/Negative và hậu quả của sai lầm (FP/FN).
*   **Giải thích chỉ số:** Bấm vào biểu tượng trợ giúp bên cạnh các chỉ số (Accuracy, F1...), AI sẽ giải thích ý nghĩa của nó dựa trên ngữ cảnh cụ thể đang chọn.

## 🛠️ Cài đặt và Chạy dự án

### Yêu cầu
*   Node.js (phiên bản 16 trở lên)
*   API Key từ [Google AI Studio](https://aistudio.google.com/) (cho Gemini API)

### Các bước cài đặt

1.  **Clone dự án:**
    ```bash
    git clone https://github.com/your-username/confusion-matrix-simulator.git
    cd confusion-matrix-simulator
    ```

2.  **Cài đặt dependencies:**
    ```bash
    npm install
    ```

3.  **Cấu hình môi trường:**
    Tạo file `.env` ở thư mục gốc và thêm API Key của bạn:
    ```env
    API_KEY=your_google_gemini_api_key_here
    ```
    *(Lưu ý: Trong môi trường dev server như Vite/React thuần, bạn có thể cần cấu hình cách biến môi trường được load, ví dụ `VITE_API_KEY` hoặc `REACT_APP_API_KEY` tùy vào bundler).*

4.  **Chạy ứng dụng:**
    ```bash
    npm start
    # hoặc
    npm run dev
    ```

## 📚 Các khái niệm chính

Ứng dụng giúp bạn nắm vững các thuật ngữ:

*   **TP (True Positive):** Dự đoán đúng là Dương tính (VD: Có bệnh và máy báo có bệnh).
*   **TN (True Negative):** Dự đoán đúng là Âm tính (VD: Không bệnh và máy báo khỏe mạnh).
*   **FP (False Positive - Type I Error):** Báo động giả (VD: Khỏe mạnh nhưng máy báo có bệnh).
*   **FN (False Negative - Type II Error):** Bỏ sót (VD: Có bệnh nhưng máy báo khỏe mạnh).
*   **Accuracy:** Độ chính xác tổng thể.
*   **Precision:** Trong những cái máy đoán là Positive, bao nhiêu cái đúng? (Quan trọng khi FP tốn kém).
*   **Recall (Sensitivity):** Trong thực tế có bao nhiêu Positive, máy tìm được bao nhiêu? (Quan trọng khi FN nguy hiểm).
*   **F1 Score:** Trung bình điều hòa giữa Precision và Recall.

## 💻 Công nghệ sử dụng

*   **Frontend:** React 19, TypeScript
*   **Styling:** Tailwind CSS
*   **Charts:** Recharts (cho ROC/PR curves), Custom SVG (cho phân phối xác suất)
*   **AI:** Google GenAI SDK (`@google/genai`)
*   **Icons:** Lucide React

## 🤝 Đóng góp

Mọi đóng góp đều được hoan nghênh! Hãy tạo Pull Request nếu bạn muốn cải thiện tính năng hoặc sửa lỗi.

## 📄 License

MIT License.
