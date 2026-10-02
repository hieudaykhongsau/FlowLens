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

export interface FlowNode {
  id: string;
  type: NodeType;
  label: string;
  sublabel?: string;
  file?: string;
  line?: number;
  state: ExecutionState;
  certainty: CertaintyLevel;
  confidence: number; // 0.0 to 1.0
  method?: string;
  causalWhy?: CausalWhy;
  codeEvidence?: CodeEvidence;
  runtimeLogs?: string[];
  executionTimeMs?: number;
}

export interface FlowEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  animated?: boolean;
  style?: Record<string, any>;
  data?: Record<string, any>;
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
  status: 'running' | 'completed' | 'failed';
  createdAt: string;
  updatedAt: string;
  steps: InvestigationStep[];
  nodes: FlowNode[];
  edges: FlowEdge[];
  rootCauseNodeId?: string;
  summary?: string;
  certaintyScore: number;
}

export interface TracePipelineParams {
  endpoint: string;
  method?: string;
  workspacePath?: string;
  curlCommand?: string;
  errorCode?: number;
  rawPayload?: string;
}

export interface UpdateSessionParams {
  sessionId?: string;
  endpoint?: string;
  method?: string;
  currentStep?: number;
  stepStatus?: 'pending' | 'in_progress' | 'completed' | 'failed';
  stepSummary?: string;
  nodes?: FlowNode[];
  edges?: FlowEdge[];
  rootCauseNodeId?: string;
  summary?: string;
}

export interface ExecuteRunnerParams {
  command: 'mvn' | 'gradle' | 'npm' | 'pnpm' | 'pytest' | 'python' | 'go';
  args: string[];
  cwd?: string;
  timeoutMs?: number;
  mode?: 'active' | 'ephemeral_mock' | 'passive_log';
}
