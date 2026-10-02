import React from 'react';
import { Check, Loader2, AlertCircle } from 'lucide-react';
import type { InvestigationStep } from '../types.js';

interface StepperTrackerProps {
  steps: InvestigationStep[];
  activeStep?: number;
  onSelectStep?: (step: InvestigationStep) => void;
}

export const StepperTracker: React.FC<StepperTrackerProps> = ({ steps }) => {
  return (
    <div className="w-full bg-slate-900/80 backdrop-blur-md border-b border-slate-800/80 px-4 py-2.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 overflow-x-auto no-scrollbar">
        {steps.map((step, idx) => {
          const isLast = idx === steps.length - 1;

          let icon = (
            <div className="w-5 h-5 rounded-full border border-slate-700 bg-slate-800 flex items-center justify-center text-[10px] text-slate-400 font-mono">
              {step.stepNumber}
            </div>
          );

          let textColor = 'text-slate-400';
          let borderGlow = '';

          if (step.status === 'completed') {
            icon = (
              <div className="w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.3)]">
                <Check className="w-3 h-3 stroke-[2.5]" />
              </div>
            );
            textColor = 'text-emerald-300';
          } else if (step.status === 'in_progress') {
            icon = (
              <div className="w-5 h-5 rounded-full bg-sky-500/20 border border-sky-400 flex items-center justify-center text-sky-400 animate-spin shadow-[0_0_10px_rgba(56,189,248,0.4)]">
                <Loader2 className="w-3 h-3 stroke-[2.5]" />
              </div>
            );
            textColor = 'text-sky-300 font-semibold';
            borderGlow = 'ring-1 ring-sky-500/30';
          } else if (step.status === 'failed') {
            icon = (
              <div className="w-5 h-5 rounded-full bg-rose-500/20 border border-rose-500 flex items-center justify-center text-rose-400">
                <AlertCircle className="w-3 h-3 stroke-[2.5]" />
              </div>
            );
            textColor = 'text-rose-300';
          }

          return (
            <React.Fragment key={step.stepNumber}>
              <div
                className={`flex items-center gap-2 px-2.5 py-1 rounded-lg transition-all shrink-0 cursor-default ${borderGlow}`}
                title={step.summary || step.title}
              >
                {icon}
                <div className="flex flex-col">
                  <span className={`text-xs whitespace-nowrap ${textColor}`}>
                    {step.title}
                  </span>
                  {step.summary && (
                    <span className="text-[10px] text-slate-400 max-w-[140px] truncate">
                      {step.summary}
                    </span>
                  )}
                </div>
              </div>

              {!isLast && (
                <div className="h-[1px] w-6 bg-slate-800 shrink-0 hidden sm:block" />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};
