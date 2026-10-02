import React from 'react';
import {
  Radio,
  Wifi,
  WifiOff,
  Maximize2,
  Columns3,
  Rows3,
  RotateCcw,
  Sparkles
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
  return (
    <header className="w-full bg-slate-950/90 border-b border-slate-800/80 px-4 py-3 flex items-center justify-between gap-4 z-20">
      {/* Brand & Active Endpoint */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-sky-500 to-indigo-500 flex items-center justify-center shadow-[0_0_15px_rgba(56,189,248,0.4)]">
            <Radio className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-base tracking-tight text-white">
                Flow<span className="text-sky-400">Lens</span>
              </span>
              <span className="text-[10px] font-mono uppercase bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded border border-slate-700/60">
                MCP Canvas v1.0
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-mono hidden sm:block">
              Universal API Execution Debugger & Causal HUD
            </p>
          </div>
        </div>

        <div className="h-6 w-[1px] bg-slate-800 hidden md:block" />

        {/* Active Endpoint */}
        <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-md">
          <span className="text-xs font-mono font-bold text-sky-400">
            {session.method}
          </span>
          <span className="text-xs font-mono text-slate-200">
            {session.endpoint}
          </span>
        </div>

        {/* Status Pill */}
        <span
          className={`text-[10px] font-mono px-2 py-0.5 rounded-full border uppercase tracking-wider ${
            session.status === 'completed'
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
              : 'bg-sky-500/10 text-sky-400 border-sky-500/30 animate-pulse'
          }`}
        >
          {session.status}
        </span>
      </div>

      {/* Middle: Certainty Score Gauge */}
      <div className="hidden lg:flex items-center gap-3 bg-slate-900/60 border border-slate-800/80 px-3 py-1.5 rounded-lg">
        <div className="flex flex-col text-right">
          <span className="text-[10px] uppercase font-mono text-slate-400">
            Certainty Score
          </span>
          <span className="text-xs font-mono font-bold text-sky-400">
            {(session.certaintyScore * 100).toFixed(0)}%{' '}
            <span className="text-[10px] text-emerald-400 font-normal">
              {session.certaintyScore >= 0.7 ? '(EXPLICIT)' : '(INFERRED)'}
            </span>
          </span>
        </div>
        <div className="w-16 h-2 bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-sky-500 to-emerald-400 rounded-full transition-all"
            style={{ width: `${Math.round(session.certaintyScore * 100)}%` }}
          />
        </div>
      </div>

      {/* Right Controls: Test API button & Actions */}
      <div className="flex items-center gap-2">
        {/* Test API Simulator Button */}
        <button
          onClick={onOpenSimulator}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white text-xs font-semibold shadow-[0_0_15px_rgba(56,189,248,0.3)] transition-all active:scale-95"
        >
          <Sparkles className="w-3.5 h-3.5 text-white" />
          <span>Test API Trực Tiếp</span>
        </button>

        {/* WebSocket Connection Status */}
        <div
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-mono ${
            isConnected
              ? 'bg-emerald-950/40 text-emerald-400 border-emerald-800/50'
              : 'bg-amber-950/40 text-amber-400 border-amber-800/50'
          }`}
          title={isConnected ? 'WebSocket Port 9876 connected' : 'Connecting to ws://localhost:9876'}
        >
          {isConnected ? (
            <>
              <Wifi className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">LIVE 9876</span>
            </>
          ) : (
            <>
              <WifiOff className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              <span className="hidden sm:inline">RECONNECTING</span>
            </>
          )}
        </div>

        {/* Layout direction toggle */}
        <button
          onClick={onToggleLayout}
          className="p-1.5 rounded-md bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-colors"
          title={`Switch layout to ${layoutDirection === 'TB' ? 'Horizontal (LR)' : 'Vertical (TB)'}`}
        >
          {layoutDirection === 'TB' ? (
            <Rows3 className="w-4 h-4" />
          ) : (
            <Columns3 className="w-4 h-4" />
          )}
        </button>

        {/* Fit View button */}
        <button
          onClick={onFitView}
          className="p-1.5 rounded-md bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-colors"
          title="Fit Graph to View"
        >
          <Maximize2 className="w-4 h-4" />
        </button>

        {/* Reset Demo button */}
        <button
          onClick={onResetDemo}
          className="p-1.5 rounded-md bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-colors"
          title="Reset to Default Demo"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
