import React from 'react';
import { Check, Loader2, AlertCircle } from 'lucide-react';
import type { InvestigationStep } from '../types.js';

interface StepperTrackerProps {
  steps: InvestigationStep[];
  activeStep?: number;
}

export const StepperTracker: React.FC<StepperTrackerProps> = ({ steps }) => {
  return (
    <div className="w-full bg-slate-950/70 border-b border-slate-800/80 px-4 py-1 backdrop-blur-sm select-none shrink-0 z-20">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-1 overflow-x-auto no-scrollbar font-mono text-xs">
        {steps.map((step, idx) => {
          const isLast = idx === steps.length - 1;

          let badge = (
            <div className="w-4 h-4 rounded-full border border-slate-700 bg-slate-800 flex items-center justify-center text-[9px] text-slate-400 font-mono shrink-0">
              {step.stepNumber}
            </div>
          );

          let textColor = 'text-slate-400';
          let itemBg = 'hover:bg-slate-900/60';

          if (step.status === 'completed') {
            badge = (
              <div className="w-4 h-4 rounded-full bg-emerald-500/15 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
                <Check className="w-2.5 h-2.5 stroke-[2.5]" />
              </div>
            );
            textColor = 'text-slate-300';
          } else if (step.status === 'in_progress') {
            badge = (
              <div className="w-4 h-4 rounded-full bg-sky-500/20 border border-sky-400 flex items-center justify-center text-sky-400 animate-spin shrink-0">
                <Loader2 className="w-2.5 h-2.5 stroke-[2.5]" />
              </div>
            );
            textColor = 'text-sky-300 font-semibold';
            itemBg = 'bg-sky-500/5 border border-sky-500/20';
          } else if (step.status === 'failed') {
            badge = (
              <div className="w-4 h-4 rounded-full bg-rose-500/20 border border-rose-500 flex items-center justify-center text-rose-400 shrink-0">
                <AlertCircle className="w-2.5 h-2.5 stroke-[2.5]" />
              </div>
            );
            textColor = 'text-rose-300';
          }

          return (
            <React.Fragment key={step.stepNumber}>
              <div
                className={`flex items-center gap-1.5 px-2 py-0.5 rounded-md transition-all shrink-0 cursor-default ${itemBg}`}
                title={step.summary ? `${step.title}: ${step.summary}` : step.title}
              >
                {badge}
                <div className="flex flex-col">
                  <span className={`text-[11px] whitespace-nowrap ${textColor}`}>
                    {step.title}
                  </span>
                  {step.summary && (
                    <span className="text-[9px] text-slate-500 max-w-[125px] truncate hidden sm:block">
                      {step.summary}
                    </span>
                  )}
                </div>
              </div>

              {!isLast && (
                <div className="h-[1px] w-3 bg-slate-800 shrink-0 hidden md:block" />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};
