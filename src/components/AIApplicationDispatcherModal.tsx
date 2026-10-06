'use client';

import React, { useState, useEffect } from 'react';
import {
  Globe, Shield, CheckCircle2, ArrowRight,
  Lock, FileText, Sparkles, X,
  Building2, ExternalLink, Check, AlertTriangle,
  Copy, ClipboardCheck, Info
} from 'lucide-react';
import BankLogo from '@/components/BankLogo';

export interface DispatcherTarget {
  lenderName: string;
  lenderUrl?: string;
  productName: string;
  installment?: number;
  speed?: string;
  loanAmount?: number;
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

/** The real portal URLs from lenders.ts */
const REAL_PORTAL_URLS: Record<string, string> = {
  'maybank': 'https://www.maybank2u.com.my/maybank2u/malaysia/en/personal/loans/business/sme_clean_loan.page',
  'cimb': 'https://www.cimb.com.my/en/business/financing/micro-financing.html',
  'tekun': 'https://www.tekun.gov.my/index.php/permohonan-pembiayaan',
  'bsn': 'https://www.bsn.com.my/page/micro-sme',
  'gxbank': 'https://www.gxbank.my/personal/loan',
  'boost bank': 'https://www.boostbank.my/business',
  'boost': 'https://www.boostbank.my/business',
  'aeon bank': 'https://www.aeon.bank/business',
  'aeon credit': 'https://www.aeoncredit.com.my/personal-financing',
  'agro bank': 'https://www.agrobank.com.my/product/sme-financing/',
  'agrobank': 'https://www.agrobank.com.my/product/sme-financing/',
  'rhb': 'https://www.rhbgroup.com/personal/loans/personal-financing',
  'direct lending': 'https://www.directlending.my/apply',
  'fundaztic': 'https://www.fundaztic.com/borrower',
  'mara': 'https://www.mara.gov.my/perkhidmatan/pinjaman',
  'bank rakyat': 'https://www.bankrakyat.com.my/personal/financing',
  'bank islam': 'https://www.bankislam.com/personal/personal-financing/',
  'asnb': 'https://www.asnb.com.my',
};

function getRealPortalUrl(lenderName: string): string {
  const lower = lenderName.toLowerCase();
  for (const key of Object.keys(REAL_PORTAL_URLS)) {
    if (lower.includes(key)) return REAL_PORTAL_URLS[key];
  }
  return `https://www.google.com/search?q=${encodeURIComponent(lenderName + ' Malaysia loan apply online')}`;
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
  // 3 stages: PREVIEW → HANDOFF → DONE
  const [stage, setStage] = useState<'PREVIEW' | 'HANDOFF' | 'DONE'>('PREVIEW');
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [generatedRefCode, setGeneratedRefCode] = useState('');

  useEffect(() => {
    if (isOpen) {
      setStage('PREVIEW');
      setCopiedField(null);
      const prefix = (target?.lenderName || 'BNK')
        .replace(/[^A-Za-z]/g, '').substring(0, 3).toUpperCase();
      setGeneratedRefCode(`LL-${new Date().getFullYear()}-${prefix}-${Math.floor(10000 + Math.random() * 90000)}`);
    }
  }, [isOpen, target]);

  if (!isOpen || !target || !applicant) return null;

  const lenderName = target.lenderName;
  const loanAmount = target.loanAmount || 15000;
  const monthlyInstallment = target.installment || Math.round((loanAmount * 1.055) / 24);
  const portalUrl = target.lenderUrl || getRealPortalUrl(lenderName);
  const isBm = language === 'bm';

  // Copy to clipboard helper
  const handleCopy = (text: string, field: string) => {
    try {
      navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      // fallback for older browsers
    }
  };

  // The pre-fill fields the user needs to enter at the bank portal
  const prefillFields = [
    { label: isBm ? 'Nama Penuh' : 'Full Name', value: applicant.name, field: 'name' },
    { label: isBm ? 'Pendapatan Bulanan Bersih' : 'Net Monthly Income', value: `RM ${applicant.averageMonthlyNetIncome.toLocaleString()}`, field: 'income' },
    { label: isBm ? 'Jumlah Pinjaman' : 'Loan Amount', value: `RM ${loanAmount.toLocaleString()}`, field: 'amount' },
    { label: isBm ? 'Tujuan Pinjaman' : 'Loan Purpose', value: 'Working Capital / Business Financing', field: 'purpose' },
    { label: isBm ? 'Skor Kredit (FRI)' : 'Credit Score (FRI)', value: `${applicant.score}/850 (Grade ${applicant.grade})`, field: 'score' },
    { label: isBm ? 'Nisbah Perkhidmatan Hutang' : 'Debt Service Ratio', value: `${applicant.dsr.toFixed(1)}%`, field: 'dsr' },
  ];

  if (applicant.phone) {
    prefillFields.splice(1, 0, { label: isBm ? 'No. Telefon' : 'Phone Number', value: applicant.phone, field: 'phone' });
  }
  if (applicant.email) {
    prefillFields.splice(2, 0, { label: 'Email', value: applicant.email, field: 'email' });
  }

  const handleConfirmAndOpen = () => {
    // Save the application record locally
    const record = {
      id: `app-${Date.now()}`,
      refCode: generatedRefCode,
      lenderName: target.lenderName,
      productName: target.productName,
      loanAmount,
      monthlyInstallment,
      appliedAt: `Today, ${new Date().toLocaleTimeString('en-MY', { hour: '2-digit', minute: '2-digit' })}`,
      status: 'PORTAL_REDIRECT',
      speed: target.speed || '24–48 Hours',
      lenderUrl: portalUrl
    };

    if (onApplicationDispatched) onApplicationDispatched(record);

    // Open the real bank portal
    window.open(portalUrl, '_blank', 'noopener,noreferrer');

    setStage('HANDOFF');
  };

  const handlePortalOpened = () => {
    setStage('DONE');
  };

  return (
    <div className="fixed inset-0 z-[95] flex items-center justify-center bg-slate-950/70 backdrop-blur-md p-3 sm:p-4">
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">

        {/* Header */}
        <div className="bg-slate-950 text-white px-5 py-3.5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-rose-500/80" />
              <div className="w-3 h-3 rounded-full bg-amber-500/80" />
              <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-900 rounded-lg border border-slate-800 text-xs font-mono text-slate-300">
              <Lock className="w-3 h-3 text-emerald-400 shrink-0" />
              <span className="text-slate-400 font-bold">OFFICIAL PORTAL:</span>
              <span className="text-cyan-300 truncate max-w-[220px]">{portalUrl.replace('https://', '')}</span>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ─── STAGE 1: PREVIEW ─── */}
        {stage === 'PREVIEW' && (
          <div className="p-5 sm:p-6 overflow-y-auto flex flex-col gap-5">

            {/* Lender Banner */}
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-slate-950 via-slate-900 to-slate-800 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-slate-700">
              <div className="flex items-center gap-3.5">
                <BankLogo bankName={lenderName} size="lg" />
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    {isBm ? 'Institusi Pembiayaan Berlesen' : 'Licensed Financing Institution'}
                  </span>
                  <h3 className="text-lg font-black text-white mt-0.5">{lenderName}</h3>
                  <p className="text-xs text-slate-300 font-medium">
                    {target.productName} · {isBm ? 'Ansuran Est.' : 'Est. Installment:'} <strong className="text-white">RM {monthlyInstallment.toLocaleString()}/mo</strong>
                  </p>
                </div>
              </div>
              <div className="text-left sm:text-right shrink-0">
                <span className="text-[11px] text-slate-400 block font-medium">{isBm ? 'Jumlah Pinjaman' : 'Loan Amount'}</span>
                <span className="text-2xl font-black text-white tabular-nums">RM {loanAmount.toLocaleString()}</span>
              </div>
            </div>

            {/* How it works — honest explanation */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col gap-3">
              <div className="flex items-center gap-2 text-slate-800 font-bold text-xs uppercase tracking-wider">
                <Info className="w-4 h-4 text-slate-600" />
                <span>{isBm ? 'Apa Yang Akan Berlaku' : 'What Happens Next'}</span>
              </div>
              <div className="flex flex-col gap-2">
                {[
                  { n: '1', text: isBm ? 'Semak maklumat anda di bawah — ini yang perlu anda masukkan di portal bank.' : 'Review your info below — this is what you\'ll need to fill in at the bank portal.' },
                  { n: '2', text: isBm ? 'Klik "Buka Portal Rasmi" — kami akan buka laman permohonan rasmi bank dalam tab baru.' : 'Click "Open Official Portal" — we\'ll open the bank\'s real application page in a new tab.' },
                  { n: '3', text: isBm ? 'Salin dan tampal maklumat anda ke dalam borang permohonan bank.' : 'Copy and paste your details into the bank application form. Use your Credit Passport PDF as your supporting document.' },
                ].map(step => (
                  <div key={step.n} className="flex items-start gap-3 p-3 bg-white rounded-xl border border-slate-200">
                    <div className="w-6 h-6 rounded-full bg-slate-900 text-white text-xs font-black flex items-center justify-center shrink-0 mt-0.5">{step.n}</div>
                    <p className="text-xs text-slate-700 leading-relaxed">{step.text}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Verified applicant summary */}
            <div className="border border-slate-200 rounded-2xl overflow-hidden">
              <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-200 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-slate-600" />
                  {isBm ? 'Maklumat Anda (Disahkan oleh Loan-La)' : 'Your Verified Details (Loan-La Assessed)'}
                </span>
                <span className="text-[10px] font-mono text-slate-400 font-bold">
                  CAM: {applicant.documentHash.slice(0, 10)}...
                </span>
              </div>
              <div className="divide-y divide-slate-100">
                {prefillFields.map((f) => (
                  <div key={f.field} className="flex items-center justify-between px-4 py-2.5 hover:bg-slate-50 transition-colors">
                    <span className="text-xs text-slate-500 font-medium">{f.label}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900 tabular-nums">{f.value}</span>
                      <button
                        onClick={() => handleCopy(f.value.replace('RM ', '').replace(',', ''), f.field)}
                        className="p-1 rounded-md hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                        title="Copy"
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

            {/* Honest disclaimer */}
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="leading-relaxed">
                <strong>{isBm ? 'Penafian:' : 'Disclaimer:'} </strong>
                {isBm
                  ? `Loan-La membuka laman permohonan rasmi ${lenderName} untuk anda. Keputusan kredit adalah sepenuhnya di bawah kuasa jawatankuasa underwriting ${lenderName}. Loan-La tidak memberikan kredit secara langsung.`
                  : `Loan-La opens the real official ${lenderName} application portal for you. The credit decision is entirely at ${lenderName}'s discretion. Loan-La does not provide credit directly.`}
              </div>
            </div>

            {/* Action bar */}
            <div className="flex flex-col sm:flex-row items-center gap-3 pt-1">
              <button
                onClick={onClose}
                className="w-full sm:w-auto px-5 py-3 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-50 transition-colors cursor-pointer"
              >
                {isBm ? 'Batal' : 'Cancel'}
              </button>
              <button
                onClick={handleConfirmAndOpen}
                className="w-full sm:flex-1 py-3.5 px-6 rounded-xl bg-slate-950 hover:bg-slate-800 active:scale-[0.98] text-white font-extrabold text-xs shadow-lg hover:shadow-xl transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Globe className="w-4 h-4 text-emerald-400" />
                <span>{isBm ? `Buka Portal Rasmi ${lenderName} →` : `Open Official ${lenderName} Portal →`}</span>
              </button>
            </div>
          </div>
        )}

        {/* ─── STAGE 2: HANDOFF (portal opened, show copy card) ─── */}
        {stage === 'HANDOFF' && (
          <div className="p-5 sm:p-6 overflow-y-auto flex flex-col gap-5">

            {/* Status banner */}
            <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl">
              <div className="w-9 h-9 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0">
                <ExternalLink className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm font-black text-emerald-800">
                  {isBm ? `Portal ${lenderName} Dibuka!` : `${lenderName} Portal Opened!`}
                </p>
                <p className="text-xs text-emerald-700 mt-0.5">
                  {isBm
                    ? 'Portal rasmi kini terbuka dalam tab baru. Gunakan kad di bawah untuk salin maklumat anda.'
                    : 'The official portal is now open in a new tab. Use the card below to copy your details.'}
                </p>
              </div>
            </div>

            {/* Quick-copy reference card */}
            <div className="border border-slate-200 rounded-2xl overflow-hidden">
              <div className="bg-slate-900 px-4 py-2.5 flex items-center gap-2">
                <ClipboardCheck className="w-3.5 h-3.5 text-cyan-400" />
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  {isBm ? 'Salin & Tampal ke Borang Bank' : 'Copy & Paste into Bank Form'}
                </span>
              </div>
              <div className="divide-y divide-slate-100">
                {prefillFields.map((f) => (
                  <div key={f.field} className="flex items-center justify-between px-4 py-3 hover:bg-slate-50 transition-colors">
                    <span className="text-xs text-slate-500 font-medium">{f.label}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900">{f.value}</span>
                      <button
                        onClick={() => handleCopy(f.value, f.field)}
                        className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 text-[11px] font-bold transition-colors cursor-pointer"
                      >
                        {copiedField === f.field
                          ? <><ClipboardCheck className="w-3 h-3 text-emerald-600" /> <span className="text-emerald-700">Copied!</span></>
                          : <><Copy className="w-3 h-3" /> {isBm ? 'Salin' : 'Copy'}</>}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Ref code + document reminder */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col gap-3">
              <div className="flex justify-between text-xs">
                <span className="text-slate-500 font-medium">{isBm ? 'Kod Rujukan Loan-La:' : 'Loan-La Reference Code:'}</span>
                <button
                  onClick={() => handleCopy(generatedRefCode, 'ref')}
                  className="flex items-center gap-1 font-mono font-bold text-slate-800 hover:text-slate-600 cursor-pointer"
                >
                  {generatedRefCode}
                  {copiedField === 'ref'
                    ? <ClipboardCheck className="w-3.5 h-3.5 text-emerald-600 ml-1" />
                    : <Copy className="w-3 h-3 ml-1 text-slate-400" />}
                </button>
              </div>
              <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-100 rounded-xl">
                <Sparkles className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
                <p className="text-xs text-blue-800 leading-relaxed">
                  {isBm
                    ? 'Ingat: Muat naik PDF Credit Passport anda (dari Laporan Loan-La) sebagai dokumen sokongan di portal bank untuk mempercepat semakan!'
                    : 'Tip: Upload your Credit Passport PDF (from your Loan-La Report) as a supporting document at the bank portal — it speeds up their review significantly!'}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => window.open(portalUrl, '_blank', 'noopener,noreferrer')}
                className="flex-1 py-3 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-50 transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                <Globe className="w-4 h-4" />
                {isBm ? 'Buka Semula Portal' : 'Re-open Portal'}
              </button>
              <button
                onClick={handlePortalOpened}
                className="flex-1 py-3.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-white font-extrabold text-xs transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4 text-emerald-400" />
                {isBm ? 'Saya Sudah Hantar Permohonan' : 'I\'ve Submitted the Application'}
              </button>
            </div>
          </div>
        )}

        {/* ─── STAGE 3: DONE ─── */}
        {stage === 'DONE' && (
          <div className="p-6 sm:p-8 overflow-y-auto flex flex-col gap-6 items-center text-center">

            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-lg ring-8 ring-emerald-50">
              <CheckCircle2 className="w-8 h-8 stroke-[2]" />
            </div>

            <div className="max-w-md">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 font-mono block">
                {isBm ? 'Permohonan Dihantar' : 'Application Submitted'}
              </span>
              <h3 className="text-2xl font-black text-slate-900 mt-1">
                {isBm ? 'Semua Selesai!' : 'All Done!'}
              </h3>
              <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                {isBm
                  ? `Permohonan anda telah dihantar terus ke ${lenderName}. Kami telah simpan rekod ini dalam Penjejak Permohonan anda.`
                  : `Your application has been submitted directly to ${lenderName}. We've saved this record in your Application Tracker.`}
              </p>
            </div>

            {/* Summary card */}
            <div className="w-full max-w-sm p-4 bg-slate-50 border border-slate-200 rounded-2xl text-left flex flex-col gap-2.5 text-xs">
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <span className="text-slate-500 font-medium">{isBm ? 'Kod Rujukan' : 'Reference Code'}</span>
                <span className="font-bold text-slate-900 font-mono">{generatedRefCode}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <span className="text-slate-500 font-medium">{isBm ? 'Pembiaya' : 'Lender'}</span>
                <span className="font-bold text-slate-900">{lenderName}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <span className="text-slate-500 font-medium">{isBm ? 'Jumlah' : 'Amount'}</span>
                <span className="font-bold text-slate-900 tabular-nums">RM {loanAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">{isBm ? 'Masa Proses' : 'Turnaround'}</span>
                <span className="font-bold text-slate-900">{target.speed || '24–48 Hours'}</span>
              </div>
            </div>

            {/* Banker portal promo — honest label */}
            {onSwitchToB2BPortal && (
              <div className="w-full max-w-sm p-4 bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl text-left flex flex-col gap-3 border border-slate-700">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-slate-400" />
                  <span className="text-xs font-black uppercase tracking-wider text-slate-300">
                    {isBm ? 'Demo: Paparan Pegawai Bank' : 'Demo: Banker Officer View'}
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {isBm
                    ? 'Lihat bagaimana pegawai kredit bank akan melihat dossier permohonan anda dalam portal dalaman mereka.'
                    : 'See how a bank credit officer would view your application dossier in their internal underwriting portal.'}
                </p>
                <button
                  onClick={() => { onClose(); onSwitchToB2BPortal(generatedRefCode); }}
                  className="w-full py-2.5 px-4 bg-white hover:bg-slate-100 text-slate-900 font-black text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <Shield className="w-3.5 h-3.5" />
                  {isBm ? 'Buka Paparan Pegawai Kredit →' : 'Open Credit Officer View →'}
                </button>
              </div>
            )}

            <div className="flex gap-3 w-full max-w-sm">
              <button
                onClick={onClose}
                className="flex-1 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
              >
                {isBm ? 'Tutup' : 'Close'}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
