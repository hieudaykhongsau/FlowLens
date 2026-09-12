> **Tài liệu dự án:** [Tổng quan dự án](PROJECT_OVERVIEW.md) | [Đặc tả Tech Stack](TECH_STACK.md) | [Đặc tả Nghiệp vụ (BRD)](BUSINESS_REQUIREMENTS.md)

---

# FlowLens: Đặc tả Tech Stack & Cơ sở Lựa chọn Kỹ thuật

---

## 1. Bảng tổng hợp công nghệ toàn hệ thống

| Tầng kiến trúc | Công nghệ lựa chọn | Vai trò chính |
|---|---|---|
| **Protocol Layer** | `@modelcontextprotocol/sdk` (TypeScript) | Giao thức chuẩn kết nối AI Agent với Workspace |
| **Server Runtime** | Node.js (v20+ LTS) + TypeScript | Xử lý I/O, quản lý file system, điều phối tools |
| **AST & DI Engine** | `web-tree-sitter` (Tree-sitter WASM) | Phân tích cú pháp AST, phân giải Dependency Injection & Interface |
| **Search Engine** | Ripgrep (`ripgrep-js` / CLI) + Regex Lexical | Quét symbol và tìm kiếm reference siêu tốc |
| **Communication Bridge** | `ws` (WebSocket Server) | Truyền tải dữ liệu trạng thái thời gian thực sang UI |
| **Execution Engine** | Node.js `child_process.execFile` | Thực thi kiểm thử an toàn trong danh mục kiểm soát |
| **Frontend Framework** | React 19 + Vite | Giao diện Single Page Application gọn nhẹ, tốc độ cao |
| **Graph Visualization** | `@xyflow/react` (React Flow) | Khung render đồ thị tương tác (nodes, edges) |
| **Layout Engine** | `dagre` (`@types/dagre`) | Thuật toán tự động sắp xếp layout đồ thị có hướng |
| **Styling & Icons** | Tailwind CSS v4 + Lucide React | Hệ thống giao diện hiện đại, tối ưu dark mode |

---

## 2. Cơ sở lựa chọn chi tiết từng công nghệ

### 2.1. Giao thức & Server: Model Context Protocol SDK (TypeScript)
* **Lý do lựa chọn:**
  * **Chuẩn công nghiệp mở:** MCP hiện là chuẩn giao tiếp chuẩn hóa được hỗ trợ trực tiếp bởi các AI Agent hàng đầu (Claude Code, Cursor, Windsurf, Roo Code).
  * **Hỗ trợ Typescript chính thức:** Package `@modelcontextprotocol/sdk` cung cấp đầy đủ validation schema thông qua Zod / JSON Schema, giúp loại bỏ lỗi sai lệch dữ liệu giữa Agent và Server.
  * **Chạy qua stdio:** Không yêu cầu cài đặt port phức tạp khi kết nối với IDE, đảm bảo an toàn cục bộ.

### 2.2. Deterministic Symbol Engine: Ripgrep kết hợp Tree-sitter WASM (`web-tree-sitter`)
* **Lý do lựa chọn:**
  * **Giải quyết bài toán Đa hình & Dependency Injection:** Khi làm việc với các framework như Spring, NestJS hay Go, một interface có thể có nhiều implementations. Ripgrep tìm kiếm vị trí cực nhanh (<10ms), sau đó `web-tree-sitter` bóc tách nhanh AST cục bộ để đọc các Decorator/Annotation (`@Service`, `@Component`, `@Primary`, `@Injectable`) giúp xác định chính xác bean nào được nạp.
  * **Siêu nhẹ, không tốn tài nguyên như LSP:** Language Server Protocol (LSP) yêu cầu khởi động runtime nặng nề (ngốn từ 1-3GB RAM cho mỗi ngôn ngữ). Ngược lại, Tree-sitter WASM chạy trong tiến trình Node.js, chỉ tốn vài chục MB RAM và phân tích theo nhu cầu (on-demand).

