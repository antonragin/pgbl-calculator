"use client";

import React from "react";

interface StepperProps {
  steps: { label: string; icon: React.ReactNode }[];
  currentStep: number;
  onStepClick: (step: number) => void;
}

export default function Stepper({ steps, currentStep, onStepClick }: StepperProps) {
  return (
    <div className="flex items-center justify-center gap-1 sm:gap-2">
      {steps.map((step, i) => {
        const isActive = i === currentStep;
        const isDone = i < currentStep;

        return (
          <React.Fragment key={step.label}>
            {i > 0 && (
              <div
                className={`h-0.5 w-6 sm:w-10 transition-colors ${
                  isDone ? "bg-primary-500" : "bg-gray-200"
                }`}
              />
            )}
            <button
              onClick={() => onStepClick(i)}
              aria-current={isActive ? "step" : undefined}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium
                transition-all sm:text-sm ${
                  isActive
                    ? "bg-primary-100 text-primary-700 ring-2 ring-primary-500/30"
                    : isDone
                    ? "bg-primary-50 text-primary-600"
                    : "bg-gray-100 text-gray-400"
                }`}
            >
              <span className="hidden sm:inline">{step.icon}</span>
              <span>{step.label}</span>
              {isDone && (
                <svg aria-hidden="true" className="h-3.5 w-3.5 text-primary-500" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </button>
          </React.Fragment>
        );
      })}
    </div>
  );
}
