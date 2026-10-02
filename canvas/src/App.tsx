import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  BackgroundVariant
} from '@xyflow/react';
import type { Node, Edge } from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { FlowLensNode } from './components/FlowLensNode.js';
import { Header } from './components/Header.js';
import { StepperTracker } from './components/StepperTracker.js';
import { InspectorDrawer } from './components/InspectorDrawer.js';
import { InvestigationModal, PRESET_SCENARIOS } from './components/InvestigationModal.js';
import { getLayoutedElements } from './utils/layout.js';
import type { FlowNodeData, InvestigationSession, InvestigationStep } from './types.js';

export const App: React.FC = () => {
  const [session, setSession] = useState<InvestigationSession>(PRESET_SCENARIOS[0].session);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [layoutDirection, setLayoutDirection] = useState<'TB' | 'LR'>('TB');
  const [selectedNode, setSelectedNode] = useState<FlowNodeData | null>(null);
  const [isSimulatorOpen, setIsSimulatorOpen] = useState<boolean>(false);

  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  const wsRef = useRef<WebSocket | null>(null);

  const nodeTypes = useMemo(
    () => ({
      flowlensNode: FlowLensNode
    }),
    []
  );

  const handleSelectNode = useCallback((nodeData: FlowNodeData) => {
    setSelectedNode(nodeData);
  }, []);

  // Sync session nodes and edges to React Flow
  const syncGraph = useCallback(
    (currentSession: InvestigationSession, direction: 'TB' | 'LR') => {
      const rfNodes: Node[] = (currentSession.nodes || []).map((n) => ({
        id: n.id,
        type: 'flowlensNode',
        data: {
          ...n,
          onSelectNode: handleSelectNode
        },
        position: { x: 0, y: 0 }
      }));

      const rfEdges: Edge[] = (currentSession.edges || []).map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        label: e.label,
        animated: e.animated !== false,
        style: e.style || { stroke: '#38bdf8', strokeWidth: 2 }
      }));

      const layouted = getLayoutedElements(rfNodes, rfEdges, direction);
      setNodes(layouted.nodes);
      setEdges(layouted.edges);

      // Auto-open stopped here node if none selected or if it's the root cause
      const stoppedNode = currentSession.nodes.find((n) => n.state === 'STOPPED_HERE');
      if (stoppedNode) {
        setSelectedNode(stoppedNode);
      }
    },
    [handleSelectNode, setNodes, setEdges]
  );

  // WebSocket Connection
  useEffect(() => {
    const wsUrl = `ws://${window.location.hostname || 'localhost'}:9876`;
    let ws: WebSocket | null = null;
    let reconnectTimeout: any = null;

    function connect() {
      ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          if (message.type === 'INIT_SESSION' || message.type === 'SESSION_UPDATE') {
            if (message.data) {
              setSession(message.data);
              syncGraph(message.data, layoutDirection);
            }
          }
        } catch (err) {
          console.error('Error parsing WebSocket message:', err);
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        reconnectTimeout = setTimeout(connect, 3000);
      };

      ws.onerror = () => {
        setIsConnected(false);
        ws?.close();
      };
    }

    connect();

    return () => {
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      ws?.close();
    };
  }, [layoutDirection, syncGraph]);

  // Initial layout calculation
  useEffect(() => {
    syncGraph(session, layoutDirection);
  }, [layoutDirection]);

  const handleToggleLayout = () => {
    const nextDir = layoutDirection === 'TB' ? 'LR' : 'TB';
    setLayoutDirection(nextDir);
    syncGraph(session, nextDir);
  };

  const handleResetDemo = () => {
    const defaultSession = PRESET_SCENARIOS[0].session;
    setSession(defaultSession);
    syncGraph(defaultSession, layoutDirection);
  };

  /**
   * Chạy kịch bản từng bước với tiến độ % tăng dần thực tế
   */
  const handleRunScenario = (targetSession: InvestigationSession) => {
    // Bước 1: Khởi tạo tất cả node ở trạng thái NOT_VERIFIED, Step 1-3
    const initialSteps: InvestigationStep[] = targetSession.steps.map((s, idx) => ({
      ...s,
      status: idx < 3 ? 'completed' : idx === 3 ? 'in_progress' : 'pending'
    }));

    const initialNodes = targetSession.nodes.map((n) => ({
      ...n,
      state: 'NOT_VERIFIED' as const,
      confidence: n.evidence?.hasRouteAnnotation ? 0.4 : 0.3
    }));

    const stage1Session: InvestigationSession = {
      ...targetSession,
      status: 'running',
      steps: initialSteps,
      nodes: initialNodes,
      certaintyScore: 0.35
    };

    setSession(stage1Session);
    syncGraph(stage1Session, layoutDirection);

    // Bước 2 (Sau 500ms): Xác minh Runtime - Kích hoạt các node PASSED
    setTimeout(() => {
      const stage2Steps: InvestigationStep[] = targetSession.steps.map((s, idx) => ({
        ...s,
        status: idx < 4 ? 'completed' : idx === 4 ? 'in_progress' : 'pending'
      }));

      const stage2Nodes = targetSession.nodes.map((n) => {
        if (n.state === 'PASSED') {
          return { ...n };
        }
        return {
          ...n,
          state: 'NOT_VERIFIED' as const
        };
      });

      const stage2Session: InvestigationSession = {
        ...targetSession,
        status: 'running',
        steps: stage2Steps,
        nodes: stage2Nodes,
        certaintyScore: 0.65
      };

      setSession(stage2Session);
      syncGraph(stage2Session, layoutDirection);
    }, 450);

    // Bước 3 (Sau 950ms): Phát hiện STOPPED_HERE, các node sau thành SKIPPED, hoàn tất 100%
    setTimeout(() => {
      setSession(targetSession);
      syncGraph(targetSession, layoutDirection);

      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({
            type: 'SIMULATE_SCENARIO',
            data: targetSession
          })
        );
      }
    }, 950);
  };

  return (
    <div className="w-screen h-screen flex flex-col bg-[#080c14] text-slate-100 overflow-hidden font-sans">
      {/* 1. Header Bar */}
      <Header
        session={session}
        isConnected={isConnected}
        layoutDirection={layoutDirection}
        onToggleLayout={handleToggleLayout}
        onFitView={() => syncGraph(session, layoutDirection)}
        onResetDemo={handleResetDemo}
        onOpenSimulator={() => setIsSimulatorOpen(true)}
      />

      {/* 2. Investigation Stepper Progress Tracker */}
      <StepperTracker steps={session.steps} />

      {/* 3. React Flow 2D Canvas */}
      <div className="flex-1 relative w-full h-full">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          fitView
          minZoom={0.2}
          maxZoom={1.8}
          proOptions={{ hideAttribution: true }}
        >
          <Background
            color="#1e293b"
            gap={24}
            size={1.5}
            variant={BackgroundVariant.Dots}
          />
          <Controls
            className="!bg-slate-900 !border-slate-800 !text-slate-300 [&>button]:!bg-slate-900 [&>button]:!border-slate-800 [&>button:hover]:!bg-slate-800"
            showInteractive={false}
          />
        </ReactFlow>

        {/* 4. Inspector Drawer */}
        <InspectorDrawer
          node={selectedNode}
          onClose={() => setSelectedNode(null)}
        />

        {/* 5. Investigation Test Simulator Modal */}
        <InvestigationModal
          isOpen={isSimulatorOpen}
          onClose={() => setIsSimulatorOpen(false)}
          onRunScenario={handleRunScenario}
        />
      </div>
    </div>
  );
};

export default App;
