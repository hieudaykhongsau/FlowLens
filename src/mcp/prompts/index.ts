export const availablePrompts = [
  {
    name: 'investigate_api_error',
    description: 'Bắt đầu quy trình điều tra lỗi API theo chuẩn 6 bước FlowLens (AST Pipeline Trace -> Runtime Verification -> Causal WHY -> Đồng bộ Canvas 2D).',
    arguments: [
      {
        name: 'endpoint',
        description: 'Đường dẫn API hoặc route cần điều tra (ví dụ: /api/v1/regulations/approve hoặc POST /orders)',
        required: true
      },
      {
        name: 'method',
        description: 'HTTP Method (GET, POST, PUT, DELETE). Mặc định là POST hoặc GET.',
        required: false
      },
      {
        name: 'curlCommand',
        description: 'Lệnh cURL hoặc request HTTP đầy đủ mà bạn đã chạy kèm headers/payload',
        required: false
      },
      {
        name: 'errorCode',
        description: 'Mã HTTP status code nhận được (ví dụ: 400, 401, 403, 500)',
        required: false
      },
      {
        name: 'errorMessage',
        description: 'Nội dung thông báo lỗi hoặc stacktrace nhận được',
        required: false
      }
    ]
  },
  {
    name: 'verify_runtime_mock',
    description: 'Chạy xác minh runtime an toàn trong sandbox runner (mvn, gradle, npm, pytest, go) hoặc đọc passive log.',
    arguments: [
      {
        name: 'command',
        description: 'Lệnh test runner: mvn, gradle, npm, pnpm, pytest, python, go',
        required: true
      },
      {
        name: 'testTarget',
        description: 'Tên test class, test function hoặc file test cần chạy',
        required: false
      },
      {
        name: 'mode',
        description: 'Chế độ: active (chạy test suite thực tế), ephemeral_mock (chạy test tạm), passive_log (quét file log)',
        required: false
      }
    ]
  },
  {
    name: 'explain_causal_why',
    description: 'Phân tích chi tiết thẻ Causal WHY 4 thành phần (Condition, Actual State, Verdict, Recommendation) cho điểm dừng thất bại (STOPPED_HERE).',
    arguments: [
      {
        name: 'nodeId',
        description: 'ID của node trong Canvas cần giải thích (để trống nếu muốn phân tích node STOPPED_HERE hiện tại)',
        required: false
      }
    ]
  }
];

