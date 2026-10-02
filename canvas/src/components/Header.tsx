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
  CheckSquare
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
}

export const Header: React.FC<HeaderProps> = ({
  session,
  isConnected,
  layoutDirection,
  onToggleLayout,
  onFitView,
  onResetDemo,
  onOpenSimulator
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
    <header className="w-full bg-slate-950 border-b border-slate-800 px-4 py-2.5 flex items-center justify-between gap-3 z-20 font-sans">
      {/* Brand & Endpoint */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded bg-slate-900 border border-slate-700 flex items-center justify-center text-sky-400">
            <Search className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-sm text-slate-100 font-mono tracking-tight">
                Flow<span className="text-sky-400">Lens</span>
              </span>
              <span className="text-[10px] font-mono bg-slate-900 text-slate-400 px-1 py-0.2 rounded border border-slate-800">
                v1.0
              </span>
            </div>
          </div>
        </div>

        <div className="h-5 w-[1px] bg-slate-800 hidden md:block" />

        {/* Endpoint & Status Pill */}
        <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 px-2 py-1 rounded font-mono text-xs">
          <span className="font-bold text-sky-400">{session.method}</span>
          <span className="text-slate-200">{session.endpoint}</span>
          {session.statusCode && (
            <span
              className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                session.statusCode >= 500
                  ? 'bg-rose-950 text-rose-300 border border-rose-800'
                  : session.statusCode >= 400
                  ? 'bg-amber-950 text-amber-300 border border-amber-800'
                  : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
              }`}
            >
              {session.statusCode}
            </span>
          )}
        </div>
      </div>

      {/* Real Percentage Telemetry Metrics (Middle) */}
      <div className="hidden lg:flex items-center gap-3.5 text-xs font-mono text-slate-400 bg-slate-900/80 px-3.5 py-1.5 rounded-lg border border-slate-800">
        {/* Metric 1: Real Investigation Steps Progress % */}
        <div className="flex items-center gap-1.5" title="Tiến độ hoàn thành 6 bước điều tra chuẩn">
          <CheckSquare className="w-3.5 h-3.5 text-sky-400" />
          <span>Steps:</span>
          <span className="text-slate-200 font-semibold">{stepProgressPercent}%</span>
          <div className="w-10 bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-sky-400 h-full rounded-full transition-all duration-300"
              style={{ width: `${stepProgressPercent}%` }}
            />
          </div>
        </div>

        <div className="h-3.5 w-[1px] bg-slate-800" />

        {/* Metric 2: Real Execution Depth % */}
        <div
          className="flex items-center gap-1.5"
          title={`Độ sâu thực thi luồng: ${depthStats.executedLayers}/${depthStats.totalLayers} tầng (${depthStats.depthPercent}%). Tầng bị bỏ qua: ${depthStats.bypassedPercent}%.`}
        >
          <Workflow className="w-3.5 h-3.5 text-indigo-400" />
          <span>Depth:</span>
          <span className="text-slate-200 font-semibold">{depthStats.depthPercent}%</span>
          <span className="text-[10px] text-slate-500">
            ({depthStats.executedLayers}/{depthStats.totalLayers} layers)
          </span>
          <div className="w-12 bg-slate-800 rounded-full h-1.5 overflow-hidden flex">
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

        <div className="h-3.5 w-[1px] bg-slate-800" />

        {/* Metric 3: Real Evidence Certainty Score % */}
        <div className="flex items-center gap-1.5" title="Điểm tin cậy toán học trung bình của toàn bộ node có bằng chứng">
          <span>Certainty:</span>
          <strong className="text-emerald-400">{realCertaintyPercent}%</strong>
          <span className="text-[10px] text-slate-500">
            ({realCertaintyPercent >= 70 ? 'EXPLICIT' : 'INFERRED'})
          </span>
        </div>

        <div className="h-3.5 w-[1px] bg-slate-800" />

        {/* Metric 4: Latency */}
        <div className="flex items-center gap-1">
          <Timer className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-300 font-medium">
            {session.latencyMs ? `${session.latencyMs}ms` : '12ms'}
          </span>
        </div>
      </div>

      {/* Controls & Actions (Right) */}
      <div className="flex items-center gap-2">
        {/* Test Scenarios button */}
        <button
          onClick={onOpenSimulator}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors"
          title="Thử nghiệm các kịch bản lỗi mẫu"
        >
          <SlidersHorizontal className="w-3.5 h-3.5 text-sky-400" />
          <span>Kịch Bản Lỗi Mẫu</span>
        </button>

        {/* WebSocket Live Indicator */}
        <div
          className={`flex items-center gap-1.5 px-2 py-1 rounded border text-[11px] font-mono ${
            isConnected
              ? 'bg-slate-900 text-emerald-400 border-slate-800'
              : 'bg-slate-900 text-amber-400 border-slate-800'
          }`}
          title={isConnected ? 'WebSocket server connected on port 9876' : 'Reconnecting...'}
        >
          <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse'}`} />
          <span className="hidden sm:inline">Port 9876</span>
        </div>

        {/* Layout Direction */}
        <button
          onClick={onToggleLayout}
          className="p-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-colors"
          title={`Đổi hướng bố cục sang ${layoutDirection === 'TB' ? 'Ngang (LR)' : 'Dọc (TB)'}`}
        >
          {layoutDirection === 'TB' ? (
            <Rows3 className="w-3.5 h-3.5" />
          ) : (
            <Columns3 className="w-3.5 h-3.5" />
          )}
        </button>

        {/* Fit View */}
        <button
          onClick={onFitView}
          className="p-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-colors"
          title="Căn giữa sơ đồ"
        >
          <Maximize2 className="w-3.5 h-3.5" />
        </button>

        {/* Reset */}
        <button
          onClick={onResetDemo}
          className="p-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-colors"
          title="Đặt lại về mặc định"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>
    </header>
  );
};