### 2.3. Safe Command Dispatcher: Whitelisted `execFile` & Hỗ trợ Ephemeral Runner
* **Lý do lựa chọn:**
  * **Triệt tiêu lỗ hổng Remote Code Execution (RCE):** Nếu dùng `child_process.exec(command)`, AI Agent có thể bị lợi dụng hoặc hallucinate chạy các lệnh nguy hiểm (`rm -rf`, `curl | bash`).
  * **Kiểm soát tham số nghiêm ngặt:** `execFile` chỉ chấp nhận danh sách runner được duyệt trước (`mvn`, `gradle`, `npm`, `pytest`, `go`). Các tham số được truyền dưới dạng mảng (`string[]`), ngăn chặn hoàn toàn kỹ thuật command injection qua ký tự `;`, `&&`, `|`.
  * **Hỗ trợ Ephemeral Mock Test:** Khi endpoint chưa có sẵn unit test hoặc DB local chưa chạy, dispatcher cho phép Agent khởi chạy các test mock độc lập tạm thời (dùng `MockMvc`, `supertest`, `pytest-mock`) để kiểm chứng logic cách ly.

### 2.4. Real-time Communication: WebSocket (`ws`) trên cổng Local 9876
* **Lý do lựa chọn:**
  * **Tách biệt hiển thị khỏi tiến trình MCP:** MCP Server giao tiếp với IDE qua `stdio`. Do đó, không thể dùng `stdio` để đẩy dữ liệu lên trình duyệt.
  * **Độ trễ bằng không (Zero Latency):** Mỗi khi Agent hoàn thành một bước điều tra (ví dụ: tìm xong Controller, chạy xong test), một gói tin JSON nhẹ được bắn qua WebSocket để Canvas tự động cập nhật ngay tức thì mà không cần polling HTTP.

### 2.5. Graph Visualization: React Flow (`@xyflow/react`)
* **Lý do lựa chọn:**
  * **Khả năng mở rộng Custom Node vô hạn:** Cho phép tạo các node chuyên biệt hiển thị đồng thời: Phase badge, trạng thái thực thi (`PASSED`/`STOPPED_HERE`), Certainty score, và nút bấm mở Code Evidence.
  * **Tương tác mượt mà:** Hỗ trợ sẵn pan, zoom, kéo thả, và khả năng animate các đường nối (edges) để thể hiện gói tin di chuyển.
  * **Hỗ trợ chu trình:** Không bị giới hạn trong cây phân cấp phẳng, xử lý tốt các luồng retry hoặc rẽ nhánh phức tạp.

### 2.6. Auto-Layout Engine: Dagre
* **Lý do lựa chọn:**
  * **Tự động hóa hoàn toàn tọa độ:** AI Agent chỉ trả về quan hệ logic (`nodes` và `edges`). Việc tính toán tọa độ $(x, y)$ để các hộp không đè lên nhau được Dagre xử lý tự động trong vòng vài mili-giây.
  * **Thiết lập hướng linh hoạt:** Dễ dàng chuyển đổi linh hoạt giữa bố cục Top-to-Bottom (`TB`) cho luồng API hoặc Left-to-Right (`LR`) cho luồng pipeline phân tán.

### 2.7. Frontend Build Tool: Vite + Tailwind CSS
* **Lý do lựa chọn:**
  * **Tốc độ phát triển:** Vite khởi động môi trường dev trong <300ms và Hot Module Replacement (HMR) tức thì.
  * **Giao diện chuẩn Developer Tool:** Tailwind CSS giúp xây dựng giao diện tối (Dark mode/Developer aesthetic) nhanh chóng, đồng bộ chuẩn hiển thị code block và badge trạng thái.

### 2.8. Composite Macro Tools: Tối ưu hóa Context Window & Token Latency
* **Lý do lựa chọn:**
  * Thay vì bắt AI Agent phải gửi hàng chục request đơn lẻ để dò qua từng tầng file (Controller $\rightarrow$ Guard $\rightarrow$ Service $\rightarrow$ Repo), FlowLens định nghĩa công cụ vĩ mô `trace_endpoint_pipeline`.
  * MCP Server thực hiện phân tích tĩnh chuỗi liên kết ở tầng backend bằng AST và trả về trọn vẹn khung đồ thị ban đầu chỉ trong **1 round-trip tool call**.
  * Giúp tiết kiệm đến **70% chi phí token** và giảm thời gian chờ đợi phản hồi của lập trình viên.