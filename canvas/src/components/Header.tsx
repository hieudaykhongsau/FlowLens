import React from 'react';
import {
  Search,
  Maximize2,
  Columns3,
  Rows3,
  RotateCcw,
  SlidersHorizontal,
  Timer,
  Workflow,
  CheckSquare,
  PanelRight,
  PanelRightClose
} from 'lucide-react';
import type { InvestigationSession } from '../types.js';
import { calculateExecutionDepth, calculateInvestigationProgress } from '../types.js';

interface HeaderProps {
  session: InvestigationSession;
  isConnected: boolean;
  layoutDirection: 'TB' | 'LR';
  onToggleLayout: () => void;
  onFitView: () => void;
  onResetDemo: () => void;
  onOpenSimulator: () => void;
  isInspectorOpen?: boolean;
  onToggleInspector?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  session,
  isConnected,
  layoutDirection,
  onToggleLayout,
  onFitView,
  onResetDemo,
  onOpenSimulator,
  isInspectorOpen = true,
  onToggleInspector
}) => {
  // Tính toán các chỉ số % thực tế từ cấu trúc dữ liệu phiên
  const depthStats = calculateExecutionDepth(session.nodes || []);
  const stepProgressPercent = calculateInvestigationProgress(session.steps || []);

  const totalConfidence = (session.nodes || []).reduce((acc, n) => acc + (n.confidence ?? 0), 0);
  const realCertaintyPercent = session.nodes && session.nodes.length > 0
    ? Math.round((totalConfidence / session.nodes.length) * 100)
    : Math.round((session.certaintyScore || 0) * 100);

  const stoppedCount = (session.nodes || []).filter((n) => n.state === 'STOPPED_HERE').length;

  return (
    <header className="w-full h-13 bg-slate-950/95 border-b border-slate-800/90 px-4 flex items-center justify-between gap-3 z-30 font-sans select-none backdrop-blur-md shrink-0">
      {/* 1. Left: Brand & Endpoint Badge */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 shadow-sm shadow-sky-500/10">
            <Search className="w-4 h-4" />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-sm text-slate-100 font-mono tracking-tight">
              Flow<span className="text-sky-400">Lens</span>
            </span>
            <span className="text-[10px] font-mono bg-slate-900 text-slate-400 px-1.5 py-0.5 rounded border border-slate-800">
              v1.0
            </span>
          </div>
        </div>

        <div className="h-4 w-[1px] bg-slate-800 hidden sm:block" />

        {/* Endpoint Pill */}
        <div className="flex items-center gap-2 bg-slate-900/90 border border-slate-800 px-2.5 py-1 rounded-md font-mono text-xs">
          <span className="font-bold text-sky-400">{session.method}</span>
          <span className="text-slate-200 truncate max-w-[200px] md:max-w-[320px]" title={session.endpoint}>
            {session.endpoint}
          </span>
          {session.statusCode && (
            <span
              className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                session.statusCode >= 500
                  ? 'bg-rose-950/80 text-rose-300 border border-rose-800'
                  : session.statusCode >= 400
                  ? 'bg-amber-950/80 text-amber-300 border border-amber-800'
                  : 'bg-emerald-950/80 text-emerald-300 border border-emerald-800'
              }`}
            >
              {session.statusCode}
            </span>
          )}
        </div>
      </div>

      {/* 2. Middle: Real Telemetry Metrics HUD */}
      <div className="hidden xl:flex items-center gap-3.5 text-xs font-mono text-slate-400 bg-slate-900/60 px-3.5 py-1 rounded-lg border border-slate-800/80">
        {/* Metric 1: Investigation Steps */}
        <div className="flex items-center gap-1.5" title="Tiến độ hoàn thành 6 bước điều tra chuẩn">
          <CheckSquare className="w-3.5 h-3.5 text-sky-400" />
          <span>Steps:</span>
          <span className="text-slate-200 font-semibold">{stepProgressPercent}%</span>
          <div className="w-9 bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-sky-400 h-full rounded-full transition-all duration-300"
              style={{ width: `${stepProgressPercent}%` }}
            />
          </div>
        </div>

        <div className="h-3 w-[1px] bg-slate-800" />

        {/* Metric 2: Execution Depth */}
        <div
          className="flex items-center gap-1.5"
          title={`Độ sâu thực thi luồng: ${depthStats.executedLayers}/${depthStats.totalLayers} tầng (${depthStats.depthPercent}%). Tầng bị bỏ qua: ${depthStats.bypassedPercent}%.`}
        >
          <Workflow className="w-3.5 h-3.5 text-indigo-400" />
          <span>Depth:</span>
          <span className="text-slate-200 font-semibold">{depthStats.depthPercent}%</span>
          <span className="text-[10px] text-slate-500">
            ({depthStats.executedLayers}/{depthStats.totalLayers})
          </span>
          <div className="w-10 bg-slate-800 rounded-full h-1.5 overflow-hidden flex">
            <div
              className={`h-full transition-all duration-300 ${
                stoppedCount > 0 ? 'bg-rose-500' : 'bg-emerald-400'
              }`}
              style={{ width: `${depthStats.depthPercent}%` }}
            />
            <div
              className="bg-slate-700/60 h-full transition-all duration-300"
              style={{ width: `${depthStats.bypassedPercent}%` }}
            />
          </div>
        </div>

        <div className="h-3 w-[1px] bg-slate-800" />

        {/* Metric 3: Real Certainty Score */}
        <div className="flex items-center gap-1.5" title="Điểm tin cậy toán học trung bình của toàn bộ node có bằng chứng">
          <span>Certainty:</span>
          <strong className="text-emerald-400">{realCertaintyPercent}%</strong>
          <span className="text-[10px] text-slate-500">
            ({realCertaintyPercent >= 70 ? 'EXPLICIT' : 'INFERRED'})
          </span>
        </div>

        <div className="h-3 w-[1px] bg-slate-800" />

        {/* Metric 4: Latency */}
        <div className="flex items-center gap-1">
          <Timer className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-300 font-medium">
            {session.latencyMs ? `${session.latencyMs}ms` : '12ms'}
          </span>
        </div>
      </div>

      {/* 3. Right: Actions & Tools */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Test Scenarios button with nowrap */}
        <button
          onClick={onOpenSimulator}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 hover:text-sky-200 text-xs font-medium border border-sky-500/30 transition-all whitespace-nowrap shadow-sm"
          title="Thử nghiệm các kịch bản lỗi mẫu"
        >
          <SlidersHorizontal className="w-3.5 h-3.5 text-sky-400" />
          <span>Kịch Bản Lỗi Mẫu</span>
        </button>

        {/* Layout Direction Button */}
        <button
          onClick={onToggleLayout}
          className="flex items-center gap-1 px-2 py-1.5 rounded-md bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs font-mono transition-colors whitespace-nowrap"
          title={`Đổi hướng bố cục sang ${layoutDirection === 'TB' ? 'Ngang (LR)' : 'Dọc (TB)'}`}
        >
          {layoutDirection === 'TB' ? (
            <>
              <Rows3 className="w-3.5 h-3.5 text-slate-400" />
              <span className="hidden sm:inline">Dọc (TB)</span>
            </>
          ) : (
            <>
              <Columns3 className="w-3.5 h-3.5 text-slate-400" />
              <span className="hidden sm:inline">Ngang (LR)</span>
            </>
          )}
        </button>

        {/* Fit View Button */}
        <button
          onClick={onFitView}
          className="p-1.5 rounded-md bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-colors"
          title="Căn giữa sơ đồ (Fit View)"
        >
          <Maximize2 className="w-3.5 h-3.5" />
        </button>

        {/* Reset Demo Button */}
        <button
          onClick={onResetDemo}
          className="p-1.5 rounded-md bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-colors"
          title="Đặt lại kịch bản mặc định"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>

        {/* Inspector Toggle Button */}
        {onToggleInspector && (
          <button
            onClick={onToggleInspector}
            className={`flex items-center gap-1 px-2 py-1.5 rounded-md border text-xs font-mono transition-colors ${
              isInspectorOpen
                ? 'bg-sky-950/60 text-sky-300 border-sky-800'
                : 'bg-slate-900 hover:bg-slate-800 text-slate-400 border-slate-800'
            }`}
            title={isInspectorOpen ? 'Ẩn bảng Inspector' : 'Mở bảng Inspector'}
          >
            {isInspectorOpen ? (
              <PanelRightClose className="w-3.5 h-3.5 text-sky-400" />
            ) : (
              <PanelRight className="w-3.5 h-3.5" />
            )}
            <span className="hidden md:inline">Inspector</span>
          </button>
        )}

        {/* Port Status Indicator */}
        <div
          className={`flex items-center gap-1.5 px-2 py-1.5 rounded-md border text-[11px] font-mono ${
            isConnected
              ? 'bg-slate-900/90 text-emerald-400 border-slate-800'
              : 'bg-slate-900/90 text-amber-400 border-slate-800'
          }`}
          title={isConnected ? 'WebSocket server connected on port 9876' : 'Reconnecting to port 9876...'}
        >
          <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]' : 'bg-amber-400 animate-pulse'}`} />
          <span className="hidden lg:inline">Port 9876</span>
        </div>
      </div>
    </header>
  );
};
