'use client';

import React, { useState, useEffect } from 'react';
import { 
  FileCheck2, Building2, Award, ArrowRight, ShieldCheck, Sparkles, 
  CheckCircle2, ArrowUpRight, TrendingUp, Zap, FileSpreadsheet, Lock, ChevronRight
} from 'lucide-react';
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
  const { language, t } = useLanguage();
  const [activeStep, setActiveStep] = useState<number>(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState<boolean>(true);

  // Auto cycle through steps every 4.5 seconds if user is not actively interacting
  useEffect(() => {
    if (!isAutoPlaying) return;
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % 3);
    }, 4500);
    return () => clearInterval(interval);
  }, [isAutoPlaying]);

  const steps = [
    {
      id: 0,
      stepNumber: '01',
      title: language === 'bm' ? 'Sahkan Pendapatan Gig & Alternatif' : 'Verify Alternative Income',
      desc: language === 'bm' 
        ? 'Audit penyata bank atau platform gig. Kira DSR selamat tanpa slip gaji tradisional.'
        : 'Audit bank or gig statements. Calculate safe DSR limits automatically without payslips.',
      actionLabel: language === 'bm' ? 'Semak Skor Pendapatan' : 'Check Income Score',
      onAction: onStartAssessment,
      badge: language === 'bm' ? 'Audit DSR Segera' : 'Instant DSR Audit',
      color: 'blue'
    },
    {
      id: 1,
      stepNumber: '02',
      title: language === 'bm' ? 'Padanan Pintar 18+ Bank' : 'Smart Bank Matching',
      desc: language === 'bm'
        ? 'Bandingkan kadar subsidi & bank digital (GXBank, Boost, BSN, TEKUN) yang sesuai profil tunai anda.'
        : 'Match with 18+ licensed banks & digital lenders that accept non-traditional cashflow profiles.',
      actionLabel: language === 'bm' ? 'Lihat Padanan Bank' : 'Explore Matched Banks',
      onAction: onExploreDirectory,
      badge: language === 'bm' ? 'Kadar Terkini 2026' : 'Live 2026 Rates',
      color: 'emerald'
    },
    {
      id: 2,
      stepNumber: '03',
      title: language === 'bm' ? 'Kit Permohonan Berperakuan' : 'Certified Application Kit',
      desc: language === 'bm'
        ? 'Jana Pasport Kredit rasmi dengan cap pengesahan & mohon terus ke portal rasmi bank.'
        : 'Generate your official Credit Passport PDF & apply with confidence directly via bank portals.',
      actionLabel: language === 'bm' ? 'Mulakan Pra-Kelayakan' : 'Start Guided Pre-Check',
      onAction: onStartPrecheck,
      badge: language === 'bm' ? 'Pasport Patuh Bank' : 'Bank-Compliant Passport',
      color: 'indigo'
    }
  ];

  return (
    <div 
      className="w-full bg-gradient-to-b from-white via-slate-50/60 to-white rounded-3xl border border-slate-200/90 p-5 sm:p-7 shadow-sm transition-all"
      onMouseEnter={() => setIsAutoPlaying(false)}
      onMouseLeave={() => setIsAutoPlaying(true)}
    >
      {/* Top Header & Interactive Stepper Track */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-5 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-blue-50 text-blue-900 border border-blue-200/60 flex items-center gap-1">
              <Zap className="w-3 h-3 text-blue-600" />
              {language === 'bm' ? 'Aliran Pintar CreditFlow' : 'CreditFlow Smart Workflow'}
            </span>
            <span className="text-[11px] text-slate-600 font-bold hidden sm:inline">
              {language === 'bm' ? '3 Langkah Mudah Tanpa Slip Gaji' : '3 Simple Steps Without Payslips'}
            </span>
          </div>
          <h3 className="text-lg sm:text-xl font-black text-blue-950 tracking-tight">
            {language === 'bm' ? 'Bagaimana Anda Mendapat Kelulusan Pinjaman' : 'How You Get Matched & Approved'}
          </h3>
        </div>

        {/* Step Progress Indicators */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {steps.map((s, idx) => (
            <button
              key={s.id}
              onClick={() => {
                setActiveStep(idx);
                setIsAutoPlaying(false);
              }}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeStep === idx 
                  ? 'bg-blue-950 text-white shadow-xs scale-102' 
                  : 'bg-slate-100 hover:bg-slate-200/70 text-slate-600'
              }`}
            >
              <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-black ${
                activeStep === idx ? 'bg-blue-400 text-blue-950' : 'bg-slate-300 text-slate-700'
              }`}>
                {idx + 1}
              </span>
              <span className="hidden md:inline text-[11px] font-extrabold">
                {idx === 0 ? (language === 'bm' ? 'Audit' : 'Verify') : idx === 1 ? (language === 'bm' ? 'Padan' : 'Match') : (language === 'bm' ? 'Pasport' : 'Apply')}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Interactive Stage: 2-Column Split (Animated Visual Simulation + Interactive Step Cards) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        
        {/* Left Column (5 Cols): Real-time Animated Simulation Stage */}
        <div className="lg:col-span-5 w-full bg-slate-950 rounded-2xl p-5 text-white shadow-xl border border-slate-800 relative overflow-hidden flex flex-col justify-between min-h-[260px]">
          
          {/* Subtle Ambient Background Mesh */}
          <div className="absolute -top-16 -right-16 w-48 h-48 bg-blue-500/15 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-emerald-500/15 rounded-full blur-2xl pointer-events-none" />

          {/* Top Simulation Header */}
          <div className="flex items-center justify-between relative z-10 border-b border-slate-800/80 pb-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[11px] font-mono tracking-wider text-slate-300 uppercase">
                {activeStep === 0 && (language === 'bm' ? 'AI INFLOW AUDIT ENGINE' : 'AI INFLOW AUDIT ENGINE')}
                {activeStep === 1 && (language === 'bm' ? '18-BANK COMPATIBILITY RADAR' : '18-BANK COMPATIBILITY RADAR')}
                {activeStep === 2 && (language === 'bm' ? 'CREDIT PASSPORT PACKAGER' : 'CREDIT PASSPORT PACKAGER')}
              </span>
            </div>
            <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/70 border border-cyan-800/80 px-2 py-0.5 rounded-full">
              LIVE SIMULATION
            </span>
          </div>

          {/* Middle Animated Dynamic Canvas */}
          <div className="py-4 relative z-10">
            {activeStep === 0 && (
              <div className="flex flex-col gap-3 animate-fade-in">
                {/* Simulated File Scanner Beam */}
                <div className="relative bg-slate-900 border border-slate-800 rounded-xl p-3.5 overflow-hidden">
                  <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent top-0 animate-[pulse_2s_infinite]" />
                  <div className="flex items-center justify-between mb-2 text-xs">
                    <div className="flex items-center gap-2">
                      <FileSpreadsheet className="w-4 h-4 text-cyan-400" />
                      <span className="font-semibold text-slate-200">Maybank_Statement_6M.pdf</span>
                    </div>
                    <span className="text-[10px] text-emerald-400 font-mono font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> AUDITED
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-slate-950/80 p-2 rounded-lg border border-slate-800/90">
                      <span className="text-[10px] text-slate-400 block uppercase font-mono">Avg Monthly Inflow</span>
                      <span className="text-emerald-400 font-black text-sm font-mono">+RM 4,280.00</span>
                    </div>
                    <div className="bg-slate-950/80 p-2 rounded-lg border border-slate-800/90">
                      <span className="text-[10px] text-slate-400 block uppercase font-mono">Calculated DSR</span>
                      <span className="text-cyan-300 font-black text-sm font-mono">28.4% (Safe)</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
                  <span>✓ 0 Payslips Needed</span>
                  <span>✓ 100% Data Masked</span>
                  <span className="text-emerald-400 font-semibold">Tier 1 Approved</span>
                </div>
              </div>
            )}

            {activeStep === 1 && (
              <div className="flex flex-col gap-2.5 animate-fade-in">
                {/* Bank Match Visual List */}
                <div className="space-y-2">
                  <div className="bg-slate-900/90 border border-emerald-500/40 p-2.5 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-6 h-6 rounded-md bg-emerald-500/20 text-emerald-300 flex items-center justify-center font-bold text-xs">
                        GX
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-100 block">GXBank Digital Flexi</span>
                        <span className="text-[10px] text-slate-400">10-Min Fast Disbursement</span>
                      </div>
                    </div>
                    <span className="px-2 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-lg text-[10px] font-mono font-bold">
                      98% MATCH
                    </span>
                  </div>

                  <div className="bg-slate-900/90 border border-slate-800 p-2.5 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-6 h-6 rounded-md bg-blue-500/20 text-blue-300 flex items-center justify-center font-bold text-xs">
                        BSN
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-100 block">BSN MicroKredit Madani</span>
                        <span className="text-[10px] text-slate-400">4.0% Subsidized Gov Rate</span>
                      </div>
                    </div>
                    <span className="px-2 py-1 bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded-lg text-[10px] font-mono font-bold">
                      94% MATCH
                    </span>
                  </div>
                </div>
                <div className="text-[11px] text-slate-400 text-center pt-1 font-mono">
                  18 institutions filtered against your verified RM 4,280 cashflow
                </div>
              </div>
            )}

            {activeStep === 2 && (
              <div className="flex flex-col gap-3 animate-fade-in">
                {/* Official Passport Preview */}
                <div className="bg-gradient-to-br from-indigo-950/80 via-slate-900 to-slate-950 border border-indigo-500/40 rounded-xl p-3.5">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-indigo-400" />
                      <span className="text-xs font-bold text-slate-100">CreditFlow Passport™</span>
                    </div>
                    <span className="text-[10px] font-mono text-indigo-300 bg-indigo-500/20 px-2 py-0.5 rounded-md font-bold">
                      CERTIFIED PDF
                    </span>
                  </div>
                  <div className="p-2.5 bg-slate-950/70 rounded-lg border border-slate-800 text-[11px] space-y-1">
                    <div className="flex justify-between text-slate-300">
                      <span>Certified Capacity:</span>
                      <span className="font-bold text-emerald-400">RM 30,000 – RM 50,000</span>
                    </div>
                    <div className="flex justify-between text-slate-300">
                      <span>Bank Verification QR:</span>
                      <span className="font-mono text-cyan-400">BNM-COMPLIANT #8839</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
                  <span>✓ 1-Click Submission</span>
                  <span>✓ Zero Broker Fees</span>
                  <span className="text-cyan-400 font-semibold">Direct to Bank Portal</span>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Simulation Action Trigger */}
          <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between relative z-10">
            <span className="text-[10px] text-slate-400 font-mono">
              STEP {activeStep + 1} OF 3
            </span>
            <button
              onClick={steps[activeStep].onAction}
              className="px-3.5 py-1.5 bg-white hover:bg-slate-100 text-slate-950 text-xs font-black rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shadow-md active:scale-95"
            >
              <span>{steps[activeStep].actionLabel}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>

        {/* Right Column (7 Cols): 3 Sleek Step Panels (Clickable to switch simulation) */}
        <div className="lg:col-span-7 flex flex-col gap-3">
          {steps.map((step, idx) => {
            const isSelected = activeStep === idx;
            return (
              <div
                key={step.id}
                onClick={() => {
                  setActiveStep(idx);
                  setIsAutoPlaying(false);
                }}
                className={`p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden text-left ${
                  isSelected
                    ? 'bg-blue-50/50 border-blue-900/40 shadow-xs ring-1 ring-blue-900/20'
                    : 'bg-white hover:bg-slate-50/80 border-slate-200'
                }`}
              >
                {/* Active Indicator Bar on Left */}
                {isSelected && (
                  <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-blue-950 rounded-r-md" />
                )}

                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    {/* Number Badge */}
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black shrink-0 transition-colors ${
                      isSelected ? 'bg-blue-950 text-white' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {step.stepNumber}
                    </div>

                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className={`text-sm font-black transition-colors ${
                          isSelected ? 'text-blue-950' : 'text-slate-800'
                        }`}>
                          {step.title}
                        </h4>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                          isSelected ? 'bg-blue-100 text-blue-900' : 'bg-slate-100 text-slate-500'
                        }`}>
                          {step.badge}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed font-normal max-w-xl">
                        {step.desc}
                      </p>
                    </div>
                  </div>

                  {/* Arrow Action on Right */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      step.onAction();
                    }}
                    className={`shrink-0 p-2 rounded-xl transition-all cursor-pointer ${
                      isSelected 
                        ? 'bg-blue-950 text-white hover:bg-blue-900' 
                        : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                    }`}
                    title={step.actionLabel}
                  >
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}
