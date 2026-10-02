# 🔍 FlowLens: Universal API Execution Debugger & Real-time Causal Canvas

<p align="center">
  <b>The X-Ray HUD for AI Coding Agents</b><br/>
  <i>Biến quá trình điều tra lỗi API phức tạp thành sơ đồ thực thi 2D tương tác thời gian thực — Không ảo giác, minh bạch bằng chứng, kiểm soát nguyên nhân gốc rễ (Root Cause).</i>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Protocol-Model%20Context%20Protocol%20(MCP)-blue?style=for-the-badge&logo=anthropic" alt="MCP Protocol"/>
  <img src="https://img.shields.io/badge/Runtime-Node.js%2020%2B%20%7C%20TypeScript-green?style=for-the-badge&logo=node.js" alt="Node.js"/>
  <img src="https://img.shields.io/badge/Canvas-React%2019%20%7C%20React%20Flow-61DAFB?style=for-the-badge&logo=react" alt="React Flow"/>
  <img src="https://img.shields.io/badge/Style-Tailwind%20CSS%20v4-38B2AC?style=for-the-badge&logo=tailwind-css" alt="Tailwind"/>
  <img src="https://img.shields.io/badge/License-MIT-orange?style=for-the-badge" alt="MIT License"/>
</p>

---

## 📖 Mục lục
- [1. Giới thiệu tổng quan](#1-giới-thiệu-tổng-quan)
- [2. Vấn đề thực tế & Giải pháp](#2-vấn-đề-thực-tế--giải-pháp)
- [3. Kiến trúc hệ thống tam giác](#3-kiến-trúc-hệ-thống-tam-giác)
- [4. Điểm khác biệt cốt lõi (Key Differentiators)](#4-điểm-khác-biệt-cốt-lõi-key-differentiators)
- [5. So sánh: AI Agent thông thường vs. AI Agent + FlowLens](#5-so-sánh-ai-agent-thông-thường-vs-ai-agent--flowlens)
- [6. Quy trình điều tra chuẩn (Investigation Protocol)](#6-quy-trình-điều-tra-chuẩn-investigation-protocol)
- [7. Công nghệ sử dụng (Tech Stack)](#7-công-nghệ-sử-dụng-tech-stack)
- [8. Hướng dẫn cài đặt & Cấu hình nhanh](#8-hướng-dẫn-cài-đặt--cấu-hình-nhanh)
- [9. Hệ thống tài liệu chi tiết](#9-hệ-thống-tài-liệu-chi-tiết)
- [10. Lộ trình phát triển (Roadmap)](#10-lộ-trình-phát-triển-roadmap)

---

## 1. Giới thiệu tổng quan

**FlowLens** là một giải pháp mở rộng dành cho AI Coding Agents (như **Antigravity**, **Cursor**, **Windsurf**, **Claude Code**), bao gồm:
1. **Một Local MCP Server (Model Context Protocol):** Cung cấp các công cụ phân tích tĩnh ngữ nghĩa (AST), dò tìm chuỗi phụ thuộc (Dependency Injection) và thực thi test runner trong môi trường sandbox an toàn.
2. **Một Màn hình Canvas 2D tương tác thời gian thực (Interactive Real-time Canvas):** Khởi chạy cục bộ trên cổng `http://localhost:9876`, tự động vẽ lại toàn bộ luồng thực thi API từ Entrypoint đến Database, gắn nhãn trạng thái và highlight chính xác **điểm chết của request**.

> [!NOTE]
> FlowLens **không thay thế** AI Agent của bạn. FlowLens đóng vai trò như **hệ thống kính ngắm HUD và bảng điều khiển radar** được gắn thêm vào bộ não của Agent, giúp developer và AI cùng nhìn vào một bản đồ duy nhất để chốt lỗi.

---

## 2. Vấn đề thực tế & Giải pháp

### Bài toán nhức nhối khi debug API backend:
* **Hộp đen API đa tầng:** Một lỗi `403 Forbidden` hay `500 Internal Server Error` có thể phát sinh ở bất cứ đâu: API Gateway, Security Filter, DTO Validator, Interceptor, hay Service nghiệp vụ.
* **Sự sai lệch giữa Code trên đĩa và Thực tế chạy:** Code có thể định nghĩa việc ghi log hay lưu vào Database, nhưng thực tế runtime lại chết ngay tại bước xác thực token.
* **Hộp đen suy luận của AI (The Black-Box Agent):** Các AI Assistant thông thường chỉ đưa ra dòng chat văn bản. Khi AI sửa sai hoặc "chém gió" (hallucinate) do không đọc hết call graph, developer không có cách nào kiểm chứng được nếu không tự mình đọc lại từng file.

### Giải pháp từ FlowLens:
* **Hiển thị trực quan 2D:** Biến luồng text vô tận trong khung chat thành sơ đồ khối trực quan có màu sắc biểu thị rõ ràng.
* **Phân định rõ trạng thái 2 chiều:** Phân biệt rõ giữa code chỉ nằm trên đĩa (`NOT_VERIFIED`) với code thực sự đã chạy qua (`PASSED`), điểm gây sập (`STOPPED_HERE`), và tài nguyên hoàn toàn chưa bị chạm tới (`SKIPPED`).
* **Thẻ Causal WHY chuẩn hóa:** Bóc tách rõ ràng: **Điều kiện cần** vs **Dữ liệu thực tế gửi lên** vs **Dòng code gây lỗi**.

---

## 3. Kiến trúc hệ thống tam giác

FlowLens hoạt động dựa trên nguyên tắc **Tam giác phân vai (Triangle Architecture)**:

```mermaid
flowchart TD
    subgraph Client["1. AI AGENT / IDE RUNTIME"]
        Agent["AI Assistant<br/>(Antigravity / Cursor / Windsurf / Claude Code)"]
    end

    subgraph Server["2. FLOWLENS MCP SERVER (Localhost)"]
        AST["AST & DI Resolver (web-tree-sitter)"]
        Macro["Macro Pipeline Engine (trace_endpoint_pipeline)"]
        Sandbox["Safe Command Dispatcher (Whitelisted execFile)"]
        Confidence["Deterministic Confidence Engine"]
        WSHub["WebSocket Hub (Port 9876)"]
    end

    subgraph Canvas["3. FLOWLENS CANVAS (Browser UI)"]
        Graph["React Flow 2D Canvas + Dagre Auto-Layout"]
        Stepper["Investigation Stepper Progress Tracker"]
        Drawer["Inspector Drawer: Causal Card & Code Evidence"]
    end

    Agent <-->|"JSON-RPC qua stdio (MCP Protocol)"| Server
    WSHub -->|"Phát sóng sự kiện đồ thị (WebSocket)"| Canvas
```

---

## 4. Điểm khác biệt cốt lõi (Key Differentiators)

1. **Deterministic Fact, AI Meaning (Sự thật tất định, AI suy luận ý nghĩa):**
   * Việc file có tồn tại không, symbol nằm ở dòng nào, test runner có pass hay không được đảm bảo 100% bằng công cụ tất định.
   * AI Agent chỉ tập trung vào thế mạnh duy nhất: Suy luận nhân-quả (*Tại sao điều kiện A không khớp với dữ liệu B?*).
2. **Cơ chế chấm điểm tin cậy có công thức định lượng (Confidence Engine):**
   $$\text{Confidence} = \min\left(1.0, \sum w_i\right)$$
   Độ tin cậy được tính dựa trên bằng chứng vật lý thu thập được (+0.4 nếu bắt được Route, +0.3 nếu khớp Stack Trace, -0.2 nếu trùng tên hàm do đa hình), triệt tiêu hoàn toàn sự tự tin thái quá của LLM.
3. **Phân tích AST giải quyết Đa hình & Dependency Injection:**
   Tích hợp `web-tree-sitter` (Tree-sitter WASM) siêu nhẹ để bóc tách annotation bean (`@Service`, `@Injectable`, `@Primary`), định vị chính xác implementation thực sự được nạp mà không cần dựng Language Server Protocol (LSP) ngốn GB RAM.
4. **Xác minh Runtime 3 cấp độ (Adaptive Runtime Verification):**
   * *Cấp 1 (Active):* Chạy test suite sẵn có qua runner an toàn (`mvn`, `gradle`, `npm`, `pytest`, `go`).
   * *Cấp 2 (Ephemeral Mock):* Tự động sinh file test mock tạm thời (`MockMvc`, `supertest`) để kích hoạt endpoint cô lập mà không phụ thuộc DB ngoài.
   * *Cấp 3 (Passive):* Đọc và so khớp log file/OpenTelemetry trace spans có sẵn khi môi trường không cho phép chạy lệnh.
5. **Composite Macro Tools (`trace_endpoint_pipeline`):**
   Gom toàn bộ pipeline khung từ Route $\rightarrow$ Filter $\rightarrow$ Service $\rightarrow$ Repo chỉ trong **1 round-trip duy nhất**, tiết kiệm hơn 70% token context cho Agent.

---

## 5. So sánh: AI Agent thông thường vs. AI Agent + FlowLens

| Tiêu chí | AI Agent thông thường trong IDE | AI Agent khi được tích hợp FlowLens MCP |
|---|---|---|
| **Giao diện phản hồi** | Chỉ có dòng chat text dài lê thê | Màn hình Canvas 2D tương tác, zoom/pan mượt mà |
| **Nhận thức kiến trúc** | Tìm kiếm text bằng regex thô (`grep`) | Bóc tách AST, hiểu rõ luồng Dependency Injection |
| **Quản lý trạng thái** | Phụ thuộc vào trí nhớ context của LLM (dễ quên) | State Machine chuẩn hóa (`NOT_VERIFIED`, `PASSED`, `STOPPED_HERE`) |
| **Phát hiện điểm chết** | AI tự phỏng đoán dòng lỗi | Khẳng định điểm dừng bằng bằng chứng stack trace / test log |
| **Số lần gọi tool (Calls)**| 15–20 tool calls đơn lẻ tốn kém | 1 Macro Tool duy nhất dựng xong toàn bộ khung pipeline |
| **Mức độ minh bạch** | "Hộp đen" — Không rõ AI đã kiểm tra những gì | "Bạch diện" — Toàn bộ bước điều tra đều hiện rõ trên Canvas |

---

## 6. Quy trình điều tra chuẩn (Investigation Protocol)

Khi người dùng cung cấp lệnh cURL lỗi hoặc mã lỗi API, quy trình 6 bước được kích hoạt:

```mermaid
flowchart LR
    S1["1. Nhận cURL / Mã lỗi"] --> S2["2. Tạo Session MCP"]
    S2 --> S3["3. Quét Pipeline AST"]
    S3 --> S4["4. Xác minh Runtime 3 cấp độ"]
    S4 --> S5["5. Kết luận Nhân - Quả (WHY)"]
    S5 --> S6["6. Báo cáo & Hiển thị Canvas"]
```

* **Bước 1:** Nhận request lỗi và bóc tách parameters/headers.
* **Bước 2:** Khởi tạo `InvestigationSession` trên FlowLens Server và mở kênh WebSocket `9876`.
* **Bước 3:** Gọi `trace_endpoint_pipeline` tạo khung đồ thị tĩnh ban đầu (trạng thái `NOT_VERIFIED`).
* **Bước 4:** Chạy kiểm chứng runtime (Test có sẵn / Ephemeral Mock Test / Trace Log).
* **Bước 5:** Đánh dấu node lỗi là `STOPPED_HERE`, các node trước đó là `PASSED`, các node phía sau thành `SKIPPED`. Đính kèm Causal Card và trích dẫn mã nguồn thực tế (Code Evidence).
* **Bước 6:** Tự động đồng bộ toàn bộ đồ thị lên Canvas và trả kết luận cho developer.

---

## 7. Công nghệ sử dụng (Tech Stack)

```text
FlowLens Core Stack
├── MCP Protocol:      @modelcontextprotocol/sdk (TypeScript)
├── Server Runtime:    Node.js (v20+ LTS)
├── AST & DI Engine:   web-tree-sitter (Tree-sitter WASM)
├── Search Engine:     Ripgrep (ripgrep-js / regex lexical scanner)
├── Execution Sandbox: child_process.execFile (Whitelisted commands)
├── Communication:     ws (WebSocket Server port 9876)
├── Frontend UI:       React 19 + Vite
├── Graph Canvas:      @xyflow/react (React Flow)
├── Layout Engine:     dagre (@types/dagre)
└── Styling:           Tailwind CSS v4 + Lucide React
```

---

## 8. Hướng dẫn cài đặt & Cấu hình nhanh

### 8.1. Yêu cầu môi trường
* **Node.js:** Phiên bản `v20.0.0` trở lên.
* **Package Manager:** `npm` hoặc `pnpm`.
* Một AI Agent IDE hỗ trợ giao thức MCP (Antigravity, Cursor, Windsurf, Claude Code, Roo Code).

### 8.2. Cài đặt dự án
```bash
# Clone repository
git clone https://github.com/your-org/flowlens.git
cd flowlens

# Cài đặt dependencies
npm install

# Build mã nguồn TypeScript
npm run build
```

### 8.3. Cấu hình MCP Server vào IDE của bạn

Thêm cấu hình sau vào file cấu hình MCP của IDE (ví dụ: `mcp_config.json` hoặc cấu hình Claude/Cursor Settings):

```json
{
  "mcpServers": {
    "flowlens": {
      "command": "node",
      "args": ["d:/MyProject/FlowLens/dist/server.js"],
      "env": {
        "FLOWLENS_PORT": "9876"
      }
    }
  }
}
```

### 8.4. Khởi chạy Canvas giao diện
Khi MCP Server hoạt động, server sẽ tự động mở WebSocket hub tại cổng `9876`.  
Mở trình duyệt bất kỳ và truy cập:
```text
http://localhost:9876
```

---

## 9. Hệ thống tài liệu chi tiết

Để tìm hiểu sâu hơn về kiến trúc và đặc tả nghiệp vụ, vui lòng tham khảo các tài liệu chuyên đề trong thư mục `docs/`:

* 📘 **[Tổng quan dự án (PROJECT_OVERVIEW.md)](docs/PROJECT_OVERVIEW.md):** Tầm nhìn, bối cảnh bài toán, tam giác phân vai và các giải pháp khắc phục điểm nghẽn thực tế.
* 🛠️ **[Đặc tả Tech Stack (TECH_STACK.md)](docs/TECH_STACK.md):** Bảng tổng hợp công nghệ toàn hệ thống, luận cứ lựa chọn Tree-sitter WASM, React Flow, Dagre và Safe Dispatcher.
* 📋 **[Đặc tả Nghiệp vụ (BUSINESS_REQUIREMENTS.md)](docs/BUSINESS_REQUIREMENTS.md):** Hệ thống phân loại trạng thái (Taxonomy), công thức Certainty Score, chi tiết 9 Use Cases cốt lõi và giao thức điều tra chuẩn.

---

## 10. Lộ trình phát triển (Roadmap)

- [x] Thiết kế kiến trúc tổng thể, mô hình nghiệp vụ & đặc tả công nghệ.
- [x] **Giai đoạn 1 (PoC MCP Core):** Hoàn thiện MCP Server với các tool cốt lõi (`trace_endpoint_pipeline`, `update_investigation_session`, `execute_sandboxed_runner`, `codebase_search`, `find_symbol_references`).
- [x] **Giai đoạn 2 (Real-time Canvas):** Xây dựng giao diện React 19 + React Flow kết nối WebSocket port 9876, tự động bố trí layout bằng Dagre, hiển thị Code Evidence & Causal WHY Card.
- [x] **Giai đoạn 3 (Adaptive Runtime):** Triển khai Safe Command Dispatcher (Whitelisted execFile) với 3 chế độ (Active Runner, Ephemeral Mock Test, Passive Log Matcher).
- [ ] **Giai đoạn 4 (Ecosystem Plugin):** Đóng gói extension 1-click cho Antigravity IDE, Cursor và VS Code Marketplace.

---

<p align="center">
  Được phát triển với niềm đam mê mang lại sự minh bạch và tin cậy cho kỷ nguyên AI Agent Coding.
</p>
