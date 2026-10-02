import React from 'react';
import {
  X,
  FileCode,
  AlertOctagon,
  Lightbulb,
  Terminal,
  Scale
} from 'lucide-react';
import type { FlowNodeData } from '../types.js';

interface InspectorDrawerProps {
  node: FlowNodeData | null;
  onClose: () => void;
}

export const InspectorDrawer: React.FC<InspectorDrawerProps> = ({ node, onClose }) => {
  if (!node) return null;

  const {
    label,
    sublabel,
    type,
    file,
    line,
    state,
    certainty,
    confidence,
    causalWhy,
    codeEvidence,
    runtimeLogs
  } = node;

  return (
    <aside className="fixed top-14 bottom-0 right-0 w-[420px] max-w-[90vw] bg-slate-950/95 backdrop-blur-xl border-l border-slate-800/80 shadow-2xl z-30 flex flex-col overflow-hidden animate-in slide-in-from-right duration-200">
      {/* Drawer Header */}
      <div className="p-4 border-b border-slate-800/80 flex items-center justify-between gap-3 bg-slate-900/60">
        <div className="flex items-center gap-2 overflow-hidden">
          <div className="w-7 h-7 rounded-md bg-sky-950 border border-sky-800/60 flex items-center justify-center shrink-0">
            <FileCode className="w-4 h-4 text-sky-400" />
          </div>
          <div className="overflow-hidden">
            <h3 className="text-sm font-semibold text-slate-100 font-mono truncate">
              {label}
            </h3>
            <p className="text-[11px] text-slate-400 font-mono truncate uppercase">
              {type} • {state}
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1 rounded-md text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Drawer Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Status & Location Pill */}
        <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
          <span
            className={`px-2.5 py-1 rounded-full border text-[11px] font-semibold ${
              state === 'STOPPED_HERE'
                ? 'bg-rose-500/10 text-rose-400 border-rose-500/40'
                : state === 'PASSED'
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/40'
                : state === 'SKIPPED'
                ? 'bg-slate-800 text-slate-400 border-slate-700'
                : 'bg-slate-800 text-slate-300 border-slate-700'
            }`}
          >
            ● {state}
          </span>

          <span className="px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-300">
            Confidence: <strong className="text-sky-400">{(confidence * 100).toFixed(0)}%</strong> ({certainty})
          </span>

          {file && (
            <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400 text-[10px]">
              {file.split('/').pop()}{line ? `:${line}` : ''}
            </span>
          )}
        </div>

        {/* Causal WHY Card (Highlighted for root cause or critical decisions) */}
        {causalWhy ? (
          <div className="rounded-xl border border-rose-500/40 bg-rose-950/20 p-3.5 space-y-3 shadow-lg">
            <div className="flex items-center gap-2 text-xs font-bold text-rose-400 uppercase tracking-wider">
              <AlertOctagon className="w-4 h-4 text-rose-400" />
              <span>Causal WHY: Phân tích Nhân - Quả</span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                <span className="text-[10px] uppercase font-mono text-slate-400 block mb-0.5 font-semibold">
                  1. Condition (Điều kiện cần):
                </span>
                <p className="text-slate-200 font-mono leading-relaxed">
                  {causalWhy.condition}
                </p>
              </div>

              <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                <span className="text-[10px] uppercase font-mono text-slate-400 block mb-0.5 font-semibold">
                  2. Actual State (Dữ liệu thực tế gửi lên):
                </span>
                <p className="text-amber-300 font-mono leading-relaxed">
                  {causalWhy.actualState}
                </p>
              </div>

              <div className="bg-rose-950/60 p-2.5 rounded-lg border border-rose-900/80">
                <span className="text-[10px] uppercase font-mono text-rose-300 block mb-0.5 font-semibold">
                  3. Verdict (Kết luận nguyên nhân):
                </span>
                <p className="text-rose-200 font-mono font-semibold leading-relaxed">
                  {causalWhy.verdict}
                </p>
              </div>

              {causalWhy.recommendation && (
                <div className="bg-emerald-950/40 p-2.5 rounded-lg border border-emerald-900/60 flex items-start gap-2">
                  <Lightbulb className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[10px] uppercase font-mono text-emerald-300 block mb-0.5 font-semibold">
                      Đề xuất khắc phục (Recommendation):
                    </span>
                    <p className="text-emerald-200 font-mono leading-relaxed">
                      {causalWhy.recommendation}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-3 text-xs text-slate-400">
            <span className="text-slate-300 font-semibold block mb-1">Mô tả bước:</span>
            <p className="font-mono text-[11px] leading-relaxed">
              {sublabel || 'Node thực thi bình thường theo luồng kiểm thử.'}
            </p>
          </div>
        )}

        {/* Code Evidence Snippet */}
        {codeEvidence && (
          <div className="rounded-xl border border-slate-800 bg-slate-900/80 overflow-hidden">
            <div className="px-3 py-2 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-xs font-mono text-slate-300">
              <span className="flex items-center gap-1.5 truncate max-w-[260px]" title={codeEvidence.file}>
                <FileCode className="w-3.5 h-3.5 text-sky-400" />
                {codeEvidence.file.split('/').pop()}
              </span>
              <span className="text-sky-400 font-semibold">Line {codeEvidence.line}</span>
            </div>

            <div className="p-3 bg-slate-950 font-mono text-xs text-slate-300 overflow-x-auto leading-relaxed">
              <pre className="text-[11px]">
                <code>{codeEvidence.codeSnippet}</code>
              </pre>
            </div>
          </div>
        )}

        {/* Certainty Engine Weights */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3 space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
            <span className="flex items-center gap-1.5">
              <Scale className="w-3.5 h-3.5 text-sky-400" />
              Evidence Confidence Breakdown
            </span>
            <span className="text-sky-400 font-mono font-bold">
              {confidence.toFixed(2)} / 1.00
            </span>
          </div>

          <div className="space-y-1.5 text-[11px] font-mono text-slate-400 pt-1">
            <div className="flex items-center justify-between py-0.5 border-b border-slate-800/60">
              <span>+0.4 Route / Annotation match:</span>
              <span className="text-emerald-400 font-semibold">VERIFIED</span>
            </div>
            <div className="flex items-center justify-between py-0.5 border-b border-slate-800/60">
              <span>+0.3 Call graph / Symbol trace:</span>
              <span className="text-emerald-400 font-semibold">MATCHED</span>
            </div>
            <div className="flex items-center justify-between py-0.5">
              <span>+0.3 Stack Trace / Mock runner:</span>
              <span className={state === 'STOPPED_HERE' ? 'text-rose-400 font-semibold' : 'text-slate-500'}>
                {state === 'STOPPED_HERE' ? 'CAPTURED (403)' : 'N/A'}
              </span>
            </div>
          </div>
        </div>

        {/* Runtime Logs & Stack Trace */}
        {runtimeLogs && runtimeLogs.length > 0 && (
          <div className="rounded-xl border border-slate-800 bg-slate-950 overflow-hidden">
            <div className="px-3 py-2 bg-slate-900 border-b border-slate-800 flex items-center gap-1.5 text-xs font-mono text-slate-300">
              <Terminal className="w-3.5 h-3.5 text-amber-400" />
              <span>Runtime Evidence Logs</span>
            </div>
            <div className="p-3 text-[11px] font-mono text-slate-400 space-y-1 max-h-48 overflow-y-auto">
              {runtimeLogs.map((log, i) => (
                <div key={i} className="leading-snug text-slate-300">
                  {log}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