export async function handleGetPrompt(name: string, args: Record<string, string> = {}, port: number = 9876) {
  switch (name) {
    case 'investigate_api_error': {
      const endpoint = args.endpoint || '/api/v1/resource';
      const method = (args.method || 'POST').toUpperCase();
      const curlCommand = args.curlCommand ? `\nLệnh cURL: \`${args.curlCommand}\`` : '';
      const errorCode = args.errorCode ? `\nMã lỗi: HTTP ${args.errorCode}` : '';
      const errorMessage = args.errorMessage ? `\nThông báo lỗi: ${args.errorMessage}` : '';

      const promptText = `Bạn là trợ lý kỹ sư phân tích lỗi API cao cấp sử dụng hệ thống FlowLens.
Nhiệm vụ của bạn là điều tra nguyên nhân gốc rễ (Root Cause) của lỗi API sau đây theo đúng quy trình 6 bước tất định:

**Thông tin sự cố:**
- Endpoint: \`${method} ${endpoint}\`${errorCode}${errorMessage}${curlCommand}

---
### QUY TRÌNH THỰC HIỆN 6 BƯỚC FLOWLENS:

1. **Bước 1 - Phân tích Request & cURL:**
   - Trích xuất method, endpoint, headers (Authorization/Role), body/query params từ request.
   - Gọi tool \`trace_endpoint_pipeline\` với \`endpoint: "${endpoint}"\`, \`method: "${method}"\`${args.curlCommand ? `, \`curlCommand: "${args.curlCommand.replace(/"/g, '\\"')}"\`` : ''}${args.errorCode ? `, \`errorCode: ${args.errorCode}\`` : ''}.

2. **Bước 2 - Tạo & Cập nhật Phiên Điều tra:**
   - Khi có kết quả AST trace từ tool, gọi \`update_investigation_session\` để cập nhật danh sách \`nodes\` và \`edges\`.
   - Đặt \`currentStep: 2\`, \`stepStatus: 'completed'\`, mở Canvas tại \`http://localhost:${port}\`.

3. **Bước 3 - Quét AST Tĩnh & Dò Call Graph:**
   - Dò từ Controller -> Filter/Interceptor -> Guard/PreAuthorize -> Service -> Repository.
   - Đánh dấu các node đã vượt qua thành \`PASSED\`.

4. **Bước 4 - Xác minh Runtime (Active / Passive):**
   - Nếu có sẵn test runner hoặc log, gọi \`execute_sandboxed_runner\` để xác thực điểm gãy runtime.
   - Nếu không có test runner, sử dụng deterministic code inspection để đối chiếu điều kiện nghiệp vụ.

5. **Bước 5 - Đánh dấu STOPPED_HERE & Tạo Causal WHY:**
   - Xác định chính xác node bị lỗi, đổi state thành \`STOPPED_HERE\`. Các node phía sau đổi thành \`SKIPPED\`.
   - Viết thẻ Causal WHY gồm 4 thành phần bắt buộc:
     * \`condition\`: Điều kiện bắt buộc của hệ thống (ví dụ: cần ROLE_ADMIN).
     * \`actualState\`: Dữ liệu thực tế truyền lên (ví dụ: token chỉ có ROLE_OPERATOR).
     * \`verdict\`: Phán quyết lỗi chính xác (ví dụ: 403 Forbidden tại AccessDeniedException).
     * \`recommendation\`: Giải pháp khắc phục cụ thể, khả thi.
   - Đính kèm \`codeEvidence\` (file, line, codeSnippet).

6. **Bước 6 - Báo cáo Kết luận & Đồng bộ Canvas:**
   - Gọi \`update_investigation_session\` với \`status: 'completed'\`, \`currentStep: 6\`, \`rootCauseNodeId\`, và \`summary\`.
   - Trả về báo cáo rõ ràng kèm đường dẫn xem đồ thị tương tác tại \`http://localhost:${port}\`.

Hãy bắt đầu ngay với Bước 1 bằng cách gọi \`trace_endpoint_pipeline\`!`;

      return {
        description: `Quy trình 6 bước điều tra lỗi API ${method} ${endpoint}`,
        messages: [
          {
            role: 'user' as const,
            content: {
              type: 'text' as const,
              text: promptText
            }
          }
        ]
      };
    }

    case 'verify_runtime_mock': {
      const command = args.command || 'npm';
      const testTarget = args.testTarget || '';
      const mode = args.mode || 'active';

      const promptText = `Bạn hãy thực hiện bước Xác minh Runtime (Bước 4 trong FlowLens) cho runner: \`${command}\`.

**Thông tin cấu hình:**
- Runner: \`${command}\`
- Mục tiêu kiểm thử: \`${testTarget || 'Toàn bộ test liên quan'}\`
- Chế độ: \`${mode}\`

**Yêu cầu an toàn:**
- Sử dụng tool \`execute_sandboxed_runner\` với lệnh đã chọn.
- Không chạy bất kỳ lệnh bash nào ngoài whitelist runner.
- Phân tích output trả về: tìm stacktrace, assertions failed, HTTP status code thực tế trả về.
- Cập nhật log runtime vào node tương ứng trong session thông qua \`update_investigation_session\`.`;

      return {
        description: `Chạy xác minh runtime an toàn với runner ${command}`,
        messages: [
          {
            role: 'user' as const,
            content: {
              type: 'text' as const,
              text: promptText
            }
          }
        ]
      };
    }

    case 'explain_causal_why': {
      const nodeId = args.nodeId || '(node STOPPED_HERE hiện tại)';

      const promptText = `Hãy đọc resource \`flowlens://evidence/root-cause\` hoặc kiểm tra node ID \`${nodeId}\` trong phiên điều tra FlowLens hiện tại.

Nhiệm vụ:
1. Đọc nội dung thẻ Causal WHY và Code Evidence của node nguyên nhân gốc rễ.
2. Trình bày phân tích kỹ thuật chuyên sâu theo cấu trúc 4 phần chuẩn:
   - 📌 **Điều Kiện Tiền Đề (Condition):** Yêu cầu của logic mã nguồn/chính sách bảo mật.
   - ⚠️ **Trạng Thái Thực Tế (Actual State):** Dữ liệu runtime/request truyền vào không đáp ứng.
   - ❌ **Phán Quyết & Biểu Hiện (Verdict):** Mã lỗi HTTP, Exception class, vị trí gãy.
   - 🛠️ **Đề Xuất Sửa Lỗi (Recommendation):** Đoạn mã patch cụ thể hoặc thao tác cấu hình chuẩn.
3. Cung cấp file path và line number chính xác để lập trình viên có thể nhảy trực tiếp vào code sửa lỗi.`;

      return {
        description: `Phân tích chuyên sâu Causal WHY cho node ${nodeId}`,
        messages: [
          {
            role: 'user' as const,
            content: {
              type: 'text' as const,
              text: promptText
            }
          }
        ]
      };
    }

    default:
      throw new Error(`FlowLens Prompt not found: ${name}`);
  }
}
