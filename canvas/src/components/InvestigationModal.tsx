import React, { useState } from 'react';
import {
  X,
  Play,
  SlidersHorizontal,
  ArrowRight
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
  statusCode: number;
  statusText: string;
  desc: string;
  session: InvestigationSession;
}[] = [
  {
    id: '403_rbac',
    name: '1. [403 Forbidden] Spring Security @PreAuthorize Access Denied',
    method: 'POST',
    endpoint: '/api/v1/regulations/approve',
    statusCode: 403,
    statusText: '403 Forbidden',
    desc: 'Yêu cầu quyền ROLE_ADMIN để phê duyệt quy định. Token gửi lên chỉ mang quyền ROLE_OPERATOR.',
    session: {
      id: 'session-403',
      endpoint: '/api/v1/regulations/approve',
      method: 'POST',
      statusCode: 403,
      latencyMs: 14,
      status: 'completed',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      certaintyScore: 0.85,
      steps: [
        { stepNumber: 1, title: 'Nhận cURL / Request', status: 'completed', summary: 'POST /api/v1/regulations/approve (403)', timestamp: new Date().toISOString() },
        { stepNumber: 2, title: 'Khởi tạo Session MCP', status: 'completed', summary: 'Gán session ID & kết nối WebSocket 9876', timestamp: new Date().toISOString() },
        { stepNumber: 3, title: 'Quét Pipeline AST', status: 'completed', summary: 'Controller -> Guard -> Service -> Repo', timestamp: new Date().toISOString() },
        { stepNumber: 4, title: 'Kiểm thử Runtime', status: 'completed', summary: 'MockMvc test trả về 403 Forbidden', timestamp: new Date().toISOString() },
        { stepNumber: 5, title: 'Phân tích Nhân - Quả', status: 'completed', summary: 'Dừng tại Guard @PreAuthorize L41', timestamp: new Date().toISOString() },
        { stepNumber: 6, title: 'Đồng bộ kết quả', status: 'completed', summary: 'Cập nhật sơ đồ luồng thực thi', timestamp: new Date().toISOString() }
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
          confidence: 1.0,
          evidence: {
            hasRouteAnnotation: true,
            routeAnnotationRule: '@PostMapping("/approve") khớp endpoint HTTP',
            hasSymbolCall: true,
            symbolCallRule: 'Khớp hàm approveRegulation(ApproveDto) trong Controller',
            hasRuntimeTrace: true,
            runtimeTraceRule: 'HTTP 200 frame đón nhận request thành công'
          },
          method: 'POST',
          latencyMs: 2,
          runtimeLogs: ['HTTP POST received from client', 'Authorization: Bearer eyJhbGci...']
        },
        {
          id: 'node-auth-filter',
          type: 'filter',
          label: 'JwtAuthenticationFilter',
          sublabel: 'doFilterInternal() - Parse JWT Claims',
          file: 'src/main/java/com/fis/security/JwtAuthenticationFilter.java',
          line: 88,
          state: 'PASSED',
          certainty: 'EXPLICIT',
          confidence: 1.0,
          evidence: {
            hasRouteAnnotation: true,
            routeAnnotationRule: 'SecurityFilterChain đăng ký JwtAuthenticationFilter',
            hasSymbolCall: true,
            symbolCallRule: 'doFilterInternal(request, response, chain) gọi qua Bean filter',
            hasRuntimeTrace: true,
            runtimeTraceRule: 'Log SecurityContextHolder populated: user_8392'
          },
          latencyMs: 4,
          runtimeLogs: ['Token verified. Claims: sub=user_8392, authorities=[ROLE_OPERATOR]']
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
          evidence: {
            hasRouteAnnotation: true,
            routeAnnotationRule: '@PreAuthorize("hasRole(\'ADMIN\')") gắn trực tiếp tại method',
            hasSymbolCall: true,
            symbolCallRule: 'MethodSecurityInterceptor bắt quyền trước khi invoke method',
            hasRuntimeTrace: true,
            runtimeTraceRule: 'Bắt được AccessDeniedException tại RegulationTypeController.java:41'
          },
          latencyMs: 8,
          causalWhy: {
            condition: "Tài khoản cần có quyền 'ROLE_ADMIN' để thực hiện thao tác phê duyệt quy định.",
            actualState: "JWT Token thực tế mang quyền 'ROLE_OPERATOR', không thỏa mãn hasRole('ADMIN').",
            verdict: "403 FORBIDDEN: AccessDeniedException tại SecurityExpressionRoot.hasRole()",
            recommendation: "Bổ sung role 'ROLE_ADMIN' cho tài khoản hoặc mở rộng chính sách phân quyền cho phép 'ROLE_OPERATOR'."
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
          codeDiff: {
            filename: 'RegulationTypeController.java',
            oldCode: '@PreAuthorize("hasRole(\'ADMIN\')")',
            newCode: '@PreAuthorize("hasAnyRole(\'ADMIN\', \'OPERATOR\')")'
          },
          runtimeLogs: [
            'WARN [org.springframework.security.access.intercept.AbstractSecurityInterceptor] Access is denied (user is not authorized)',
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
          confidence: 0.30,
          evidence: {
            hasRouteAnnotation: false,
            hasSymbolCall: true,
            symbolCallRule: 'Injected interface RegulationTypeService -> Impl tìm thấy qua AST',
            hasRuntimeTrace: false,
            runtimeTraceRule: 'Request bị chặn trước khi bước vào Service (0% runtime)'
          },
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
          confidence: 0.30,
          evidence: {
            hasRouteAnnotation: false,
            hasSymbolCall: true,
            symbolCallRule: 'Autowired repository trong RegulationTypeServiceImpl',
            hasRuntimeTrace: false,
            runtimeTraceRule: 'Chưa từng được kích hoạt do Service bị skip'
          }
        },
        {
          id: 'node-db',
          type: 'database',
          label: 'PostgreSQL Database',
          sublabel: 'TABLE regulation_type (COMMIT)',
          state: 'SKIPPED',
          certainty: 'INFERRED',
          confidence: 0.30,
          evidence: {
            hasRouteAnnotation: false,
            hasSymbolCall: true,
            symbolCallRule: 'Datasource JPA Hibernate transaction mapping',
            hasRuntimeTrace: false,
            runtimeTraceRule: '0 transactions initiated'
          }
        }
      ],
      edges: [
        { id: 'e1-2', source: 'node-entrypoint', target: 'node-auth-filter', label: 'HTTP Context', animated: true },
        { id: 'e2-3', source: 'node-auth-filter', target: 'node-rbac-guard', label: 'Auth Token', animated: true },
        { id: 'e3-4', source: 'node-rbac-guard', target: 'node-service', label: 'BLOCKED (403)', animated: false, style: { stroke: '#ef4444', strokeDasharray: '4 4' } },
        { id: 'e4-5', source: 'node-service', target: 'node-repo', label: 'Bypassed', animated: false },
        { id: 'e5-6', source: 'node-repo', target: 'node-db', label: 'Bypassed', animated: false }
      ]
    }
  },
  {
    id: '500_payment_timeout',
    name: '2. [500 Server Error] External Payment Gateway SocketTimeout',
    method: 'POST',
    endpoint: '/api/v1/orders/checkout',
    statusCode: 500,
    statusText: '500 Gateway Timeout',
    desc: 'Đã hoàn tất Controller và Service, nhưng bị crash tại tầng gọi API đối tác do quá hạn timeout 5000ms.',
    session: {
      id: 'session-500',
      endpoint: '/api/v1/orders/checkout',
      method: 'POST',
      statusCode: 500,
      latencyMs: 5024,
      status: 'completed',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      certaintyScore: 0.86,
      steps: [
        { stepNumber: 1, title: 'Nhận cURL / Request', status: 'completed', summary: 'POST /api/v1/orders/checkout (500)', timestamp: new Date().toISOString() },
        { stepNumber: 2, title: 'Khởi tạo Session MCP', status: 'completed', summary: 'Gán session ID cho lỗi timeout', timestamp: new Date().toISOString() },
        { stepNumber: 3, title: 'Quét Pipeline AST', status: 'completed', summary: 'OrderController -> OrderService -> VNPayClient', timestamp: new Date().toISOString() },
        { stepNumber: 4, title: 'Kiểm thử Runtime', status: 'completed', summary: 'Bắt được SocketTimeoutException', timestamp: new Date().toISOString() },
        { stepNumber: 5, title: 'Phân tích Nhân - Quả', status: 'completed', summary: 'Dừng tại VNPayPaymentGatewayClient L94', timestamp: new Date().toISOString() },
        { stepNumber: 6, title: 'Đồng bộ kết quả', status: 'completed', summary: 'Cảnh báo Database Order chưa commit tiền', timestamp: new Date().toISOString() }
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
          confidence: 1.0,
          evidence: {
            hasRouteAnnotation: true,
            routeAnnotationRule: '@PostMapping("/checkout") tìm thấy tại OrderCheckoutController',
            hasSymbolCall: true,
            symbolCallRule: 'Gọi processCheckout(CheckoutDto)',
            hasRuntimeTrace: true,
            runtimeTraceRule: 'HTTP 200 frame khởi tạo request'
          },
          method: 'POST',
          latencyMs: 3
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
          confidence: 1.0,
          evidence: {
            hasRouteAnnotation: false,
            hasSymbolCall: true,
            symbolCallRule: 'AST định vị @Service OrderCheckoutServiceImpl',
            hasRuntimeTrace: true,
            runtimeTraceRule: 'Log bước vào hàm createOrderAndCharge() lúc 13:20:01'
          },
          latencyMs: 18
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
          evidence: {
            hasRouteAnnotation: true,
            routeAnnotationRule: 'Client bean RestTemplate trỏ tới URL VNPay Sandbox',
            hasSymbolCall: true,
            symbolCallRule: 'RestTemplate.postForEntity(...)',
            hasRuntimeTrace: true,
            runtimeTraceRule: 'java.net.SocketTimeoutException tại VNPayPaymentGatewayClient.java:94'
          },
          latencyMs: 5003,
          causalWhy: {
            condition: "Cổng thanh toán ngoại vi phải phản hồi trong giới hạn connectTimeout = 5000ms.",
            actualState: "Server đối tác quá tải, không trả response sau 5000ms dẫn đến kết nối bị ngắt đột ngột.",
            verdict: "500 GATEWAY TIMEOUT: java.net.SocketTimeoutException: Read timed out",
            recommendation: "Bổ sung Circuit Breaker (Resilience4j) có fallback và tăng timeout cấu hình lên 10000ms."
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
          codeDiff: {
            filename: 'VNPayPaymentGatewayClient.java',
            oldCode: 'restTemplate.postForEntity(paymentUrl, request, PaymentResp.class);',
            newCode: '@CircuitBreaker(name = "vnpay", fallbackMethod = "handlePaymentFallback")\nrestTemplate.postForEntity(paymentUrl, request, PaymentResp.class);'
          },
          runtimeLogs: [
            'ERROR [org.springframework.web.client.ResourceAccessException] I/O error on POST request: Read timed out',
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
          confidence: 0.30,
          evidence: {
            hasRouteAnnotation: false,
            hasSymbolCall: true,
            symbolCallRule: 'Autowired OrderRepository',
            hasRuntimeTrace: false,
            runtimeTraceRule: 'Chưa từng được gọi do ngoại lệ xảy ra ở Client phía trước'
          }
        },
        {
          id: 'node-order-db',
          type: 'database',
          label: 'Orders DB Table',
          sublabel: 'UPDATE orders SET status = "PAID"',
          state: 'SKIPPED',
          certainty: 'INFERRED',
          confidence: 0.30,
          evidence: {
            hasRouteAnnotation: false,
            hasSymbolCall: true,
            symbolCallRule: 'Database commit table orders',
            hasRuntimeTrace: false,
            runtimeTraceRule: 'Giao dịch rollback tự động (0 commit)'
          }
        }
      ],
      edges: [
        { id: 'e-ord-1', source: 'node-order-entry', target: 'node-order-service', label: 'Call service', animated: true },
        { id: 'e-ord-2', source: 'node-order-service', target: 'node-payment-client', label: 'Invoke API', animated: true },
        { id: 'e-ord-3', source: 'node-payment-client', target: 'node-order-repo', label: 'TIMEOUT (500)', animated: false, style: { stroke: '#ef4444', strokeDasharray: '4 4' } },
        { id: 'e-ord-4', source: 'node-order-repo', target: 'node-order-db', label: 'Bypassed', animated: false }
      ]
    }
  },
  {
    id: '400_validation',
    name: '3. [400 Bad Request] Bean Validation @NotBlank Field Error',
    method: 'POST',
    endpoint: '/api/v1/categories',
    statusCode: 400,
    statusText: '400 Bad Request',
    desc: 'Dữ liệu request body gửi lên thiếu trường bắt buộc categoryName, bị chặn bởi Hibernate Validator.',
    session: {
      id: 'session-400',
      endpoint: '/api/v1/categories',
      method: 'POST',
      statusCode: 400,
      latencyMs: 6,
      status: 'completed',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      certaintyScore: 0.90,
      steps: [
        { stepNumber: 1, title: 'Nhận cURL / Request', status: 'completed', summary: 'POST /api/v1/categories (400)', timestamp: new Date().toISOString() },
        { stepNumber: 2, title: 'Khởi tạo Session MCP', status: 'completed', summary: 'Tạo session kiểm tra validation', timestamp: new Date().toISOString() },
        { stepNumber: 3, title: 'Quét Pipeline AST', status: 'completed', summary: 'Phát hiện @Valid CategoryDto', timestamp: new Date().toISOString() },
        { stepNumber: 4, title: 'Kiểm thử Runtime', status: 'completed', summary: 'MethodArgumentNotValidException', timestamp: new Date().toISOString() },
        { stepNumber: 5, title: 'Phân tích Nhân - Quả', status: 'completed', summary: 'Thiếu trường bắt buộc categoryName', timestamp: new Date().toISOString() },
        { stepNumber: 6, title: 'Đồng bộ kết quả', status: 'completed', summary: 'Dừng trước khi bước vào Service', timestamp: new Date().toISOString() }
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
          confidence: 1.0,
          evidence: {
            hasRouteAnnotation: true,
            routeAnnotationRule: '@PostMapping("/categories") định vị tại Controller',
            hasSymbolCall: true,
            symbolCallRule: 'createCategory(@Valid CategoryDto dto)',
            hasRuntimeTrace: true,
            runtimeTraceRule: 'Controller nhận payload JSON thành công'
          },
          method: 'POST',
          latencyMs: 2
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
          evidence: {
            hasRouteAnnotation: true,
            routeAnnotationRule: '@Valid annotation gắn tại tham số request body',
            hasSymbolCall: true,
            symbolCallRule: 'Hibernate Validator quét @NotBlank trên field categoryName',
            hasRuntimeTrace: true,
            runtimeTraceRule: 'MethodArgumentNotValidException: Field error on categoryName'
          },
          latencyMs: 4,
          causalWhy: {
            condition: "Trường 'categoryName' là bắt buộc không rỗng theo ràng buộc @NotBlank.",
            actualState: "Payload gửi lên: {\"description\": \"Danh mục 1\"}, thiếu trường 'categoryName'.",
            verdict: "400 BAD REQUEST: MethodArgumentNotValidException on field 'categoryName'",
            recommendation: "Bổ sung thuộc tính 'categoryName' vào payload JSON của request."
          },
          codeEvidence: {
            file: 'src/main/java/com/fis/category/dto/CategoryDto.java',
            line: 15,
            language: 'java',
            codeSnippet: `@NotBlank(message = "categoryName cannot be blank")
private String categoryName; // <--- STOPPED_HERE: rejected value [null]`
          },
          codeDiff: {
            filename: 'request.json',
            oldCode: '{\n  "description": "Danh mục 1"\n}',
            newCode: '{\n  "categoryName": "Tên danh mục",\n  "description": "Danh mục 1"\n}'
          },
          runtimeLogs: [
            'WARN [DefaultHandlerExceptionResolver] Resolved [MethodArgumentNotValidException: Validation failed for argument [0]]',
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
          confidence: 0.30,
          evidence: {
            hasRouteAnnotation: false,
            hasSymbolCall: true,
            symbolCallRule: 'CategoryService bean mapping',
            hasRuntimeTrace: false,
            runtimeTraceRule: 'Chưa từng bước vào Service do bị chặn ở DTO Validator'
          }
        },
        {
          id: 'node-cat-db',
          type: 'database',
          label: 'Category Table',
          sublabel: 'INSERT INTO categories',
          state: 'SKIPPED',
          certainty: 'INFERRED',
          confidence: 0.30,
          evidence: {
            hasRouteAnnotation: false,
            hasSymbolCall: true,
            symbolCallRule: 'JPA entity Category',
            hasRuntimeTrace: false,
            runtimeTraceRule: '0 SQL insert statements generated'
          }
        }
      ],
      edges: [
        { id: 'e-cat-1', source: 'node-cat-entry', target: 'node-cat-validator', label: 'Validate DTO', animated: true },
        { id: 'e-cat-2', source: 'node-cat-validator', target: 'node-cat-service', label: 'BLOCKED (400)', animated: false, style: { stroke: '#ef4444', strokeDasharray: '4 4' } },
        { id: 'e-cat-3', source: 'node-cat-service', target: 'node-cat-db', label: 'Bypassed', animated: false }
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

  if (!isOpen) return null;

  const handleRunPreset = (scenarioId: string) => {
    const sc = PRESET_SCENARIOS.find((s) => s.id === scenarioId);
    if (!sc) return;
    onRunScenario(sc.session);
    onClose();
  };

  const handleRunCustom = () => {
    const parts = customEndpoint.split('/').filter(Boolean);
    const domain = parts[parts.length - 1] || 'resource';
    const cap = domain.charAt(0).toUpperCase() + domain.slice(1);

    const customSession: InvestigationSession = {
      id: `custom-${Date.now()}`,
      endpoint: customEndpoint,
      method: customMethod,
      statusCode: parseInt(customErrorCode, 10),
      latencyMs: 15,
      status: 'completed',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      certaintyScore: 0.85,
      steps: [
        { stepNumber: 1, title: 'Nhận cURL / Request', status: 'completed', summary: `${customMethod} ${customEndpoint} (${customErrorCode})`, timestamp: new Date().toISOString() },
        { stepNumber: 2, title: 'Khởi tạo Session MCP', status: 'completed', summary: 'Mở WebSocket Hub port 9876', timestamp: new Date().toISOString() },
        { stepNumber: 3, title: 'Quét Pipeline AST', status: 'completed', summary: `Phân giải ${cap}Controller -> ${cap}Service`, timestamp: new Date().toISOString() },
        { stepNumber: 4, title: 'Kiểm thử Runtime', status: 'completed', summary: `Khớp phản hồi mã lỗi ${customErrorCode}`, timestamp: new Date().toISOString() },
        { stepNumber: 5, title: 'Phân tích Nhân - Quả', status: 'completed', summary: `Dừng tại ${cap}SecurityFilter`, timestamp: new Date().toISOString() },
        { stepNumber: 6, title: 'Đồng bộ kết quả', status: 'completed', summary: 'Cập nhật sơ đồ hoàn tất', timestamp: new Date().toISOString() }
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
          confidence: 1.0,
          evidence: {
            hasRouteAnnotation: true,
            routeAnnotationRule: `Khớp mapping ${customMethod} ${customEndpoint}`,
            hasSymbolCall: true,
            symbolCallRule: `${cap}Controller.handle()`,
            hasRuntimeTrace: true,
            runtimeTraceRule: 'Đón nhận request thành công'
          },
          method: customMethod,
          latencyMs: 3
        },
        {
          id: 'c-filter',
          type: 'filter',
          label: `${cap}SecurityFilter`,
          sublabel: `doFilterInternal() - Status check ${customErrorCode}`,
          file: `src/main/java/com/fis/security/${cap}SecurityFilter.java`,
          line: 55,
          state: 'STOPPED_HERE',
          certainty: 'EXPLICIT',
          confidence: 1.0,
          evidence: {
            hasRouteAnnotation: true,
            routeAnnotationRule: 'Registered filter in chain',
            hasSymbolCall: true,
            symbolCallRule: 'Filter chain interception',
            hasRuntimeTrace: true,
            runtimeTraceRule: `Exception / rejection with HTTP ${customErrorCode}`
          },
          latencyMs: 12,
          causalWhy: {
            condition: `Request cần thỏa mãn chính sách bảo mật cho endpoint ${customEndpoint}.`,
            actualState: `Client gửi thông tin xác thực không hợp lệ dẫn đến mã lỗi ${customErrorCode}.`,
            verdict: `${customErrorCode} ERROR: Bị chặn tại ${cap}SecurityFilter trước khi vào Service.`,
            recommendation: `Kiểm tra lại Authorization header hoặc quyền hạn được định nghĩa tại ${cap}SecurityFilter.`
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
          confidence: 0.30,
          evidence: {
            hasRouteAnnotation: false,
            hasSymbolCall: true,
            symbolCallRule: `Service bean ${cap}Service`,
            hasRuntimeTrace: false,
            runtimeTraceRule: 'Bypassed'
          }
        },
        {
          id: 'c-repo',
          type: 'repository',
          label: `${cap}Repository`,
          sublabel: 'saveOrUpdate()',
          state: 'SKIPPED',
          certainty: 'INFERRED',
          confidence: 0.30,
          evidence: {
            hasRouteAnnotation: false,
            hasSymbolCall: true,
            symbolCallRule: `Repository ${cap}Repository`,
            hasRuntimeTrace: false,
            runtimeTraceRule: 'Bypassed'
          }
        }
      ],
      edges: [
        { id: 'c-e1', source: 'c-entry', target: 'c-filter', label: 'HTTP Context', animated: true },
        { id: 'c-e2', source: 'c-filter', target: 'c-service', label: `BLOCKED (${customErrorCode})`, animated: false, style: { stroke: '#ef4444', strokeDasharray: '4 4' } },
        { id: 'c-e3', source: 'c-service', target: 'c-repo', label: 'Bypassed', animated: false }
      ]
    };

    onRunScenario(customSession);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 font-sans">
      <div className="w-full max-w-2xl bg-slate-950 border border-slate-800 rounded-xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-sky-400" />
            <h3 className="text-sm font-semibold text-slate-100">
              Kịch Bản Điều Tra Lỗi Mẫu
            </h3>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 space-y-4 overflow-y-auto max-h-[75vh] text-xs">
          {/* Preset list */}
          <div>
            <div className="text-slate-400 font-medium mb-2 uppercase text-[10px] tracking-wider">
              Chọn kịch bản lỗi backend thực tế:
            </div>

            <div className="space-y-2">
              {PRESET_SCENARIOS.map((sc) => {
                const isSelected = selectedScenarioId === sc.id;
                return (
                  <div
                    key={sc.id}
                    onClick={() => setSelectedScenarioId(sc.id)}
                    className={`p-3 rounded-lg border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'border-sky-500/80 bg-slate-900'
                        : 'border-slate-800 bg-slate-900/40 hover:border-slate-700'
                    }`}
                  >
                    <div className="space-y-1 overflow-hidden">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-200">
                          {sc.name}
                        </span>
                      </div>
                      <p className="text-slate-400 text-[11px] leading-relaxed">
                        {sc.desc}
                      </p>
                      <div className="font-mono text-[10px] text-slate-300">
                        {sc.method} {sc.endpoint}
                      </div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRunPreset(sc.id);
                      }}
                      className="px-3 py-1.5 rounded bg-sky-600 hover:bg-sky-500 text-white font-medium flex items-center gap-1 shrink-0 transition-colors shadow-sm"
                    >
                      <Play className="w-3 h-3 fill-current" />
                      <span>Xem luồng</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="h-[1px] bg-slate-800" />

          {/* Custom Endpoint */}
          <div>
            <div className="text-slate-400 font-medium mb-2 uppercase text-[10px] tracking-wider">
              Hoặc nhập endpoint kiểm thử:
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 font-mono text-xs">
              <div>
                <select
                  value={customMethod}
                  onChange={(e) => setCustomMethod(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded p-1.5 text-slate-200"
                >
                  <option value="GET">GET</option>
                  <option value="POST">POST</option>
                  <option value="PUT">PUT</option>
                  <option value="DELETE">DELETE</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <input
                  type="text"
                  value={customEndpoint}
                  onChange={(e) => setCustomEndpoint(e.target.value)}
                  placeholder="/api/v1/orders"
                  className="w-full bg-slate-900 border border-slate-800 rounded p-1.5 text-slate-200"
                />
              </div>

              <div>
                <select
                  value={customErrorCode}
                  onChange={(e) => setCustomErrorCode(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded p-1.5 text-slate-200"
                >
                  <option value="400">400 Bad Request</option>
                  <option value="401">401 Unauthorized</option>
                  <option value="403">403 Forbidden</option>
                  <option value="404">404 Not Found</option>
                  <option value="500">500 Server Error</option>
                </select>
              </div>
            </div>

            <div className="mt-2.5 flex justify-end">
              <button
                onClick={handleRunCustom}
                className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium flex items-center gap-1.5 transition-colors"
              >
                <span>Mô phỏng endpoint này</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
