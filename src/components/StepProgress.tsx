"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";

interface StepProgressProps {
  currentStep: number;
  totalSteps: number;
  steps: string[];
}

export function StepProgress({ currentStep, totalSteps, steps }: StepProgressProps) {
  return (
    <div className="w-full mb-8">
      <div className="flex items-center justify-between relative px-2">
        {/* Connection Lines */}
        <div className="absolute top-1/2 left-0 w-full h-[2px] bg-slate-800 -translate-y-1/2 z-0" />
        <motion.div 
          className="absolute top-1/2 left-0 h-[2px] bg-sky-500 -translate-y-1/2 z-0"
          initial={{ width: "0%" }}
          animate={{ width: `${((currentStep - 1) / (totalSteps - 1)) * 100}%` }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
        />

        {/* Steps */}
        {steps.map((step, index) => {
          const stepNum = index + 1;
          const isActive = stepNum === currentStep;
          const isCompleted = stepNum < currentStep;

          return (
            <div key={index} className="relative z-10 flex flex-col items-center">
              <motion.div
                className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors duration-300 ${
                  isActive 
                    ? "bg-slate-900 border-sky-500 text-sky-400 shadow-[0_0_15px_rgba(14,165,233,0.3)]" 
                    : isCompleted 
                      ? "bg-sky-500 border-sky-500 text-slate-950" 
                      : "bg-slate-900 border-slate-800 text-slate-500"
                }`}
                initial={false}
                animate={{
                  scale: isActive ? 1.2 : 1,
                }}
              >
                {isCompleted ? (
                   <Check className="w-5 h-5 stroke-[3px]" />
                ) : (
                  <span className="text-xs font-bold">{stepNum}</span>
                )}
              </motion.div>
              <span className={`absolute top-10 text-[10px] whitespace-nowrap font-bold uppercase tracking-wider transition-colors duration-300 ${isActive ? "text-sky-400" : "text-slate-500"}`}>
                {step}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
