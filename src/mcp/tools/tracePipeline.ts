import { DiResolver } from '../../ast/diResolver.js';
import { SessionStore } from '../../engine/sessionStore.js';
import { CurlParser, ParsedCurlRequest } from '../../parser/curlParser.js';
import { FlowNode } from '../../types.js';

export async function handleTraceEndpointPipeline(args: {
  endpoint: string;
  method?: string;
  workspacePath?: string;
  curlCommand?: string;
  errorCode?: number;
  rawPayload?: string;
}) {
  let endpoint = args.endpoint || '/api/v1/resource';
  let method = (args.method || 'GET').toUpperCase();
  const workspacePath = args.workspacePath || process.cwd();

  let parsedCurl: ParsedCurlRequest | undefined = undefined;

  // Nếu người dùng cung cấp lệnh cURL, kích hoạt Smart Parser
  if (args.curlCommand) {
    parsedCurl = CurlParser.parse(args.curlCommand);

    // Tự động lấy endpoint từ cURL nếu người dùng truyền placeholder hoặc để mặc định
    if ((endpoint === '/api/v1/resource' || endpoint === '/') && parsedCurl.endpoint) {
      endpoint = parsedCurl.endpoint;
    }

    // Tự động nhận diện method từ cURL
    if (!args.method && parsedCurl.method) {
      method = parsedCurl.method;
    }
  }

  const store = SessionStore.getInstance();

  // Tạo hoặc khởi động session mới
  store.createNewSession(endpoint, method);

  // Tiến hành quét pipeline bằng AST / DI Resolver
  const discovered = await DiResolver.resolvePipeline(endpoint, method, workspacePath);

  // Đính kèm nhật ký phân tích cURL và JWT vào các node tương ứng
  if (parsedCurl) {
    if (!discovered.entrypointNode.runtimeLogs) {
      discovered.entrypointNode.runtimeLogs = [];
    }
    discovered.entrypointNode.runtimeLogs.push(
      `[cURL Parser] Detected HTTP ${method} ${endpoint}`,
      `[cURL Parser] Headers: ${Object.keys(parsedCurl.headers).length} headers detected`
    );

    if (parsedCurl.rawBody) {
      discovered.entrypointNode.runtimeLogs.push(
        `[cURL Parser] Payload: ${parsedCurl.rawBody.length > 120 ? parsedCurl.rawBody.slice(0, 120) + '...' : parsedCurl.rawBody}`
      );
    }

    if (parsedCurl.jwt) {
      const jwtLogs: string[] = [];
      if (parsedCurl.jwt.isValidJwt) {
        jwtLogs.push(
          `[JWT Decoder] Token decoded successfully. Subject: ${parsedCurl.jwt.subject || 'N/A'}`,
          `[JWT Decoder] Extracted Roles: [${parsedCurl.jwt.roles.join(', ')}]`,
          `[JWT Decoder] Expiration: ${parsedCurl.jwt.expiresAt || 'N/A'} (isExpired: ${parsedCurl.jwt.isExpired})`
        );
      } else {
        jwtLogs.push(`[JWT Decoder] CẢNH BÁO: Token không hợp lệ (${parsedCurl.jwt.error})`);
      }

      // Đính kèm vào node filter hoặc node entrypoint
      if (discovered.filterNodes.length > 0) {
        discovered.filterNodes[0].runtimeLogs = [
          ...(discovered.filterNodes[0].runtimeLogs || []),
          ...jwtLogs
        ];
      } else {
        discovered.entrypointNode.runtimeLogs.push(...jwtLogs);
      }
    }
  }

  const allNodes: FlowNode[] = [
    discovered.entrypointNode,
    ...discovered.filterNodes,
    ...discovered.serviceNodes,
    ...discovered.repositoryNodes,
    ...(discovered.databaseNode ? [discovered.databaseNode] : [])
  ];

  // Lưu đồ thị vào Session và cập nhật Step 3: Quét Pipeline AST tĩnh
  store.updateSession({
    endpoint,
    method,
    currentStep: 3,
    stepStatus: 'completed',
    stepSummary: `Đã dựng khung đồ thị tĩnh gồm ${allNodes.length} nodes và ${discovered.edges.length} edges${parsedCurl?.jwt?.isValidJwt ? ` (JWT Role: ${parsedCurl.jwt.roles.join(', ') || 'None'})` : ''}`,
    nodes: allNodes,
    edges: discovered.edges,
    parsedRequest: parsedCurl
  });

  // Tạo phân tích gợi ý thông minh nếu có lỗi và có JWT
  let rbacHint: string | undefined = undefined;
  if (args.errorCode === 403 && parsedCurl?.jwt?.isValidJwt) {
    rbacHint = `[RBAC Hint] Lỗi 403 Forbidden: Token gửi lên chỉ có quyền: [${parsedCurl.jwt.roles.join(', ') || 'RỖNG'}]. Hãy kiểm tra các rào chắn Guard / @PreAuthorize trong pipeline xem có yêu cầu quyền khác (ví dụ ROLE_ADMIN) hay không.`;
  }

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(
          {
            status: 'success',
            message: `Macro Pipeline Trace hoàn tất cho ${method} ${endpoint}`,
            session: {
              id: store.getSession().id,
              canvasUrl: 'http://localhost:9876',
              totalNodes: allNodes.length,
              totalEdges: discovered.edges.length,
              nodes: allNodes.map(n => ({
                id: n.id,
                type: n.type,
                label: n.label,
                sublabel: n.sublabel,
                state: n.state,
                certainty: n.certainty,
                confidence: n.confidence,
                file: n.file,
                line: n.line
              })),
              edges: discovered.edges,
              parsedCurl: parsedCurl ? {
                method: parsedCurl.method,
                endpoint: parsedCurl.endpoint,
                queryParams: parsedCurl.queryParams,
                rolesExtracted: parsedCurl.jwt?.roles || []
              } : undefined
            },
            rbacHint,
            instruction: 'Các node hiện đang ở trạng thái NOT_VERIFIED. Hãy tiếp tục Bước 4 (Xác minh Runtime qua execute_sandboxed_runner) hoặc Bước 5 (Cập nhật điểm chết STOPPED_HERE và Causal WHY qua update_investigation_session).'
          },
          null,
          2
        )
      }
    ]
  };
}
