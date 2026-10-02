import React, { useState } from 'react';
import {
  X,
  Play,
  Sparkles
} from 'lucide-react';
import type { InvestigationSession } from '../types.js';

interface InvestigationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRunScenario: (session: InvestigationSession) => void;
}

export const PRESET_SCENARIOS: {
  id: string;
  name: string;
  method: string;
  endpoint: string;
  statusText: string;
  desc: string;
  session: InvestigationSession;
}[] = [
  {
    id: '403_rbac',
    name: '1. [403 Forbidden] Lỗi phân quyền Spring Boot RBAC',
    method: 'POST',
    endpoint: '/api/v1/regulations/approve',
    statusText: '403 Forbidden',
    desc: 'Request bị chặn tại @PreAuthorize do user chỉ có ROLE_OPERATOR, thiếu ROLE_ADMIN.',
    session: {
      id: 'session-403',
      endpoint: '/api/v1/regulations/approve',
      method: 'POST',
      status: 'completed',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      certaintyScore: 0.88,
      steps: [
        { stepNumber: 1, title: 'Nhận cURL / Mã lỗi', status: 'completed', summary: 'POST /api/v1/regulations/approve (403)', timestamp: new Date().toISOString() },
        { stepNumber: 2, title: 'Tạo Session MCP', status: 'completed', summary: 'WebSocket hub mở tại port 9876', timestamp: new Date().toISOString() },
        { stepNumber: 3, title: 'Quét Pipeline AST', status: 'completed', summary: 'Định vị Controller -> Guard -> Service -> Repo', timestamp: new Date().toISOString() },
        { stepNumber: 4, title: 'Xác minh Runtime 3 cấp độ', status: 'completed', summary: 'MockMvc test trả về 403 Forbidden', timestamp: new Date().toISOString() },
        { stepNumber: 5, title: 'Kết luận Nhân - Quả (WHY)', status: 'completed', summary: 'Chết tại Guard @PreAuthorize', timestamp: new Date().toISOString() },
        { stepNumber: 6, title: 'Báo cáo & Hiển thị Canvas', status: 'completed', summary: 'Đồng bộ hoàn tất lên màn hình 2D', timestamp: new Date().toISOString() }
      ],
      nodes: [
        {
          id: 'node-entrypoint',
          type: 'entrypoint',
          label: 'POST /api/v1/regulations/approve',
          sublabel: 'RegulationTypeController.approveRegulation()',
          file: 'src/main/java/com/fis/category/controller/RegulationTypeController.java',
          line: 42,
          state: 'PASSED',
          certainty: 'EXPLICIT',
          confidence: 0.95,
          method: 'POST',
          runtimeLogs: ['HTTP POST received from 10.20.1.5', 'Request Header: Authorization=Bearer eyJhbGci...']
        },
        {
          id: 'node-auth-filter',
          type: 'filter',
          label: 'JwtAuthenticationFilter',
          sublabel: 'doFilterInternal() - Token Verification',
          file: 'src/main/java/com/fis/security/JwtAuthenticationFilter.java',
          line: 88,
          state: 'PASSED',
          certainty: 'EXPLICIT',
          confidence: 0.90,
          runtimeLogs: ['Token decoded successfully. Subject: user_8392, Roles: [ROLE_OPERATOR]']
        },
        {
          id: 'node-rbac-guard',
          type: 'guard',
          label: 'PreAuthorize Guard',
          sublabel: "@PreAuthorize(\"hasRole('ADMIN')\")",
          file: 'src/main/java/com/fis/category/controller/RegulationTypeController.java',
          line: 41,
          state: 'STOPPED_HERE',
          certainty: 'EXPLICIT',
          confidence: 1.0,
          causalWhy: {
            condition: "Người dùng phải có role 'ROLE_ADMIN' để phê duyệt quy định quy chế.",
            actualState: "Token gửi lên chỉ chứa 'ROLE_OPERATOR', thiếu quyền quản trị.",
            verdict: "403 FORBIDDEN: Access Denied tại SecurityExpressionRoot.hasRole()",
            recommendation: "Cấp thêm quyền ROLE_ADMIN cho tài khoản kiểm thử hoặc cập nhật chính sách RBAC."
          },
          codeEvidence: {
            file: 'src/main/java/com/fis/category/controller/RegulationTypeController.java',
            line: 41,
            language: 'java',
            codeSnippet: `@PostMapping("/approve")
@PreAuthorize("hasRole('ADMIN')") // <--- STOPPED_HERE: AccessDeniedException
public ResponseEntity<ApiResponse> approveRegulation(@RequestBody ApproveDto dto) {
    return ResponseEntity.ok(regulationTypeService.approve(dto));
}`
          },
          runtimeLogs: [
            'WARN [SecurityInterceptor] Access is denied (user is not authorized)',
            'org.springframework.security.access.AccessDeniedException: Access is denied'
          ]
        },
        {
          id: 'node-service',
          type: 'service',
          label: 'RegulationTypeServiceImpl',
          sublabel: 'approve(dto) - Nghiệp vụ phê duyệt',
          file: 'src/main/java/com/fis/category/service/impl/RegulationTypeServiceImpl.java',
          line: 120,
          state: 'SKIPPED',
          certainty: 'INFERRED',
          confidence: 0.70,
          runtimeLogs: ['[SKIPPED] Luồng thực thi bị chặn trước khi bước vào Service']
        },
        {
          id: 'node-repo',
          type: 'repository',
          label: 'RegulationTypeRepository',
          sublabel: 'saveAndFlush(entity)',
          file: 'src/main/java/com/fis/category/repository/RegulationTypeRepository.java',
          line: 35,
          state: 'SKIPPED',
          certainty: 'INFERRED',
          confidence: 0.65
        },
        {
          id: 'node-db',
          type: 'database',
          label: 'PostgreSQL Database',
          sublabel: 'TABLE regulation_type (COMMIT)',
          state: 'SKIPPED',
          certainty: 'INFERRED',
          confidence: 0.50
        }
      ],
      edges: [
        { id: 'e1-2', source: 'node-entrypoint', target: 'node-auth-filter', label: 'HTTP Request', animated: true },
        { id: 'e2-3', source: 'node-auth-filter', target: 'node-rbac-guard', label: 'Authenticated Context', animated: true },
        { id: 'e3-4', source: 'node-rbac-guard', target: 'node-service', label: 'BLOCKED (403)', animated: false, style: { stroke: '#ef4444', strokeDasharray: '4 4' } },
        { id: 'e4-5', source: 'node-service', target: 'node-repo', label: 'Call repository', animated: false },
        { id: 'e5-6', source: 'node-repo', target: 'node-db', label: 'SQL UPDATE', animated: false }
      ]
    }
  },
  {
    id: '500_payment_timeout',
    name: '2. [500 Gateway Timeout] Cổng thanh toán ngoại vi bị treo',
    method: 'POST',
    endpoint: '/api/v1/orders/checkout',
    statusText: '500 Internal Error',
    desc: 'Đã qua Controller và Service nghiệp vụ nhưng sập tại ExternalPaymentClient do SocketTimeout.',
    session: {
      id: 'session-500',
      endpoint: '/api/v1/orders/checkout',
      method: 'POST',
      status: 'completed',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      certaintyScore: 0.92,
      steps: [
        { stepNumber: 1, title: 'Nhận cURL / Mã lỗi', status: 'completed', summary: 'POST /api/v1/orders/checkout (500)', timestamp: new Date().toISOString() },
        { stepNumber: 2, title: 'Tạo Session MCP', status: 'completed', summary: 'Tạo session điều tra lỗi 500', timestamp: new Date().toISOString() },
        { stepNumber: 3, title: 'Quét Pipeline AST', status: 'completed', summary: 'Dò vết OrderController -> OrderService -> VNPayClient', timestamp: new Date().toISOString() },
        { stepNumber: 4, title: 'Xác minh Runtime 3 cấp độ', status: 'completed', summary: 'Khớp Stack Trace java.net.SocketTimeoutException', timestamp: new Date().toISOString() },
        { stepNumber: 5, title: 'Kết luận Nhân - Quả (WHY)', status: 'completed', summary: 'Điểm chết tại ExternalPaymentClient', timestamp: new Date().toISOString() },
        { stepNumber: 6, title: 'Báo cáo & Hiển thị Canvas', status: 'completed', summary: 'Cảnh báo Database Order chưa commit tiền', timestamp: new Date().toISOString() }
      ],
      nodes: [
        {
          id: 'node-order-entry',
          type: 'entrypoint',
          label: 'POST /api/v1/orders/checkout',
          sublabel: 'OrderCheckoutController.processCheckout()',
          file: 'src/main/java/com/fis/order/controller/OrderCheckoutController.java',
          line: 28,
          state: 'PASSED',
          certainty: 'EXPLICIT',
          confidence: 0.95,
          method: 'POST'
        },
        {
          id: 'node-order-service',
          type: 'service',
          label: 'OrderCheckoutServiceImpl',
          sublabel: 'createOrderAndCharge(dto)',
          file: 'src/main/java/com/fis/order/service/OrderCheckoutServiceImpl.java',
          line: 65,
          state: 'PASSED',
          certainty: 'EXPLICIT',
          confidence: 0.90
        },
        {
          id: 'node-payment-client',
          type: 'external_api',
          label: 'VNPayPaymentGatewayClient',
          sublabel: 'POST https://sandbox.vnpayment.vn/payment',
          file: 'src/main/java/com/fis/order/client/VNPayPaymentGatewayClient.java',
          line: 94,
          state: 'STOPPED_HERE',
          certainty: 'EXPLICIT',
          confidence: 1.0,
          causalWhy: {
            condition: "Cổng thanh toán đối tác phải phản hồi trong thời hạn connectTimeout = 5000ms.",
            actualState: "Server đối tác quá tải, không trả response sau 5000ms dẫn đến kết nối bị drop.",
            verdict: "500 GATEWAY TIMEOUT: java.net.SocketTimeoutException: Read timed out",
            recommendation: "Bổ sung cơ chế Circuit Breaker (Resilience4j) với fallback hoặc tăng timeout lên 10s có cơ chế retry bất đồng bộ."
          },
          codeEvidence: {
            file: 'src/main/java/com/fis/order/client/VNPayPaymentGatewayClient.java',
            line: 94,
            language: 'java',
            codeSnippet: `ResponseEntity<PaymentResp> response = restTemplate.postForEntity(
    paymentUrl, 
    request, 
    PaymentResp.class
); // <--- STOPPED_HERE: java.net.SocketTimeoutException: Read timed out`
          },
          runtimeLogs: [
            'ERROR [org.springframework.web.client.ResourceAccessException] I/O error on POST request for "https://sandbox.vnpayment.vn/payment": Read timed out',
            'Caused by: java.net.SocketTimeoutException: Read timed out'
          ]
        },
        {
          id: 'node-order-repo',
          type: 'repository',
          label: 'OrderRepository',
          sublabel: 'markOrderAsPaid()',
          state: 'SKIPPED',
          certainty: 'INFERRED',
          confidence: 0.60
        },
        {
          id: 'node-order-db',
          type: 'database',
          label: 'Orders DB Table',
          sublabel: 'UPDATE orders SET status = "PAID"',
          state: 'SKIPPED',
          certainty: 'INFERRED',
          confidence: 0.50
        }
      ],
      edges: [
        { id: 'e-ord-1', source: 'node-order-entry', target: 'node-order-service', label: 'Call service', animated: true },
        { id: 'e-ord-2', source: 'node-order-service', target: 'node-payment-client', label: 'Invoke External API', animated: true },
        { id: 'e-ord-3', source: 'node-payment-client', target: 'node-order-repo', label: 'BLOCKED (TIMEOUT)', animated: false, style: { stroke: '#ef4444', strokeDasharray: '4 4' } },
        { id: 'e-ord-4', source: 'node-order-repo', target: 'node-order-db', label: 'Never executed', animated: false }
      ]
    }
  },
  {
    id: '400_validation',
    name: '3. [400 Bad Request] Lỗi Validation DTO @NotBlank',
    method: 'POST',
    endpoint: '/api/v1/categories',
    statusText: '400 Bad Request',
    desc: 'Request gửi body thiếu trường bắt buộc "categoryName", quăng MethodArgumentNotValidException.',
    session: {
      id: 'session-400',
      endpoint: '/api/v1/categories',
      method: 'POST',
      status: 'completed',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      certaintyScore: 0.95,
      steps: [
        { stepNumber: 1, title: 'Nhận cURL / Mã lỗi', status: 'completed', summary: 'POST /api/v1/categories (400 Bad Request)', timestamp: new Date().toISOString() },
        { stepNumber: 2, title: 'Tạo Session MCP', status: 'completed', summary: 'Khởi tạo session điều tra lỗi 400', timestamp: new Date().toISOString() },
        { stepNumber: 3, title: 'Quét Pipeline AST', status: 'completed', summary: 'Phát hiện @Valid CategoryDto tại Controller', timestamp: new Date().toISOString() },
        { stepNumber: 4, title: 'Xác minh Runtime 3 cấp độ', status: 'completed', summary: 'Chạy MockMvc test: status().isBadRequest()', timestamp: new Date().toISOString() },
        { stepNumber: 5, title: 'Kết luận Nhân - Quả (WHY)', status: 'completed', summary: 'Điểm chết tại Tầng DTO Validation', timestamp: new Date().toISOString() },
        { stepNumber: 6, title: 'Báo cáo & Hiển thị Canvas', status: 'completed', summary: 'Đồng bộ đồ thị 2D hoàn tất', timestamp: new Date().toISOString() }
      ],
      nodes: [
        {
          id: 'node-cat-entry',
          type: 'entrypoint',
          label: 'POST /api/v1/categories',
          sublabel: 'CategoryController.createCategory(@Valid CategoryDto dto)',
          file: 'src/main/java/com/fis/category/controller/CategoryController.java',
          line: 30,
          state: 'PASSED',
          certainty: 'EXPLICIT',
          confidence: 0.95,
          method: 'POST'
        },
        {
          id: 'node-cat-validator',
          type: 'guard',
          label: 'DTO Validation (Hibernate Validator)',
          sublabel: '@NotBlank(message = "categoryName must not be empty")',
          file: 'src/main/java/com/fis/category/dto/CategoryDto.java',
          line: 15,
          state: 'STOPPED_HERE',
          certainty: 'EXPLICIT',
          confidence: 1.0,
          causalWhy: {
            condition: "Trường 'categoryName' là chuỗi ký tự không rỗng theo ràng buộc @NotBlank.",
            actualState: "Payload gửi lên: {\"description\": \"Danh mục số 1\"}, thiếu hoàn toàn 'categoryName'.",
            verdict: "400 BAD REQUEST: MethodArgumentNotValidException: Field 'categoryName' rejected value [null]",
            recommendation: "Bổ sung thuộc tính 'categoryName' vào payload HTTP body của client."
          },
          codeEvidence: {
            file: 'src/main/java/com/fis/category/dto/CategoryDto.java',
            line: 15,
            language: 'java',
            codeSnippet: `@NotBlank(message = "categoryName cannot be blank")
private String categoryName; // <--- STOPPED_HERE (Field error: rejected value [null])`
          },
          runtimeLogs: [
            'WARN [DefaultHandlerExceptionResolver] Resolved [MethodArgumentNotValidException: Validation failed for argument [0] in public ResponseEntity...]',
            'Field error in object "categoryDto" on field "categoryName": rejected value [null]'
          ]
        },
        {
          id: 'node-cat-service',
          type: 'service',
          label: 'CategoryServiceImpl',
          sublabel: 'createCategory()',
          state: 'SKIPPED',
          certainty: 'INFERRED',
          confidence: 0.60
        },
        {
          id: 'node-cat-db',
          type: 'database',
          label: 'Category Table',
          sublabel: 'INSERT INTO categories',
          state: 'SKIPPED',
          certainty: 'INFERRED',
          confidence: 0.50
        }
      ],
      edges: [
        { id: 'e-cat-1', source: 'node-cat-entry', target: 'node-cat-validator', label: 'Validate Payload', animated: true },
        { id: 'e-cat-2', source: 'node-cat-validator', target: 'node-cat-service', label: 'BLOCKED (400)', animated: false, style: { stroke: '#ef4444', strokeDasharray: '4 4' } },
        { id: 'e-cat-3', source: 'node-cat-service', target: 'node-cat-db', label: 'Never executed', animated: false }
      ]
    }
  }
];

