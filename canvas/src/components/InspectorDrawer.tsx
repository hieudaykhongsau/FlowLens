import React, { useState } from 'react';
import {
  X,
  FileCode,
  AlertOctagon,
  Terminal,
  Scale,
  GitCompare,
  Copy,
  Check,
  Code2
} from 'lucide-react';
import type { FlowNodeData } from '../types.js';

interface InspectorDrawerProps {
  node: FlowNodeData | null;
  onClose: () => void;
}

export const InspectorDrawer: React.FC<InspectorDrawerProps> = ({ node, onClose }) => {
  const [activeTab, setActiveTab] = useState<'root_cause' | 'code_diff' | 'logs'>('root_cause');
  const [copiedPatch, setCopiedPatch] = useState<boolean>(false);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);

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
    latencyMs,
    causalWhy,
    codeEvidence,
    codeDiff,
    runtimeLogs
  } = node;

  const handleCopyPatch = () => {
    if (!codeDiff) return;
    const diffText = `--- ${codeDiff.filename || file || 'Original'}\n+++ Suggested Fix\n@@ -1,1 +1,1 @@\n- ${codeDiff.oldCode}\n+ ${codeDiff.newCode}`;
    navigator.clipboard.writeText(diffText);
    setCopiedPatch(true);
    setTimeout(() => setCopiedPatch(false), 2000);
  };

  const handleCopyCode = () => {
    if (!codeEvidence) return;
    navigator.clipboard.writeText(codeEvidence.codeSnippet);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <aside className="fixed top-14 bottom-0 right-0 w-[450px] max-w-[95vw] bg-slate-950/98 border-l border-slate-800 shadow-2xl z-30 flex flex-col overflow-hidden font-sans">
      {/* Header */}
      <div className="p-3.5 border-b border-slate-800 flex items-center justify-between gap-3 bg-slate-900/80">
        <div className="flex items-center gap-2 overflow-hidden">
          <div className="w-7 h-7 rounded bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0">
            <FileCode className="w-4 h-4 text-sky-400" />
          </div>
          <div className="overflow-hidden">
            <h3 className="text-xs font-semibold text-slate-100 font-mono truncate">
              {label}
            </h3>
            <p className="text-[10px] text-slate-400 font-mono truncate uppercase">
              {type} • {state} {latencyMs !== undefined ? `• ${latencyMs}ms` : ''}
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1 rounded text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center border-b border-slate-800 bg-slate-900/40 px-2 text-xs font-mono">
        <button
          onClick={() => setActiveTab('root_cause')}
          className={`flex items-center gap-1.5 px-3 py-2 border-b-2 font-medium transition-colors ${
            activeTab === 'root_cause'
              ? 'border-sky-500 text-sky-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <AlertOctagon className="w-3.5 h-3.5" />
          <span>Root Cause</span>
        </button>

        <button
          onClick={() => setActiveTab('code_diff')}
          className={`flex items-center gap-1.5 px-3 py-2 border-b-2 font-medium transition-colors ${
            activeTab === 'code_diff'
              ? 'border-sky-500 text-sky-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <GitCompare className="w-3.5 h-3.5" />
          <span>Code & Patch</span>
        </button>

        <button
          onClick={() => setActiveTab('logs')}
          className={`flex items-center gap-1.5 px-3 py-2 border-b-2 font-medium transition-colors ${
            activeTab === 'logs'
              ? 'border-sky-500 text-sky-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Terminal className="w-3.5 h-3.5" />
          <span>Logs & Trace</span>
        </button>
      </div>

      {/* Drawer Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs font-mono">
        {/* Status bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-900 p-2.5 rounded border border-slate-800 text-[11px]">
          <div className="flex items-center gap-2">
            <span
              className={`px-2 py-0.5 rounded font-semibold ${
                state === 'STOPPED_HERE'
                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                  : state === 'PASSED'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                  : 'bg-slate-800 text-slate-400 border border-slate-700'
              }`}
            >
              ● {state}
            </span>
            <span className="text-slate-300">
              Certainty: <strong className="text-sky-400">{(confidence * 100).toFixed(0)}%</strong> ({certainty})
            </span>
          </div>

          {file && (
            <span className="text-slate-400 truncate max-w-[170px]" title={file}>
              {file.split('/').pop()}{line ? `:${line}` : ''}
            </span>
          )}
        </div>

        {/* TAB 1: Root Cause Analysis */}
        {activeTab === 'root_cause' && (
          <div className="space-y-3">
            {causalWhy ? (
              <div className="space-y-2.5">
                <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">
                    1. Required Condition (Chính sách / Điều kiện):
                  </span>
                  <p className="text-slate-200 leading-relaxed font-sans text-xs">
                    {causalWhy.condition}
                  </p>
                </div>

                <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 space-y-1">
                  <span className="text-[10px] text-amber-400 uppercase tracking-wider block font-semibold">
                    2. Actual Request State (Dữ liệu thực tế gửi lên):
                  </span>
                  <p className="text-amber-200/90 leading-relaxed font-sans text-xs">
                    {causalWhy.actualState}
                  </p>
                </div>

                <div className="bg-rose-950/40 p-3 rounded-lg border border-rose-900/60 space-y-1">
                  <span className="text-[10px] text-rose-300 uppercase tracking-wider block font-semibold">
                    3. Root Cause Verdict (Điểm dừng & Mã lỗi):
                  </span>
                  <p className="text-rose-200 font-semibold leading-relaxed text-xs">
                    {causalWhy.verdict}
                  </p>
                </div>

                {causalWhy.recommendation && (
                  <div className="bg-emerald-950/30 p-3 rounded-lg border border-emerald-900/50 space-y-1">
                    <span className="text-[10px] text-emerald-400 uppercase tracking-wider block font-semibold">
                      4. Actionable Fix Recommendation:
                    </span>
                    <p className="text-emerald-200 leading-relaxed font-sans text-xs">
                      {causalWhy.recommendation}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-3 bg-slate-900 rounded border border-slate-800 text-slate-400 text-xs font-sans">
                {sublabel || 'Node thực thi bình thường theo luồng kiểm thử.'}
              </div>
            )}

            {/* Evidence Breakdown */}
            <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-slate-300 text-xs font-semibold">
                <span className="flex items-center gap-1.5">
                  <Scale className="w-3.5 h-3.5 text-sky-400" />
                  Deterministic Evidence Weights
                </span>
                <span className="text-sky-400 font-mono font-bold">
                  {confidence.toFixed(2)} / 1.00
                </span>
              </div>

              <div className="space-y-1 text-[11px] text-slate-400 pt-1">
                <div className="flex items-center justify-between py-1 border-b border-slate-800">
                  <span>+0.4 Route / Endpoint mapping:</span>
                  <span className="text-emerald-400 font-semibold">VERIFIED</span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-slate-800">
                  <span>+0.3 Call graph / Injected symbol:</span>
                  <span className="text-emerald-400 font-semibold">MATCHED</span>
                </div>
                <div className="flex items-center justify-between py-1">
                  <span>+0.3 Runtime trace / Exit assertion:</span>
                  <span className={state === 'STOPPED_HERE' ? 'text-rose-400 font-semibold' : 'text-slate-500'}>
                    {state === 'STOPPED_HERE' ? 'CAPTURED EXCEPTION' : 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Code Evidence & Git Patch Diff */}
        {activeTab === 'code_diff' && (
          <div className="space-y-3">
            {/* Git Diff Block */}
            {codeDiff ? (
              <div className="bg-slate-900 rounded-lg border border-slate-800 overflow-hidden">
                <div className="px-3 py-2 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-xs text-slate-300">
                  <span className="flex items-center gap-1.5">
                    <GitCompare className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Suggested Patch Diff</span>
                  </span>
                  <button
                    onClick={handleCopyPatch}
                    className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 px-2 py-0.5 rounded transition-colors"
                  >
                    {copiedPatch ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span>Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy Patch</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="p-3 bg-slate-950 font-mono text-[11px] leading-relaxed overflow-x-auto">
                  <div className="text-slate-500 pb-1">
                    --- a/{codeDiff.filename || file?.split('/').pop() || 'Original'}
                    <br />
                    +++ b/{codeDiff.filename || file?.split('/').pop() || 'Suggested'}
                  </div>
                  <div className="text-rose-400 bg-rose-950/30 px-2 py-0.5 rounded-sm">
                    - {codeDiff.oldCode}
                  </div>
                  <div className="text-emerald-400 bg-emerald-950/30 px-2 py-0.5 rounded-sm mt-0.5">
                    + {codeDiff.newCode}
                  </div>
                </div>
              </div>
            ) : null}

            {/* Original Source Snippet */}
            {codeEvidence && (
              <div className="bg-slate-900 rounded-lg border border-slate-800 overflow-hidden">
                <div className="px-3 py-2 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-xs text-slate-300">
                  <span className="flex items-center gap-1.5 truncate max-w-[260px]" title={codeEvidence.file}>
                    <Code2 className="w-3.5 h-3.5 text-sky-400" />
                    <span>{codeEvidence.file.split('/').pop()}</span>
                    <span className="text-sky-400 font-semibold">:{codeEvidence.line}</span>
                  </span>
                  <button
                    onClick={handleCopyCode}
                    className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 px-2 py-0.5 rounded transition-colors"
                  >
                    {copiedCode ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span>Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="p-3 bg-slate-950 font-mono text-[11px] text-slate-300 overflow-x-auto leading-relaxed">
                  <pre>
                    <code>{codeEvidence.codeSnippet}</code>
                  </pre>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: Runtime Logs & Stack Trace */}
        {activeTab === 'logs' && (
          <div className="space-y-3">
            {runtimeLogs && runtimeLogs.length > 0 ? (
              <div className="bg-slate-950 rounded-lg border border-slate-800 overflow-hidden">
                <div className="px-3 py-2 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-xs text-slate-300">
                  <span className="flex items-center gap-1.5">
                    <Terminal className="w-3.5 h-3.5 text-amber-400" />
                    <span>Console Trace Logs</span>
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {runtimeLogs.length} events
                  </span>
                </div>
                <div className="p-3 text-[11px] font-mono text-slate-300 space-y-1.5 max-h-80 overflow-y-auto leading-snug">
                  {runtimeLogs.map((log, i) => {
                    const isError = log.includes('ERROR') || log.includes('Exception') || log.includes('AccessDenied');
                    const isWarn = log.includes('WARN');
                    return (
                      <div
                        key={i}
                        className={`p-1 rounded ${
                          isError
                            ? 'text-rose-300 bg-rose-950/20'
                            : isWarn
                            ? 'text-amber-300 bg-amber-950/20'
                            : 'text-slate-300'
                        }`}
                      >
                        {log}
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="p-4 text-center text-slate-500 text-xs">
                Không có log phát sinh tại node này.
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  );
};
