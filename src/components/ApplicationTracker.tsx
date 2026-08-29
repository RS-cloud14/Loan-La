'use client';

import React, { useState, useEffect } from 'react';
import {
  FileText, CheckCircle2, Clock, Building2, AlertCircle,
  ArrowRight, ExternalLink, Shield, Plus, Download,
  History, Eye, AlertTriangle, Activity, RefreshCw, Cpu, UploadCloud
} from 'lucide-react';
import BankLogo from '@/components/BankLogo';
import { useLanguage } from '@/context/LanguageContext';

export interface ApplicationRecord {
  id: string;
  refCode: string;
  lenderName: string;
  productName: string;
  loanAmount: number;
  monthlyInstallment: number;
  appliedAt: string;
  status: 'SUBMITTED' | 'UNDER_REVIEW' | 'CONDITIONALLY_APPROVED' | 'DISBURSED' | 'ACTION_REQUIRED';
  speed: string;
  lenderUrl: string;
  bankQuery?: {
    queryText: string;
    requiredDoc: string;
    requestedAt: string;
    resolved: boolean;
  };
}

export interface ActiveAssessmentTask {
  id: string;
  startedAt: string;
  targetLoanPurpose: string;
  targetLoanAmount: number;
  filesCount: number;
  progress: number; // 0 to 100
  phase: 'ENCRYPTING' | 'AI_AUDITING' | 'CALCULATING_DSR' | 'COMPLETED' | 'RETRYING' | 'FAILED';
  statusMessage: string;
  retryAttempt?: number;
  result?: any;
}

export interface ReportHistoryItem {
  id: string;
  generatedAt: string;
  expiresAt?: string;
  expiresTimestamp?: number;
  name: string;
  platform: string;
  score: number;
  grade: string;
  dsr: number;
  status: string;
  loanPurpose: string;
  loanAmount: number;
  isDemo: boolean;
  result: {
    inputData: any;
    report: any;
    hash: string;
  };
}

interface ApplicationTrackerProps {
  applications: ApplicationRecord[];
  reports?: ReportHistoryItem[];
  activeTask?: ActiveAssessmentTask | null;
  onNewApplication: () => void;
  onViewReport?: (reportItem: ReportHistoryItem) => void;
  onViewActiveTaskResult?: () => void;
  onDownloadReportPdf?: (reportItem: ReportHistoryItem) => void;
  onViewCertifiedPassport?: () => void;
}

