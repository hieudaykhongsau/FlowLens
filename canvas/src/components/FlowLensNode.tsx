import React from 'react';
import { Handle, Position } from '@xyflow/react';
import {
  Globe,
  Shield,
  ShieldAlert,
  Cpu,
  Database,
  ExternalLink,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Layers
} from 'lucide-react';
import type { FlowNodeData } from '../types.js';

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
    certainty,
    confidence,
    method,
    onSelectNode
  } = data;

  const getTypeIcon = () => {
    switch (type) {
      case 'entrypoint':
        return <Globe className="w-4 h-4 text-cyan-400" />;
      case 'filter':
        return <Shield className="w-4 h-4 text-indigo-400" />;
      case 'guard':
        return <ShieldAlert className="w-4 h-4 text-amber-400" />;
      case 'service':
        return <Cpu className="w-4 h-4 text-purple-400" />;
      case 'repository':
        return <Layers className="w-4 h-4 text-emerald-400" />;
      case 'database':
        return <Database className="w-4 h-4 text-blue-400" />;
      case 'external_api':
        return <ExternalLink className="w-4 h-4 text-orange-400" />;
      case 'failure_node':
        return <AlertTriangle className="w-4 h-4 text-rose-400" />;
      default:
        return <Cpu className="w-4 h-4 text-slate-400" />;
    }
  };

  const getStateStyle = () => {
    switch (state) {
      case 'PASSED':
        return {
          card: 'border-emerald-500/80 bg-slate-900/90 shadow-[0_0_20px_rgba(16,185,129,0.15)]',
          badge: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30',
          icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />,
          text: 'PASSED'
        };
      case 'STOPPED_HERE':
        return {
          card: 'border-rose-500 bg-rose-950/40 pulse-stopped shadow-[0_0_30px_rgba(244,63,94,0.35)] ring-1 ring-rose-500',
          badge: 'bg-rose-500 text-white font-bold border border-rose-400 animate-pulse',
          icon: <XCircle className="w-3.5 h-3.5 text-white" />,
          text: 'STOPPED HERE'
        };
      case 'SKIPPED':
        return {
          card: 'border-slate-800/80 bg-slate-950/60 opacity-55 contrast-75',
          badge: 'bg-slate-800/60 text-slate-400 border border-slate-700/50',
          icon: <Clock className="w-3.5 h-3.5 text-slate-500" />,
          text: 'SKIPPED'
        };
      case 'NOT_VERIFIED':
      default:
        return {
          card: 'border-slate-700/70 border-dashed bg-slate-900/70 shadow-sm',
          badge: 'bg-slate-800/80 text-slate-300 border border-slate-700/60',
          icon: <Clock className="w-3.5 h-3.5 text-slate-400" />,
          text: 'NOT VERIFIED'
        };
    }
  };

  const stateStyle = getStateStyle();

  return (
    <div
      onClick={() => onSelectNode && onSelectNode(data)}
      className={`group relative w-[320px] rounded-xl border backdrop-blur-md transition-all duration-200 cursor-pointer hover:border-sky-400 hover:shadow-[0_0_25px_rgba(56,189,248,0.25)] ${stateStyle.card}`}
    >
      <Handle
        type="target"
        position={targetPosition}
        className="!w-2.5 !h-2.5 !bg-sky-400 !border-slate-950"
      />

      <div className="p-3.5">
        {/* Header row: Category & State Badge */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold tracking-wider uppercase text-slate-300">
            {getTypeIcon()}
            <span className="truncate">{type.replace('_', ' ')}</span>
            {method && (
              <span className="px-1.5 py-0.5 rounded bg-sky-950 text-sky-300 text-[10px] font-mono border border-sky-800/60">
                {method}
              </span>
            )}
          </div>
          <div
            className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] tracking-wide font-medium ${stateStyle.badge}`}
          >
            {stateStyle.icon}
            <span>{stateStyle.text}</span>
          </div>
        </div>

        {/* Main Title & Subtitle */}
        <div className="mb-2.5">
          <h4 className="text-sm font-semibold text-slate-100 font-mono tracking-tight leading-snug line-clamp-2">
            {label}
          </h4>
          {sublabel && (
            <p className="text-xs text-slate-400 font-mono mt-0.5 truncate">
              {sublabel}
            </p>
          )}
        </div>

        {/* File & Line Location */}
        {file && (
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 bg-slate-950/80 px-2 py-1 rounded border border-slate-800/80 mb-2.5">
            <span className="truncate max-w-[210px]" title={file}>
              {file.split('/').pop()}
            </span>
            {line && <span className="text-sky-400 font-medium">L{line}</span>}
          </div>
        )}

        {/* Confidence & Certainty Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-800/60 text-[10px]">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 font-mono">Certainty:</span>
            <span
              className={`font-semibold ${
                certainty === 'EXPLICIT'
                  ? 'text-emerald-400'
                  : certainty === 'INFERRED'
                  ? 'text-amber-400'
                  : 'text-slate-500'
              }`}
            >
              {certainty}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-12 bg-slate-800 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-sky-400 h-full rounded-full transition-all"
                style={{ width: `${Math.round(confidence * 100)}%` }}
              />
            </div>
            <span className="font-mono text-slate-300 font-medium">
              {confidence.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      <Handle
        type="source"
        position={sourcePosition}
        className="!w-2.5 !h-2.5 !bg-sky-400 !border-slate-950"
      />
    </div>
  );
};
