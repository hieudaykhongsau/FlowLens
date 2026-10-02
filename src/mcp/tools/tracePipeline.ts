import { DiResolver } from '../../ast/diResolver.js';
import { SessionStore } from '../../engine/sessionStore.js';
import { FlowNode } from '../../types.js';

export async function handleTraceEndpointPipeline(args: {
  endpoint: string;
  method?: string;
  workspacePath?: string;
  curlCommand?: string;
  errorCode?: number;
  rawPayload?: string;
}) {
  const endpoint = args.endpoint || '/api/v1/resource';
  const method = (args.method || 'GET').toUpperCase();
  const workspacePath = args.workspacePath || process.cwd();

  const store = SessionStore.getInstance();

  // Tạo hoặc khởi động session mới
  store.createNewSession(endpoint, method);

  // Tiến hành quét pipeline bằng AST / DI Resolver
  const discovered = await DiResolver.resolvePipeline(endpoint, method, workspacePath);

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
    stepSummary: `Đã dựng khung đồ thị tĩnh gồm ${allNodes.length} nodes và ${discovered.edges.length} edges`,
    nodes: allNodes,
    edges: discovered.edges
  });

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
              edges: discovered.edges
            },
            instruction: 'Các node hiện đang ở trạng thái NOT_VERIFIED. Hãy tiếp tục Bước 4 (Xác minh Runtime qua execute_sandboxed_runner) hoặc Bước 5 (Cập nhật điểm chết STOPPED_HERE và Causal WHY qua update_investigation_session).'
          },
          null,
          2
        )
      }
    ]
  };
}
