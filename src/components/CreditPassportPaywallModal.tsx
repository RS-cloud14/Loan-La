'use client';

import React, { useState, useEffect } from 'react';
import { 
  CreditCard, 
  QrCode, 
  Building2, 
  Wallet, 
  Lock, 
  X, 
  BadgeCheck, 
  CheckCircle2, 
  ChevronLeft, 
  RefreshCw, 
  Smartphone, 
  ShieldCheck, 
  Landmark, 
  FileText, 
  Clock, 
  Zap, 
  AlertTriangle,
  User,
  Briefcase
} from 'lucide-react';

export type BorrowerPricingTier = 'personal' | 'sme';
export type PaywallScenario = 'good_result' | 'bad_result';

interface CreditPassportPaywallModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (plan: string) => void;
  applicantName?: string;
  preliminaryScore?: number;
  preliminaryGrade?: string;
  isMalay?: boolean;
  initialTier?: BorrowerPricingTier;
  initialScenario?: PaywallScenario;
}

export default function CreditPassportPaywallModal({
  isOpen,
  onClose,
  onSuccess,
  applicantName = 'Borrower',
  isMalay = false,
  initialTier = 'personal',
  initialScenario = 'good_result'
}: CreditPassportPaywallModalProps) {
  // Case Type: Normal (GIG / Personal) vs SME (Business / Company)
  const [tier, setTier] = useState<BorrowerPricingTier>(initialTier);
  // Result state: Passed (Good Result) vs Failed (Bad Result)
  const [scenario, setScenario] = useState<PaywallScenario>(initialScenario);
  
  // Selected package key:
  // For Good Result: 'basic' or 'upgrade'
  // For Bad Result: 'retry'
  const [selectedPackage, setSelectedPackage] = useState<'basic' | 'upgrade' | 'retry'>('basic');

  const [paymentMethod, setPaymentMethod] = useState<'duitnow' | 'fpx' | 'tng' | 'card'>('duitnow');
  const [selectedFpxBank, setSelectedFpxBank] = useState<string>('maybank');
  const [paymentStep, setPaymentStep] = useState<'select' | 'gateway_demo' | 'success'>('select');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [countdownSeconds, setCountdownSeconds] = useState<number>(298);

  useEffect(() => {
    if (isOpen) {
      setTier(initialTier);
      setScenario(initialScenario);
      setSelectedPackage(initialScenario === 'bad_result' ? 'retry' : 'basic');
      setPaymentStep('select');
      setIsProcessing(false);
      setCountdownSeconds(298);
    }
  }, [isOpen, initialTier, initialScenario]);

  // Timer countdown simulation for DuitNow QR
  useEffect(() => {
    if (paymentStep === 'gateway_demo' && paymentMethod === 'duitnow') {
      const interval = setInterval(() => {
        setCountdownSeconds(prev => (prev > 1 ? prev - 1 : 299));
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [paymentStep, paymentMethod]);

  if (!isOpen) return null;

  const fpxBanks = [
    { id: 'maybank', name: 'Maybank2u' },
    { id: 'cimb', name: 'CIMB Clicks' },
    { id: 'public', name: 'Public Bank (PBe)' },
    { id: 'rhb', name: 'RHB Now' },
    { id: 'hongleong', name: 'Hong Leong Connect' },
    { id: 'bankislam', name: 'Bank Islam' },
    { id: 'bankrakyat', name: 'Bank Rakyat (i-Rakyat)' }
  ];

  // Pricing Matrix based on Blueprint Specification:
  // Normal Case: Basic RM 19.90, Upgrade RM 34.90 (19.90 + 15.00), Retry RM 10.00
  // SME Case: Basic RM 49.90, Upgrade RM 64.90 (49.90 + 15.00), Retry RM 20.00
  const getPricing = () => {
    if (tier === 'personal') {
      if (scenario === 'bad_result' || selectedPackage === 'retry') {
        return {
          price: '10.00',
          numericPrice: 10.00,
          packageName: isMalay ? 'Diagnostik Dokumen & Audit Semula' : 'Document Diagnostic & Re-Audit',
          badge: isMalay ? 'PILIHAN PEMBETULAN' : 'FIX & RETRY LIFELINE',
          description: isMalay ? '1 Laporan Ralat Terperinci + 1 Percubaan Audit Dokumen Baharu' : '1 Detailed Error Diagnostic Report + 1 Re-Audit Attempt'
        };
      }
      if (selectedPackage === 'upgrade') {
        return {
          price: '34.90',
          numericPrice: 34.90,
          packageName: isMalay ? 'Naik Taraf Penuh (Buka Semua Bank & Mohon)' : 'Apply Upgrade (Unlock All Lenders)',
          badge: isMalay ? 'PILIHAN TERBAIK' : 'TOP RECOMMENDED',
          description: isMalay ? 'Buka SEMUA Padanan Bank Berlesen + Akses Permohonan Terus' : 'Unlock ALL matched licensed lenders + Direct Platform Application'
        };
      }
      return {
        price: '19.90',
        numericPrice: 19.90,
        packageName: isMalay ? 'Pakej Asas (Laporan & Audit)' : 'Basic Assessment Pack',
        badge: isMalay ? 'PENGESAHAN AWAL' : 'INITIAL ENTRY',
        description: isMalay ? '1 Laporan Skor Kredit Penuh, 1 Padanan Bank Utama, 1 Audit Dokumen' : '1 Full Credit Report, 1 Top Bank Match, 1 Document Audit'
      };
    } else {
      // SME Case
      if (scenario === 'bad_result' || selectedPackage === 'retry') {
        return {
          price: '20.00',
          numericPrice: 20.00,
          packageName: isMalay ? 'SME Diagnostik & Audit Semula Mendalam' : 'SME Document Diagnostic & Re-Audit',
          badge: isMalay ? 'PEMBETULAN DOKUMEN SME' : 'SME ERROR CORRECTION',
          description: isMalay ? '1 Laporan Analisis Ralat Syarikat + 1 Percubaan Audit Semula Penyata' : '1 Detailed Heavy Analysis Report + 1 Re-Audit Attempt'
        };
      }
      if (selectedPackage === 'upgrade') {
        return {
          price: '64.90',
          numericPrice: 64.90,
          packageName: isMalay ? 'SME Apply Upgrade (Buka Semua Bank Perniagaan)' : 'SME Apply Upgrade (All Commercial Lenders)',
          badge: isMalay ? 'PERMOHONAN KOMERSIAL' : 'COMMERCIAL ACCESS',
          description: isMalay ? 'Buka SEMUA Pembiaya Komersial SME & Agensi Kerajaan + Mohon Platform' : 'Unlock ALL Commercial SME Lenders & Government Funds + Direct Intake'
        };
      }
      return {
        price: '49.90',
        numericPrice: 49.90,
        packageName: isMalay ? 'Analisis Asas SME (Audit Mendalam Penyata Syarikat)' : 'SME Basic Deep-Dive Analysis',
        badge: isMalay ? 'AUDIT MENDALAM SME' : 'DEEP-DIVE AUDIT',
        description: isMalay ? '1 Laporan Komprehensif SME, Padanan Bank #1, Audit SSM & Penyata 6-Bulan' : '1 Comprehensive SME Report, Top 1 Bank Match, Heavy Document Audit'
      };
    }
  };

  const currentPricing = getPricing();
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
        onSuccess(selectedPackage);
      }, 1400);
    }, 1100);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden text-slate-900 flex flex-col md:flex-row my-auto min-h-[520px]">
        
        {/* ========================================================================= */}
        {/* LEFT COLUMN: OFFICIAL INVOICE & BLUEPRINT ORDER SUMMARY                   */}
        {/* ========================================================================= */}
        <div className="w-full md:w-[42%] bg-gradient-to-b from-[#071325] via-[#091E42] to-[#0A2558] text-white p-7 sm:p-8 flex flex-col justify-between relative shrink-0">
          
          <div className="flex flex-col gap-5">
            <div>
              {/* Case Badge & Category */}
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-blue-500/20 text-blue-200 border border-blue-400/30">
                  {tier === 'personal' ? (isMalay ? 'KES INDIVIDU / GIG' : 'NORMAL / GIG WORKER') : (isMalay ? 'KES PERNIAGAAN / SME' : 'SME / BUSINESS CASE')}
                </span>
                <span className="text-[10px] font-semibold text-slate-300">
                  {scenario === 'good_result' ? (isMalay ? 'Status: Lulus' : 'Pre-Qualified') : (isMalay ? 'Status: Perlu Semakan' : 'Action Needed')}
                </span>
              </div>

              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-snug">
                {currentPricing.packageName}
              </h2>
              <span className="text-xs text-slate-300 mt-1 block">
                {isMalay ? 'Pemohon / Syarikat:' : 'Applicant / Company:'} <strong className="text-white font-semibold">{applicantName}</strong>
              </span>
            </div>

            {/* Total Price Card */}
            <div className="py-3.5 px-4 bg-white/5 border border-white/10 rounded-2xl">
              <span className="text-[10px] uppercase font-bold text-slate-300 block tracking-wider">
                {isMalay ? 'Jumlah Bersih (Pelan 1 Kitaran Permohonan)' : 'Total Investment (1 Application Cycle)'}
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                  RM {currentPricing.price}
                </span>
                <span className="text-xs text-blue-200 font-medium">
                  {isMalay ? 'sekali bayar' : 'one-time fee'}
                </span>
              </div>
            </div>

            {/* Included Deliverables */}
            <div className="space-y-3 text-xs text-slate-200">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                {isMalay ? 'Termasuk Dalam Pakej Ini:' : 'What You Receive:'}
              </span>

              <div className="flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-md bg-blue-500/20 text-blue-300 flex items-center justify-center shrink-0 mt-0.5">
                  <FileText className="w-3.5 h-3.5" />
                </div>
                <div className="leading-tight">
                  <strong className="text-white block font-semibold">
                    {tier === 'personal'
                      ? (isMalay ? 'Laporan Kesihatan Kredit Rasmi' : 'Official Credit Health Memo')
                      : (isMalay ? 'Audit Penyata Kewangan Komprehensif SME' : 'Comprehensive SME Financial Audit')}
                  </strong>
                  <span className="text-[11px] text-slate-300">
                    {isMalay ? 'Penilaian DSR, kapasiti bayaran balik & skor kebolehterimaan bank.' : 'Assessed DSR, liquidity buffer & credit eligibility score.'}
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-md bg-emerald-500/20 text-emerald-300 flex items-center justify-center shrink-0 mt-0.5">
                  <Landmark className="w-3.5 h-3.5" />
                </div>
                <div className="leading-tight">
                  <strong className="text-white block font-semibold">
                    {selectedPackage === 'upgrade'
                      ? (isMalay ? 'Buka Semua Institusi Kewangan & Mohon' : 'Unlock ALL Lenders & Direct Intake')
                      : (isMalay ? 'Padanan Bank #1 Berserta Saluran Rasmi' : 'Top 1 Matched Bank & Official Channel')}
                  </strong>
                  <span className="text-[11px] text-slate-300">
                    {isMalay ? 'Ketahui kadar faedah terendah dan dokumen yang perlu dibawa.' : 'Direct intake pathway, required documents checklist & rates.'}
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-md bg-amber-500/20 text-amber-300 flex items-center justify-center shrink-0 mt-0.5">
                  <ShieldCheck className="w-3.5 h-3.5" />
                </div>
                <div className="leading-tight">
                  <strong className="text-white block font-semibold">
                    {isMalay ? 'Servis Pembetulan Dokumen & Integriti CAM' : 'Document Verification Service'}
                  </strong>
                  <span className="text-[11px] text-slate-300">
                    {isMalay ? 'Pemeriksaan kesempurnaan dokumen tanpa menjejaskan rekod CCRIS anda.' : 'Prevents blind bank rejection marks without hard credit inquiries.'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Legal Software Disclaimer (Required per Blueprint) */}
          <div className="pt-4 mt-5 border-t border-white/10 text-[10px] text-slate-400 leading-relaxed">
            <span className="font-semibold text-slate-300 block mb-0.5">Penafian Platform / Platform Disclaimer:</span>
            {isMalay 
              ? 'CreditFlow AI ialah Konsultan Pinjaman Digital & Pembantu Permohonan AI. Kami membantu pemohon mengaudit kesiapsiagaan kredit, menyediakan pakej permohonan gred pengunderait, dan memandu saluran permohonan rasmi bank. Kami tidak memberi pinjaman langsung; kelulusan akhir tertakluk kepada penilaian institusi perbankan.' 
              : 'CreditFlow AI is an Online AI Loan Consultant & Application Assistant. We assist applicants in auditing credit readiness, compiling underwriter-grade application packs, and navigating official bank application channels. We do not disburse loans directly; all final loan approvals remain subject to the bank\'s official assessment.'}
          </div>

        </div>

        {/* ========================================================================= */}
        {/* RIGHT COLUMN: PACKAGE CHOOSER & MALAYSIAN CHECKOUT CHANNELS              */}
        {/* ========================================================================= */}
        <div className="w-full md:w-[58%] bg-white p-7 sm:p-8 flex flex-col justify-between relative">
          
          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          {/* VIEW 1: SUCCESS RECEIPT */}
          {paymentStep === 'success' && (
            <div className="text-center flex flex-col items-center justify-center gap-4 py-8 animate-fade-in my-auto">
              <div className="w-16 h-16 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-xl ring-4 ring-emerald-50">
                <BadgeCheck className="w-9 h-9" />
              </div>

              <div>
                <h3 className="text-xl font-bold text-slate-900">
                  {isMalay ? 'Pembayaran Berjaya Disahkan' : 'Payment Completed'}
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  {isMalay ? 'Membuka akses laporan dan pakej permohonan anda...' : 'Unlocking your official application pack...'}
                </p>
              </div>

              <div className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-left text-xs space-y-2 mt-2">
                <div className="flex justify-between text-slate-600">
                  <span>{isMalay ? 'Nama Pemohon:' : 'Issued To:'}</span>
                  <strong className="text-slate-900 font-semibold">{applicantName}</strong>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>{isMalay ? 'Pakej Dibeli:' : 'Package:'}</span>
                  <strong className="text-slate-900 font-semibold">{currentPricing.packageName}</strong>
                </div>
                <div className="flex justify-between text-slate-600 border-t border-slate-200 pt-2">
                  <span>{isMalay ? 'Jumlah Dibayar:' : 'Amount Paid:'}</span>
                  <strong className="text-emerald-700 font-bold text-sm">RM {currentPricing.price}</strong>
                </div>
              </div>
            </div>
          )}

          {/* VIEW 2: PAYMENT GATEWAY DEMO */}
          {paymentStep === 'gateway_demo' && (
            <div className="flex flex-col gap-4 animate-fade-in w-full">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 pr-8">
                <button
                  type="button"
                  onClick={() => setPaymentStep('select')}
                  className="text-xs font-semibold text-slate-500 hover:text-slate-900 flex items-center gap-1 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" /> {isMalay ? 'Tukar Pakej' : 'Change Plan'}
                </button>
                <span className="text-xs text-slate-600">
                  Total: <strong className="text-slate-900 font-bold text-base">RM {currentPricing.price}</strong>
                </span>
              </div>

              {/* DuitNow QR */}
              {paymentMethod === 'duitnow' && (
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-center flex flex-col items-center gap-3">
                  <div className="w-full bg-[#ED008C] text-white py-1.5 px-3 rounded-xl flex items-center justify-between text-xs font-bold shadow-xs">
                    <span>DuitNow QR Instant</span>
                    <span className="flex items-center gap-1 text-[11px] font-normal opacity-90">
                      <Clock className="w-3 h-3" /> {formatTimer(countdownSeconds)}
                    </span>
                  </div>

                  <div className="p-2.5 bg-white border border-slate-200 rounded-2xl shadow-sm inline-block">
                    <div className="w-36 h-36 bg-white flex items-center justify-center rounded-xl relative">
                      <QrCode className="w-32 h-32 text-slate-900" />
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="w-6 h-6 bg-[#ED008C] rounded-md flex items-center justify-center text-white text-[8px] font-black">
                          DN
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="text-center">
                    <span className="text-xs font-bold text-slate-900 block">
                      Merchant: CreditFlow AI (PayNet Verified)
                    </span>
                    <span className="text-[11px] text-slate-500 block">
                      Imbas guna MAE, TNG eWallet, CIMB OCTO, GXBank
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={handleConfirmGatewayPayment}
                    disabled={isProcessing}
                    className="w-full max-w-sm py-2.5 px-4 bg-[#ED008C] hover:bg-[#D4007D] text-white font-bold text-xs rounded-xl shadow-sm flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
                  >
                    {isProcessing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                    <span>{isMalay ? 'Sahkan Pembayaran Dibuat' : 'Confirm Payment Completed'}</span>
                  </button>
                </div>
              )}

              {/* FPX Banking */}
              {paymentMethod === 'fpx' && (
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col gap-3 text-xs">
                  <div className="w-full bg-[#002B49] text-white py-1.5 px-3 rounded-xl flex items-center justify-between text-xs font-bold shadow-xs">
                    <span>FPX Online Banking</span>
                    <span className="text-[10px] font-normal text-blue-200">Ref: FPX-MY-{Math.floor(100000 + Math.random() * 900000)}</span>
                  </div>

                  <div className="bg-white border border-slate-200 rounded-xl p-3 space-y-1.5 text-xs">
                    <div className="flex justify-between text-slate-500">
                      <span>Merchant:</span>
                      <strong className="text-slate-900">CreditFlow AI Platform</strong>
                    </div>
                    <div className="flex justify-between text-slate-500">
                      <span>Bank Terpilih:</span>
                      <strong className="text-slate-900 font-bold">{selectedBankObj.name}</strong>
                    </div>
                    <div className="flex justify-between text-slate-500 border-t border-slate-100 pt-1.5">
                      <span>Jumlah:</span>
                      <strong className="text-emerald-700 font-black text-sm">RM {currentPricing.price}</strong>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleConfirmGatewayPayment}
                    disabled={isProcessing}
                    className="w-full py-3 px-4 bg-[#091E42] hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
                  >
                    {isProcessing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Lock className="w-3.5 h-3.5" />}
                    <span>{isMalay ? `Luluskan Transaksi ${selectedBankObj.name}` : `Authorize & Pay RM ${currentPricing.price}`}</span>
                  </button>
                </div>
              )}

              {/* TNG eWallet */}
              {paymentMethod === 'tng' && (
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 flex flex-col gap-3 text-center items-center text-xs">
                  <div className="w-full bg-[#005BAB] text-white py-1.5 px-3 rounded-xl flex items-center justify-between text-xs font-bold shadow-xs">
                    <span>Touch &apos;n Go eWallet</span>
                    <span className="text-[11px] font-normal text-blue-100">1-Tap Checkout</span>
                  </div>
                  <div className="space-y-0.5">
                    <span className="font-bold text-slate-900 block text-xs">Authorization Request: RM {currentPricing.price}</span>
                    <span className="text-[11px] text-slate-500">Linked Account: 012-*** 8891 ({applicantName})</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleConfirmGatewayPayment}
                    disabled={isProcessing}
                    className="w-full max-w-sm py-2.5 px-4 bg-[#005BAB] hover:bg-[#004A8B] text-white font-bold text-xs rounded-xl shadow-sm flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
                  >
                    {isProcessing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Smartphone className="w-3.5 h-3.5" />}
                    <span>{isMalay ? 'Sahkan & Bayar Sekarang' : `1-Tap Pay RM ${currentPricing.price}`}</span>
                  </button>
                </div>
              )}

              {/* Card */}
              {paymentMethod === 'card' && (
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col gap-2.5 text-xs">
                  <div className="w-full bg-slate-900 text-white py-1.5 px-3 rounded-xl flex items-center justify-between text-xs font-bold shadow-xs">
                    <span>Visa Secure / Mastercard ID Check</span>
                    <span className="text-[10px] font-normal text-slate-300">3D-Secure 2.0</span>
                  </div>
                  <div className="bg-white border border-slate-200 rounded-xl p-3 space-y-1 text-xs">
                    <div className="flex justify-between text-slate-500">
                      <span>Card:</span>
                      <strong className="text-slate-900 font-mono">•••• •••• •••• 4281</strong>
                    </div>
                    <div className="flex justify-between text-slate-500 border-t border-slate-100 pt-1">
                      <span>Total:</span>
                      <strong className="text-slate-900 font-bold">RM {currentPricing.price}</strong>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleConfirmGatewayPayment}
                    disabled={isProcessing}
                    className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-sm flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
                  >
                    {isProcessing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                    <span>{isMalay ? 'Sahkan & Bayar' : `Pay RM ${currentPricing.price}`}</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* VIEW 3: CHECKOUT PLAN SELECTOR */}
          {paymentStep === 'select' && (
            <div className="flex flex-col gap-5">
              
              {/* Application Scope Display (Locked to Identified Profile) */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  {isMalay ? 'Kategori Permohonan:' : 'Application Scope:'}
                </span>

                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-900 font-bold text-xs shadow-2xs">
                  {tier === 'personal' ? (
                    <>
                      <User className="w-3.5 h-3.5 text-blue-900" />
                      <span>{isMalay ? 'Individu / Pekerja GIG' : 'Normal (GIG Worker)'}</span>
                    </>
                  ) : (
                    <>
                      <Briefcase className="w-3.5 h-3.5 text-blue-900" />
                      <span>{isMalay ? 'PKS / Syarikat (SME)' : 'SME / Company'}</span>
                    </>
                  )}
                </div>
              </div>

              {/* Scenario Option: Good Result vs Bad Result */}
              {scenario === 'bad_result' ? (
                /* BAD RESULT: DIAGNOSTIC & RE-AUDIT LIFELINE */
                <div>
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl mb-3 flex items-start gap-2.5">
                    <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                    <div className="text-xs text-amber-900">
                      <strong className="block font-bold">
                        {isMalay ? 'Dokumen Perlu Pembetulan (Audit Tidak Lengkap)' : 'Document Audit Incomplete (Errors Detected)'}
                      </strong>
                      <span className="text-[11px] leading-tight text-amber-800">
                        {isMalay 
                          ? 'Anda tidak perlu membayar pakej penuh lagi. Ambil pas diagnostik untuk membetulkan fail dan lakukan audit semula.' 
                          : 'Do not pay full price again. Get a detailed error diagnostic and 1 additional re-audit to fix your file.'}
                      </span>
                    </div>
                  </div>

                  <div
                    onClick={() => setSelectedPackage('retry')}
                    className="p-4 rounded-2xl border-2 border-amber-600 bg-amber-50/40 text-left transition-all cursor-pointer relative shadow-xs"
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-bold text-slate-900">
                        {tier === 'personal'
                          ? (isMalay ? 'Diagnostik Dokumen & Audit Semula' : 'Document Diagnostic & Re-Audit')
                          : (isMalay ? 'SME Diagnostik & Audit Semula Mendalam' : 'SME Document Diagnostic & Re-Audit')}
                      </span>
                      <div className="w-4 h-4 rounded-full border-2 border-amber-700 bg-amber-700 flex items-center justify-center">
                        <div className="w-1.5 h-1.5 bg-white rounded-full" />
                      </div>
                    </div>

                    <div className="flex items-baseline gap-1 my-1">
                      <span className="text-2xl font-black text-slate-900">
                        RM {tier === 'personal' ? '10.00' : '20.00'}
                      </span>
                      <span className="text-xs text-slate-500 font-medium">
                        {tier === 'personal' ? (isMalay ? '(Jimat ~50% dari Asas)' : '(~50% discount from Basic)') : (isMalay ? '(Jimat ~60% dari Asas)' : '(~60% discount from Basic)')}
                      </span>
                    </div>

                    <span className="text-xs text-slate-600 block">
                      {tier === 'personal'
                        ? (isMalay ? '1 Laporan Ralat Terperinci + 1 Percubaan Audit Semula' : '1 Detailed Error Report + 1 Re-Audit Attempt')
                        : (isMalay ? '1 Laporan Analisis Ralat Syarikat + 1 Audit Semula Mendalam' : '1 Heavy Analysis Report + 1 Re-Audit Attempt')}
                    </span>
                  </div>
                </div>
              ) : (
                /* GOOD RESULT: BASIC VS APPLY UPGRADE */
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                    {isMalay ? 'PILIH PAKEJ KELULUSAN ANDA:' : 'SELECT YOUR PACKAGE:'}
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    
                    {/* OPTION 1: BASIC */}
                    <div
                      onClick={() => setSelectedPackage('basic')}
                      className={`p-4 rounded-2xl border text-left transition-all cursor-pointer relative ${
                        selectedPackage === 'basic'
                          ? 'border-[#091E42] bg-slate-50/90 ring-2 ring-[#091E42] shadow-xs'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs sm:text-sm font-bold text-slate-900">
                          {tier === 'personal' ? (isMalay ? 'Pakej Asas' : 'Basic Pack') : (isMalay ? 'SME Analisis Asas' : 'SME Basic Analysis')}
                        </span>
                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                          selectedPackage === 'basic' ? 'border-[#091E42] bg-[#091E42]' : 'border-slate-300'
                        }`}>
                          {selectedPackage === 'basic' && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                        </div>
                      </div>

                      <div className="flex items-baseline gap-1 my-1">
                        <span className="text-2xl font-black text-slate-900">
                          RM {tier === 'personal' ? '19.90' : '49.90'}
                        </span>
                        <span className="text-xs text-slate-500 font-medium">{isMalay ? 'sekali' : 'one-time'}</span>
                      </div>

                      <span className="text-[11px] text-slate-600 block leading-tight">
                        {tier === 'personal'
                          ? (isMalay ? '1 Laporan, 1 Padanan Bank, 1 Audit Dokumen' : '1 Report, 1 Top Lender Match, 1 Audit')
                          : (isMalay ? '1 Laporan SME, 1 Bank Utama, 1 Audit Mendalam' : '1 Comprehensive SME Report, 1 Top Bank Match')}
                      </span>
                    </div>

                    {/* OPTION 2: APPLY UPGRADE */}
                    <div
                      onClick={() => setSelectedPackage('upgrade')}
                      className={`p-4 rounded-2xl border text-left transition-all cursor-pointer relative ${
                        selectedPackage === 'upgrade'
                          ? 'border-[#091E42] bg-slate-50/90 ring-2 ring-[#091E42] shadow-xs'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      {/* RECOMMENDED BADGE */}
                      <div className="absolute -top-2.5 right-3">
                        <span className="text-[8.5px] font-black uppercase tracking-wider bg-emerald-700 text-white px-2 py-0.5 rounded-full shadow-xs">
                          {isMalay ? 'NAIK TARAF DISYORKAN' : 'RECOMMENDED'}
                        </span>
                      </div>

                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs sm:text-sm font-bold text-slate-900">
                          {tier === 'personal' ? (isMalay ? 'Apply Upgrade (+RM15)' : 'Apply Upgrade (+RM15)') : (isMalay ? 'SME Apply Upgrade' : 'SME Apply Upgrade')}
                        </span>
                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                          selectedPackage === 'upgrade' ? 'border-[#091E42] bg-[#091E42]' : 'border-slate-300'
                        }`}>
                          {selectedPackage === 'upgrade' && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                        </div>
                      </div>

                      <div className="flex items-baseline gap-1 my-1">
                        <span className="text-2xl font-black text-slate-900">
                          RM {tier === 'personal' ? '34.90' : '64.90'}
                        </span>
                        <span className="text-xs text-slate-500 font-medium">
                          {tier === 'personal' ? '(19.90 + 15.00)' : '(49.90 + 15.00)'}
                        </span>
                      </div>

                      <span className="text-[11px] text-slate-600 block leading-tight">
                        {isMalay
                          ? 'Buka SEMUA Institusi Kewangan & Pakej Permohonan Platform'
                          : 'Unlock ALL Lenders & Generate Full Platform Application Pack'}
                      </span>
                    </div>

                  </div>
                </div>
              )}

              {/* Payment Method Selector */}
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                  {isMalay ? 'KAEDAH PEMBAYARAN MALAYSIA:' : 'MALAYSIAN PAYMENT METHOD:'}
                </span>

                <div className="grid grid-cols-4 gap-2.5">
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
                        className={`p-2.5 rounded-xl border text-xs flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                          isSel
                            ? 'border-[#091E42] bg-[#091E42] text-white font-bold shadow-xs'
                            : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span className="text-[10px] font-semibold truncate">{m.label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* FPX Selector */}
                {paymentMethod === 'fpx' && (
                  <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-2 mt-2 text-xs">
                    <span className="text-xs text-slate-700 font-semibold shrink-0">
                      {isMalay ? 'Pilih Bank:' : 'Select Bank:'}
                    </span>
                    <select
                      value={selectedFpxBank}
                      onChange={(e) => setSelectedFpxBank(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg py-1 px-2 text-xs font-semibold text-slate-800 outline-none"
                    >
                      {fpxBanks.map(b => (
                        <option key={b.id} value={b.id}>{b.name}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Action Button */}
              <button
                type="button"
                onClick={() => setPaymentStep('gateway_demo')}
                className="w-full py-3 px-5 rounded-xl bg-slate-900 hover:bg-black text-white font-bold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
              >
                <Lock className="w-4 h-4" />
                <span>
                  {isMalay
                    ? `Bayar RM ${currentPricing.price} & Dapatkan Akses →`
                    : `Pay RM ${currentPricing.price} & Unlock Access →`}
                </span>
              </button>

            </div>
          )}

        </div>

      </div>
    </div>
  );
}
