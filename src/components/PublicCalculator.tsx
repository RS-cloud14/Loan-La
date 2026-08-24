'use client';

import React, { useState, useEffect } from 'react';
import { ArrowRight, FileCheck } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

interface PublicCalculatorProps {
  initialLoanAmount?: number;
  initialTenureYears?: number;
  initialInterestRate?: number;
  onStartAudit: (initialData?: { loanAmount: number; loanPurpose: string; monthlyIncome: number }) => void;
}

export default function PublicCalculator({ 
  initialLoanAmount = 5000, 
  initialTenureYears = 1, 
  initialInterestRate = 6.0,
  onStartAudit 
}: PublicCalculatorProps) {
  const { language, t } = useLanguage();
  const [loanAmount, setLoanAmount] = useState<number>(initialLoanAmount);
  const [tenureYears, setTenureYears] = useState<number>(initialTenureYears);
  const [interestRate, setInterestRate] = useState<number>(initialInterestRate);

  useEffect(() => {
    if (initialLoanAmount) setLoanAmount(initialLoanAmount);
  }, [initialLoanAmount]);

  useEffect(() => {
    if (initialTenureYears) setTenureYears(initialTenureYears);
  }, [initialTenureYears]);

  useEffect(() => {
    if (initialInterestRate !== undefined && initialInterestRate > 0) setInterestRate(initialInterestRate);
  }, [initialInterestRate]);

  const tenureMonths = Math.max(1, Math.round(tenureYears * 12));

  // Financial calculations
  const totalInterest = loanAmount * (interestRate / 100) * tenureYears;
  const totalRepayment = loanAmount + totalInterest;
  const monthlyInstallment = Math.round(totalRepayment / tenureMonths);

  const formatTenureDisplay = (years: number) => {
    if (years === 0.5) return language === 'bm' ? '6 Bulan' : '6 Months';
    if (years === 1) return language === 'bm' ? '1 Tahun' : '1 Year';
    return `${years} ${language === 'bm' ? 'Tahun' : 'Years'}`;
  };

  // Reusable Monitor Card component
  const MonitorCard = (
    <div className="bg-slate-950 text-white p-5 sm:p-6 rounded-3xl flex flex-col items-center text-center gap-3.5 shadow-xl border border-slate-800 w-full">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
        {t.monthlyRepaymentLabel}
      </span>
      <div className="text-4xl sm:text-5xl font-black text-white tracking-tight">
        RM {monthlyInstallment.toLocaleString()}
        <span className="text-sm font-medium text-slate-400"> {language === 'bm' ? '/ bulan' : '/ month'}</span>
      </div>

      {/* 4 Key Metrics */}
      <div className="grid grid-cols-2 gap-2 w-full pt-3 mt-1 border-t border-slate-800/80 text-xs">
        <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800 text-left">
          <span className="text-[10px] text-slate-400 block">{language === 'bm' ? 'Pinjaman Pokok' : 'Principal Loan'}</span>
          <span className="font-bold text-white mt-0.5 block text-sm">RM {loanAmount.toLocaleString()}</span>
        </div>

        <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800 text-left">
          <span className="text-[10px] text-slate-400 block">{language === 'bm' ? 'Tempoh Bayaran' : 'Tenure'}</span>
          <span className="font-bold text-white mt-0.5 block text-sm">{formatTenureDisplay(tenureYears)}</span>
        </div>

        <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800 text-left">
          <span className="text-[10px] text-slate-400 block">{language === 'bm' ? 'Jumlah Faedah' : 'Total Interest'}</span>
          <span className="font-bold text-white mt-0.5 block text-sm">RM {Math.round(totalInterest).toLocaleString()}</span>
        </div>

        <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800 text-left">
          <span className="text-[10px] text-slate-400 block">{language === 'bm' ? 'Kadar Tahunan' : 'Interest Rate'}</span>
          <span className="font-bold text-white mt-0.5 block text-sm">{interestRate.toFixed(2)}% p.a.</span>
        </div>
      </div>

      <div className="text-[11px] text-slate-400 pt-0.5">
        {t.totalRepaymentLabel}: <strong className="text-white">RM {Math.round(totalRepayment).toLocaleString()}</strong>
      </div>
    </div>
  );

  // Reusable Advisory & CTA Button
  const AdvisoryAndCTA = (
    <div className="flex flex-col gap-3.5 w-full">
      <div className="p-4 bg-white border border-slate-200 rounded-2xl flex items-start gap-3 text-xs shadow-xs">
        <div className="p-2 bg-slate-900 text-white rounded-xl shrink-0 mt-0.5">
          <FileCheck className="w-4 h-4" />
        </div>
        <div>
          <h4 className="font-bold text-slate-900 text-xs sm:text-sm">
            {language === 'bm' ? 'Penilaian Pra-Kelayakan Diperibadikan' : 'Personalized Pre-Screening & Eligibility'}
          </h4>
          <p className="text-slate-500 text-[11px] mt-0.5 leading-relaxed">
            {language === 'bm'
              ? 'Jalankan semakan aliran tunai pintar untuk mengesahkan kelayakan pinjaman berasaskan penyata bank sebenar anda & dapatkan padanan bank digital secara terus.'
              : 'Run our customized underwriting pre-check to assess your true debt-service ratio (DSR) and get pre-matched with licensed digital banks.'}
          </p>
        </div>
      </div>

      <button
        onClick={() => onStartAudit({ loanAmount, loanPurpose: 'personal_cash', monthlyIncome: 3000 })}
        className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
      >
        <span>{language === 'bm' ? 'Semak Laporan Kelayakan Pinjaman' : 'Check Loan Eligibility Report'}</span>
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );

  return (
    <div className="w-full flex flex-col items-center gap-6 animate-fade-in max-w-5xl mx-auto py-2">
      
      {/* Top Header */}
      <div className="text-center w-full">
        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          {language === 'bm' ? 'Kalkulator Pembiayaan & Ansuran Pinjaman' : 'Loan Repayment & Financing Calculator'}
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          {language === 'bm' 
            ? 'Anggarkan bayaran ansuran bulanan, tempoh bayaran, dan kadar faedah sebelum memohon.' 
            : 'Simulate your estimated monthly installments, tenure, and competitive interest rates.'}
        </p>
      </div>

      {/* Main Container: Split on Desktop (lg), Stacked on Mobile */}
      <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* DESKTOP LEFT COLUMN (lg:col-span-5): Sticky Monitor + Advisory + CTA */}
        <div className="hidden lg:flex lg:col-span-5 flex-col gap-4 sticky top-24">
          {MonitorCard}
          {AdvisoryAndCTA}
        </div>

        {/* MOBILE ONLY: Monitor at Top */}
        <div className="lg:hidden w-full">
          {MonitorCard}
        </div>

        {/* RIGHT COLUMN (or Middle on Mobile): COMPACT CONTROLS */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200 shadow-md p-5 sm:p-6 flex flex-col gap-4.5 w-full">
          
          {/* 1. LOAN AMOUNT */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                {t.loanAmountLabel}
              </label>
              <span className="text-xs font-semibold text-slate-400">
                RM 1,000 – RM 100,000
              </span>
            </div>

            {/* Compact Steppers + Input */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setLoanAmount(prev => Math.max(1000, prev - 500))}
                aria-label="Decrease amount"
                className="w-10 h-10 flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-lg rounded-xl border border-slate-200 transition-all active:scale-95 shrink-0 cursor-pointer"
              >
                −
              </button>

              <div className="relative flex-1">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 select-none">
                  RM
                </span>
                <input
                  type="number"
                  min={1000}
                  max={100000}
                  step={500}
                  value={loanAmount || ''}
                  onChange={(e) => {
                    const val = e.target.value === '' ? 0 : Number(e.target.value);
                    setLoanAmount(val);
                  }}
                  onBlur={() => {
                    if (loanAmount < 1000) setLoanAmount(1000);
                    if (loanAmount > 100000) setLoanAmount(100000);
                  }}
                  className="w-full pl-10 pr-3.5 py-2 bg-slate-50 hover:bg-slate-100/80 focus:bg-white border border-slate-200 focus:border-slate-800 rounded-xl text-lg font-bold text-slate-900 outline-hidden transition-all text-right shadow-2xs"
                  placeholder="5,000"
                />
              </div>

              <button
                type="button"
                onClick={() => setLoanAmount(prev => Math.min(100000, prev + 500))}
                aria-label="Increase amount"
                className="w-10 h-10 flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-lg rounded-xl border border-slate-200 transition-all active:scale-95 shrink-0 cursor-pointer"
              >
                +
              </button>
            </div>

            {/* Quick Presets */}
            <div className="grid grid-cols-4 gap-1.5 pt-0.5">
              {[3000, 5000, 10000, 20000].map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setLoanAmount(amt)}
                  className={`py-1.5 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                    loanAmount === amt
                      ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  RM {(amt / 1000)}k
                </button>
              ))}
            </div>
          </div>

          {/* 2. REPAYMENT TENURE IN YEARS */}
          <div className="flex flex-col gap-2 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                {language === 'bm' ? 'Tempoh Pembayaran (Tahun)' : 'Tenure (Years)'}
              </label>
              <span className="text-xs font-semibold text-slate-400">
                {tenureYears >= 1 ? `${tenureYears * 12} ${language === 'bm' ? 'Bulan' : 'Months'}` : '6 Bulan'}
              </span>
            </div>

            {/* Compact Steppers + Input */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setTenureYears(prev => Math.max(0.5, prev <= 1 ? +(prev - 0.5).toFixed(1) : prev - 1))}
                aria-label="Decrease years"
                className="w-10 h-10 flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-lg rounded-xl border border-slate-200 transition-all active:scale-95 shrink-0 cursor-pointer"
              >
                −
              </button>

              <div className="relative flex-1">
                <input
                  type="number"
                  min={0.5}
                  max={10}
                  step={0.5}
                  value={tenureYears || ''}
                  onChange={(e) => {
                    const val = e.target.value === '' ? 0 : Number(e.target.value);
                    setTenureYears(val);
                  }}
                  onBlur={() => {
                    if (tenureYears < 0.5) setTenureYears(0.5);
                    if (tenureYears > 10) setTenureYears(10);
                  }}
                  className="w-full px-3.5 py-2 bg-slate-50 hover:bg-slate-100/80 focus:bg-white border border-slate-200 focus:border-slate-800 rounded-xl text-lg font-bold text-slate-900 outline-hidden transition-all text-center shadow-2xs"
                  placeholder="1"
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 select-none pointer-events-none">
                  {language === 'bm' ? (tenureYears > 1 ? 'Tahun' : 'Tahun') : (tenureYears > 1 ? 'Years' : 'Year')}
                </span>
              </div>

              <button
                type="button"
                onClick={() => setTenureYears(prev => Math.min(10, prev < 1 ? +(prev + 0.5).toFixed(1) : prev + 1))}
                aria-label="Increase years"
                className="w-10 h-10 flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-lg rounded-xl border border-slate-200 transition-all active:scale-95 shrink-0 cursor-pointer"
              >
                +
              </button>
            </div>

            {/* Quick Presets */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 pt-0.5">
              {[
                { y: 0.5, label: language === 'bm' ? '6 Bulan' : '6 Mos' },
                { y: 1, label: language === 'bm' ? '1 Tahun' : '1 Year' },
                { y: 2, label: language === 'bm' ? '2 Tahun' : '2 Years' },
                { y: 3, label: language === 'bm' ? '3 Tahun' : '3 Years' },
                { y: 5, label: language === 'bm' ? '5 Tahun' : '5 Years' },
              ].map((preset) => (
                <button
                  key={preset.y}
                  type="button"
                  onClick={() => setTenureYears(preset.y)}
                  className={`py-1.5 px-1.5 text-xs font-semibold rounded-lg border transition-all cursor-pointer text-center ${
                    tenureYears === preset.y
                      ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* 3. INTEREST RATE (% P.A.) */}
          <div className="flex flex-col gap-2 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                {language === 'bm' ? 'Kadar Faedah (% Setahun)' : 'Interest Rate (% p.a.)'}
              </label>
              <span className="text-xs font-semibold text-slate-400">
                1.0% – 24.0% p.a.
              </span>
            </div>

            {/* Compact Steppers + Input */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setInterestRate(prev => Math.max(1.0, +(prev - 0.5).toFixed(2)))}
                aria-label="Decrease interest rate"
                className="w-10 h-10 flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-lg rounded-xl border border-slate-200 transition-all active:scale-95 shrink-0 cursor-pointer"
              >
                −
              </button>

              <div className="relative flex-1">
                <input
                  type="number"
                  min={1.0}
                  max={24.0}
                  step={0.01}
                  value={interestRate || ''}
                  onChange={(e) => {
                    const val = e.target.value === '' ? 0 : Number(e.target.value);
                    setInterestRate(val);
                  }}
                  onBlur={() => {
                    if (interestRate < 1.0) setInterestRate(1.0);
                    if (interestRate > 24.0) setInterestRate(24.0);
                  }}
                  className="w-full px-3.5 py-2 bg-slate-50 hover:bg-slate-100/80 focus:bg-white border border-slate-200 focus:border-slate-800 rounded-xl text-lg font-bold text-slate-900 outline-hidden transition-all text-center shadow-2xs"
                  placeholder="6.00"
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 select-none pointer-events-none">
                  % p.a.
                </span>
              </div>

              <button
                type="button"
                onClick={() => setInterestRate(prev => Math.min(24.0, +(prev + 0.5).toFixed(2)))}
                aria-label="Increase interest rate"
                className="w-10 h-10 flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-lg rounded-xl border border-slate-200 transition-all active:scale-95 shrink-0 cursor-pointer"
              >
                +
              </button>
            </div>

            {/* Quick Presets */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 pt-0.5">
              {[
                { rate: 3.88, label: '3.88% (Gov)' },
                { rate: 5.99, label: '5.99% (Std)' },
                { rate: 7.99, label: '7.99% (Digital)' },
                { rate: 12.00, label: '12.0% (Micro)' },
              ].map((preset) => (
                <button
                  key={preset.rate}
                  type="button"
                  onClick={() => setInterestRate(preset.rate)}
                  className={`py-1.5 px-1.5 text-[11px] font-semibold rounded-lg border transition-all cursor-pointer text-center truncate ${
                    interestRate === preset.rate
                      ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* MOBILE ONLY: Advisory & Button at the VERY BOTTOM */}
        <div className="lg:hidden w-full flex flex-col gap-4">
          {AdvisoryAndCTA}
        </div>

      </div>
    </div>
  );
}
