import React, { useState, useEffect } from 'react';
import {
  X,
  FileCode,
  AlertOctagon,
  Terminal,
  Scale,
  GitCompare,
  Copy,
  Check,
  Code2,
  CheckCircle2,
  MinusCircle,
  HelpCircle,
  Info
} from 'lucide-react';
import type { FlowNodeData } from '../types.js';
import { calculateRealConfidence, resolveNodeEvidence } from '../types.js';

interface InspectorDrawerProps {
  node: FlowNodeData | null;
  onClose: () => void;
}

export const InspectorDrawer: React.FC<InspectorDrawerProps> = ({ node, onClose }) => {
  const [activeTab, setActiveTab] = useState<'root_cause' | 'code_diff' | 'logs'>('root_cause');
  const [copiedPatch, setCopiedPatch] = useState<boolean>(false);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);

  // Auto-switch tab intelligently when node changes
  useEffect(() => {
    if (!node) return;
    if (node.state === 'STOPPED_HERE') {
      setActiveTab('root_cause');
    } else if (node.codeEvidence && !node.causalWhy) {
      setActiveTab('code_diff');
    } else {
      setActiveTab('root_cause');
    }
  }, [node?.id, node?.state]);

  if (!node) {
    return (
      <div className="h-full w-full bg-slate-950 flex flex-col items-center justify-center p-6 text-center text-slate-500 font-mono text-xs">
        <Info className="w-8 h-8 text-slate-600 mb-2" />
        <p>Chọn một node trên sơ đồ để xem bằng chứng chi tiết, mã nguồn và thẻ Causal WHY.</p>
      </div>
    );
  }

  const {
    label,
    type,
    file,
    line,
    state,
    latencyMs,
    causalWhy,
    codeEvidence,
    codeDiff,
    runtimeLogs
  } = node;

  const isStopped = state === 'STOPPED_HERE';
  const isPassed = state === 'PASSED';
  const isSkipped = state === 'SKIPPED';

  // Đảm bảo bằng chứng toán học tất định luôn phản ánh đúng thực tế
  const activeEvidence = resolveNodeEvidence(node);
  const calculated = calculateRealConfidence(activeEvidence);
  const confidenceScore = node.confidence !== undefined ? node.confidence : calculated.score;
  const certaintyLevel = node.certainty || calculated.certainty;

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
    <aside className="h-full w-full bg-slate-950 flex flex-col overflow-hidden font-sans select-none">
      {/* 1. Header */}
      <div className="p-3 border-b border-slate-800 flex items-center justify-between gap-3 bg-slate-900/90 shrink-0">
        <div className="flex items-center gap-2 overflow-hidden">
          <div className="w-7 h-7 rounded bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0">
            <FileCode className="w-4 h-4 text-sky-400" />
          </div>
          <div className="overflow-hidden">
            <h3 className="text-xs font-semibold text-slate-100 font-mono truncate" title={label}>
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
          title="Đóng bảng chi tiết"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* 2. Tabs */}
      <div className="flex items-center border-b border-slate-800 bg-slate-900/40 px-2 text-xs font-mono shrink-0">
        <button
          onClick={() => setActiveTab('root_cause')}
          className={`flex items-center gap-1.5 px-3 py-2 border-b-2 font-medium transition-colors ${
            activeTab === 'root_cause'
              ? 'border-sky-500 text-sky-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <AlertOctagon className="w-3.5 h-3.5" />
          <span>{isStopped ? 'Root Cause (WHY)' : 'Evidence & Rules'}</span>
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
          <span>{codeDiff ? 'Code & Patch' : 'Source Code'}</span>
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

      {/* 3. Drawer Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs font-mono">
        {/* Status bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-900/90 p-2.5 rounded-lg border border-slate-800 text-[11px]">
          <div className="flex items-center gap-2">
            <span
              className={`px-2 py-0.5 rounded font-semibold ${
                isStopped
                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                  : isPassed
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                  : 'bg-slate-800 text-slate-400 border border-slate-700'
              }`}
            >
              ● {state}
            </span>
            <span className="text-slate-300">
              Confidence: <strong className="text-sky-400">{Math.round(confidenceScore * 100)}%</strong> ({certaintyLevel})
            </span>
          </div>

          {file && (
            <span className="text-slate-400 truncate max-w-[170px]" title={file}>
              {file.split('/').pop()}{line ? `:${line}` : ''}
            </span>
          )}
        </div>

        {/* Informational banner if node was SKIPPED */}
        {isSkipped && (
          <div className="p-3 bg-slate-900/70 border border-slate-800 rounded-lg space-y-1">
            <div className="flex items-center gap-1.5 text-slate-300 font-semibold">
              <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
              <span>Tầng này bị bỏ qua (SKIPPED)</span>
            </div>
            <p className="text-slate-400 text-[11px] leading-relaxed font-sans">
              Luồng thực thi đã bị chặn lại ở các bước trước đó, nên tầng nghiệp vụ này chưa hề được gọi tới trong runtime.
            </p>
          </div>
        )}

        {/* TAB 1: Root Cause / Evidence Analysis */}
        {activeTab === 'root_cause' && (
          <div className="space-y-3">
            {/* 4-part Causal Card for STOPPED_HERE nodes */}
            {causalWhy && (
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
            )}

            {/* REAL Deterministic Evidence Breakdown */}
            <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 space-y-2.5">
              <div className="flex items-center justify-between text-slate-300 text-xs font-semibold">
                <span className="flex items-center gap-1.5">
                  <Scale className="w-3.5 h-3.5 text-sky-400" />
                  Deterministic Evidence Calculation
                </span>
                <span className="text-emerald-400 font-mono font-bold">
                  {Math.round(confidenceScore * 100)}% ({certaintyLevel})
                </span>
              </div>

              <div className="text-[10px] text-slate-400 font-mono bg-slate-950 p-2 rounded border border-slate-800">
                Formula: <span className="text-sky-300">Confidence = min(1.0, max(0, ∑ wi))</span>
              </div>

              <div className="space-y-1.5 text-[11px] text-slate-300 pt-0.5">
                {/* 1. Route annotation */}
                <div className="flex items-start justify-between py-1 border-b border-slate-800/80 gap-2">
                  <div>
                    <div className="flex items-center gap-1 text-slate-200">
                      {activeEvidence?.hasRouteAnnotation ? (
                        <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                      ) : (
                        <MinusCircle className="w-3 h-3 text-slate-500 shrink-0" />
                      )}
                      <span>Route / Endpoint Annotation (w₁ = +0.40):</span>
                    </div>
                    {activeEvidence?.routeAnnotationRule && (
                      <span className="text-[10px] text-slate-400 block pl-4">
                        {activeEvidence.routeAnnotationRule}
                      </span>
                    )}
                  </div>
                  <span className={`font-semibold font-mono ${activeEvidence?.hasRouteAnnotation ? 'text-emerald-400' : 'text-slate-500'}`}>
                    {activeEvidence?.hasRouteAnnotation ? '+40%' : '0%'}
                  </span>
                </div>

                {/* 2. Symbol call */}
                <div className="flex items-start justify-between py-1 border-b border-slate-800/80 gap-2">
                  <div>
                    <div className="flex items-center gap-1 text-slate-200">
                      {activeEvidence?.hasSymbolCall ? (
                        <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                      ) : (
                        <MinusCircle className="w-3 h-3 text-slate-500 shrink-0" />
                      )}
                      <span>AST & Symbol Call Graph (w₂ = +0.30):</span>
                    </div>
                    {activeEvidence?.symbolCallRule && (
                      <span className="text-[10px] text-slate-400 block pl-4">
                        {activeEvidence.symbolCallRule}
                      </span>
                    )}
                  </div>
                  <span className={`font-semibold font-mono ${activeEvidence?.hasSymbolCall ? 'text-emerald-400' : 'text-slate-500'}`}>
                    {activeEvidence?.hasSymbolCall ? '+30%' : '0%'}
                  </span>
                </div>

                {/* 3. Runtime trace */}
                <div className="flex items-start justify-between py-1 border-b border-slate-800/80 gap-2">
                  <div>
                    <div className="flex items-center gap-1 text-slate-200">
                      {activeEvidence?.hasRuntimeTrace ? (
                        <CheckCircle2 className={`w-3 h-3 shrink-0 ${isStopped ? 'text-rose-400' : 'text-emerald-400'}`} />
                      ) : (
                        <MinusCircle className="w-3 h-3 text-slate-500 shrink-0" />
                      )}
                      <span>Runtime Frame / Stack Trace (w₃ = +0.30):</span>
                    </div>
                    {activeEvidence?.runtimeTraceRule && (
                      <span className="text-[10px] text-slate-400 block pl-4">
                        {activeEvidence.runtimeTraceRule}
                      </span>
                    )}
                  </div>
                  <span className={`font-semibold font-mono ${activeEvidence?.hasRuntimeTrace ? (isStopped ? 'text-rose-400' : 'text-emerald-400') : 'text-slate-500'}`}>
                    {activeEvidence?.hasRuntimeTrace ? '+30%' : '0%'}
                  </span>
                </div>

                {/* 4. Ambiguity deduction */}
                {activeEvidence?.hasAmbiguousOverload && (
                  <div className="flex items-start justify-between py-1 text-rose-300 gap-2">
                    <div>
                      <div className="flex items-center gap-1 font-semibold">
                        <AlertOctagon className="w-3 h-3 text-rose-400 shrink-0" />
                        <span>Ambiguous Polymorphism Overload (w₄ = -0.20):</span>
                      </div>
                      {activeEvidence.ambiguityRule && (
                        <span className="text-[10px] text-rose-400/80 block pl-4">
                          {activeEvidence.ambiguityRule}
                        </span>
                      )}
                    </div>
                    <span className="font-semibold font-mono text-rose-400">-20%</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Code Diff & Suggested Patch */}
        {activeTab === 'code_diff' && (
          <div className="space-y-4">
            {codeDiff ? (
              <div className="bg-slate-900 rounded-lg border border-slate-800 overflow-hidden">
                <div className="px-3 py-2 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-xs text-slate-300">
                  <span className="flex items-center gap-1.5 truncate max-w-[260px]">
                    <GitCompare className="w-3.5 h-3.5 text-sky-400" />
                    <span>{codeDiff.filename || file?.split('/').pop() || 'Patch'}</span>
                  </span>
                  <button
                    onClick={handleCopyPatch}
                    className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 px-2 py-0.5 rounded transition-colors"
                  >
                    {copiedPatch ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span>Copied Patch</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy Patch</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Git-style Diff View */}
                <div className="p-3 bg-slate-950 font-mono text-[11px] overflow-x-auto leading-relaxed space-y-1">
                  <div className="text-slate-500 pb-1 border-b border-slate-800 text-[10px]">
                    @@ -41,1 +41,1 @@ Root Cause Fix
                  </div>
                  <div className="flex items-start gap-2 bg-rose-950/40 text-rose-300 px-1 py-0.5 rounded">
                    <span className="select-none text-rose-500 font-bold">-</span>
                    <pre className="overflow-x-auto">
                      <code>{codeDiff.oldCode}</code>
                    </pre>
                  </div>
                  <div className="flex items-start gap-2 bg-emerald-950/40 text-emerald-300 px-1 py-0.5 rounded">
                    <span className="select-none text-emerald-500 font-bold">+</span>
                    <pre className="overflow-x-auto">
                      <code>{codeDiff.newCode}</code>
                    </pre>
                  </div>
                </div>
              </div>
            ) : null}

            {/* Code Evidence snippet */}
            {codeEvidence ? (
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
            ) : !codeDiff ? (
              <div className="p-4 text-center text-slate-500 font-mono text-xs">
                Chưa có đoạn mã nguồn mẫu cho node này.
              </div>
            ) : null}
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
                    const isJwt = log.startsWith('[JWT Decoder]');
                    const isCurl = log.startsWith('[cURL Parser]');
                    return (
                      <div
                        key={i}
                        className={`p-1.5 rounded transition-colors ${
                          isError
                            ? 'text-rose-300 bg-rose-950/30 border border-rose-900/40'
                            : isWarn
                            ? 'text-amber-300 bg-amber-950/30 border border-amber-900/40'
                            : isJwt
                            ? 'text-sky-300 bg-sky-950/30 border border-sky-900/40 font-semibold'
                            : isCurl
                            ? 'text-indigo-300 bg-indigo-950/30 border border-indigo-900/40'
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
              <div className="p-6 text-center text-slate-500 font-mono text-xs bg-slate-900/40 rounded-lg border border-slate-800/60">
                <Terminal className="w-5 h-5 mx-auto mb-2 text-slate-600" />
                <p>Không có log runtime phát sinh tại node này.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  );
};