export const InvestigationModal: React.FC<InvestigationModalProps> = ({
  isOpen,
  onClose,
  onRunScenario
}) => {
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>('403_rbac');
  const [customMethod, setCustomMethod] = useState<string>('POST');
  const [customEndpoint, setCustomEndpoint] = useState<string>('/api/v1/users');
  const [customErrorCode, setCustomErrorCode] = useState<string>('403');
  const [isSimulating, setIsSimulating] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleRunPreset = (scenarioId: string) => {
    const sc = PRESET_SCENARIOS.find((s) => s.id === scenarioId);
    if (!sc) return;

    setIsSimulating(true);
    setTimeout(() => {
      onRunScenario(sc.session);
      setIsSimulating(false);
      onClose();
    }, 600);
  };

  const handleRunCustom = () => {
    setIsSimulating(true);
    setTimeout(() => {
      const parts = customEndpoint.split('/').filter(Boolean);
      const domain = parts[parts.length - 1] || 'resource';
      const cap = domain.charAt(0).toUpperCase() + domain.slice(1);

      const customSession: InvestigationSession = {
        id: `custom-${Date.now()}`,
        endpoint: customEndpoint,
        method: customMethod,
        status: 'completed',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        certaintyScore: 0.85,
        steps: [
          { stepNumber: 1, title: 'Nhận cURL / Request lỗi', status: 'completed', summary: `${customMethod} ${customEndpoint} (${customErrorCode})`, timestamp: new Date().toISOString() },
          { stepNumber: 2, title: 'Tạo Session MCP & WebSocket', status: 'completed', summary: 'Mở WebSocket Hub port 9876', timestamp: new Date().toISOString() },
          { stepNumber: 3, title: 'Quét Pipeline AST tĩnh', status: 'completed', summary: `Phân giải ${cap}Controller -> ${cap}Service`, timestamp: new Date().toISOString() },
          { stepNumber: 4, title: 'Xác minh Runtime 3 cấp độ', status: 'completed', summary: `Khớp phản hồi mã lỗi ${customErrorCode}`, timestamp: new Date().toISOString() },
          { stepNumber: 5, title: 'Kết luận Nhân - Quả (WHY)', status: 'completed', summary: `Xác định điểm dừng STOPPED_HERE tại ${cap}Filter`, timestamp: new Date().toISOString() },
          { stepNumber: 6, title: 'Báo cáo & Đồng bộ Canvas', status: 'completed', summary: 'Hoàn tất đồng bộ đồ thị', timestamp: new Date().toISOString() }
        ],
        nodes: [
          {
            id: 'c-entry',
            type: 'entrypoint',
            label: `${customMethod} ${customEndpoint}`,
            sublabel: `${cap}Controller.handle()`,
            file: `src/main/java/com/fis/controller/${cap}Controller.java`,
            line: 32,
            state: 'PASSED',
            certainty: 'EXPLICIT',
            confidence: 0.95,
            method: customMethod
          },
          {
            id: 'c-filter',
            type: 'filter',
            label: `${cap}SecurityFilter`,
            sublabel: `doFilterInternal() - Check status code ${customErrorCode}`,
            file: `src/main/java/com/fis/security/${cap}SecurityFilter.java`,
            line: 55,
            state: 'STOPPED_HERE',
            certainty: 'EXPLICIT',
            confidence: 0.90,
            causalWhy: {
              condition: `Request phải thỏa mãn chính sách bảo mật và tham số hợp lệ cho ${customEndpoint}.`,
              actualState: `Client gửi dữ liệu vi phạm điều kiện, dẫn đến mã lỗi ${customErrorCode}.`,
              verdict: `${customErrorCode} ERROR: Request bị chặn tại tầng filter trước khi vào logic nghiệp vụ.`,
              recommendation: `Kiểm tra lại token xác thực hoặc quyền hạn được cấu hình tại ${cap}SecurityFilter.`
            },
            codeEvidence: {
              file: `src/main/java/com/fis/security/${cap}SecurityFilter.java`,
              line: 55,
              language: 'java',
              codeSnippet: `if (!hasValidCredentials(request)) {\n    response.sendError(HttpServletResponse.SC_${customErrorCode === '403' ? 'FORBIDDEN' : 'BAD_REQUEST'}); // <--- STOPPED_HERE\n    return;\n}`
            }
          },
          {
            id: 'c-service',
            type: 'service',
            label: `${cap}ServiceImpl`,
            sublabel: 'executeBusinessLogic()',
            state: 'SKIPPED',
            certainty: 'INFERRED',
            confidence: 0.60
          },
          {
            id: 'c-repo',
            type: 'repository',
            label: `${cap}Repository`,
            sublabel: 'saveOrUpdate()',
            state: 'SKIPPED',
            certainty: 'INFERRED',
            confidence: 0.50
          }
        ],
        edges: [
          { id: 'c-e1', source: 'c-entry', target: 'c-filter', label: 'HTTP Context', animated: true },
          { id: 'c-e2', source: 'c-filter', target: 'c-service', label: `BLOCKED (${customErrorCode})`, animated: false, style: { stroke: '#ef4444', strokeDasharray: '4 4' } },
          { id: 'c-e3', source: 'c-service', target: 'c-repo', label: 'Never reached', animated: false }
        ]
      };

      onRunScenario(customSession);
      setIsSimulating(false);
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-sky-500/20 border border-sky-500/40 flex items-center justify-center text-sky-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">
                FlowLens Investigation Simulator
              </h3>
              <p className="text-[11px] text-slate-400">
                Thử nghiệm điều tra trực tiếp trên Web mà không cần kết nối Agent
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-5 overflow-y-auto max-h-[75vh]">
          {/* Section 1: Presets */}
          <div>
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block mb-2">
              Chọn Kịch Bản Mô Phỏng Lỗi Sẵn Có (Presets):
            </label>

            <div className="space-y-2.5">
              {PRESET_SCENARIOS.map((sc) => {
                const isSelected = selectedScenarioId === sc.id;
                return (
                  <div
                    key={sc.id}
                    onClick={() => setSelectedScenarioId(sc.id)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
                      isSelected
                        ? 'border-sky-500 bg-sky-950/20 shadow-[0_0_15px_rgba(56,189,248,0.15)] ring-1 ring-sky-500/50'
                        : 'border-slate-800 bg-slate-900/40 hover:border-slate-700 hover:bg-slate-900/70'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-200">
                          {sc.name}
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-sky-400 border border-slate-700">
                          {sc.statusText}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed font-sans">
                        {sc.desc}
                      </p>
                      <div className="text-[11px] font-mono text-slate-300">
                        <code>{sc.method} {sc.endpoint}</code>
                      </div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRunPreset(sc.id);
                      }}
                      disabled={isSimulating}
                      className="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold flex items-center gap-1.5 shrink-0 transition-all shadow-md active:scale-95"
                    >
                      <Play className="w-3 h-3 fill-current" />
                      <span>Chạy kịch bản</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="h-[1px] bg-slate-800" />

          {/* Section 2: Custom API Test */}
          <div>
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block mb-2">
              Hoặc Nhập Endpoint Tự Định Nghĩa:
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
              <div>
                <span className="text-[10px] text-slate-400 block mb-1">Method:</span>
                <select
                  value={customMethod}
                  onChange={(e) => setCustomMethod(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 font-mono focus:border-sky-500 focus:outline-none"
                >
                  <option value="GET">GET</option>
                  <option value="POST">POST</option>
                  <option value="PUT">PUT</option>
                  <option value="DELETE">DELETE</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <span className="text-[10px] text-slate-400 block mb-1">API Endpoint Path:</span>
                <input
                  type="text"
                  value={customEndpoint}
                  onChange={(e) => setCustomEndpoint(e.target.value)}
                  placeholder="/api/v1/orders"
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 font-mono focus:border-sky-500 focus:outline-none"
                />
              </div>

              <div>
                <span className="text-[10px] text-slate-400 block mb-1">Mã Lỗi:</span>
                <select
                  value={customErrorCode}
                  onChange={(e) => setCustomErrorCode(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 font-mono focus:border-sky-500 focus:outline-none"
                >
                  <option value="400">400 Bad Request</option>
                  <option value="401">401 Unauthorized</option>
                  <option value="403">403 Forbidden</option>
                  <option value="404">404 Not Found</option>
                  <option value="500">500 Server Error</option>
                </select>
              </div>
            </div>

            <div className="mt-3 flex justify-end">
              <button
                onClick={handleRunCustom}
                disabled={isSimulating}
                className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-2 transition-all shadow-md active:scale-95"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Mô phỏng điều tra Endpoint này</span>
              </button>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-3 bg-slate-900/60 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
          <span>* Dữ liệu mô phỏng sẽ được vẽ trực tiếp thành đồ thị 2D với Causal WHY Card trên Canvas.</span>
          <button
            onClick={onClose}
            className="px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
