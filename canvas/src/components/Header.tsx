import React from 'react';
import {
  Search,
  Maximize2,
  Columns3,
  Rows3,
  RotateCcw,
  SlidersHorizontal,
  Timer
} from 'lucide-react';
import type { InvestigationSession } from '../types.js';

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
  const passedCount = (session.nodes || []).filter((n) => n.state === 'PASSED').length;
  const stoppedCount = (session.nodes || []).filter((n) => n.state === 'STOPPED_HERE').length;
  const skippedCount = (session.nodes || []).filter((n) => n.state === 'SKIPPED').length;
  const totalCount = (session.nodes || []).length;

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

      {/* Execution Telemetry (Middle) */}
      <div className="hidden lg:flex items-center gap-3 text-xs font-mono text-slate-400 bg-slate-900/60 px-3 py-1 rounded border border-slate-800">
        <div className="flex items-center gap-1">
          <Timer className="w-3.5 h-3.5 text-slate-400" />
          <span>Latency:</span>
          <strong className="text-slate-200">
            {session.latencyMs ? `${session.latencyMs}ms` : '12ms'}
          </strong>
        </div>

        <div className="h-3.5 w-[1px] bg-slate-800" />

        <div className="flex items-center gap-1.5">
          <span>Layers:</span>
          <span className="text-emerald-400 font-semibold">{passedCount} passed</span>
          {stoppedCount > 0 && <span className="text-rose-400 font-semibold">• {stoppedCount} stopped</span>}
          {skippedCount > 0 && <span className="text-slate-500">• {skippedCount} skipped</span>}
          <span className="text-slate-600">({totalCount} total)</span>
        </div>

        <div className="h-3.5 w-[1px] bg-slate-800" />

        <div>
          <span>Certainty:</span>{' '}
          <strong className="text-sky-400">{(session.certaintyScore * 100).toFixed(0)}%</strong>
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
