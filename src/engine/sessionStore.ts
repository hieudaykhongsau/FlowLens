import { FlowEdge, FlowNode, InvestigationSession, InvestigationStep } from '../types.js';
import { ConfidenceEngine } from './confidenceEngine.js';

type SessionChangeListener = (session: InvestigationSession) => void;

export class SessionStore {
  private static instance: SessionStore;
  private currentSession: InvestigationSession;
  private listeners: SessionChangeListener[] = [];

  private constructor() {
    this.currentSession = this.createDefaultDemoSession();
  }

  public static getInstance(): SessionStore {
    if (!SessionStore.instance) {
      SessionStore.instance = new SessionStore();
    }
    return SessionStore.instance;
  }

  public getSession(): InvestigationSession {
    return this.currentSession;
  }

  public subscribe(listener: SessionChangeListener): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify(): void {
    for (const listener of this.listeners) {
      try {
        listener(this.currentSession);
      } catch (err) {
        console.error('Error notifying session listener:', err);
      }
    }
  }

  public createNewSession(endpoint: string, method: string = 'GET', id?: string): InvestigationSession {
    const steps: InvestigationStep[] = [
      { stepNumber: 1, title: 'Nhận cURL / Request lỗi', status: 'completed', summary: `Endpoint ${method} ${endpoint}`, timestamp: new Date().toISOString() },
      { stepNumber: 2, title: 'Tạo Session MCP & WebSocket', status: 'completed', summary: 'Đã mở cổng 9876 kết nối Canvas', timestamp: new Date().toISOString() },
      { stepNumber: 3, title: 'Quét Pipeline AST tĩnh', status: 'in_progress', summary: 'Dò call graph từ Controller sang Service', timestamp: new Date().toISOString() },
      { stepNumber: 4, title: 'Xác minh Runtime 3 cấp độ', status: 'pending', timestamp: new Date().toISOString() },
      { stepNumber: 5, title: 'Kết luận Nhân - Quả (WHY)', status: 'pending', timestamp: new Date().toISOString() },
      { stepNumber: 6, title: 'Báo cáo & Đồng bộ Canvas', status: 'pending', timestamp: new Date().toISOString() }
    ];

    this.currentSession = {
      id: id || `session-${Date.now()}`,
      endpoint,
      method: method.toUpperCase(),
      status: 'running',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      steps,
      nodes: [],
      edges: [],
      certaintyScore: 0
    };

    this.notify();
    return this.currentSession;
  }

  public updateSession(params: {
    endpoint?: string;
    method?: string;
    currentStep?: number;
    stepStatus?: 'pending' | 'in_progress' | 'completed' | 'failed';
    stepSummary?: string;
    nodes?: FlowNode[];
    edges?: FlowEdge[];
    rootCauseNodeId?: string;
    summary?: string;
    status?: 'running' | 'completed' | 'failed';
    parsedRequest?: any;
  }): InvestigationSession {
    if (params.endpoint) this.currentSession.endpoint = params.endpoint;
    if (params.method) this.currentSession.method = params.method.toUpperCase();
    if (params.summary) this.currentSession.summary = params.summary;
    if (params.status) this.currentSession.status = params.status;
    if (params.rootCauseNodeId) this.currentSession.rootCauseNodeId = params.rootCauseNodeId;
    if (params.parsedRequest !== undefined) this.currentSession.parsedRequest = params.parsedRequest;

    if (params.currentStep !== undefined && params.currentStep >= 1 && params.currentStep <= 6) {
      const idx = params.currentStep - 1;
      if (this.currentSession.steps[idx]) {
        if (params.stepStatus) this.currentSession.steps[idx].status = params.stepStatus;
        if (params.stepSummary) this.currentSession.steps[idx].summary = params.stepSummary;
        this.currentSession.steps[idx].timestamp = new Date().toISOString();
      }
    }

    if (params.nodes) {
      this.currentSession.nodes = params.nodes;
    }
    if (params.edges) {
      this.currentSession.edges = params.edges;
    }

    this.currentSession.certaintyScore = ConfidenceEngine.calculateOverallSessionCertainty(this.currentSession.nodes);
    this.currentSession.updatedAt = new Date().toISOString();

    this.notify();
    return this.currentSession;
  }

