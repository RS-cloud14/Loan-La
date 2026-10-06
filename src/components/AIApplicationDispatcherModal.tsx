'use client';

import React, { useState, useEffect } from 'react';
import {
  Globe, Shield, CheckCircle2, ArrowRight,
  Lock, FileText, Sparkles, X,
  Building2, ExternalLink, Check, AlertTriangle,
  Copy, ClipboardCheck, Info, Smartphone, QrCode,
  Download, Send, MessageCircle, HelpCircle, ChevronRight
} from 'lucide-react';
import BankLogo from '@/components/BankLogo';
import {
  getLenderOfficialPortalUrl,
  getLenderChannelType,
  findLenderByNameOrId,
  ApplicationChannel
} from '@/lib/lenders';
import { generateCreditPassportPdf } from '@/lib/pdfGenerator';

export interface DispatcherTarget {
  lenderName: string;
  lenderUrl?: string;
  productName: string;
  installment?: number;
  speed?: string;
  loanAmount?: number;
  channelType?: ApplicationChannel;
}

export interface DispatcherApplicantData {
  name: string;
  icNumber?: string;
  phone?: string;
  email?: string;
  platform?: string;
  averageMonthlyNetIncome: number;
  score: number;
  grade: string;
  dsr: number;
  documentHash: string;
  hasReconciledBankStatement: boolean;
  status?: string;
}

interface AIApplicationDispatcherModalProps {
  isOpen: boolean;
  onClose: () => void;
  target: DispatcherTarget | null;
  applicant: DispatcherApplicantData | null;
  language?: 'en' | 'bm';
  onApplicationDispatched?: (applicationRecord: any) => void;
  onSwitchToB2BPortal?: (applicantId?: string) => void;
}

