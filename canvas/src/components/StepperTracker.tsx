import React from 'react';
import { Check, Loader2, AlertCircle } from 'lucide-react';
import type { InvestigationStep } from '../types.js';

interface StepperTrackerProps {
  steps: InvestigationStep[];
  activeStep?: number;
}

export const StepperTracker: React.FC<StepperTrackerProps> = ({ steps }) => {
  return (
    <div className="w-full bg-slate-950/80 border-b border-slate-800/80 px-4 py-1.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-1 overflow-x-auto no-scrollbar font-mono text-xs">
        {steps.map((step, idx) => {
          const isLast = idx === steps.length - 1;

          let icon = (
            <div className="w-4 h-4 rounded-full border border-slate-700 bg-slate-800 flex items-center justify-center text-[9px] text-slate-400 font-mono">
              {step.stepNumber}
            </div>
          );

          let textColor = 'text-slate-400';

          if (step.status === 'completed') {
            icon = (
              <div className="w-4 h-4 rounded-full bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center text-emerald-400">
                <Check className="w-2.5 h-2.5 stroke-[2.5]" />
              </div>
            );
            textColor = 'text-slate-300';
          } else if (step.status === 'in_progress') {
            icon = (
              <div className="w-4 h-4 rounded-full bg-sky-500/20 border border-sky-400 flex items-center justify-center text-sky-400 animate-spin">
                <Loader2 className="w-2.5 h-2.5 stroke-[2.5]" />
              </div>
            );
            textColor = 'text-sky-400 font-semibold';
          } else if (step.status === 'failed') {
            icon = (
              <div className="w-4 h-4 rounded-full bg-rose-500/20 border border-rose-500 flex items-center justify-center text-rose-400">
                <AlertCircle className="w-2.5 h-2.5 stroke-[2.5]" />
              </div>
            );
            textColor = 'text-rose-400';
          }

          return (
            <React.Fragment key={step.stepNumber}>
              <div
                className="flex items-center gap-1.5 px-2 py-0.5 rounded transition-all shrink-0 cursor-default"
                title={step.summary || step.title}
              >
                {icon}
                <div className="flex flex-col">
                  <span className={`text-[11px] whitespace-nowrap ${textColor}`}>
                    {step.title}
                  </span>
                  {step.summary && (
                    <span className="text-[9px] text-slate-500 max-w-[130px] truncate">
                      {step.summary}
                    </span>
                  )}
                </div>
              </div>

              {!isLast && (
                <div className="h-[1px] w-4 bg-slate-800 shrink-0 hidden md:block" />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};
