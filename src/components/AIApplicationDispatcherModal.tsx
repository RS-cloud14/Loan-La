'use client';

import React, { useState, useEffect } from 'react';
import {
  Globe, Shield, CheckCircle2, AlertCircle, ArrowRight,
  RefreshCw, Cpu, Lock, FileText, Send, Sparkles, X,
  Building2, ExternalLink, ChevronRight, Check, AlertTriangle,
  Smartphone, Terminal, Eye, Layers
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

export default function AIApplicationDispatcherModal({
  isOpen,
  onClose,
  target,
  applicant,
  language = 'en',
  onApplicationDispatched,
  onSwitchToB2BPortal
}: AIApplicationDispatcherModalProps) {
  // Dispatcher stages: 'PREVIEW' -> 'EXECUTING' -> 'COMPLETED'
  const [dispatchStage, setDispatchStage] = useState<'PREVIEW' | 'EXECUTING' | 'COMPLETED'>('PREVIEW');
  const [executionStep, setExecutionStep] = useState<number>(0);
  const [progress, setProgress] = useState<number>(0);
  const [generatedRefCode, setGeneratedRefCode] = useState<string>('');
  const [logs, setLogs] = useState<string[]>([]);

  // Reset when opened
  useEffect(() => {
    if (isOpen) {
      setDispatchStage('PREVIEW');
      setExecutionStep(0);
      setProgress(0);
      setLogs([]);
      const lenderPrefix = (target?.lenderName || 'BNK')
        .replace(/[^A-Za-z]/g, '')
        .substring(0, 3)
        .toUpperCase();
      const ref = `LL-2026-${lenderPrefix}-${Math.floor(10000 + Math.random() * 90000)}`;
      setGeneratedRefCode(ref);
    }
  }, [isOpen, target]);

  if (!isOpen || !target || !applicant) return null;

  const lenderName = target.lenderName;
  const loanAmount = target.loanAmount || 15000;
  const monthlyInstallment = target.installment || Math.round((loanAmount * 1.06) / 24);
  const lenderDomain = lenderName.toLowerCase().includes('gxbank')
    ? 'gxbank.my'
    : lenderName.toLowerCase().includes('tekun')
      ? 'tekun.gov.my'
      : lenderName.toLowerCase().includes('maybank')
        ? 'maybank2u.com.my'
        : lenderName.toLowerCase().includes('boost')
          ? 'boostbank.my'
          : lenderName.toLowerCase().includes('aeon')
            ? 'aeoncredit.com.my'
            : 'lender-gateway.my';

  const gatewayUrl = `https://gateway.${lenderDomain}/api/v2/intake/credit-application`;

  const executionSteps = [
    {
      agent: 'Agent 1: Forensic & Integrity Agent',
      action: 'Verifying bank statement cryptographic hash & BNM RMiT integrity watermark...',
      detail: `SHA-256: ${applicant.documentHash.slice(0, 16)}... (Metadata origin: Verified Bank Core)`
    },
    {
      agent: 'Agent 2: Cashflow Reconciliation Agent',
      action: 'Reconciling 3-month digital payouts against bank statement credit entries...',
      detail: `Verified Net Inflow: RM ${applicant.averageMonthlyNetIncome.toLocaleString()}/mo (${applicant.platform || 'Gig/SME Platform'})`
    },
    {
      agent: 'Agent 3: Policy & Underwriting Risk Agent',
      action: 'Computing Net Disposable Income (NDI) & Debt Service Ratio (DSR)...',
      detail: `Calculated DSR: ${applicant.dsr.toFixed(1)}% | FRI Score: ${applicant.score}/850 (Grade ${applicant.grade})`
    },
    {
      agent: 'Agent 4: Autonomous Robotic Form Dispatcher',
      action: `Connecting to ${lenderName} Secured Intake Gateway (TLS 1.3)...`,
      detail: `POST ${gatewayUrl} (Open Banking Standard Payload)`
    },
    {
      agent: 'Agent 4: Autonomous Robotic Form Dispatcher',
      action: 'Auto-filling applicant credentials & attaching certified Credit Assessment Memo (CAM)...',
      detail: `Applicant: ${applicant.name} | MyKad: Verified | CAM Attached: CAM-2026-${applicant.name.replace(/\s+/g, '')}.pdf`
    },
    {
      agent: 'Lender Gateway Handshake',
      action: 'Receiving institutional acknowledgment & registering into underwriter queue...',
      detail: `HTTP 201 Created · Application Reference: ${generatedRefCode}`
    }
  ];

  const handleStartAgentDispatch = () => {
    setDispatchStage('EXECUTING');
    setExecutionStep(0);
    setProgress(5);
    setLogs([`[0.0s] Initializing Loan-La Autonomous Underwriting & Application Dispatcher...`]);

    const stepTimers: NodeJS.Timeout[] = [];

    executionSteps.forEach((step, idx) => {
      const delay = (idx + 1) * 750;
      const t = setTimeout(() => {
        setExecutionStep(idx + 1);
        setProgress(Math.round(((idx + 1) / executionSteps.length) * 100));
        setLogs(prev => [
          ...prev,
          `[${((idx + 1) * 0.8).toFixed(1)}s] [${step.agent}] ${step.action}`
        ]);

        if (idx === executionSteps.length - 1) {
          // Final completion
          setTimeout(() => {
            setDispatchStage('COMPLETED');

            // Construct registered record
            const newRecord = {
              id: `app-${Date.now()}`,
              refCode: generatedRefCode,
              lenderName: target.lenderName,
              productName: target.productName,
              loanAmount: loanAmount,
              monthlyInstallment: monthlyInstallment,
              appliedAt: `Today, ${new Date().toLocaleTimeString('en-MY', { hour: '2-digit', minute: '2-digit' })}`,
              status: 'SUBMITTED',
              speed: target.speed || '24 Hours',
              lenderUrl: target.lenderUrl || `https://${lenderDomain}`
            };

            if (onApplicationDispatched) {
              onApplicationDispatched(newRecord);
            }
          }, 600);
        }
      }, delay);
      stepTimers.push(t);
    });
  };

  return (
    <div className="fixed inset-0 z-[95] flex items-center justify-center bg-blue-950/70 backdrop-blur-md p-3 sm:p-4 animate-fade-in">
      <div className="w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* MODAL HEADER: Simulated Browser / Secure Gateway Bar */}
        <div className="bg-slate-950 text-white px-4 py-3 sm:px-6 sm:py-3.5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="flex items-center gap-1.5 shrink-0">
              <div className="w-3 h-3 rounded-full bg-rose-500/80"></div>
              <div className="w-3 h-3 rounded-full bg-amber-500/80"></div>
              <div className="w-3 h-3 rounded-full bg-emerald-500/80"></div>
            </div>

            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-slate-900 rounded-lg border border-slate-800 text-xs font-mono text-slate-300 truncate max-w-md">
              <Lock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="text-slate-400 font-bold">SECURE SSL 256-BIT:</span>
              <span className="text-cyan-300 truncate">{gatewayUrl}</span>
            </div>

            <span className="sm:hidden text-xs font-mono text-cyan-300 font-bold truncate">
              {lenderName} Gateway
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-900/60 text-blue-200 border border-blue-700 hidden sm:inline-block">
              BNM OPEN FINTECH SANDBOX
            </span>
            <button
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* STAGE 1: APPLICATION PREVIEW & AGENT BRIEFING */}
        {dispatchStage === 'PREVIEW' && (
          <div className="p-5 sm:p-6 overflow-y-auto flex flex-col gap-5">
            {/* Top banner: Lender match summary */}
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-blue-900/40">
              <div className="flex items-center gap-3.5">
                <BankLogo bankName={lenderName} size="lg" />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-cyan-400 font-mono">
                      Target Institution
                    </span>
                    <span className="text-[10px] px-2 py-0.2 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 font-medium">
                      API Gateway Online
                    </span>
                  </div>
                  <h3 className="text-lg font-black text-white mt-0.5">{lenderName}</h3>
                  <p className="text-xs text-slate-300 font-medium">
                    {target.productName} · Est. Ansuran: <strong className="text-white">RM {monthlyInstallment.toLocaleString()}/mo</strong>
                  </p>
                </div>
              </div>

              <div className="text-left sm:text-right shrink-0">
                <span className="text-[11px] text-slate-400 block font-medium">Financing Quantum</span>
                <span className="text-xl font-black text-cyan-300 tabular-nums">RM {loanAmount.toLocaleString()}</span>
              </div>
            </div>

            {/* How Loan-La AI Agent Works Here */}
            <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-2xl flex flex-col gap-2.5">
              <div className="flex items-center gap-2 text-blue-950 font-bold text-xs uppercase tracking-wider">
                <Sparkles className="w-4 h-4 text-blue-900" />
                <span>How the Loan-La AI Agent Submits on Your Behalf:</span>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed font-normal">
                Instead of requiring you to fill out 20 manual form pages on {lenderName}'s website, our <strong>Collegiate AI Agent System</strong> packages your pre-verified financial evidence into a standardized <strong>Credit Assessment Memorandum (CAM)</strong>, connects to the lender's digital intake gateway, and submits the dossier directly to their underwriter review queue.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-1">
                <div className="p-2.5 bg-white rounded-xl border border-blue-100 flex items-center gap-2 text-[11px] font-bold text-slate-800">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Verified RMiT Statement Hash</span>
                </div>
                <div className="p-2.5 bg-white rounded-xl border border-blue-100 flex items-center gap-2 text-[11px] font-bold text-slate-800">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>3-Way Income Reconciliation</span>
                </div>
                <div className="p-2.5 bg-white rounded-xl border border-blue-100 flex items-center gap-2 text-[11px] font-bold text-slate-800">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Zero Manual Form Filling</span>
                </div>
              </div>
            </div>

            {/* Applicant Pre-flight Data Verification Table */}
            <div className="border border-slate-200 rounded-2xl overflow-hidden">
              <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-200 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-blue-900" /> Certified Dossier Payload to Dispatch
                </span>
                <span className="text-[10px] font-mono text-slate-500 font-bold">
                  HASH: {applicant.documentHash.slice(0, 12)}...
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-slate-100 text-xs">
                <div className="p-3">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">Applicant</span>
                  <span className="font-bold text-slate-900 mt-0.5 block truncate">{applicant.name}</span>
                </div>
                <div className="p-3">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">Net Monthly Income</span>
                  <span className="font-bold text-slate-900 mt-0.5 block tabular-nums">RM {applicant.averageMonthlyNetIncome.toLocaleString()}</span>
                </div>
                <div className="p-3">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">FRI Score</span>
                  <span className="font-bold text-blue-950 mt-0.5 block tabular-nums">{applicant.score} / 850 (Grade {applicant.grade})</span>
                </div>
                <div className="p-3">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">Debt Service Ratio</span>
                  <span className="font-bold text-emerald-700 mt-0.5 block tabular-nums">{applicant.dsr.toFixed(1)}%</span>
                </div>
              </div>
            </div>

            {/* Important Disclaimer */}
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="leading-relaxed">
                <strong>Online Credit Agent Disclaimer:</strong> Loan-La acts as an independent application preparation and routing agent. We do not provide credit directly and do not guarantee final approval. The loan decision remains with {lenderName}'s credit underwriting committee.
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto px-5 py-3 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-50 transition-colors cursor-pointer"
              >
                {language === 'bm' ? 'Batal' : 'Cancel'}
              </button>

              <button
                type="button"
                onClick={handleStartAgentDispatch}
                className="w-full sm:flex-1 py-3.5 px-6 rounded-xl bg-blue-950 hover:bg-blue-900 active:scale-98 text-white font-extrabold text-xs shadow-lg hover:shadow-xl transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Cpu className="w-4 h-4 text-cyan-300 animate-pulse" />
                <span>
                  {language === 'bm'
                    ? `Mulakan Penghantaran Ejen AI ke ${lenderName}`
                    : `Dispatch Application with Loan-La AI Agent to ${lenderName}`}
                </span>
                <ArrowRight className="w-4 h-4 text-blue-200" />
              </button>
            </div>
          </div>
        )}

        {/* STAGE 2: LIVE AGENT EXECUTION TERMINAL & FORM AUTOFILL SIMULATOR */}
        {dispatchStage === 'EXECUTING' && (
          <div className="p-5 sm:p-6 overflow-y-auto flex flex-col gap-5">
            {/* Header with progress */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-extrabold text-blue-950 uppercase tracking-wider flex items-center gap-2">
                  <RefreshCw className="w-3.5 h-3.5 text-blue-900 animate-spin" />
                  AI Agent Executing Autonomous Application Pipeline ({progress}%)
                </span>
                <span className="font-mono text-slate-500 font-bold text-[11px]">
                  STEP {Math.min(executionStep, executionSteps.length)} / {executionSteps.length}
                </span>
              </div>
              
              {/* Progress bar */}
              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                <div
                  className="h-full bg-gradient-to-r from-blue-950 via-indigo-900 to-cyan-500 transition-all duration-300 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {/* Split Screen: Left = Live Terminal Log, Right = Simulated Form Filling */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Terminal Logs */}
              <div className="bg-slate-950 rounded-2xl p-4 font-mono text-[11px] text-slate-300 flex flex-col gap-2 shadow-inner border border-slate-800 min-h-[260px] max-h-[300px] overflow-y-auto">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  <span className="flex items-center gap-1.5 text-cyan-400">
                    <Terminal className="w-3 h-3" /> Agent Execution Log
                  </span>
                  <span>TLS 1.3 Active</span>
                </div>
                
                <div className="flex flex-col gap-2 pt-1">
                  {logs.map((log, i) => (
                    <div key={i} className="leading-relaxed animate-fade-in">
                      <span className="text-cyan-400">{log}</span>
                    </div>
                  ))}
                  {executionStep < executionSteps.length && (
                    <div className="flex items-center gap-2 text-slate-400 italic pt-1 animate-pulse">
                      <span>▸ Ingesting verified payload into {lenderName} credit intake API...</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Simulated Form Autofill View */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col gap-2.5">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <span className="text-[11px] font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Smartphone className="w-3.5 h-3.5 text-blue-900" /> {lenderName} Gateway Intake Form
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                    RPA AUTOFILL ACTIVE
                  </span>
                </div>

                <div className="flex flex-col gap-2 text-xs">
                  <div className="flex justify-between items-center p-2 bg-white rounded-lg border border-slate-200">
                    <span className="text-slate-500 font-medium">Borrower Full Name:</span>
                    <span className="font-bold text-slate-900 flex items-center gap-1">
                      {applicant.name} <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    </span>
                  </div>

                  <div className="flex justify-between items-center p-2 bg-white rounded-lg border border-slate-200">
                    <span className="text-slate-500 font-medium">Financing Quantum:</span>
                    <span className="font-bold text-blue-950 tabular-nums">
                      RM {loanAmount.toLocaleString()}
                    </span>
                  </div>

                  <div className="flex justify-between items-center p-2 bg-white rounded-lg border border-slate-200">
                    <span className="text-slate-500 font-medium">Verified Net Income:</span>
                    <span className="font-bold text-slate-900 tabular-nums flex items-center gap-1">
                      RM {applicant.averageMonthlyNetIncome.toLocaleString()}/mo <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    </span>
                  </div>

                  <div className="flex justify-between items-center p-2 bg-white rounded-lg border border-slate-200">
                    <span className="text-slate-500 font-medium">Calculated DSR:</span>
                    <span className="font-bold text-slate-900 tabular-nums">
                      {applicant.dsr.toFixed(1)}% (Passes Bank Cap)
                    </span>
                  </div>

                  <div className="flex justify-between items-center p-2 bg-white rounded-lg border border-slate-200">
                    <span className="text-slate-500 font-medium">Alternative CAM Memo:</span>
                    <span className="font-bold text-blue-900 font-mono text-[10px] flex items-center gap-1">
                      CAM-{applicant.name.slice(0, 4).toUpperCase()}-2026.pdf <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="text-center text-xs text-slate-400 italic">
              Please wait while the AI Agent completes cryptographic sealing and payload submission...
            </div>
          </div>
        )}

        {/* STAGE 3: APPLICATION COMPLETED & DISPATCH ACKNOWLEDGMENT */}
        {dispatchStage === 'COMPLETED' && (
          <div className="p-6 sm:p-8 overflow-y-auto flex flex-col gap-6 animate-fade-in text-center items-center">
            
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-lg ring-8 ring-emerald-50">
              <Check className="w-8 h-8 stroke-[2.5]" />
            </div>

            <div className="max-w-md">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 font-mono block">
                Gateway Dispatch Acknowledged
              </span>
              <h3 className="text-2xl font-black text-blue-950 mt-1">
                Application Successfully Dispatched!
              </h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Your alternative credit dossier and Credit Assessment Memorandum have been submitted to <strong>{lenderName}</strong>'s underwriting queue.
              </p>
            </div>

            {/* Official Confirmation Card */}
            <div className="w-full max-w-md p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col gap-2.5 text-xs text-left font-mono">
              <div className="flex justify-between pb-2 border-b border-slate-200">
                <span className="text-slate-500 font-sans font-bold">Application Ref Code:</span>
                <span className="font-bold text-blue-950 font-mono text-sm">{generatedRefCode}</span>
              </div>
              <div className="flex justify-between pb-2 border-b border-slate-200">
                <span className="text-slate-500 font-sans font-bold">Recipient Institution:</span>
                <span className="font-bold text-slate-800 font-sans">{lenderName}</span>
              </div>
              <div className="flex justify-between pb-2 border-b border-slate-200">
                <span className="text-slate-500 font-sans font-bold">Facility Quantum:</span>
                <span className="font-bold text-slate-800">RM {loanAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between pb-2 border-b border-slate-200">
                <span className="text-slate-500 font-sans font-bold">Initial Review Status:</span>
                <span className="font-bold text-emerald-700 font-sans flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> SUBMITTED TO UNDERWRITER
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-sans font-bold">Expected Turnaround:</span>
                <span className="font-bold text-slate-800 font-sans">{target.speed || '24–48 Business Hours'}</span>
              </div>
            </div>

            {/* Seamless B2B Banker Portal Bridge */}
            <div className="w-full max-w-md p-4 bg-gradient-to-br from-blue-900 to-indigo-950 text-white rounded-2xl text-left flex flex-col gap-3 shadow-md border border-blue-800">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-cyan-300" />
                <span className="text-xs font-black uppercase tracking-wider text-cyan-300">
                  Demo Showcase: See How the Bank Sees This
                </span>
              </div>
              <p className="text-xs text-blue-100 leading-relaxed font-normal">
                Want to see what the bank's credit officer actually sees right now? This application has been placed into the <strong>Institutional Underwriter Portal</strong> live intake queue.
              </p>
              {onSwitchToB2BPortal && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onSwitchToB2BPortal(generatedRefCode);
                  }}
                  className="w-full py-2.5 px-4 bg-cyan-400 hover:bg-cyan-300 text-blue-950 font-black text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 shadow-sm"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Open Institutional Underwriter Portal (Banker View) →</span>
                </button>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex gap-3 w-full max-w-md pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