export default function AIApplicationDispatcherModal({
  isOpen,
  onClose,
  target,
  applicant,
  language = 'en',
  onApplicationDispatched,
  onSwitchToB2BPortal
}: AIApplicationDispatcherModalProps) {
  // 3 Stages:
  // 1. APPROVAL: User must review and explicitly approve before anything is sent!
  // 2. APPLY_GUIDE: Clear tailored action based on bank type (digital bank app vs web portal vs government)
  // 3. DONE: Confirmation and tracking
  const [stage, setStage] = useState<'APPROVAL' | 'APPLY_GUIDE' | 'DONE'>('APPROVAL');
  
  const [userConsented, setUserConsented] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);
  const [generatedRefCode, setGeneratedRefCode] = useState('');
  const [showQrCode, setShowQrCode] = useState(false);

  useEffect(() => {
    if (isOpen && target) {
      setStage('APPROVAL');
      setUserConsented(false);
      setCopiedField(null);
      setCopiedAll(false);
      setShowQrCode(false);

      const prefix = (target.lenderName || 'BNK')
        .replace(/[^A-Za-z]/g, '')
        .substring(0, 3)
        .toUpperCase();
      setGeneratedRefCode(`LL-${new Date().getFullYear()}-${prefix}-${Math.floor(10000 + Math.random() * 90000)}`);
    }
  }, [isOpen, target]);

  if (!isOpen || !target || !applicant) return null;

  const lenderName = target.lenderName;
  const lenderData = findLenderByNameOrId(lenderName);
  const channelType: ApplicationChannel = target.channelType || getLenderChannelType(lenderName);
  const loanAmount = target.loanAmount || 15000;
  const monthlyInstallment = target.installment || Math.round((loanAmount * 1.055) / 24);
  const portalUrl = target.lenderUrl || getLenderOfficialPortalUrl(lenderName);
  const isBm = language === 'bm';

  // Copy helper
  const handleCopy = (text: string, field: string) => {
    try {
      navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      // fallback
    }
  };

  // Structured pre-fill fields
  const prefillFields = [
    { label: isBm ? 'Nama Penuh' : 'Full Name', value: applicant.name, field: 'name' },
    { label: isBm ? 'No. Kad Pengenalan' : 'MyKad / NRIC', value: applicant.icNumber || '940815-14-5521', field: 'ic' },
    { label: isBm ? 'Pendapatan Bersih Bulanan' : 'Net Monthly Income', value: `RM ${applicant.averageMonthlyNetIncome.toLocaleString()}`, field: 'income' },
    { label: isBm ? 'Platform / Pekerjaan' : 'Platform / Job', value: applicant.platform || 'Gig Worker (Grab & Foodpanda)', field: 'platform' },
    { label: isBm ? 'Amaun Pinjaman Dipohon' : 'Requested Loan Amount', value: `RM ${loanAmount.toLocaleString()}`, field: 'amount' },
    { label: isBm ? 'Cadangan Tempoh Pinjaman' : 'Proposed Tenure', value: '24 Bulan (2 Tahun)', field: 'tenure' },
    { label: isBm ? 'Tujuan Pembiayaan' : 'Financing Purpose', value: 'Working Capital / Modal Pusingan', field: 'purpose' },
    { label: isBm ? 'Skor Kesihatan Kredit (FRI)' : 'Credit Readiness (FRI)', value: `${applicant.score}/850 (Grade ${applicant.grade})`, field: 'score' },
    { label: isBm ? 'Nisbah Khidmat Hutang (DSR)' : 'Debt Service Ratio (DSR)', value: `${applicant.dsr.toFixed(1)}%`, field: 'dsr' },
  ];

  if (applicant.phone) {
    prefillFields.splice(2, 0, { label: isBm ? 'No. Telefon' : 'Phone Number', value: applicant.phone, field: 'phone' });
  }

  // Copy all details in formatted block
  const handleCopyAll = () => {
    const textSummary = [
      `=== LOAN-LA VERIFIED APPLICATION PROFILE ===`,
      `Reference Code: ${generatedRefCode}`,
      `Target Institution: ${lenderName}`,
      `Applicant Name: ${applicant.name}`,
      `MyKad: ${applicant.icNumber || '940815-14-5521'}`,
      `Net Monthly Income: RM ${applicant.averageMonthlyNetIncome.toLocaleString()}`,
      `Platform / Source: ${applicant.platform || 'Gig Worker'}`,
      `Requested Amount: RM ${loanAmount.toLocaleString()}`,
      `Tenure: 24 Months`,
      `FRI Score: ${applicant.score}/850 (Grade ${applicant.grade})`,
      `DSR: ${applicant.dsr.toFixed(1)}%`,
      `Certified CAM Hash: ${applicant.documentHash}`,
      `============================================`
    ].join('\n');

    try {
      navigator.clipboard.writeText(textSummary);
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 2500);
    } catch {}
  };

  // Download CAM PDF
  const handleDownloadCamPdf = () => {
    try {
      generateCreditPassportPdf({
        inputData: {
          name: applicant.name,
          icNumber: applicant.icNumber || '940815-14-5521',
          phone: applicant.phone || '+60 12-345 6789',
          email: applicant.email || 'borrower@loan-la.my',
          platform: applicant.platform || 'Grab & Foodpanda',
          averageMonthlyNetIncome: applicant.averageMonthlyNetIncome,
          existingCommitments: Math.round(applicant.averageMonthlyNetIncome * (applicant.dsr / 100)),
          targetLoanAmount: loanAmount,
          targetLoanPurpose: 'working_capital',
          transactions: []
        } as any,
        report: {
          score: applicant.score,
          grade: applicant.grade,
          status: applicant.status || 'Approved',
          dsr: applicant.dsr,
          dsrPercentage: applicant.dsr,
          maxRecommendedLoan: loanAmount * 1.5,
          estimatedInstallment: monthlyInstallment,
          monthlySurplus: Math.round(applicant.averageMonthlyNetIncome * 0.5),
          runwayMonths: 6.5,
          confidenceScore: 92,
          recommendations: ['Consistent weekly earnings', 'Low financial risk margin'],
          warningFlags: []
        } as any,
        documentHash: applicant.documentHash,
        isLocked: false,
        language
      });
    } catch (e) {
      console.error('PDF download error:', e);
    }
  };

  // User explicitly approves the package
  const handleApproveAndProceed = () => {
    if (!userConsented) return;

    // Record application in tracker
    const record = {
      id: `app-${Date.now()}`,
      refCode: generatedRefCode,
      lenderName,
      productName: target.productName,
      loanAmount,
      monthlyInstallment,
      appliedAt: `Today, ${new Date().toLocaleTimeString('en-MY', { hour: '2-digit', minute: '2-digit' })}`,
      status: channelType === 'digital_bank_app' ? 'CONDITIONALLY_APPROVED' : 'SUBMITTED',
      speed: target.speed || (channelType === 'digital_bank_app' ? '10 Mins (Digital Payout)' : '24–48 Hours'),
      lenderUrl: portalUrl
    };

    if (onApplicationDispatched) {
      onApplicationDispatched(record);
    }

    setStage('APPLY_GUIDE');
  };

  // Channel helper labels
  const getChannelBadge = () => {
    switch (channelType) {
      case 'digital_bank_app':
        return {
          icon: Smartphone,
          label: isBm ? 'Bank Digital Berlesen (Aplikasi Telefon)' : 'Licensed Digital Bank (Mobile App)',
          color: 'bg-emerald-50 text-emerald-700 border-emerald-200'
        };
      case 'digital_web_portal':
        return {
          icon: Globe,
          label: isBm ? 'Portal Web Digital 100% Online' : '100% Online Web Portal',
          color: 'bg-blue-50 text-blue-700 border-blue-200'
        };
      case 'government_micro_agency':
        return {
          icon: Building2,
          label: isBm ? 'Agensi / Dana Mikro Kerajaan' : 'Government Micro-Fund Agency',
          color: 'bg-amber-50 text-amber-700 border-amber-200'
        };
      default:
        return {
          icon: Building2,
          label: isBm ? 'Perbankan Komersial / Cawangan' : 'Commercial Bank Facility',
          color: 'bg-slate-100 text-slate-700 border-slate-200'
        };
    }
  };

  const channelBadge = getChannelBadge();
  const ChannelIcon = channelBadge.icon;

  // WhatsApp Pre-filled text for TEKUN / BSN / Government agencies
  const whatsappOfficerText = encodeURIComponent(
    isBm
      ? `Salam Tuan/Puan Pegawai Pembiayaan ${lenderName},\n\nSaya ${applicant.name} (No. Kad Pengenalan: ${applicant.icNumber || '940815-14-5521'}) ingin memohon pembiayaan sebanyak RM ${loanAmount.toLocaleString()} bagi tujuan Modal Pusingan.\n\nProfil kewangan saya telah dipra-saring oleh sistem CreditFlow AI:\n- Kod Rujukan: ${generatedRefCode}\n- Pendapatan Bersih Bulanan: RM ${applicant.averageMonthlyNetIncome.toLocaleString()}\n- Skor Kredit (FRI): ${applicant.score}/850 (Gred ${applicant.grade})\n- Nisbah Khidmat Hutang (DSR): ${applicant.dsr.toFixed(1)}%\n- Hash Memo Kredit (CAM): ${applicant.documentHash}\n\nDokumen penyata bank dan Memo Kredit CAM rasmi telah sedia dilampirkan. Mohon bantuan tuan/puan untuk panduan proses borang permohonan.\n\nTerima kasih.`
      : `Dear Financing Officer at ${lenderName},\n\nI am ${applicant.name} (IC: ${applicant.icNumber || '940815-14-5521'}) applying for financing of RM ${loanAmount.toLocaleString()} for Working Capital.\n\nMy financial profile has been pre-underwritten by CreditFlow AI:\n- Reference Code: ${generatedRefCode}\n- Net Monthly Income: RM ${applicant.averageMonthlyNetIncome.toLocaleString()}\n- FRI Credit Score: ${applicant.score}/850 (Grade ${applicant.grade})\n- DSR: ${applicant.dsr.toFixed(1)}%\n- Certified CAM Hash: ${applicant.documentHash}\n\nMy bank statements and official CAM Credit Passport are ready for submission. Please advise on final form intake.\n\nThank you.`
  );

  const whatsappUrl = `https://wa.me/${(lenderData?.whatsappOfficer || '60192238888').replace(/[^0-9]/g, '')}?text=${whatsappOfficerText}`;
  const appDownloadLink = lenderData?.appDownloadUrl?.android || lenderData?.appDownloadUrl?.ios || portalUrl;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(appDownloadLink)}`;

  return (
    <div className="fixed inset-0 z-[95] flex items-center justify-center bg-slate-950/75 backdrop-blur-md p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">

        {/* Modal Header */}
        <div className="bg-slate-950 text-white px-5 py-3.5 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
              <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
            </div>
            <div className="flex items-center gap-2 px-3 py-1 bg-slate-900 rounded-lg border border-slate-800 text-xs font-mono text-slate-300">
              <Lock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="text-slate-400 font-bold uppercase tracking-wider text-[11px]">
                {stage === 'APPROVAL'
                  ? (isBm ? 'Langkah 1/2: Kelulusan Pemohon' : 'Step 1/2: Borrower Approval')
                  : stage === 'APPLY_GUIDE'
                  ? (isBm ? 'Langkah 2/2: Panduan Memohon' : 'Step 2/2: How to Apply')
                  : (isBm ? 'Selesai: Penjejak Permohonan' : 'Completed: Application Tracker')}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* STAGE 1: DOSSIER REVIEW & MANDATORY USER APPROVAL                   */}
        {/* "user should approve then only send out"                            */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {stage === 'APPROVAL' && (
          <div className="p-5 sm:p-6 overflow-y-auto flex flex-col gap-5">
            
            {/* Lender Header Card */}
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-slate-950 via-slate-900 to-slate-800 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-slate-700 shadow-md">
              <div className="flex items-center gap-3.5">
                <BankLogo bankName={lenderName} size="lg" />
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-300">
                      {lenderData?.regulatedBy || 'Bank Negara Malaysia Regulated'}
                    </span>
                  </div>
                  <h3 className="text-lg font-black text-white mt-0.5">{lenderName}</h3>
                  <p className="text-xs text-slate-300 font-medium">
                    {target.productName} · {isBm ? 'Ansuran Est.' : 'Est. Installment:'} <strong className="text-emerald-300">RM {monthlyInstallment.toLocaleString()}/mo</strong>
                  </p>
                </div>
              </div>
              <div className="text-left sm:text-right shrink-0">
                <span className="text-[11px] text-slate-400 block font-medium">{isBm ? 'Jumlah Permohonan' : 'Requested Amount'}</span>
                <span className="text-2xl font-black text-white tabular-nums">RM {loanAmount.toLocaleString()}</span>
              </div>
            </div>

            {/* Application Channel Notice */}
            <div className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 ${channelBadge.color}`}>
              <div className="flex items-center gap-2.5">
                <ChannelIcon className="w-5 h-5 shrink-0" />
                <div>
                  <span className="text-xs font-bold block">{channelBadge.label}</span>
                  <span className="text-[11px] opacity-80">
                    {channelType === 'digital_bank_app'
                      ? (isBm ? 'Permohonan lengkap di telefon pintar anda melalui aplikasi rasmi bank.' : 'Applied directly on smartphone via the bank\'s official mobile app.')
                      : channelType === 'digital_web_portal'
                      ? (isBm ? 'Permohonan 100% digital tanpa perlu hadir ke cawangan fizikal.' : '100% digital web application with no branch visit required.')
                      : (isBm ? 'Pembiayaan subsidi kerajaan dengan pilihan online, WhatsApp atau cawangan.' : 'Subsidized micro-scheme via online, WhatsApp officer or branch.')}
                  </span>
                </div>
              </div>
              <span className="text-[11px] font-black px-2.5 py-1 rounded-full bg-white/80 border border-current shadow-xs shrink-0">
                {target.speed || '24h Approval'}
              </span>
            </div>

            {/* Document Package Checklist Prepared by Loan-La */}
            <div className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-50/50">
              <div className="bg-slate-100 px-4 py-2.5 border-b border-slate-200 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-blue-600" />
                  {isBm ? 'Pakej Dokumen Yang Disediakan Untuk Kelulusan Anda' : 'Document Package Prepared for Your Approval'}
                </span>
                <span className="text-[10px] font-mono text-slate-500 font-bold">
                  HASH: {applicant.documentHash.slice(0, 12)}...
                </span>
              </div>
              <div className="p-3.5 flex flex-col gap-2.5 text-xs">
                <div className="flex items-center gap-2 text-slate-700">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>
                    <strong>{isBm ? 'Memo Penilaian Kredit (CAM PDF Rasmi):' : 'Credit Assessment Memo (CAM PDF):'}</strong> {applicant.score}/850 (Grade {applicant.grade}), DSR {applicant.dsr.toFixed(1)}%
                  </span>
                </div>
                <div className="flex items-center gap-2 text-slate-700">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>
                    <strong>{isBm ? 'Penyata Pendapatan Diselaraskan:' : 'Reconciled Income Statements:'}</strong> RM {applicant.averageMonthlyNetIncome.toLocaleString()}/bulan ({applicant.platform || 'Gig/Self-Employed'})
                  </span>
                </div>
                <div className="flex items-center gap-2 text-slate-700">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>
                    <strong>{isBm ? 'Pengesahan Identiti Pemohon:' : 'Applicant Identity Verification:'}</strong> {applicant.name} ({applicant.icNumber || '940815-14-5521'})
                  </span>
                </div>
              </div>
            </div>

            {/* Applicant Summary Preview */}
            <div className="border border-slate-200 rounded-2xl overflow-hidden">
              <div className="divide-y divide-slate-100 text-xs">
                {prefillFields.slice(0, 5).map(f => (
                  <div key={f.field} className="flex items-center justify-between px-4 py-2 hover:bg-slate-50">
                    <span className="text-slate-500 font-medium">{f.label}</span>
                    <span className="text-slate-900 font-bold">{f.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Mandatory User Consent Declaration */}
            <div className="p-4 bg-amber-50/70 border-2 border-amber-300/80 rounded-2xl flex flex-col gap-3">
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="user-consent-checkbox"
                  checked={userConsented}
                  onChange={(e) => setUserConsented(e.target.checked)}
                  className="mt-1 w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 cursor-pointer shrink-0"
                />
                <label htmlFor="user-consent-checkbox" className="text-xs text-amber-950 font-medium leading-relaxed cursor-pointer select-none">
                  <strong>{isBm ? 'Kebenaran & Pengesahan Pemohon:' : 'Applicant Consent & Authorization:'}</strong>{' '}
                  {isBm
                    ? `Saya telah menyemak maklumat kewangan di atas dan meluluskan Ejen AI Loan-La untuk memulakan pakej permohonan pembiayaan saya ke ${lenderName}. Tiada dokumen akan dihantar tanpa persetujuan saya.`
                    : `I have reviewed the financial details above and authorize Loan-La AI Agent to prepare and guide my financing application to ${lenderName}. No documents are transmitted without my consent.`}
                </label>
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex flex-col sm:flex-row items-center gap-3 pt-1">
              <button
                onClick={onClose}
                className="w-full sm:w-auto px-5 py-3.5 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-50 transition-colors cursor-pointer"
              >
                {isBm ? 'Batal' : 'Cancel'}
              </button>
              <button
                onClick={handleApproveAndProceed}
                disabled={!userConsented}
                className={`w-full sm:flex-1 py-3.5 px-6 rounded-xl font-extrabold text-xs shadow-lg transition-all flex items-center justify-center gap-2 ${
                  userConsented
                    ? 'bg-blue-950 hover:bg-blue-900 text-white cursor-pointer active:scale-[0.98]'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-200'
                }`}
              >
                <CheckCircle2 className={`w-4 h-4 ${userConsented ? 'text-emerald-400' : 'text-slate-400'}`} />
                <span>
                  {isBm
                    ? userConsented ? `Luluskan & Teruskan Memohon ke ${lenderName} →` : 'Sila Tandakan Persetujuan di Atas'
                    : userConsented ? `Approve & Proceed to Apply at ${lenderName} →` : 'Please Check Consent Box Above'}
                </span>
              </button>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* STAGE 2: APPLICATION GUIDANCE TAILORED TO BANK TYPE                 */}
        {/* "if is digital bank they have their own way... cannot let them      */}
        {/*  still think like how to apply"                                     */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {stage === 'APPLY_GUIDE' && (
          <div className="p-5 sm:p-6 overflow-y-auto flex flex-col gap-5">
            
            {/* Status confirmation */}
            <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl">
              <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                <Check className="w-5 h-5 stroke-[2.5]" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-black text-emerald-950">
                  {isBm ? `Pakej Permohonan Diluluskan oleh Anda!` : `Application Package Approved!`}
                </p>
                <p className="text-xs text-emerald-800 mt-0.5">
                  {isBm
                    ? `Kod Rujukan Loan-La: ${generatedRefCode}. Ikuti langkah rasmi di bawah untuk ${lenderName}.`
                    : `Loan-La Reference: ${generatedRefCode}. Follow the official steps below for ${lenderName}.`}
                </p>
              </div>
            </div>

            {/* ─── A) DIGITAL BANK MOBILE APP EXPERIENCE (GXBank, Boost, AEON Bank) ─── */}
            {channelType === 'digital_bank_app' && (
              <div className="flex flex-col gap-4">
                
                {/* Hero App Launch Card */}
                <div className="p-5 bg-gradient-to-br from-slate-900 to-slate-950 text-white rounded-2xl border border-slate-800 flex flex-col gap-4 shadow-xl">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Smartphone className="w-5 h-5 text-emerald-400" />
                      <span className="text-xs font-black uppercase tracking-wider text-slate-200">
                        {isBm ? `Cara Memohon di Aplikasi Mudah Alih ${lenderName}` : `Apply in ${lenderName} Mobile App`}
                      </span>
                    </div>
                    <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                      100% In-App Onboarding
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">
                    {isBm
                      ? `${lenderName} memproses pinjaman sepenuhnya di dalam aplikasi telefon pintar mereka. Anda tidak perlu mencetak borang atau ke cawangan fizikal.`
                      : `${lenderName} processes financing entirely inside their official mobile app. No branch visit or paper printout required.`}
                  </p>

                  <div className="flex flex-col sm:flex-row items-center gap-3">
                    <a
                      href={portalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
                    >
                      <ExternalLink className="w-4 h-4" />
                      <span>{isBm ? `Buka Laman / Pasang Aplikasi ${lenderName}` : `Open / Install ${lenderName} App`}</span>
                    </a>

                    <button
                      onClick={() => setShowQrCode(!showQrCode)}
                      className="w-full sm:w-auto py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 transition-colors flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <QrCode className="w-4 h-4 text-cyan-300" />
                      <span>{showQrCode ? (isBm ? 'Sembunyi QR' : 'Hide QR') : (isBm ? 'Imbas Kod QR' : 'Scan Phone QR')}</span>
                    </button>
                  </div>

                  {/* QR Code expansion */}
                  {showQrCode && (
                    <div className="p-4 bg-white text-slate-900 rounded-xl flex flex-col sm:flex-row items-center gap-4 border border-slate-200 animate-in fade-in duration-200">
                      <img
                        src={qrCodeUrl}
                        alt="Scan QR code for bank app"
                        className="w-32 h-32 rounded-lg border border-slate-200 shrink-0"
                      />
                      <div className="text-xs">
                        <strong className="text-sm font-black text-slate-900 block mb-1">
                          {isBm ? 'Imbas dengan Kamera Telefon Pintar Anda' : 'Scan with Your Phone Camera'}
                        </strong>
                        <p className="text-slate-600 leading-relaxed">
                          {isBm
                            ? `Halakan kamera telefon anda ke kod QR ini untuk terus memuat turun atau membuka aplikasi rasmi ${lenderName} di iOS App Store atau Google Play.`
                            : `Point your smartphone camera at this QR code to download or launch the official ${lenderName} app on iOS App Store or Google Play.`}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Step-by-Step App Walkthrough */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col gap-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider">
                    <Info className="w-4 h-4 text-blue-600" />
                    <span>{isBm ? 'Langkah Memohon di Telefon (Panduan Ejen AI)' : 'Step-by-Step In-App Guide (AI Agent)'}</span>
                  </div>
                  <div className="grid grid-cols-1 gap-2.5">
                    {[
                      {
                        n: '1',
                        title: isBm ? `Buka Aplikasi ${lenderName}` : `Launch ${lenderName} App`,
                        desc: isBm ? 'Daftar masuk ke aplikasi rasmi di telefon pintar anda.' : 'Log in to the official app on your smartphone.'
                      },
                      {
                        n: '2',
                        title: isBm ? 'Pilih Bahagian "Pinjaman / Pembiayaan"' : 'Navigate to "Borrow / FlexiCredit"',
                        desc: isBm ? 'Ketik pada menu FlexiCredit / Pembiayaan Mikro di skrin utama aplikasi.' : 'Tap on FlexiCredit / Micro-Financing banner on the home screen.'
                      },
                      {
                        n: '3',
                        title: isBm ? 'Gunakan Maklumat Pra-Saringan (Fast-Fill)' : 'Use Pre-Screened Fast-Fill Info',
                        desc: isBm ? 'Salin nombor pendapatan RM ' + applicant.averageMonthlyNetIncome.toLocaleString() + ' dan amaun pinjaman di bawah supaya permohonan menepati kelayakan.' : 'Paste your pre-screened net income and requested amount from below to match underwriting approval.'
                      },
                      {
                        n: '4',
                        title: isBm ? 'Pengesahan Swafoto e-KYC (30 Saat)' : '30-Second Facial e-KYC Scan',
                        desc: isBm ? 'Lengkapkan imbasan MyKad dan muka di telefon untuk pengeluaran pembiayaan segera.' : 'Complete your quick selfie verification for immediate digital disbursement.'
                      }
                    ].map(step => (
                      <div key={step.n} className="flex items-start gap-3 p-3 bg-white rounded-xl border border-slate-200">
                        <div className="w-6 h-6 rounded-full bg-slate-900 text-white text-xs font-black flex items-center justify-center shrink-0 mt-0.5">
                          {step.n}
                        </div>
                        <div>
                          <p className="text-xs font-black text-slate-900">{step.title}</p>
                          <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">{step.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            )}

            {/* ─── B) DIGITAL WEB PORTAL EXPERIENCE (Maybank, Alliance, Funding Societies) ─── */}
            {channelType === 'digital_web_portal' && (
              <div className="flex flex-col gap-4">
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl flex flex-col gap-3">
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-blue-700" />
                    <span className="text-xs font-bold text-blue-900 uppercase tracking-wider">
                      {isBm ? 'Portal Rasmi Dalam Talian' : 'Official Online Web Portal'}
                    </span>
                  </div>
                  <p className="text-xs text-blue-800 leading-relaxed">
                    {isBm
                      ? `Permohonan untuk ${lenderName} dihantar melalui portal web rasmi mereka. Klik butang di bawah untuk membuka borang dalam tab baru.`
                      : `Applications for ${lenderName} are completed via their official web portal. Click below to open the application in a new tab.`}
                  </p>
                  <a
                    href={portalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-3 px-4 bg-blue-950 hover:bg-blue-900 text-white font-extrabold text-xs rounded-xl transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer"
                  >
                    <ExternalLink className="w-4 h-4 text-cyan-300" />
                    <span>{isBm ? `Buka Portal Rasmi ${lenderName} Sekarang →` : `Open Official ${lenderName} Portal Now →`}</span>
                  </a>
                </div>
              </div>
            )}

            {/* ─── C) GOVERNMENT MICRO AGENCIES (TEKUN, BSN, MARA, AIM) ─── */}
            {channelType === 'government_micro_agency' && (
              <div className="flex flex-col gap-3">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-amber-600" />
                  {isBm ? 'Pilih Saluran Penghantaran Dokumen:' : 'Select Submission Channel:'}
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Option 1: WhatsApp Officer */}
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-4 rounded-2xl bg-emerald-50 border-2 border-emerald-300 hover:border-emerald-500 hover:shadow-md transition-all flex flex-col gap-2 cursor-pointer group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-emerald-900 flex items-center gap-1.5">
                        <MessageCircle className="w-4 h-4 text-emerald-600" />
                        {isBm ? 'WhatsApp Pegawai Pembiayaan' : 'WhatsApp Loan Officer'}
                      </span>
                      <ArrowRight className="w-4 h-4 text-emerald-600 group-hover:translate-x-1 transition-transform" />
                    </div>
                    <p className="text-[11px] text-emerald-800 leading-relaxed">
                      {isBm
                        ? 'Hantar draf permohonan formal yang telah diformatkan terus kepada pegawai pembiayaan.'
                        : 'Send a pre-formatted professional application pitch directly to a registered loan officer.'}
                    </p>
                  </a>

                  {/* Option 2: Online e-Permohonan Portal */}
                  <a
                    href={portalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-4 rounded-2xl bg-slate-50 border-2 border-slate-300 hover:border-slate-800 hover:shadow-md transition-all flex flex-col gap-2 cursor-pointer group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                        <Globe className="w-4 h-4 text-slate-700" />
                        {isBm ? 'Portal e-Permohonan Rasmi' : 'Official Online Portal'}
                      </span>
                      <ExternalLink className="w-4 h-4 text-slate-700 group-hover:translate-x-1 transition-transform" />
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      {isBm
                        ? `Akses portal permohonan dalam talian rasmi ${lenderName}.`
                        : `Access the official online application portal for ${lenderName}.`}
                    </p>
                  </a>
                </div>
              </div>
            )}

            {/* ─── Fast-Fill Clipboard Card (for ALL bank types) ─── */}
            <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
              <div className="bg-slate-900 px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ClipboardCheck className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    {isBm ? 'Pembantu Salin Pantas (Fast-Fill Assistant)' : 'Fast-Fill Application Assistant'}
                  </span>
                </div>
                <button
                  onClick={handleCopyAll}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 text-[11px] font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  {copiedAll ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedAll ? (isBm ? 'Disalin!' : 'Copied All!') : (isBm ? 'Salin Semua' : 'Copy All')}</span>
                </button>
              </div>

              <div className="divide-y divide-slate-100 text-xs">
                {prefillFields.map(f => (
                  <div key={f.field} className="flex items-center justify-between px-4 py-2.5 hover:bg-slate-50 transition-colors">
                    <span className="text-slate-500 font-medium">{f.label}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-900 font-bold tabular-nums">{f.value}</span>
                      <button
                        onClick={() => handleCopy(f.value.replace('RM ', '').replace(',', ''), f.field)}
                        className="p-1 rounded-md hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                        title={isBm ? 'Salin nilai ini' : 'Copy this value'}
                      >
                        {copiedField === f.field
                          ? <ClipboardCheck className="w-3.5 h-3.5 text-emerald-600" />
                          : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Document Download & Supporting Packet */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                  <Download className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-900 block">
                    {isBm ? 'Perlu Muat Naik Penyata / Bukti Pendapatan?' : 'Need to Upload Statements / Proof of Income?'}
                  </span>
                  <span className="text-[11px] text-slate-500">
                    {isBm ? 'Muat turun Memo Kredit CAM rasmi bersekuriti SHA-256' : 'Download official SHA-256 secured Credit Passport CAM'}
                  </span>
                </div>
              </div>
              <button
                onClick={handleDownloadCamPdf}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs shrink-0"
              >
                <Download className="w-3.5 h-3.5 text-blue-600" />
                <span>{isBm ? 'Muat Turun CAM PDF' : 'Download CAM PDF'}</span>
              </button>
            </div>

            {/* Completion Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={() => setStage('APPROVAL')}
                className="w-full sm:w-auto px-5 py-3 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-50 transition-colors cursor-pointer"
              >
                {isBm ? '← Kembali' : '← Back'}
              </button>
              <button
                onClick={() => setStage('DONE')}
                className="w-full sm:flex-1 py-3.5 px-6 rounded-xl bg-slate-950 hover:bg-slate-800 active:scale-[0.98] text-white font-extrabold text-xs shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4 text-emerald-400" />
                <span>{isBm ? 'Saya Sudah Selesai Menghantar Permohonan' : 'I\'ve Completed the Application'}</span>
              </button>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* STAGE 3: APPLICATION SUBMISSION COMPLETED & TRACKING                */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {stage === 'DONE' && (
          <div className="p-6 sm:p-8 overflow-y-auto flex flex-col gap-6 items-center text-center">
            
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-lg ring-8 ring-emerald-50">
              <CheckCircle2 className="w-8 h-8 stroke-[2.5]" />
            </div>

            <div className="max-w-md">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 font-mono block">
                {isBm ? 'Permohonan Direkodkan' : 'Application Logged & Tracked'}
              </span>
              <h3 className="text-2xl font-black text-slate-900 mt-1">
                {isBm ? 'Tahniah, Langkah Permohonan Selesai!' : 'Application Steps Completed!'}
              </h3>
              <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                {isBm
                  ? `Rekod permohonan anda ke ${lenderName} kini aktif dan disimpan dalam Penjejak Permohonan anda. Pegawai atau sistem underwriting akan memproses dalam masa yang ditetapkan.`
                  : `Your application to ${lenderName} is now tracked in your Application Tracker. Underwriters or the digital system will process within the stated turnaround.`}
              </p>
            </div>

            {/* Reference Details */}
            <div className="w-full max-w-sm p-4 bg-slate-50 border border-slate-200 rounded-2xl text-left flex flex-col gap-2.5 text-xs">
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <span className="text-slate-500 font-medium">{isBm ? 'Kod Rujukan' : 'Reference Code'}</span>
                <span className="font-bold text-slate-900 font-mono text-cyan-800">{generatedRefCode}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <span className="text-slate-500 font-medium">{isBm ? 'Institusi Pembiaya' : 'Financing Lender'}</span>
                <span className="font-bold text-slate-900">{lenderName}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <span className="text-slate-500 font-medium">{isBm ? 'Jumlah Dipohon' : 'Loan Amount'}</span>
                <span className="font-bold text-slate-900 tabular-nums">RM {loanAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">{isBm ? 'Masa Pemprosesan' : 'Turnaround Speed'}</span>
                <span className="font-bold text-emerald-700">{target.speed || '24–48 Hours'}</span>
              </div>
            </div>

            {/* Banker Officer View Preview */}
            {onSwitchToB2BPortal && (
              <div className="w-full max-w-sm p-4 bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl text-left flex flex-col gap-3 border border-slate-700 shadow-md">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs font-black uppercase tracking-wider text-slate-300">
                    {isBm ? 'Paparan Pegawai Bank (Underwriting)' : 'Credit Officer Dossier View'}
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {isBm
                    ? 'Lihat bagaimana pegawai kredit bank menyemak skor FRI dan laporan analisis aliran tunai anda dalam portal institusi.'
                    : 'Inspect how credit risk officers review your certified FRI score and cashflow analytics in the institutional terminal.'}
                </p>
                <button
                  onClick={() => { onClose(); onSwitchToB2BPortal(generatedRefCode); }}
                  className="w-full py-2.5 px-4 bg-white hover:bg-slate-100 text-slate-900 font-black text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <Shield className="w-3.5 h-3.5 text-blue-900" />
                  <span>{isBm ? 'Buka Paparan Pegawai Kredit →' : 'Open Credit Officer View →'}</span>
                </button>
              </div>
            )}

            <button
              onClick={onClose}
              className="w-full max-w-sm py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs transition-colors cursor-pointer"
            >
              {isBm ? 'Tutup & Kembali ke Papan Pemuka' : 'Close & Return to Dashboard'}
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
