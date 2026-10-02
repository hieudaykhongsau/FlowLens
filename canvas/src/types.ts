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
}