export default function ApplicationTracker({
  applications,
  reports = [],
  activeTask,
  onNewApplication,
  onViewReport,
  onViewActiveTaskResult,
  onDownloadReportPdf,
  onViewCertifiedPassport
}: ApplicationTrackerProps) {
  const { language, t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'applications' | 'history'>('applications');
  const [localApps, setLocalApps] = useState<ApplicationRecord[]>(applications);

  useEffect(() => {
    setLocalApps(applications);
  }, [applications]);

  // Proactively announce pending bank queries
  useEffect(() => {
    const pendingApp = localApps.find(a => a.bankQuery && !a.bankQuery.resolved);
    if (pendingApp && typeof window !== 'undefined' && (window as any).__loanLaSpeak) {
      const msg = language === 'bm'
        ? `${pendingApp.lenderName} telah menyemak permohonan anda dan meminta ${pendingApp.bankQuery?.requiredDoc || 'sijil SSM'}. Adakah anda ingin memuat naiknya sekarang?`
        : `${pendingApp.lenderName} has reviewed your application and requested your ${pendingApp.bankQuery?.requiredDoc || 'SSM certificate'}. Would you like to upload it now?`;
      
      const timer = setTimeout(() => {
        (window as any).__loanLaSpeak(msg);
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [localApps, language]);

  const handleResolveBankQuery = (appId: string) => {
    setLocalApps(prev => prev.map(a => {
      if (a.id === appId && a.bankQuery) {
        return {
          ...a,
          status: 'UNDER_REVIEW',
          bankQuery: { ...a.bankQuery, resolved: true }
        };
      }
      return a;
    }));

    if (typeof window !== 'undefined' && (window as any).__loanLaSpeak) {
      const confirmMsg = language === 'bm'
        ? "Dokumen sijil SSM berjaya dimuat naik ke portal Agrobank. Pegawai pengunderait kini menyambung semakan permohonan anda."
        : "SSM certificate uploaded successfully to Agrobank portal. Underwriting officer has resumed reviewing your application.";
      (window as any).__loanLaSpeak(confirmMsg);
    }
  };

  const getStatusBadge = (status: ApplicationRecord['status']) => {
    switch (status) {
      case 'ACTION_REQUIRED':
        return (
          <span className="px-2.5 py-1 text-[11px] font-extrabold rounded-lg bg-amber-100 text-amber-950 border border-amber-300 flex items-center gap-1.5 font-mono">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" /> {language === 'bm' ? 'Tindakan Diperlukan' : 'Action Required'}
          </span>
        );
      case 'SUBMITTED':
        return (
          <span className="px-2.5 py-1 text-[11px] font-extrabold rounded-lg bg-blue-50 text-blue-900 border border-blue-200 flex items-center gap-1.5 font-mono">
            <Clock className="w-3.5 h-3.5 text-blue-900" /> {t.statusSent}
          </span>
        );
      case 'UNDER_REVIEW':
        return (
          <span className="px-2.5 py-1 text-[11px] font-extrabold rounded-lg bg-blue-100 text-blue-950 border border-blue-300 flex items-center gap-1.5 font-mono">
            <Clock className="w-3.5 h-3.5 text-blue-900" /> {t.statusReviewing}
          </span>
        );
      case 'CONDITIONALLY_APPROVED':
        return (
          <span className="px-2.5 py-1 text-[11px] font-extrabold rounded-lg bg-blue-900 text-white border border-blue-900 flex items-center gap-1.5 font-mono">
            <CheckCircle2 className="w-3.5 h-3.5 text-blue-300" /> {t.statusApproved}
          </span>
        );
      case 'DISBURSED':
        return (
          <span className="px-2.5 py-1 text-[11px] font-extrabold rounded-lg bg-blue-950 text-white border border-blue-950 flex items-center gap-1.5 font-mono">
            <CheckCircle2 className="w-3.5 h-3.5 text-blue-300" /> {t.statusFunded}
          </span>
        );
    }
  };

  const getPurposeName = (code: string) => {
    if (language === 'bm') {
      const mapBm: Record<string, string> = {
        personal_cash: 'Tunai Peribadi',
        working_capital: 'Modal Pusingan Perniagaan',
        equipment: 'Pembiayaan Peralatan',
        vehicle: 'Sewa Beli Kenderaan',
        invoice_financing: 'Pembiayaan Invois',
        education: 'Pinjaman Pendidikan'
      };
      return mapBm[code] || code || 'Pinjaman Peribadi';
    }
    const map: Record<string, string> = {
      personal_cash: 'Personal Cash',
      working_capital: 'Working Capital',
      equipment: 'Equipment Financing',
      vehicle: 'Vehicle Hire Purchase',
      invoice_financing: 'Invoice Financing',
      education: 'Education Loan'
    };
    return map[code] || code || 'Personal Loan';
  };

  return (
    <div className="w-full flex flex-col gap-6 animate-fade-in">
      
      {/* Clean Header Banner */}
      <div className="p-6 bg-gradient-to-r from-blue-950 via-blue-900 to-blue-950 text-white rounded-2xl shadow-lg border border-blue-800/60">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-xl md:text-2xl font-extrabold tracking-tight flex items-center gap-2">
              <FileText className="w-6 h-6 text-blue-300" /> {t.myAppsTitle}
            </h2>
            <p className="text-xs text-blue-200 mt-1 max-w-2xl leading-relaxed">
              {t.myAppsSubtitle}
            </p>
          </div>
          
          <div className="flex items-center gap-2 w-full md:w-auto">
            {onViewCertifiedPassport && (
              <button
                onClick={onViewCertifiedPassport}
                className="px-4 py-2.5 bg-blue-900/80 hover:bg-blue-800 border border-blue-700 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shadow-sm"
              >
                <Shield className="w-3.5 h-3.5 text-blue-300" /> {language === 'bm' ? 'Lihat Laporan Semasa' : 'View Current Report'}
              </button>
            )}
            <button
              onClick={onNewApplication}
              className="px-4 py-2.5 bg-white hover:bg-blue-50 text-blue-950 text-xs font-extrabold rounded-xl shadow-md transition-all flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4 text-blue-900" /> {language === 'bm' ? 'Penilaian Baru' : 'New Assessment'}
            </button>
          </div>
        </div>
      </div>

      {/* LIVE ACTIVE AUDIT & ASSESSMENT TASK CARD (DYNAMIC STATUS) */}
      {activeTask && (
        <div className={`p-6 rounded-3xl border shadow-lg transition-all flex flex-col gap-4 animate-fade-in ${
          activeTask.phase === 'COMPLETED' 
            ? 'bg-emerald-50/80 border-emerald-300 shadow-emerald-950/5' 
            : activeTask.phase === 'FAILED'
              ? 'bg-rose-50/80 border-rose-300 shadow-rose-950/5'
              : 'bg-gradient-to-r from-blue-50 via-white to-blue-50 border-blue-300 shadow-blue-950/5'
        }`}>
          {/* Card Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 pb-4">
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-2xl flex items-center justify-center shrink-0 ${
                activeTask.phase === 'COMPLETED'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : activeTask.phase === 'FAILED'
                    ? 'bg-rose-600 text-white shadow-md'
                    : 'bg-blue-950 text-white shadow-md'
              }`}>
                {activeTask.phase === 'COMPLETED' ? (
                  <CheckCircle2 className="w-6 h-6 text-white" />
                ) : activeTask.phase === 'FAILED' ? (
                  <AlertCircle className="w-6 h-6 text-white" />
                ) : (
                  <RefreshCw className="w-5 h-5 text-blue-200 animate-spin" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-base font-extrabold text-blue-950">
                    {activeTask.phase === 'COMPLETED'
                      ? (language === 'bm' ? 'Penilaian Selesai · Laporan Pra-Kelulusan Sedia!' : 'Assessment Complete · Pre-Approval Dossier Ready!')
                      : activeTask.phase === 'RETRYING'
                        ? (language === 'bm' ? 'Menghubungkan Semula AI (Sambungan Semula Auto)...' : 'Reconnecting AI (Auto-Retrying)...')
                        : (language === 'bm' ? 'Penilaian Aliran Tunai & Pra-Kelulusan Sedang Diproses' : 'Live Income & Cashflow Assessment')}
                  </h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-900 border border-blue-200">
                    {getPurposeName(activeTask.targetLoanPurpose)} · RM {activeTask.targetLoanAmount.toLocaleString()}
                  </span>
                </div>
                <p className="text-xs text-slate-600 font-medium mt-1">
                  {activeTask.statusMessage}
                </p>
              </div>
            </div>

            <div className="shrink-0">
              {activeTask.phase === 'COMPLETED' ? (
                <button
                  onClick={() => onViewActiveTaskResult?.()}
                  className="px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer active:scale-95 animate-pulse"
                >
                  <span>{language === 'bm' ? 'Lihat Laporan & Pilihan Bank →' : 'View Full Report & Matched Banks →'}</span>
                </button>
              ) : activeTask.phase === 'FAILED' ? (
                <button
                  onClick={onNewApplication}
                  className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-xs"
                >
                  {language === 'bm' ? 'Cuba Semula' : 'Retry'}
                </button>
              ) : (
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 border border-slate-200 text-slate-900 rounded-lg text-xs font-semibold">
                  <RefreshCw className="w-3.5 h-3.5 text-blue-900 animate-spin" />
                  <span>{activeTask.progress}%</span>
                </div>
              )}
            </div>
          </div>

          {/* Progress Bar & Phase Steps */}
          <div className="flex flex-col gap-2">
            <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden relative">
              <div 
                className={`h-full transition-all duration-500 rounded-full ${
                  activeTask.phase === 'COMPLETED' ? 'bg-emerald-500' : 'bg-blue-600'
                }`}
                style={{ width: `${activeTask.progress}%` }}
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-xs">
              <div className={`flex items-center gap-1.5 ${activeTask.progress >= 20 ? 'text-blue-950 font-bold' : 'text-slate-400'}`}>
                <CheckCircle2 className={`w-3.5 h-3.5 ${activeTask.progress >= 20 ? 'text-blue-900' : 'text-slate-300'}`} />
                <span className="text-[11px]">{language === 'bm' ? '1. Penyulitan Data' : '1. Data Encryption'}</span>
              </div>
              <div className={`flex items-center gap-1.5 ${activeTask.progress >= 60 ? 'text-blue-950 font-bold' : 'text-slate-400'}`}>
                <CheckCircle2 className={`w-3.5 h-3.5 ${activeTask.progress >= 60 ? 'text-blue-900' : 'text-slate-300'}`} />
                <span className="text-[11px]">{language === 'bm' ? '2. Audit AI Penyata' : '2. AI Bank & Gig Audit'}</span>
              </div>
              <div className={`flex items-center gap-1.5 ${activeTask.progress >= 90 ? 'text-blue-950 font-bold' : 'text-slate-400'}`}>
                <CheckCircle2 className={`w-3.5 h-3.5 ${activeTask.progress >= 90 ? 'text-blue-900' : 'text-slate-300'}`} />
                <span className="text-[11px]">{language === 'bm' ? '3. Kiraan DSR & Had' : '3. DSR & Bank Match'}</span>
              </div>
              <div className={`flex items-center gap-1.5 ${activeTask.phase === 'COMPLETED' ? 'text-emerald-700 font-bold' : 'text-slate-400'}`}>
                <CheckCircle2 className={`w-3.5 h-3.5 ${activeTask.phase === 'COMPLETED' ? 'text-emerald-600' : 'text-slate-300'}`} />
                <span className="text-[11px]">{language === 'bm' ? '4. Laporan Sedia' : '4. Dossier Ready'}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Segmented Tab Switcher */}
      <div className="flex items-center gap-2 p-1 bg-slate-100/90 border border-slate-200 rounded-2xl w-fit">
        <button
          onClick={() => setActiveTab('applications')}
          className={`px-4 py-2 text-xs font-extrabold rounded-xl transition-all flex items-center gap-2 ${
            activeTab === 'applications'
              ? 'bg-blue-950 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Building2 className="w-3.5 h-3.5" />
          <span>{t.tabBankApps} ({applications.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`px-4 py-2 text-xs font-extrabold rounded-xl transition-all flex items-center gap-2 ${
            activeTab === 'history'
              ? 'bg-blue-950 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <History className="w-3.5 h-3.5" />
          <span>{t.tabHistory} ({reports.length})</span>
        </button>
      </div>

      {/* TAB 1: BANK APPLICATIONS */}
      {activeTab === 'applications' && (
        <>
          {applications.length === 0 ? (
            /* Empty State */
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center flex flex-col items-center justify-center gap-4 shadow-sm">
              <div className="p-4 bg-slate-50 text-slate-400 rounded-2xl border border-slate-200">
                <Building2 className="w-10 h-10 text-blue-900" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-blue-950">No Submitted Bank Applications Yet</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 leading-relaxed">
                  Complete your income statement check and select a matched bank to submit your verified application.
                </p>
              </div>
              <button
                onClick={onNewApplication}
                className="mt-2 px-6 py-3 bg-blue-950 hover:bg-blue-900 text-white text-xs font-extrabold rounded-xl shadow-md transition-all flex items-center gap-2"
              >
                <FileText className="w-4 h-4 text-blue-300" /> Start Free Assessment
              </button>
            </div>
          ) : (
            /* List of Applications */
            <div className="grid grid-cols-1 gap-4">
              {localApps.map((app) => (
                <div key={app.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col gap-4 hover:border-blue-300 transition-all">
                  
                  {/* Top Row: Lender & Status */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                    <div className="flex items-center gap-3">
                      <BankLogo bankName={app.lenderName} size="md" />
                      <div>
                        <h3 className="text-base font-extrabold text-blue-950">{app.lenderName}</h3>
                        <span className="text-xs text-slate-500 block">{app.productName}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {getStatusBadge(app.status)}
                    </div>
                  </div>

                  {/* Bank Action Required Alert Banner */}
                  {app.bankQuery && !app.bankQuery.resolved && (
                    <div className="p-4 rounded-xl bg-amber-50/95 border border-amber-300 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-fade-in">
                      <div className="flex items-start gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs mt-0.5">
                          <AlertTriangle className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-black text-amber-950 uppercase tracking-wider bg-amber-200/80 px-2 py-0.5 rounded-md">
                              {language === 'bm' ? 'Tindakan Diperlukan Oleh Bank' : 'Bank Action Required'}
                            </span>
                            <span className="text-[10px] text-amber-700 font-bold">
                              {app.bankQuery.requestedAt}
                            </span>
                          </div>
                          <p className="text-xs text-amber-900 font-medium mt-1 leading-relaxed">
                            {app.bankQuery.queryText}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleResolveBankQuery(app.id)}
                        className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 active:scale-95 text-white font-bold text-xs rounded-xl transition-all shadow-xs shrink-0 flex items-center gap-1.5 cursor-pointer"
                      >
                        <UploadCloud className="w-4 h-4" />
                        <span>{language === 'bm' ? `Muat Naik ${app.bankQuery.requiredDoc}` : `Upload ${app.bankQuery.requiredDoc}`}</span>
                      </button>
                    </div>
                  )}

                  {app.bankQuery && app.bankQuery.resolved && (
                    <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-2 text-xs text-emerald-800">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="font-medium">
                        {language === 'bm'
                          ? `Dokumen ${app.bankQuery.requiredDoc} telah disahkan dan diterima oleh Agrobank. Pengunderaitan disambung semula.`
                          : `${app.bankQuery.requiredDoc} verified and acknowledged by Agrobank. Underwriting resumed.`}
                      </span>
                    </div>
                  )}

                  {/* Middle Row: Metrics & Ref Code */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100 font-mono text-xs">
                    <div>
                      <span className="text-[9px] text-slate-400 uppercase font-bold block">Application Ref</span>
                      <span className="font-extrabold text-blue-950">{app.refCode}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-400 uppercase font-bold block">Loan Amount</span>
                      <span className="font-extrabold text-blue-950">RM {app.loanAmount.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-400 uppercase font-bold block">Est. Installment</span>
                      <span className="font-bold text-slate-700">RM {app.monthlyInstallment}/mo</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-400 uppercase font-bold block">Submitted At</span>
                      <span className="font-bold text-slate-700">{app.appliedAt}</span>
                    </div>
                  </div>

                  {/* Progress Milestones Tracker */}
                  <div className="p-4 bg-blue-50/40 rounded-xl border border-blue-100 flex flex-col gap-2">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-950">
                      Application Progress
                    </span>
                    
                    <div className="grid grid-cols-3 gap-2 text-xs pt-1">
                      <div className="flex items-center gap-2 text-blue-900 font-bold">
                        <CheckCircle2 className="w-4 h-4 text-blue-900 shrink-0" />
                        <span className="text-[11px]">1. Application Sent</span>
                      </div>
                      <div className="flex items-center gap-2 text-blue-900 font-bold">
                        <CheckCircle2 className="w-4 h-4 text-blue-900 shrink-0" />
                        <span className="text-[11px]">2. Income Verified</span>
                      </div>
                      <div className={`flex items-center gap-2 font-semibold ${app.status === 'CONDITIONALLY_APPROVED' ? 'text-emerald-700 font-bold' : 'text-slate-600'}`}>
                        {app.status === 'CONDITIONALLY_APPROVED' ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        ) : (
                          <Clock className="w-4 h-4 text-blue-900 shrink-0" />
                        )}
                        <span className="text-[11px]">{app.status === 'CONDITIONALLY_APPROVED' ? '3. Approved / Ready' : `3. Bank Review (Speed: ${app.speed})`}</span>
                      </div>
                    </div>
                  </div>

                  {/* Bottom Actions */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1 text-xs">
                    <span className="text-[11px] text-slate-500 font-medium">
                      Expected turnaround: <strong>{app.speed}</strong> via direct contact from {app.lenderName}.
                    </span>
                    
                    <div className="flex items-center gap-2">
                      <a
                        href={app.lenderUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3.5 py-1.5 text-xs font-bold text-blue-900 bg-white border border-slate-300 hover:bg-slate-50 rounded-xl transition-all flex items-center gap-1"
                      >
                        <span>Bank Portal</span> <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>

                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* TAB 2: ASSESSMENT HISTORY */}
      {activeTab === 'history' && (
        <>
          {reports.length === 0 ? (
            /* Empty State */
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center flex flex-col items-center justify-center gap-4 shadow-sm">
              <div className="p-4 bg-slate-50 text-slate-400 rounded-2xl border border-slate-200">
                <History className="w-10 h-10 text-blue-900" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-blue-950">No Assessment History Recorded</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 leading-relaxed">
                  Every time you run an income check, your generated report will be saved here (valid for 30 days).
                </p>
              </div>
              <button
                onClick={onNewApplication}
                className="mt-2 px-6 py-3 bg-blue-950 hover:bg-blue-900 text-white text-xs font-extrabold rounded-xl shadow-md transition-all flex items-center gap-2"
              >
                <FileText className="w-4 h-4 text-blue-300" /> Run First Assessment
              </button>
            </div>
          ) : (
            /* List of Reports */
            <div className="grid grid-cols-1 gap-4">
              {reports.map((rep, idx) => {
                const isExpired = rep.expiresTimestamp ? Date.now() > rep.expiresTimestamp : false;
                const isLatest = idx === 0;
                return (
                <div 
                  key={rep.id} 
                  className={`bg-white rounded-2xl border p-5 sm:p-6 flex flex-col gap-4 transition-all ${
                    isLatest 
                      ? 'border-blue-900/40 shadow-sm ring-1 ring-blue-950/5' 
                      : 'border-slate-200 hover:border-slate-300 shadow-xs'
                  }`}
                >
                  
                  {/* Card Header: Applicant Name, Status Badges, Score & Grade */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3.5">
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm sm:text-base font-bold text-slate-900">{rep.name}</h3>
                        {isLatest && (
                          <span className="text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-md">
                            {language === 'bm' ? 'Laporan Terkini' : 'Latest Report'}
                          </span>
                        )}
                        {isExpired ? (
                          <span className="text-[11px] font-medium bg-rose-50 text-rose-800 border border-rose-200 px-2 py-0.5 rounded-md flex items-center gap-1.5">
                            <Clock className="w-3 h-3 text-rose-700" /> {language === 'bm' ? 'Tamat Tempoh (>30 Hari)' : 'Expired (>30 Days)'}
                          </span>
                        ) : (
                          <span className="text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200 px-2 py-0.5 rounded-md flex items-center gap-1.5">
                            <Clock className="w-3 h-3 text-slate-500" /> {language === 'bm' ? `Sah 30 Hari (Tamat: ${rep.expiresAt || '30 hari'})` : `30-Day Validity (Expires: ${rep.expiresAt || '30 days'})`}
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-slate-500 font-normal">
                        {rep.platform} · {language === 'bm' ? 'Dinilai pada' : 'Assessed on'} {rep.generatedAt}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
                      <div className="px-3 py-1 bg-slate-100 border border-slate-200 rounded-xl text-center min-w-[56px]">
                        <span className="text-[9px] uppercase font-semibold text-slate-500 block">Score</span>
                        <span className="text-sm font-bold text-slate-900">{rep.score}</span>
                      </div>
                      <div className="px-3 py-1 bg-blue-950 text-white rounded-xl text-center min-w-[56px]">
                        <span className="text-[9px] uppercase font-semibold text-blue-200 block">Grade</span>
                        <span className="text-sm font-bold text-white">{rep.grade}</span>
                      </div>
                    </div>
                  </div>

                  {/* Loan Scope Lock Banner */}
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2 text-slate-700">
                      <span className="text-[10px] uppercase font-semibold text-slate-600 bg-white border border-slate-200 px-2 py-0.5 rounded">
                        {language === 'bm' ? 'Skop Permohonan' : 'Assessment Scope'}
                      </span>
                      <span className="font-semibold text-slate-900 text-xs">
                        {getPurposeName(rep.loanPurpose)} · RM {(rep.loanAmount || 5000).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* 4-Metric Inflow & Cashflow Grid */}
                  {(() => {
                    const assessedInflow = 
                      rep.result?.inputData?.averageMonthlyNetIncome ?? 
                      rep.result?.report?.monthlyInflow ?? 
                      (rep.result?.inputData?.monthlyIncomes?.length 
                        ? (rep.result.inputData.monthlyIncomes.reduce((a: number, b: number) => a + b, 0) / rep.result.inputData.monthlyIncomes.length) 
                        : null);

                    const netCashFlow = 
                      rep.result?.report?.monthlySurplus ?? 
                      rep.result?.report?.netOperatingIncome ?? 
                      (assessedInflow && rep.result?.inputData?.averageMonthlyExpenses 
                        ? assessedInflow - rep.result.inputData.averageMonthlyExpenses 
                        : assessedInflow ? Math.round(assessedInflow * 0.65) : null);

                    return (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200/70">
                        <div>
                          <span className="text-[11px] text-slate-500 font-medium block">
                            {language === 'bm' ? 'Aliran Masuk Bulanan' : 'Assessed Inflow'}
                          </span>
                          <span className="text-xs sm:text-sm font-bold text-slate-900 block mt-0.5">
                            {assessedInflow ? `RM ${Math.round(assessedInflow).toLocaleString()}/mo` : 'RM 3,500/mo'}
                          </span>
                        </div>
                        <div>
                          <span className="text-[11px] text-slate-500 font-medium block">
                            {language === 'bm' ? 'Aliran Tunai Bersih' : 'Net Cash Flow'}
                          </span>
                          <span className="text-xs sm:text-sm font-bold text-slate-900 block mt-0.5">
                            {netCashFlow ? `RM ${Math.round(netCashFlow).toLocaleString()}/mo` : 'RM 2,250/mo'}
                          </span>
                        </div>
                        <div>
                          <span className="text-[11px] text-slate-500 font-medium block">
                            {language === 'bm' ? 'Sasaran Pinjaman' : 'Target Loan'}
                          </span>
                          <span className="text-xs sm:text-sm font-bold text-slate-900 block mt-0.5">
                            RM {(rep.loanAmount || rep.result?.inputData?.targetLoanAmount || 5000).toLocaleString()}
                          </span>
                        </div>
                        <div>
                          <span className="text-[11px] text-slate-500 font-medium block">
                            {language === 'bm' ? 'Nisbah DSR' : 'Calculated DSR'}
                          </span>
                          <span className="text-xs sm:text-sm font-bold text-slate-900 block mt-0.5">
                            {(rep.dsr ?? rep.result?.report?.dsr ?? 0).toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Action Buttons */}
                  <div className="flex items-center justify-end gap-2 pt-1">
                    {onDownloadReportPdf && (
                      <button
                        onClick={() => onDownloadReportPdf(rep)}
                        className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5 text-slate-600" />
                        <span>Download PDF</span>
                      </button>
                    )}

                    {onViewReport && (
                      <button
                        onClick={() => onViewReport(rep)}
                        className="px-4 py-2 bg-blue-950 hover:bg-blue-900 text-white text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5 text-blue-200" />
                        <span>{language === 'bm' ? 'Lihat Laporan Penuh & Padanan Bank →' : 'View Full Report & Matched Banks →'}</span>
                      </button>
                    )}
                  </div>

                </div>
                );
              })}
            </div>
          )}
        </>
      )}

    </div>
  );
}
