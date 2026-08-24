'use client';

import React, { useState, useEffect } from 'react';
import { 
  Check, 
  CreditCard, 
  QrCode, 
  Building2, 
  Wallet, 
  Lock, 
  X, 
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  ChevronLeft,
  RefreshCw,
  Smartphone,
  ShieldCheck,
  Landmark,
  FileText,
  Clock,
  Sparkles,
  Zap,
  Activity,
  Layers
} from 'lucide-react';

interface CreditPassportPaywallModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (plan: 'single' | 'pro') => void;
  applicantName?: string;
  preliminaryScore?: number;
  preliminaryGrade?: string;
  isMalay?: boolean;
}

export default function CreditPassportPaywallModal({
  isOpen,
  onClose,
  onSuccess,
  applicantName = 'Borrower',
  isMalay = false
}: CreditPassportPaywallModalProps) {
  const [selectedPlan, setSelectedPlan] = useState<'single' | 'pro'>('single');
  const [paymentMethod, setPaymentMethod] = useState<'duitnow' | 'fpx' | 'tng' | 'card'>('duitnow');
  const [selectedFpxBank, setSelectedFpxBank] = useState<string>('maybank');
  const [paymentStep, setPaymentStep] = useState<'select' | 'gateway_demo' | 'success'>('select');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [countdownSeconds, setCountdownSeconds] = useState<number>(298);

  // Timer countdown simulation for DuitNow QR
  useEffect(() => {
    if (paymentStep === 'gateway_demo' && paymentMethod === 'duitnow') {
      const interval = setInterval(() => {
        setCountdownSeconds(prev => (prev > 1 ? prev - 1 : 299));
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [paymentStep, paymentMethod]);

  // Always reset to selection step on open
  useEffect(() => {
    if (isOpen) {
      setPaymentStep('select');
      setIsProcessing(false);
      setCountdownSeconds(298);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const fpxBanks = [
    { id: 'maybank', name: 'Maybank2u' },
    { id: 'cimb', name: 'CIMB Clicks' },
    { id: 'public', name: 'Public Bank (PBe)' },
    { id: 'rhb', name: 'RHB Now' },
    { id: 'hongleong', name: 'Hong Leong Connect' },
    { id: 'bankislam', name: 'Bank Islam' },
    { id: 'ambank', name: 'AmOnline' }
  ];

  const currentPrice = selectedPlan === 'single' ? '9.90' : '19.90';
  const selectedBankObj = fpxBanks.find(b => b.id === selectedFpxBank) || fpxBanks[0];

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `0${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleConfirmGatewayPayment = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setPaymentStep('success');
      setTimeout(() => {
        onSuccess(selectedPlan);
      }, 1400);
    }, 1100);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-slate-950/80 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-5xl bg-white border border-slate-200/90 rounded-3xl shadow-2xl overflow-hidden text-slate-900 flex flex-col md:flex-row my-auto min-h-[540px] md:min-h-[580px]">
        
        {/* ========================================================================= */}
        {/* LEFT COLUMN: DYNAMIC ORDER SUMMARY & VALUE PROPOSITION (UPDATES PER PLAN)  */}
        {/* ========================================================================= */}
        <div className="w-full md:w-[40%] bg-gradient-to-b from-[#071325] via-[#091E42] to-[#0A2558] text-white p-8 sm:p-10 flex flex-col justify-between relative shrink-0 transition-all duration-300">
          
          <div className="flex flex-col gap-6">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-[10px] font-bold uppercase tracking-widest text-blue-300">
                  {selectedPlan === 'single' 
                    ? (isMalay ? 'LAPORAN TUNGGAL' : 'SINGLE REPORT ACCESS') 
                    : (isMalay ? 'PAS PREMIUM 30 HARI' : 'PRO 30-DAY PASS')
                  }
                </span>
                {selectedPlan === 'pro' && (
                  <span className="text-[9px] font-black uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-1.5 py-0.2 rounded">
                    UNLIMITED
                  </span>
                )}
              </div>
              <h2 className="text-2xl sm:text-[28px] font-black text-white tracking-tight leading-tight">
                {isMalay ? 'Laporan Analisis Kredit Penuh' : 'Full Credit Analysis Report'}
              </h2>
              <span className="text-xs sm:text-sm text-slate-300 mt-2 block">
                {isMalay ? 'Pemohon Berdaftar:' : 'Applicant:'} <strong className="text-white font-semibold">{applicantName}</strong>
              </span>
            </div>

            {/* Total Price Card */}
            <div className="py-4 px-5 bg-white/5 border border-white/10 rounded-2xl">
              <span className="text-[10px] uppercase font-bold text-slate-300 block tracking-wider">
                {isMalay ? 'Jumlah Bersih' : 'Total Investment'}
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl sm:text-4xl font-black text-white tracking-tight whitespace-nowrap shrink-0">
                  RM {currentPrice}
                </span>
                <span className="text-xs text-blue-200 font-medium whitespace-nowrap">
                  {selectedPlan === 'single' ? (isMalay ? 'sekali bayar' : 'one-time fee') : (isMalay ? '/ 30 hari akses' : '/ 30 days')}
                </span>
              </div>
            </div>

            {/* DYNAMIC BENEFITS LIST BASED ON SELECTED PLAN */}
            {selectedPlan === 'single' ? (
              /* SINGLE REPORT (RM 9.90) BENEFITS */
              <ul className="space-y-4 text-xs sm:text-[13px] text-slate-200 animate-fade-in">
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-lg bg-blue-500/20 text-blue-300 flex items-center justify-center shrink-0 mt-0.5">
                    <Landmark className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <strong className="text-white block font-semibold">
                      {isMalay ? '3 Bank Berpadanan & Mohon Terus' : '3 Matched Lenders & Direct Apply'}
                    </strong>
                    <span className="text-xs text-slate-300 leading-relaxed block mt-0.5">
                      {isMalay ? 'Ketahui nama bank sebenar dan kadar faedah terendah.' : 'Exact bank identities, lowest rates & direct apply links.'}
                    </span>
                  </div>
                </li>

                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-300 flex items-center justify-center shrink-0 mt-0.5">
                    <FileText className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <strong className="text-white block font-semibold">
                      {isMalay ? 'PDF Rasmi Tanpa Slip Gaji' : 'Bank-Accepted Income PDF'}
                    </strong>
                    <span className="text-xs text-slate-300 leading-relaxed block mt-0.5">
                      {isMalay ? 'Penyata 12-bulan beraudit dengan kod pengesahan QR.' : 'Multi-month verified dossier with tamper-proof QR hash.'}
                    </span>
                  </div>
                </li>

                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-300 flex items-center justify-center shrink-0 mt-0.5">
                    <ShieldCheck className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <strong className="text-white block font-semibold">
                      {isMalay ? 'Kira Had & Lindungi CCRIS' : 'Pre-Qualified DSR & CCRIS Safety'}
                    </strong>
                    <span className="text-xs text-slate-300 leading-relaxed block mt-0.5">
                      {isMalay ? 'Elakkan rekod penolakan bank selama 6 bulan.' : 'Prevent automatic 6-month bank lockout marks.'}
                    </span>
                  </div>
                </li>
              </ul>
            ) : (
              /* PRO 30-DAY PASS (RM 19.90) BENEFITS */
              <ul className="space-y-4 text-xs sm:text-[13px] text-slate-200 animate-fade-in">
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-300 flex items-center justify-center shrink-0 mt-0.5">
                    <Zap className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <strong className="text-white block font-semibold">
                      {isMalay ? 'Audit & Muat Naik Tanpa Had (30 Hari)' : 'Unlimited Document Re-Audits'}
                    </strong>
                    <span className="text-xs text-slate-300 leading-relaxed block mt-0.5">
                      {isMalay ? 'Muat naik penyata baru bila-bila masa untuk tingkatkan skor & had pinjaman.' : 'Upload new statements anytime to recalculate & boost loan limits.'}
                    </span>
                  </div>
                </li>

                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-lg bg-blue-500/20 text-blue-300 flex items-center justify-center shrink-0 mt-0.5">
                    <Layers className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <strong className="text-white block font-semibold">
                      {isMalay ? 'Semua Bank Rakan Kongsi & Koperasi' : 'All Matched Banks & P2P Lenders'}
                    </strong>
                    <span className="text-xs text-slate-300 leading-relaxed block mt-0.5">
                      {isMalay ? 'Akses tanpa had ke semua direktori institusi kewangan berlesen.' : 'Unrestricted access to all partner banks, digital lenders & credit co-ops.'}
                    </span>
                  </div>
                </li>

                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-lg bg-purple-500/20 text-purple-300 flex items-center justify-center shrink-0 mt-0.5">
                    <Activity className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <strong className="text-white block font-semibold">
                      {isMalay ? 'Penjejakan Status Permohonan Langsung' : 'Live Bank Application Sync'}
                    </strong>
                    <span className="text-xs text-slate-300 leading-relaxed block mt-0.5">
                      {isMalay ? 'Penyegerakan masa nyata dengan sistem kelulusan jawatankuasa kredit.' : 'Real-time status sync with bank credit committees.'}
                    </span>
                  </div>
                </li>
              </ul>
            )}
          </div>

          {/* Security badge at bottom left */}
          <div className="pt-5 mt-6 border-t border-white/10 flex items-center gap-2 text-xs text-slate-300">
            <Lock className="w-4 h-4 text-blue-300 shrink-0" />
            <span>BNM RMiT Aligned · 256-Bit SSL Encrypted</span>
          </div>

        </div>

        {/* ========================================================================= */}
        {/* RIGHT COLUMN: SPACIOUS INTERACTIVE CHECKOUT & PAYMENT SELECTION             */}
        {/* ========================================================================= */}
        <div className="w-full md:w-[60%] bg-white p-8 sm:p-10 flex flex-col justify-between relative">
          
          {/* Close button top right */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-6 right-6 p-2 rounded-xl text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          {/* VIEW 1: SUCCESS RECEIPT */}
          {paymentStep === 'success' && (
            <div className="text-center flex flex-col items-center justify-center gap-4 py-8 animate-fade-in my-auto">
              <div className="w-16 h-16 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-xl shadow-emerald-600/20 ring-4 ring-emerald-50">
                <BadgeCheck className="w-9 h-9" />
              </div>

              <div>
                <h3 className="text-xl font-bold text-slate-900">
                  {isMalay ? 'Pembayaran Berjaya Disahkan' : 'Payment Completed'}
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  {isMalay ? 'Membuka laporan analisis dan senarai bank anda...' : 'Opening your fully unlocked report and lender matches...'}
                </p>
              </div>

              <div className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-5 text-left text-xs sm:text-sm space-y-2.5 mt-2">
                <div className="flex justify-between text-slate-600">
                  <span>{isMalay ? 'Dikeluarkan Kepada:' : 'Issued To:'}</span>
                  <strong className="text-slate-900 font-semibold">{applicantName}</strong>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>{isMalay ? 'Pakej Akses:' : 'Access Plan:'}</span>
                  <strong className="text-slate-900 font-semibold">{selectedPlan === 'pro' ? 'Pro 30-Day Pass' : 'Single Full Report'}</strong>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>{isMalay ? 'Jumlah Dibayar:' : 'Amount Paid:'}</span>
                  <strong className="text-emerald-700 font-bold text-base">RM {currentPrice}</strong>
                </div>
              </div>
            </div>
          )}

          {/* VIEW 2: HYPER-REALISTIC MALAYSIAN PAYMENT GATEWAY DEMO */}
          {paymentStep === 'gateway_demo' && (
            <div className="flex flex-col gap-4 animate-fade-in w-full">
              
              {/* Header Navigation Strip at the Very Top */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 pr-10">
                <button
                  type="button"
                  onClick={() => setPaymentStep('select')}
                  className="text-xs sm:text-sm font-semibold text-slate-500 hover:text-slate-900 flex items-center gap-1.5 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" /> {isMalay ? 'Tukar Pelan' : 'Change Plan'}
                </button>
                <span className="text-xs sm:text-sm text-slate-600">
                  Total: <strong className="text-slate-900 font-bold text-base">RM {currentPrice}</strong>
                </span>
              </div>

              {/* DuitNow Terminal */}
              {paymentMethod === 'duitnow' && (
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 text-center flex flex-col items-center gap-3">
                  
                  {/* Official DuitNow Header Bar */}
                  <div className="w-full bg-[#ED008C] text-white py-1.5 px-4 rounded-xl flex items-center justify-between text-xs font-bold shadow-xs">
                    <span>DuitNow QR</span>
                    <span className="flex items-center gap-1 text-[11px] font-normal opacity-90">
                      <Clock className="w-3 h-3" /> {formatTimer(countdownSeconds)}
                    </span>
                  </div>

                  <div className="p-3 bg-white border-2 border-slate-200 rounded-2xl shadow-sm inline-block">
                    <div className="w-40 h-40 bg-white border border-slate-100 flex items-center justify-center rounded-xl relative">
                      <QrCode className="w-36 h-36 text-slate-900" />
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="w-7 h-7 bg-[#ED008C] rounded-md flex items-center justify-center text-white text-[9px] font-black shadow-xs">
                          DN
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-0.5 text-center">
                    <span className="text-xs font-bold text-slate-900 block">
                      Merchant: CreditFlow AI Underwriting (PayNet)
                    </span>
                    <span className="text-[11px] text-slate-500 block">
                      Supported: Maybank MAE, TNG eWallet, CIMB OCTO, GXBank
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={handleConfirmGatewayPayment}
                    disabled={isProcessing}
                    className="w-full max-w-sm py-3 px-5 bg-[#ED008C] hover:bg-[#D4007D] text-white font-bold text-xs sm:text-sm rounded-xl shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50 mt-1"
                  >
                    {isProcessing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                    <span>{isMalay ? 'Saya Telah Membayar' : 'Confirm Payment Complete'}</span>
                  </button>
                </div>
              )}

              {/* FPX Terminal */}
              {paymentMethod === 'fpx' && (
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 flex flex-col gap-3 text-xs sm:text-sm">
                  
                  {/* Official FPX Header */}
                  <div className="w-full bg-[#002B49] text-white py-1.5 px-4 rounded-xl flex items-center justify-between text-xs font-bold shadow-xs">
                    <span>FPX Online Banking Direct</span>
                    <span className="text-[11px] font-normal text-blue-200">Ref: FPX-MY-{Math.floor(100000 + Math.random() * 900000)}</span>
                  </div>

                  <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-2 text-xs">
                    <div className="flex justify-between text-slate-500">
                      <span>Receiving Merchant:</span>
                      <strong className="text-slate-900">CreditFlow Underwriting Systems</strong>
                    </div>
                    <div className="flex justify-between text-slate-500">
                      <span>Selected Bank:</span>
                      <strong className="text-slate-900 font-bold">{selectedBankObj.name}</strong>
                    </div>
                    <div className="flex justify-between text-slate-500 border-t border-slate-100 pt-2">
                      <span>Amount Payable:</span>
                      <strong className="text-emerald-700 font-black text-sm">RM {currentPrice}</strong>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-500 text-center">
                    A secure authentication request will be prompted via your {selectedBankObj.name} mobile token.
                  </p>

                  <button
                    type="button"
                    onClick={handleConfirmGatewayPayment}
                    disabled={isProcessing}
                    className="w-full py-3.5 px-5 bg-[#091E42] hover:bg-slate-800 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
                  >
                    {isProcessing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                    <span>{isMalay ? `Luluskan Transaksi ${selectedBankObj.name}` : `Authorize & Pay RM ${currentPrice}`}</span>
                  </button>
                </div>
              )}

              {/* TNG Terminal */}
              {paymentMethod === 'tng' && (
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 flex flex-col gap-3 text-center items-center text-xs sm:text-sm">
                  
                  {/* Official TNG Header */}
                  <div className="w-full bg-[#005BAB] text-white py-1.5 px-4 rounded-xl flex items-center justify-between text-xs font-bold shadow-xs">
                    <span>Touch &apos;n Go eWallet Direct</span>
                    <span className="text-[11px] font-normal text-blue-100">1-Tap Fast Checkout</span>
                  </div>

                  <div className="w-12 h-12 rounded-2xl bg-[#005BAB] text-white font-black flex items-center justify-center text-sm shadow-xs mt-1">
                    TNG
                  </div>

                  <div className="space-y-0.5">
                    <span className="font-bold text-slate-900 block text-sm">Authorization Request: RM {currentPrice}</span>
                    <span className="text-[11px] text-slate-500">Linked Account: 012-*** 8891 ({applicantName})</span>
                  </div>

                  <button
                    type="button"
                    onClick={handleConfirmGatewayPayment}
                    disabled={isProcessing}
                    className="w-full max-w-sm py-3 px-5 bg-[#005BAB] hover:bg-[#004A8B] text-white font-bold text-xs sm:text-sm rounded-xl shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
                  >
                    {isProcessing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Smartphone className="w-4 h-4" />}
                    <span>{isMalay ? 'Sahkan & Bayar Sekarang' : `1-Tap Pay RM ${currentPrice}`}</span>
                  </button>
                </div>
              )}

              {/* Card Terminal */}
              {paymentMethod === 'card' && (
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 flex flex-col gap-3 text-xs sm:text-sm">
                  
                  {/* Official 3DS Header */}
                  <div className="w-full bg-slate-900 text-white py-1.5 px-4 rounded-xl flex items-center justify-between text-xs font-bold shadow-xs">
                    <span>Visa Secure / Mastercard ID Check</span>
                    <span className="text-[11px] font-normal text-slate-300">3D-Secure 2.0</span>
                  </div>

                  <div className="bg-white border border-slate-200 rounded-xl p-3.5 space-y-1.5 text-xs">
                    <div className="flex justify-between text-slate-500">
                      <span>Card Number:</span>
                      <strong className="text-slate-900 font-mono">•••• •••• •••• 4281</strong>
                    </div>
                    <div className="flex justify-between text-slate-500">
                      <span>SMS OTP Code:</span>
                      <span className="bg-slate-100 font-mono font-bold px-2 py-0.5 rounded text-slate-800 tracking-wider">849 201</span>
                    </div>
                    <div className="flex justify-between text-slate-500 border-t border-slate-100 pt-1.5">
                      <span>Total Amount:</span>
                      <strong className="text-slate-900 font-bold">RM {currentPrice}</strong>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleConfirmGatewayPayment}
                    disabled={isProcessing}
                    className="w-full py-3 px-5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
                  >
                    {isProcessing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                    <span>{isMalay ? 'Sahkan Kod OTP & Bayar' : `Verify OTP & Pay RM ${currentPrice}`}</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* VIEW 3: CHECKOUT PLAN & PAYMENT CHANNEL FORM */}
          {paymentStep === 'select' && (
            <div className="flex flex-col gap-6">
              
              {/* Step 1: Select Plan */}
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2.5">
                  {isMalay ? '1. PILIH PELAN AKSES' : '1. SELECT PLAN'}
                </span>

                <div className="grid grid-cols-2 gap-4">
                  
                  {/* Single Report Card (BEST SELLER) */}
                  <div
                    onClick={() => setSelectedPlan('single')}
                    className={`p-5 rounded-2xl border text-left transition-all cursor-pointer relative ${
                      selectedPlan === 'single'
                        ? 'border-[#091E42] bg-slate-50/90 ring-2 ring-[#091E42] shadow-xs'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                    }`}
                  >
                    {/* BEST SELLER TAG */}
                    <div className="absolute -top-2.5 right-4">
                      <span className="text-[9px] font-black uppercase tracking-wider bg-[#091E42] text-white px-2.5 py-0.5 rounded-full shadow-xs border border-white/20">
                        {isMalay ? 'PALING POPULAR' : 'BEST SELLER'}
                      </span>
                    </div>

                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-xs sm:text-sm font-bold text-slate-900">
                        {isMalay ? 'Laporan Tunggal' : 'Single Report'}
                      </span>
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                        selectedPlan === 'single' ? 'border-[#091E42] bg-[#091E42]' : 'border-slate-300'
                      }`}>
                        {selectedPlan === 'single' && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                      </div>
                    </div>

                    <div className="flex items-baseline gap-1 my-1.5">
                      <span className="text-2xl font-black text-slate-900">RM 9.90</span>
                      <span className="text-xs text-slate-500 font-medium">{isMalay ? 'sekali' : 'one-time'}</span>
                    </div>

                    <span className="text-xs text-slate-600 block leading-relaxed">
                      {isMalay ? '1 Audit Lengkap & PDF Rasmi' : '1 Full Audit & Official PDF'}
                    </span>
                  </div>

                  {/* Pro 30-Day Pass Card (BEST VALUE) */}
                  <div
                    onClick={() => setSelectedPlan('pro')}
                    className={`p-5 rounded-2xl border text-left transition-all cursor-pointer relative ${
                      selectedPlan === 'pro'
                        ? 'border-[#091E42] bg-slate-50/90 ring-2 ring-[#091E42] shadow-xs'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                    }`}
                  >
                    {/* BEST VALUE TAG */}
                    <div className="absolute -top-2.5 right-4">
                      <span className="text-[9px] font-black uppercase tracking-wider bg-emerald-700 text-white px-2.5 py-0.5 rounded-full shadow-xs border border-white/20">
                        {isMalay ? 'NILAI TERBAIK' : 'BEST VALUE'}
                      </span>
                    </div>

                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-xs sm:text-sm font-bold text-slate-900">
                        {isMalay ? 'Pas Pro 30 Hari' : 'Pro 30-Day Pass'}
                      </span>
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                        selectedPlan === 'pro' ? 'border-[#091E42] bg-[#091E42]' : 'border-slate-300'
                      }`}>
                        {selectedPlan === 'pro' && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                      </div>
                    </div>

                    <div className="flex items-baseline gap-1 my-1.5">
                      <span className="text-2xl font-black text-slate-900">RM 19.90</span>
                      <span className="text-xs text-slate-500 font-medium">{isMalay ? '/ 30 hari' : '/ 30 days'}</span>
                    </div>

                    <span className="text-xs text-slate-600 block leading-relaxed">
                      {isMalay ? 'Audit Tanpa Had 30 Hari' : 'Unlimited Audits for 30 Days'}
                    </span>
                  </div>

                </div>
              </div>

              {/* Step 2: Payment Method Selector */}
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2.5">
                  {isMalay ? '2. KAEDAH PEMBAYARAN' : '2. PAYMENT METHOD'}
                </span>

                <div className="grid grid-cols-4 gap-3">
                  {[
                    { id: 'duitnow', label: 'DuitNow QR', icon: QrCode },
                    { id: 'fpx', label: 'FPX Banking', icon: Building2 },
                    { id: 'tng', label: 'TNG eWallet', icon: Wallet },
                    { id: 'card', label: 'Card', icon: CreditCard },
                  ].map((m) => {
                    const Icon = m.icon;
                    const isSel = paymentMethod === m.id;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setPaymentMethod(m.id as any)}
                        className={`p-3.5 rounded-2xl border text-xs flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                          isSel
                            ? 'border-[#091E42] bg-[#091E42] text-white font-bold shadow-sm'
                            : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span className="text-[11px] font-semibold truncate">{m.label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* FPX Inline Selector */}
                {paymentMethod === 'fpx' && (
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-3 mt-3 text-xs sm:text-sm">
                    <span className="text-xs text-slate-700 font-semibold shrink-0">
                      {isMalay ? 'Pilih Bank:' : 'Select Bank:'}
                    </span>
                    <select
                      value={selectedFpxBank}
                      onChange={(e) => setSelectedFpxBank(e.target.value)}
                      className="w-full text-xs sm:text-sm font-bold text-slate-900 bg-white border border-slate-300 rounded-lg p-2 focus:outline-none cursor-pointer"
                    >
                      {fpxBanks.map((b) => (
                        <option key={b.id} value={b.id}>{b.name}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Primary Action Button */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setPaymentStep('gateway_demo')}
                  className="w-full py-3.5 px-5 bg-[#091E42] hover:bg-[#071735] text-white font-bold rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md cursor-pointer transition-all active:scale-[0.99]"
                >
                  <Lock className="w-3.5 h-3.5 text-blue-200" />
                  <span>
                    {isMalay 
                      ? `Bayar RM ${currentPrice} & Buka Laporan Penuh` 
                      : `Pay RM ${currentPrice} & Unlock Full Report`}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-blue-200" />
                </button>
              </div>

            </div>
          )}

        </div>

      </div>
    </div>
  );
}
