'use client';

import React, { useState, useEffect } from 'react';
import { UploadCloud, Building2, ShieldCheck, ArrowRight, Sparkles } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

interface AnimatedCapabilityFlowProps {
  onStartAssessment: () => void;
  onExploreDirectory: () => void;
  onStartPrecheck: () => void;
}

export default function AnimatedCapabilityFlow({
  onStartAssessment,
  onExploreDirectory,
  onStartPrecheck
}: AnimatedCapabilityFlowProps) {
  const { language } = useLanguage();
  const [activeStep, setActiveStep] = useState<number>(0);

  // Smooth, high-level auto-cycle every 3.5s
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % 3);
    }, 3500);
    return () => clearInterval(timer);
  }, []);

  const steps = [
    {
      num: '01',
      title: language === 'bm' ? '1. Muat Naik Penyata' : '1. Upload Statement',
      subtitle: language === 'bm' ? 'Penyata Bank / Gig PDF' : 'Bank, Grab or Shopee PDF',
      action: onStartAssessment,
      icon: UploadCloud
    },
    {
      num: '02',
      title: language === 'bm' ? '2. Padanan Pintar Bank' : '2. Smart Bank Match',
      subtitle: language === 'bm' ? '18 Bank & Dana Berlesen' : '18 Licensed Malaysian Banks',
      action: onExploreDirectory,
      icon: Building2
    },
    {
      num: '03',
      title: language === 'bm' ? '3. Kelulusan Terus' : '3. Direct Approval',
      subtitle: language === 'bm' ? 'Rasmi & Tanpa Broker' : 'Official Portal & 0 Broker Fees',
      action: onStartPrecheck,
      icon: ShieldCheck
    }
  ];

  return (
    <div className="w-full max-w-4xl mx-auto my-3">
      {/* High-Level Connected 3-Step Flow */}
      <div className="bg-white/95 backdrop-blur-md rounded-3xl border border-slate-200/90 shadow-sm p-3.5 sm:p-5 relative overflow-hidden">
        
        {/* Subtle background ambient beam */}
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-900/10 via-blue-950/20 to-blue-900/10" />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 relative">
          
          {steps.map((step, idx) => {
            const isActive = activeStep === idx;
            const IconComponent = step.icon;

            return (
              <div
                key={step.num}
                onClick={() => {
                  setActiveStep(idx);
                  step.action();
                }}
                className={`relative rounded-2xl p-4 sm:p-4.5 transition-all duration-300 cursor-pointer flex items-center gap-3.5 text-left group ${
                  isActive
                    ? 'bg-blue-50/70 border border-blue-900/30 shadow-xs scale-[1.01]'
                    : 'bg-slate-50/50 hover:bg-slate-100/70 border border-slate-200/60'
                }`}
              >
                {/* Active Indicator Top Light Bar */}
                {isActive && (
                  <div className="absolute top-0 left-4 right-4 h-0.5 bg-blue-950 rounded-full animate-pulse" />
                )}

                {/* Animated Icon Avatar */}
                <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 transition-all duration-300 relative ${
                  isActive
                    ? 'bg-blue-950 text-white shadow-md shadow-blue-950/20 scale-105'
                    : 'bg-white text-slate-700 border border-slate-200 group-hover:border-slate-300 group-hover:text-blue-950'
                }`}>
                  <IconComponent className={`w-5 h-5 transition-transform duration-300 ${
                    isActive ? 'scale-110 animate-[pulse_2s_infinite]' : 'group-hover:scale-105'
                  }`} />
                  
                  {/* Small Animated Pulse Dot */}
                  {isActive && (
                    <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-600" />
                    </span>
                  )}
                </div>

                {/* Content: Clean, High-Contrast Typography */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <h4 className={`text-xs sm:text-sm font-black tracking-tight truncate transition-colors ${
                      isActive ? 'text-blue-950' : 'text-slate-800 group-hover:text-blue-950'
                    }`}>
                      {step.title}
                    </h4>
                    <ArrowRight className={`w-3.5 h-3.5 shrink-0 transition-all ${
                      isActive 
                        ? 'text-blue-950 translate-x-0.5' 
                        : 'text-slate-300 opacity-0 group-hover:opacity-100 group-hover:text-slate-600'
                    }`} />
                  </div>
                  <p className="text-[11px] text-slate-500 font-medium truncate mt-0.5">
                    {step.subtitle}
                  </p>
                </div>
              </div>
            );
          })}

        </div>

        {/* Minimal Footer Progress Bar: Smoothly tracks active step */}
        <div className="flex items-center justify-center gap-1.5 mt-3 pt-2">
          {steps.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setActiveStep(idx)}
              className={`h-1 rounded-full transition-all duration-300 cursor-pointer ${
                activeStep === idx 
                  ? 'w-7 bg-blue-950' 
                  : 'w-2 bg-slate-200 hover:bg-slate-300'
              }`}
              title={`Step ${idx + 1}`}
            />
          ))}
        </div>

      </div>
    </div>
  );
}