  public setNodesAndEdges(nodes: FlowNode[], edges: FlowEdge[]): void {
    this.currentSession.nodes = nodes;
    this.currentSession.edges = edges;
    this.currentSession.certaintyScore = ConfidenceEngine.calculateOverallSessionCertainty(nodes);
    this.currentSession.updatedAt = new Date().toISOString();
    this.notify();
  }

  public updateNodeState(nodeId: string, state: FlowNode['state'], extra?: Partial<FlowNode>): void {
    const node = this.currentSession.nodes.find(n => n.id === nodeId);
    if (node) {
      node.state = state;
      if (extra) {
        Object.assign(node, extra);
      }
      this.currentSession.certaintyScore = ConfidenceEngine.calculateOverallSessionCertainty(this.currentSession.nodes);
      this.currentSession.updatedAt = new Date().toISOString();
      this.notify();
    }
  }

  public createDefaultDemoSession(): InvestigationSession {
    const nodes: FlowNode[] = [
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
        runtimeLogs: ['[2026-10-02 09:15:01.102] HTTP POST received from 10.20.1.5', 'Request Header: Authorization=Bearer eyJhbGci...']
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
          condition: "Người dùng phải có role 'ROLE_ADMIN' để duyệt quy định quy chế.",
          actualState: "Token gửi lên chỉ chứa 'ROLE_OPERATOR', thiếu đặc quyền quản trị.",
          verdict: "403 FORBIDDEN: Access Denied tại SecurityExpressionRoot.hasRole()",
          recommendation: "Cấp thêm quyền ROLE_ADMIN cho tài khoản hoặc cập nhật chính sách phân quyền tại RegulationSecurityConfig."
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
        confidence: 0.70,
        runtimeLogs: ['[SKIPPED] Luồng thực thi bị chặn trước khi bước vào tầng Service']
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
    ];

    const edges: FlowEdge[] = [
      { id: 'e1-2', source: 'node-entrypoint', target: 'node-auth-filter', label: 'HTTP Request', animated: true },
      { id: 'e2-3', source: 'node-auth-filter', target: 'node-rbac-guard', label: 'Authenticated Context', animated: true },
      { id: 'e3-4', source: 'node-rbac-guard', target: 'node-service', label: 'BLOCKED (403)', animated: false, style: { stroke: '#ef4444', strokeDasharray: '4 4' } },
      { id: 'e4-5', source: 'node-service', target: 'node-repo', label: 'Call repository', animated: false },
      { id: 'e5-6', source: 'node-repo', target: 'node-db', label: 'SQL UPDATE', animated: false }
    ];

    const steps: InvestigationStep[] = [
      { stepNumber: 1, title: 'Nhận cURL / Request lỗi', status: 'completed', summary: 'POST /api/v1/regulations/approve (Trả về 403 Forbidden)', timestamp: new Date().toISOString() },
      { stepNumber: 2, title: 'Tạo Session MCP & WebSocket', status: 'completed', summary: 'Mở WebSocket Hub port 9876 & gán session ID', timestamp: new Date().toISOString() },
      { stepNumber: 3, title: 'Quét Pipeline AST tĩnh', status: 'completed', summary: 'Dò vết thành công Controller -> Guard -> Service -> Repository', timestamp: new Date().toISOString() },
      { stepNumber: 4, title: 'Xác minh Runtime 3 cấp độ', status: 'completed', summary: 'Chạy MockMvc test: HttpStatusCodeResultMatchersStatusResultMatchers@403', timestamp: new Date().toISOString() },
      { stepNumber: 5, title: 'Kết luận Nhân - Quả (WHY)', status: 'completed', summary: 'Xác định điểm chết STOPPED_HERE tại Guard @PreAuthorize', timestamp: new Date().toISOString() },
      { stepNumber: 6, title: 'Báo cáo & Đồng bộ Canvas', status: 'completed', summary: 'Canvas 2D đã đồng bộ hoàn tất (Certainty: 0.78 EXPLICIT)', timestamp: new Date().toISOString() }
    ];

    return {
      id: 'demo-session-403',
      endpoint: '/api/v1/regulations/approve',
      method: 'POST',
      status: 'completed',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      steps,
      nodes,
      edges,
      rootCauseNodeId: 'node-rbac-guard',
      summary: 'Request bị chặn tại tầng @PreAuthorize bảo mật trước khi chạm đến Service và Database do token chỉ có ROLE_OPERATOR.',
      certaintyScore: 0.78
    };
  }
}
