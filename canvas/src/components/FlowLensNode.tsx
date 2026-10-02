import React from 'react';
import { Handle, Position } from '@xyflow/react';
import {
  Globe,
  Shield,
  ShieldAlert,
  Cpu,
  Database,
  ExternalLink,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Clock,
  Layers,
  FileCode2,
  Timer
} from 'lucide-react';
import type { FlowNodeData } from '../types.js';
import { calculateRealConfidence } from '../types.js';

interface FlowLensNodeProps {
  data: FlowNodeData;
  targetPosition?: Position;
  sourcePosition?: Position;
}

export const FlowLensNode: React.FC<FlowLensNodeProps> = ({
  data,
  targetPosition = Position.Top,
  sourcePosition = Position.Bottom
}) => {
  const {
    type,
    label,
    sublabel,
    file,
    line,
    state,
    evidence,
    method,
    latencyMs,
    onSelectNode
  } = data;

  // Tính điểm tin cậy toán học thực tế từ bằng chứng
  const calculated = calculateRealConfidence(evidence);
  const realScore = data.confidence !== undefined ? data.confidence : calculated.score;
  const realCertainty = data.certainty || calculated.certainty;

  const getTypeMeta = () => {
    switch (type) {
      case 'entrypoint':
        return {
          icon: <Globe className="w-3.5 h-3.5 text-blue-400" />,
          title: 'CONTROLLER',
          color: 'text-blue-400 bg-blue-950/60 border-blue-900/60'
        };
      case 'filter':
        return {
          icon: <Shield className="w-3.5 h-3.5 text-sky-400" />,
          title: 'SECURITY FILTER',
          color: 'text-sky-400 bg-sky-950/60 border-sky-900/60'
        };
      case 'guard':
        return {
          icon: <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />,
          title: 'ACCESS GUARD',
          color: 'text-amber-400 bg-amber-950/60 border-amber-900/60'
        };
      case 'service':
        return {
          icon: <Cpu className="w-3.5 h-3.5 text-indigo-400" />,
          title: 'BUSINESS SERVICE',
          color: 'text-indigo-400 bg-indigo-950/60 border-indigo-900/60'
        };
      case 'repository':
        return {
          icon: <Layers className="w-3.5 h-3.5 text-teal-400" />,
          title: 'DATA REPOSITORY',
          color: 'text-teal-400 bg-teal-950/60 border-teal-900/60'
        };
      case 'database':
        return {
          icon: <Database className="w-3.5 h-3.5 text-emerald-400" />,
          title: 'DATABASE ENGINE',
          color: 'text-emerald-400 bg-emerald-950/60 border-emerald-900/60'
        };
      case 'external_api':
        return {
          icon: <ExternalLink className="w-3.5 h-3.5 text-orange-400" />,
          title: 'EXTERNAL CLIENT',
          color: 'text-orange-400 bg-orange-950/60 border-orange-900/60'
        };
      case 'failure_node':
      default:
        return {
          icon: <AlertCircle className="w-3.5 h-3.5 text-rose-400" />,
          title: 'HANDLER',
          color: 'text-rose-400 bg-rose-950/60 border-rose-900/60'
        };
    }
  };

  const getMethodBadge = (m?: string) => {
    if (!m) return null;
    const upper = m.toUpperCase();
    let color = 'bg-blue-950 text-blue-300 border-blue-800';
    if (upper === 'GET') color = 'bg-emerald-950 text-emerald-300 border-emerald-800';
    if (upper === 'PUT' || upper === 'PATCH') color = 'bg-amber-950 text-amber-300 border-amber-800';
    if (upper === 'DELETE') color = 'bg-rose-950 text-rose-300 border-rose-800';

    return (
      <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold border ${color}`}>
        {upper}
      </span>
    );
  };

  const getStateStyle = () => {
    switch (state) {
      case 'PASSED':
        return {
          card: 'border-emerald-600/60 bg-slate-900 hover:border-emerald-500',
          badge: 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30',
          icon: <CheckCircle2 className="w-3 h-3 text-emerald-400" />,
          text: 'PASSED'
        };
      case 'STOPPED_HERE':
        return {
          card: 'border-rose-500 bg-slate-900 ring-2 ring-rose-500/50 shadow-[0_0_15px_rgba(244,63,94,0.2)]',
          badge: 'bg-rose-600 text-white font-bold border border-rose-400',
          icon: <XCircle className="w-3 h-3 text-white" />,
          text: 'STOPPED HERE'
        };
      case 'SKIPPED':
        return {
          card: 'border-slate-800 bg-slate-950/50 opacity-60 hover:opacity-85',
          badge: 'bg-slate-800/80 text-slate-400 border border-slate-700/60',
          icon: <Clock className="w-3 h-3 text-slate-500" />,
          text: 'SKIPPED'
        };
      case 'NOT_VERIFIED':
      default:
        return {
          card: 'border-slate-700/80 border-dashed bg-slate-900/60',
          badge: 'bg-slate-800 text-slate-300 border border-slate-700',
          icon: <Clock className="w-3 h-3 text-slate-400" />,
          text: 'NOT VERIFIED'
        };
    }
  };

  const getEvidenceFormula = () => {
    if (!evidence) return null;
    const parts = [];
    if (evidence.hasRouteAnnotation) parts.push('+40% Route');
    if (evidence.hasSymbolCall) parts.push('+30% AST');
    if (evidence.hasRuntimeTrace) parts.push('+30% Trace');
    if (evidence.hasAmbiguousOverload) parts.push('-20% Overload');
    return parts.join(' ');
  };

  const typeMeta = getTypeMeta();
  const stateStyle = getStateStyle();
  const formulaText = getEvidenceFormula();

  return (
    <div
      onClick={() => onSelectNode && onSelectNode(data)}
      className={`group relative w-[340px] rounded-lg border transition-all duration-150 cursor-pointer shadow-md select-none ${stateStyle.card}`}
    >
      <Handle
        type="target"
        position={targetPosition}
        className="!w-2 !h-2 !bg-slate-400 !border-slate-900 group-hover:!bg-sky-400"
      />

      <div className="p-3">
        {/* Top bar: Layer Category + Method + Latency + State Badge */}
        <div className="flex items-center justify-between gap-1.5 mb-2">
          <div className="flex items-center gap-1.5 overflow-hidden">
            <span
              className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-medium border ${typeMeta.color}`}
            >
              {typeMeta.icon}
              <span className="truncate">{typeMeta.title}</span>
            </span>
            {getMethodBadge(method)}
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {latencyMs !== undefined && (
              <span className="flex items-center gap-0.5 text-[10px] font-mono text-slate-400 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">
                <Timer className="w-2.5 h-2.5 text-slate-400" />
                {latencyMs > 4000 ? `${latencyMs}ms (timeout)` : `${latencyMs}ms`}
              </span>
            )}
            <span
              className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono tracking-wide ${stateStyle.badge}`}
            >
              {stateStyle.icon}
              <span>{stateStyle.text}</span>
            </span>
          </div>
        </div>

        {/* Main Content: Title & Function */}
        <div className="mb-2">
          <div className="text-[13px] font-medium text-slate-100 font-mono leading-snug line-clamp-2">
            {label}
          </div>
          {sublabel && (
            <div className="text-[11px] text-slate-400 font-mono mt-0.5 truncate">
              {sublabel}
            </div>
          )}
        </div>

        {/* Source File Location */}
        {file && (
          <div className="flex items-center justify-between text-[11px] font-mono bg-slate-950 px-2 py-1 rounded border border-slate-800/80 mb-2 text-slate-300">
            <span className="flex items-center gap-1 truncate max-w-[240px]" title={file}>
              <FileCode2 className="w-3 h-3 text-slate-400 shrink-0" />
              <span className="truncate">{file.split('/').pop()}</span>
            </span>
            {line && (
              <span className="text-sky-400 font-semibold shrink-0">:{line}</span>
            )}
          </div>
        )}

        {/* Footer: Evidence Formula & Certainty Score % */}
        <div className="flex items-center justify-between pt-1.5 border-t border-slate-800 text-[10px] text-slate-400 font-mono">
          <div className="flex items-center gap-1 truncate max-w-[200px]" title={formulaText || 'Certainty Score'}>
            <span className="text-slate-400">Score:</span>
            <span
              className={`font-semibold ${
                realCertainty === 'EXPLICIT'
                  ? 'text-emerald-400'
                  : realCertainty === 'INFERRED'
                  ? 'text-amber-400'
                  : 'text-slate-500'
              }`}
            >
              {realCertainty}
            </span>
            {formulaText && (
              <span className="text-[9px] text-slate-500 truncate hidden sm:inline">
                ({formulaText})
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <div className="w-12 bg-slate-800 rounded-full h-1.5 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  realScore >= 0.7
                    ? 'bg-emerald-400'
                    : realScore > 0.3
                    ? 'bg-sky-400'
                    : 'bg-slate-500'
                }`}
                style={{ width: `${Math.round(realScore * 100)}%` }}
              />
            </div>
            <span className="font-semibold text-slate-200">
              {Math.round(realScore * 100)}%
            </span>
          </div>
        </div>
      </div>

      <Handle
        type="source"
        position={sourcePosition}
        className="!w-2 !h-2 !bg-slate-400 !border-slate-900 group-hover:!bg-sky-400"
      />
    </div>
  );
};
