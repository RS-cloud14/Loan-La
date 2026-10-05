'use client';

import React, { useState, useEffect } from 'react';
import { UploadCloud, Building2, CheckCircle, ArrowRight, ShieldCheck } from 'lucide-react';
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

  // Auto cycle smoothly between 1, 2, 3 every 3.5s
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % 3);
    }, 3500);
    return () => clearInterval(timer);
  }, []);

  const steps = [
    {
      num: '1',
      title: language === 'bm' ? 'Muat Naik Penyata' : 'Upload Statement',
      desc: language === 'bm' ? 'Audit aliran tunai PDF tanpa slip gaji' : 'Audit PDF cashflow without payslips',
      action: onStartAssessment,
      visual: (isActive: boolean) => (
        <div className="w-full h-20 bg-zinc-50 rounded-xl border border-zinc-200/80 p-2.5 flex flex-col justify-between overflow-hidden relative">
          {/* Subtle scanning bar animation */}
          {isActive && (
            <div className="absolute inset-x-0 h-0.5 bg-black top-0 animate-[bounce_2s_infinite]" />
          )}
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-mono font-bold text-zinc-900">statement.pdf</span>
            <span className="text-[10px] font-mono text-zinc-400">PDF</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-black">+RM 4,250</span>
            <span className="text-[10px] font-bold bg-black text-white px-1.5 py-0.5 rounded">
              DSR 28%
            </span>
          </div>
        </div>
      )
    },
    {
      num: '2',
      title: language === 'bm' ? 'Padanan Pintar' : 'Smart Match',
      desc: language === 'bm' ? '18 bank & dana mikro berlesen' : '18 licensed banks & micro funds',
      action: onExploreDirectory,
      visual: (isActive: boolean) => (
        <div className="w-full h-20 bg-zinc-50 rounded-xl border border-zinc-200/80 p-2.5 flex flex-col justify-between overflow-hidden relative">
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-bold text-black">Maybank · GXBank · BSN</span>
            <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-black animate-ping' : 'bg-zinc-300'}`} />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-zinc-600">Best Rate: 4.0%</span>
            <span className="text-[10px] font-bold bg-zinc-200 text-black px-1.5 py-0.5 rounded">
              98% Match
            </span>
          </div>
        </div>
      )
    },
    {
      num: '3',
      title: language === 'bm' ? 'Mohon & Lulus' : 'Get Approved',
      desc: language === 'bm' ? 'Pasport kredit rasmi ke portal bank' : 'Certified credit passport to bank portal',
      action: onStartPrecheck,
      visual: (isActive: boolean) => (
        <div className="w-full h-20 bg-zinc-50 rounded-xl border border-zinc-200/80 p-2.5 flex flex-col justify-between overflow-hidden relative">
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-bold text-black">Credit Passport™</span>
            <span className="text-[10px] font-mono text-black font-bold">BNM QR</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-zinc-600">RM 50,000</span>
            <span className="text-[10px] font-bold bg-black text-white px-1.5 py-0.5 rounded flex items-center gap-1">
              ✓ Ready
            </span>
          </div>
        </div>
      )
    }
  ];

  return (
    <div className="w-full my-2">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        {steps.map((step, idx) => {
          const isActive = activeStep === idx;
          return (
            <div
              key={step.num}
              onClick={() => {
                setActiveStep(idx);
                step.action();
              }}
              className={`bg-white rounded-2xl p-4 sm:p-5 border transition-all cursor-pointer flex flex-col justify-between gap-3 text-left relative overflow-hidden group ${
                isActive 
                  ? 'border-black shadow-md ring-1 ring-black' 
                  : 'border-zinc-200 hover:border-zinc-400'
              }`}
            >
              {/* Minimal Progress Bar on active step */}
              {isActive && (
                <div className="absolute top-0 left-0 right-0 h-1 bg-black animate-[pulse_2s_infinite]" />
              )}

              {/* Step Header */}
              <div className="flex items-center justify-between">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black transition-colors ${
                  isActive ? 'bg-black text-white' : 'bg-zinc-100 text-zinc-700 group-hover:bg-zinc-200'
                }`}>
                  {step.num}
                </span>

                <div className="flex items-center text-xs font-bold text-zinc-400 group-hover:text-black transition-colors">
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>

              {/* Minimal Black & White Animated Micro-Visual */}
              {step.visual(isActive)}

              {/* Minimal Typography: Title & Short Subtitle */}
              <div>
                <h4 className="text-sm font-black text-black tracking-tight">
                  {step.title}
                </h4>
                <p className="text-xs text-zinc-500 font-normal mt-0.5 leading-snug">
                  {step.desc}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
