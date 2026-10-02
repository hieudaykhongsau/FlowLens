export type ExecutionState = 'NOT_VERIFIED' | 'PASSED' | 'STOPPED_HERE' | 'SKIPPED';

export type CertaintyLevel = 'EXPLICIT' | 'INFERRED' | 'UNKNOWN';

export type NodeType = 
  | 'entrypoint' 
  | 'filter' 
  | 'guard' 
  | 'service' 
  | 'repository' 
  | 'database' 
  | 'external_api' 
  | 'failure_node';

export interface CausalWhy {
  condition: string;
  actualState: string;
  verdict: string;
  recommendation?: string;
}

export interface CodeEvidence {
  file: string;
  line: number;
  codeSnippet: string;
  language?: string;
}

export interface CodeDiff {
  oldCode: string;
  newCode: string;
  filename?: string;
}

export interface NodeEvidence {
  hasRouteAnnotation?: boolean;    // +0.4 (40%)
  routeAnnotationRule?: string;
  hasSymbolCall?: boolean;         // +0.3 (30%)
  symbolCallRule?: string;
  hasRuntimeTrace?: boolean;       // +0.3 (30%)
  runtimeTraceRule?: string;
  hasAmbiguousOverload?: boolean;  // -0.2 (-20%)
  ambiguityRule?: string;
}

export interface FlowNodeData {
  id: string;
  type: NodeType;
  label: string;
  sublabel?: string;
  file?: string;
  line?: number;
  state: ExecutionState;
  certainty: CertaintyLevel;
  confidence: number;
  evidence?: NodeEvidence;
  method?: string;
  latencyMs?: number;
  causalWhy?: CausalWhy;
  codeEvidence?: CodeEvidence;
  codeDiff?: CodeDiff;
  runtimeLogs?: string[];
  executionTimeMs?: number;
  onSelectNode?: (nodeData: FlowNodeData) => void;
  [key: string]: any;
}

export interface FlowEdgeData {
  id: string;
  source: string;
  target: string;
  label?: string;
  animated?: boolean;
  style?: Record<string, any>;
}

export interface InvestigationStep {
  stepNumber: number;
  title: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  summary?: string;
  timestamp: string;
}

export interface InvestigationSession {
  id: string;
  endpoint: string;
  method: string;
  statusCode?: number;
  latencyMs?: number;
  status: 'running' | 'completed' | 'failed';
  createdAt: string;
  updatedAt: string;
  steps: InvestigationStep[];
  nodes: FlowNodeData[];
  edges: FlowEdgeData[];
  rootCauseNodeId?: string;
  summary?: string;
  certaintyScore: number;
  investigationProgressPercent?: number; // 0 to 100%
  executionDepthPercent?: number;        // 0 to 100%
}

/**
 * Tính toán điểm tin cậy toán học thực tế từ bằng chứng thu thập được:
 * Confidence = min(1.0, max(0.0, sum(w_i)))
 */
export function calculateRealConfidence(evidence?: NodeEvidence): { score: number; certainty: CertaintyLevel } {
  if (!evidence) {
    return { score: 0.5, certainty: 'INFERRED' };
  }

  let s = 0.0;
  if (evidence.hasRouteAnnotation) s += 0.4;
  if (evidence.hasSymbolCall) s += 0.3;
  if (evidence.hasRuntimeTrace) s += 0.3;
  if (evidence.hasAmbiguousOverload) s -= 0.2;

  s = Math.min(1.0, Math.max(0.0, Math.round(s * 100) / 100));

  let certainty: CertaintyLevel = 'UNKNOWN';
  if (s >= 0.7) {
    certainty = 'EXPLICIT';
  } else if (s > 0) {
    certainty = 'INFERRED';
  }

  return { score: s, certainty };
}

/**
 * Tính toán tỷ lệ phần trăm thực thi thực tế của Pipeline:
 * Depth = (passed + stopped) / total * 100%
 */
export function calculateExecutionDepth(nodes: FlowNodeData[]): {
  executedLayers: number;
  totalLayers: number;
  depthPercent: number;
  bypassedPercent: number;
} {
  if (!nodes || nodes.length === 0) {
    return { executedLayers: 0, totalLayers: 0, depthPercent: 0, bypassedPercent: 100 };
  }

  const executed = nodes.filter(n => n.state === 'PASSED' || n.state === 'STOPPED_HERE').length;
  const total = nodes.length;
  const depth = Math.round((executed / total) * 100);

  return {
    executedLayers: executed,
    totalLayers: total,
    depthPercent: depth,
    bypassedPercent: 100 - depth
  };
}

/**
 * Tính toán tiến độ các bước điều tra:
 * Progress = completedSteps / totalSteps * 100%
 */
export function calculateInvestigationProgress(steps: InvestigationStep[]): number {
  if (!steps || steps.length === 0) return 0;
  const completed = steps.filter(s => s.status === 'completed').length;
  return Math.round((completed / steps.length) * 100);
}
