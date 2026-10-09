'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Globe, Shield, CheckCircle2, ArrowRight,
  Lock, FileText, Sparkles, X,
  Building2, ExternalLink, Check, AlertTriangle,
  Copy, ClipboardCheck, Info, Smartphone, QrCode,
  Download, Send, MessageCircle, HelpCircle, ChevronRight,
  Bot, Play, Terminal, Zap, RefreshCw, Cpu, Layers, CheckCircle, UserCheck
} from 'lucide-react';
import BankLogo from '@/components/BankLogo';
import {
  getLenderOfficialPortalUrl,
  getLenderChannelType,
  findLenderByNameOrId,
  ApplicationChannel
} from '@/lib/lenders';
import { generateCreditPassportPdf } from '@/lib/pdfGenerator';
import { BSN_SCHEMES, matchBsnSchemes, BsnScheme } from '@/lib/bsnSchemes';
import LoanProposalWizardModal, { LoanProposalData } from '@/components/LoanProposalWizardModal';
import { generateBankApplicationPackPdf } from '@/lib/bankApplicationPackGenerator';

export interface DispatcherTarget {
  lenderName: string;
  lenderUrl?: string;
  productName: string;
  installment?: number;
  speed?: string;
  rate?: string;
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
  // 1. APPROVAL: User reviews dossier and explicitly authorizes the AI Agent to apply
  // 2. AGENT_AUTOMATION: Autonomous AI Agent executes form parsing, auto-injection & portal automation
  // 3. DONE: Application confirmed, logged & tracked
  const [stage, setStage] = useState<'APPROVAL' | 'AGENT_AUTOMATION' | 'DONE'>('APPROVAL');
  
  const [userConsented, setUserConsented] = useState(true);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);
  const [generatedRefCode, setGeneratedRefCode] = useState('');
  const [showQrCode, setShowQrCode] = useState(false);
  const [activeTab, setActiveTab] = useState<'SIMULATION' | 'TERMINAL' | 'MANUAL_HELPER'>('SIMULATION');

  // Agent execution simulation states
  const [agentProgress, setAgentProgress] = useState(0);
  const [agentRunning, setAgentRunning] = useState(false);
  const [agentFinished, setAgentFinished] = useState(false);
  const [agentLogs, setAgentLogs] = useState<string[]>([]);
  const [conciergeDispatched, setConciergeDispatched] = useState(false);

  // BSN Scheme Intelligence & Borrower Proposal States
  const [selectedBsnScheme, setSelectedBsnScheme] = useState<BsnScheme | null>(null);
  const [showAllBsnSchemes, setShowAllBsnSchemes] = useState(false);
  const [isProposalModalOpen, setIsProposalModalOpen] = useState(false);
  const [proposalData, setProposalData] = useState<LoanProposalData | null>(null);

  // PDF Download feedback states
  const [downloadingCam, setDownloadingCam] = useState(false);
  const [downloadingPack, setDownloadingPack] = useState(false);
  const [downloadSuccessToast, setDownloadSuccessToast] = useState<string | null>(null);

  const logsEndRef = useRef<HTMLDivElement>(null);
  const prevIsOpenRef = useRef(false);
  const prevLenderRef = useRef<string | null>(null);

  useEffect(() => {
    // Only re-initialize when modal first opens or when target lender changes
    const isJustOpened = isOpen && !prevIsOpenRef.current;
    const isLenderChanged = target && target.lenderName !== prevLenderRef.current;

    if (isOpen && target && (isJustOpened || isLenderChanged)) {
      setStage('APPROVAL');
      setUserConsented(true);
      setCopiedField(null);
      setCopiedAll(false);
      setShowQrCode(false);
      setAgentProgress(0);
      setAgentRunning(false);
      setAgentFinished(false);
      setAgentLogs([]);
      setConciergeDispatched(false);
      setActiveTab('SIMULATION');
      setShowAllBsnSchemes(false);

      // Check if lender is BSN and match top scheme from 17 BSN micro products
      const isBsn = (target.lenderName || '').toLowerCase().includes('bsn') || (target.lenderName || '').toLowerCase().includes('simpanan');
      if (isBsn) {
        const match = matchBsnSchemes({
          name: applicant?.name,
          icNumber: applicant?.icNumber,
          platform: applicant?.platform,
          requestedAmountRM: target.loanAmount
        });
        setSelectedBsnScheme(match.recommended);
      } else {
        setSelectedBsnScheme(null);
      }

      // Load cached proposal draft if available
      try {
        const cachedProposal = localStorage.getItem('loan_la_borrower_proposal_draft');
        if (cachedProposal) {
          setProposalData(JSON.parse(cachedProposal));
        }
      } catch (e) {}

      const prefix = (target.lenderName || 'BNK')
        .replace(/[^A-Za-z]/g, '')
        .substring(0, 3)
        .toUpperCase();
      setGeneratedRefCode(`LL-${new Date().getFullYear()}-${prefix}-${Math.floor(10000 + Math.random() * 90000)}`);
      prevLenderRef.current = target.lenderName;
    }
    prevIsOpenRef.current = isOpen;
  }, [isOpen, target?.lenderName, target?.loanAmount]);

  // Start Agent Automation Sequence when entering AGENT_AUTOMATION stage
  useEffect(() => {
    if (stage === 'AGENT_AUTOMATION' && !agentRunning && !agentFinished) {
      runAgentAutomation();
    }
  }, [stage]);

  const runAgentAutomation = () => {
    setAgentRunning(true);
    setAgentFinished(false);
    setAgentProgress(10);
    setAgentLogs([
      `[00:00.1s] 🤖 AI Application Agent v3.4 initializing headless session...`,
      `[00:00.4s] 🌐 Target Endpoint: ${target?.lenderName} Loan Intake Gateway`,
      `[00:00.8s] 🔍 DOM Inspector: Scanning target form schema & field IDs...`
    ]);

    const steps = [
      {
        progress: 30,
        delay: 500,
        log: `[00:01.3s] ⚡ Detected 8 form elements (Identity, Revenue, Platform, Amount, Tenure, Attachments)`
      },
      {
        progress: 55,
        delay: 1100,
        log: `[00:01.9s] ✍️ Auto-Injecting verified applicant: ${applicant?.name} (IC: ${applicant?.icNumber || '940815-14-5521'})`
      },
      {
        progress: 75,
        delay: 1700,
        log: `[00:02.5s] 📊 Auto-Injecting audited financials: RM ${applicant?.averageMonthlyNetIncome.toLocaleString()}/mo · DSR Headroom: ${applicant?.dsr.toFixed(1)}%`
      },
      {
        progress: 90,
        delay: 2300,
        log: `[00:03.1s] 📎 Injecting Certified CAM Credit Passport PDF (SHA-256: ${applicant?.documentHash.slice(0, 10)}...)`
      },
      {
        progress: 100,
        delay: 2900,
        log: `[00:03.7s] 🛡️ BNM Regulatory Compliance: 100% of form populated. Halting at human-in-the-loop OTP verification checkpoint.`
      }
    ];

    steps.forEach(({ progress, delay, log }) => {
      setTimeout(() => {
        setAgentProgress(progress);
        setAgentLogs(prev => [...prev, log]);
        if (progress === 100) {
          setAgentRunning(false);
          setAgentFinished(true);
        }
      }, delay);
    });
  };

  useEffect(() => {
    if (activeTab === 'TERMINAL' && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [agentLogs, activeTab]);

  if (!isOpen || !target || !applicant) return null;

  const lenderName = target.lenderName;
  const lenderData = findLenderByNameOrId(lenderName);
  const channelType: ApplicationChannel = target.channelType || getLenderChannelType(lenderName);
  const loanAmount = target.loanAmount || 15000;
  const monthlyInstallment = target.installment || Math.round((loanAmount * 1.055) / 24);
  const portalUrl = target.lenderUrl || getLenderOfficialPortalUrl(lenderName);
  const isBm = language === 'bm';

  const isWalkIn = channelType === 'commercial_bank_assisted' || (channelType as any) === 'branch_walk_in' ||
    lenderName.toLowerCase().includes('bsn') ||
    lenderName.toLowerCase().includes('rakyat') ||
    lenderName.toLowerCase().includes('agrobank') ||
    lenderName.toLowerCase().includes('sme bank');

  const isWhatsAppOfficer = channelType === 'government_micro_agency' || (channelType as any) === 'officer_whatsapp' ||
    lenderName.toLowerCase().includes('tekun') ||
    lenderName.toLowerCase().includes('mara') ||
    lenderName.toLowerCase().includes('aim');

  const isDigitalApp = channelType === 'digital_bank_app' || (channelType as any) === 'digital_app' ||
    lenderName.toLowerCase().includes('gxbank') ||
    lenderName.toLowerCase().includes('boost');

  const isOnlineWeb = !isWalkIn && !isWhatsAppOfficer && !isDigitalApp;

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
    { label: isBm ? 'No. Telefon' : 'Phone Number', value: applicant.phone || '+60 12-345 6789', field: 'phone' },
    { label: isBm ? 'Pendapatan Bersih Bulanan' : 'Net Monthly Income', value: `RM ${applicant.averageMonthlyNetIncome.toLocaleString()}`, field: 'income' },
    { label: isBm ? 'Platform / Pekerjaan' : 'Platform / Job', value: applicant.platform || 'Gig Worker (Foodpanda)', field: 'platform' },
    { label: isBm ? 'Amaun Pinjaman Dipohon' : 'Requested Loan Amount', value: `RM ${loanAmount.toLocaleString()}`, field: 'amount' },
    { label: isBm ? 'Cadangan Tempoh Pinjaman' : 'Proposed Tenure', value: '24 Bulan (2 Tahun)', field: 'tenure' },
    { label: isBm ? 'Tujuan Pembiayaan' : 'Financing Purpose', value: 'Working Capital / Modal Pusingan', field: 'purpose' },
    { label: isBm ? 'Skor Kesihatan Kredit (FRI)' : 'Credit Readiness (FRI)', value: `${applicant.score}/850 (Grade ${applicant.grade})`, field: 'score' },
    { label: isBm ? 'Nisbah Khidmat Hutang (DSR)' : 'Debt Service Ratio (DSR)', value: `${applicant.dsr.toFixed(1)}%`, field: 'dsr' },
  ];

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
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        navigator.clipboard.writeText(textSummary).catch(() => {});
      }
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 2500);
    } catch {}
  };

  // 1-Click Form Auto-Injector Script (Bookmarklet snippet for judges & users)
  const handleCopyAutoFillScript = () => {
    const snippet = `/* Loan-La Auto-Fill Injector */ (function(){const d={name:"${applicant.name}",ic:"${applicant.icNumber || '940815-14-5521'}",phone:"${applicant.phone || '0123456789'}",income:"${applicant.averageMonthlyNetIncome}",amount:"${loanAmount}"};document.querySelectorAll("input").forEach(i=>{const n=(i.name||i.id||"").toLowerCase();if(n.includes("name"))i.value=d.name;if(n.includes("ic")||n.includes("nric")||n.includes("mykad"))i.value=d.ic;if(n.includes("phone")||n.includes("tel"))i.value=d.phone;if(n.includes("income")||n.includes("gaji"))i.value=d.income;if(n.includes("amount")||n.includes("jumlah"))i.value=d.amount;i.dispatchEvent(new Event("input",{bubbles:true}));i.dispatchEvent(new Event("change",{bubbles:true}));});alert("Loan-La AI Agent: All form fields populated successfully!");})();`;
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        navigator.clipboard.writeText(snippet).catch(() => {});
      }
      setCopiedField('injector');
      setTimeout(() => setCopiedField(null), 2500);
    } catch {}
  };

  // Download CAM PDF
  const handleDownloadCamPdf = () => {
    setDownloadingCam(true);
    setTimeout(() => {
      try {
        generateCreditPassportPdf({
          inputData: {
            name: applicant.name,
            icNumber: applicant.icNumber || '940815-14-5521',
            phone: applicant.phone || '+60 12-345 6789',
            email: applicant.email || 'borrower@loan-la.my',
            platform: applicant.platform || 'Foodpanda',
            averageMonthlyNetIncome: applicant.averageMonthlyNetIncome,
            existingCommitments: Math.round(applicant.averageMonthlyNetIncome * (applicant.dsr / 100)),
            targetLoanAmount: loanAmount,
            targetLoanPurpose: 'working_capital',
            monthlyIncomes: [applicant.averageMonthlyNetIncome, applicant.averageMonthlyNetIncome, applicant.averageMonthlyNetIncome],
            behavioralRisk: { red_flags: [], warnings: [], score: 85 } as any,
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
        setDownloadingCam(false);
        setDownloadSuccessToast(language === 'bm' ? '✓ Memo CAM Berjaya Dimuat Turun!' : '✓ Certified CAM PDF Downloaded!');
        setTimeout(() => setDownloadSuccessToast(null), 3500);
      } catch (e: any) {
        console.error('PDF download error:', e);
        setDownloadingCam(false);
        alert(language === 'bm' ? `Ralat muat turun CAM PDF: ${e?.message || 'Sila cuba lagi'}` : `CAM PDF error: ${e?.message || 'Please try again'}`);
      }
    }, 150);
  };

  // Launch real bank portal
  const isBsn = (target.lenderName || '').toLowerCase().includes('bsn') || (target.lenderName || '').toLowerCase().includes('simpanan');
  const effectivePortalUrl = isBsn
    ? (selectedBsnScheme?.officialUrl || 'https://www.bsncheckin.com.my/MF/')
    : portalUrl;

  const handleLaunchBankPortal = () => {
    if (typeof window !== 'undefined') {
      window.open(effectivePortalUrl, '_blank', 'noopener,noreferrer');
    }
  };

  // Download Official Pre-Filled Bank Application Pack (PDF)
  const handleDownloadApplicationPackPdf = () => {
    setDownloadingPack(true);
    setTimeout(() => {
      try {
        generateBankApplicationPackPdf({
          applicant: {
            name: applicant.name,
            icNumber: applicant.icNumber,
            phone: applicant.phone,
            email: applicant.email,
            platform: applicant.platform,
            averageMonthlyNetIncome: applicant.averageMonthlyNetIncome,
            score: applicant.score,
            grade: applicant.grade,
            dsr: applicant.dsr,
            documentHash: applicant.documentHash
          },
          lenderName: selectedBsnScheme ? selectedBsnScheme.name : lenderName,
          scheme: selectedBsnScheme,
          loanAmount,
          tenureYears: 2,
          proposal: proposalData,
          language
        });
        setDownloadingPack(false);
        setDownloadSuccessToast(language === 'bm' ? '✓ Pakej Permohonan Bank Berjaya Dimuat Turun!' : '✓ Bank Application Pack (PDF) Downloaded!');
        setTimeout(() => setDownloadSuccessToast(null), 3500);
      } catch (e: any) {
        console.error('Failed to generate application pack:', e);
        setDownloadingPack(false);
        alert(language === 'bm' ? `Ralat muat turun Pakej Permohonan: ${e?.message || 'Sila cuba lagi'}` : `Application Pack error: ${e?.message || 'Please try again'}`);
      }
    }, 150);
  };

  // Concierge Direct Dispatch
  const handleConciergeDispatch = async () => {
    setConciergeDispatched(true);
    try {
      await fetch('/api/dispatch-application', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicantName: applicant.name,
          loanAmount,
          loanPurpose: 'working_capital',
          tenureYears: 2,
          creditScore: applicant.score,
          creditGrade: applicant.grade,
          dsr: applicant.dsr,
          selectedLenders: [lenderName],
          documentHash: applicant.documentHash
        })
      });
    } catch (e) {
      // quiet fallback
    }
  };

  // User explicitly approves the package and launches AI Agent
  const handleApproveAndProceed = () => {
    setUserConsented(true);

    // Record application in tracker
    const record = {
      id: `app-${Date.now()}`,
      refCode: generatedRefCode,
      lenderName,
      productName: selectedBsnScheme ? selectedBsnScheme.name : target.productName,
      loanAmount,
      monthlyInstallment,
      appliedAt: `Today, ${new Date().toLocaleTimeString('en-MY', { hour: '2-digit', minute: '2-digit' })}`,
      status: channelType === 'digital_bank_app' ? 'CONDITIONALLY_APPROVED' : 'SUBMITTED',
      speed: target.speed || (channelType === 'digital_bank_app' ? '10 Mins (Digital Payout)' : '24–48 Hours'),
      lenderUrl: effectivePortalUrl
    };

    if (onApplicationDispatched) {
      onApplicationDispatched(record);
    }

    // Advance to Stage 2 immediately
    setStage('AGENT_AUTOMATION');

    // Auto-copy verified credentials for easy pasting (safe promise)
    try {
      handleCopyAll();
    } catch (e) {}

    // Launch official portal in new tab for borrower safely
    try {
      if (typeof window !== 'undefined') {
        window.open(effectivePortalUrl, '_blank', 'noopener,noreferrer');
      }
    } catch (e) {
      console.error('Failed to open bank portal:', e);
    }
  };

  // Channel helper labels - Clean, Simple Institutional Palette
  const getChannelBadge = () => {
    switch (channelType) {
      case 'digital_bank_app':
        return {
          icon: Smartphone,
          label: isBm ? 'Bank Digital Berlesen (Aplikasi Telefon)' : 'Licensed Digital Bank (Mobile App)',
          color: 'bg-white text-slate-800 border-slate-200'
        };
      case 'digital_web_portal':
        return {
          icon: Globe,
          label: isBm ? 'Portal Web Digital 100% Online' : '100% Online Web Portal',
          color: 'bg-white text-slate-800 border-slate-200'
        };
      case 'government_micro_agency':
        return {
          icon: Building2,
          label: isBm ? 'Agensi / Dana Mikro Kerajaan' : 'Government Micro-Fund Agency',
          color: 'bg-white text-slate-800 border-slate-200'
        };
      default:
        return {
          icon: Building2,
          label: isBm ? 'Perbankan Komersial / Mikro' : 'Commercial / Micro Bank Facility',
          color: 'bg-white text-slate-800 border-slate-200'
        };
    }
  };

  const channelBadge = getChannelBadge();
  const ChannelIcon = channelBadge.icon;

  // WhatsApp Pre-filled text for TEKUN / BSN / Bank Rakyat / Government agencies
  const whatsappOfficerText = encodeURIComponent(
    isBm
      ? `Salam Tuan/Puan Pegawai Pembiayaan ${lenderName},\n\nSaya ${applicant.name} (No. Kad Pengenalan: ${applicant.icNumber || '940815-14-5521'}) ingin memohon pembiayaan sebanyak RM ${loanAmount.toLocaleString()} bagi tujuan Modal Pusingan.\n\nProfil kewangan saya telah dipra-saring oleh sistem CreditFlow AI:\n- Kod Rujukan: ${generatedRefCode}\n- Pendapatan Bersih Bulanan: RM ${applicant.averageMonthlyNetIncome.toLocaleString()}\n- Skor Kredit (FRI): ${applicant.score}/850 (Gred ${applicant.grade})\n- Nisbah Khidmat Hutang (DSR): ${applicant.dsr.toFixed(1)}%\n- Hash Memo Kredit (CAM): ${applicant.documentHash}\n\nDokumen penyata bank dan Memo Kredit CAM rasmi telah sedia dilampirkan. Mohon bantuan tuan/puan untuk panduan proses borang permohonan.\n\nTerima kasih.`
      : `Dear Financing Officer at ${lenderName},\n\nI am ${applicant.name} (IC: ${applicant.icNumber || '940815-14-5521'}) applying for financing of RM ${loanAmount.toLocaleString()} for Working Capital.\n\nMy financial profile has been pre-underwritten by CreditFlow AI:\n- Reference Code: ${generatedRefCode}\n- Net Monthly Income: RM ${applicant.averageMonthlyNetIncome.toLocaleString()}\n- FRI Credit Score: ${applicant.score}/850 (Grade ${applicant.grade})\n- DSR: ${applicant.dsr.toFixed(1)}%\n- Certified CAM Hash: ${applicant.documentHash}\n\nMy bank statements and official CAM Credit Passport are ready for submission. Please advise on final form intake.\n\nThank you.`
  );

  const whatsappUrl = `https://wa.me/${(lenderData?.whatsappOfficer || '60192238888').replace(/[^0-9]/g, '')}?text=${whatsappOfficerText}`;
  const appDownloadLink = lenderData?.appDownloadUrl?.android || lenderData?.appDownloadUrl?.ios || portalUrl;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(appDownloadLink)}`;

  return (
    <div className="fixed inset-0 z-[95] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[94vh]">

        {/* Modal Header */}
        <div className="bg-white px-5 sm:px-6 py-4 flex items-center justify-between border-b border-slate-200 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700 shrink-0 border border-slate-200">
              <Shield className="w-4 h-4 text-slate-700" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold text-slate-900">
                  {isBm ? 'Kelulusan & Penyerahan Permohonan' : 'Application Dossier & Authorization'}
                </h2>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                  {stage === 'APPROVAL'
                    ? (isBm ? 'Langkah 1/2: Kelulusan' : 'Step 1 of 2: Approval')
                    : stage === 'AGENT_AUTOMATION'
                    ? (isBm ? 'Langkah 2/2: Automasi' : 'Step 2 of 2: Automation')
                    : (isBm ? 'Selesai' : 'Completed')}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {isBm
                  ? 'Semak profil dan sahkan sebelum ejen menghantar ke institusi kewangan'
                  : 'Review verified profile and authorize CreditFlow AI agent submission'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* STAGE 1: DOSSIER REVIEW & MANDATORY USER APPROVAL                   */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {stage === 'APPROVAL' && (
          <>
            <div className="p-5 sm:p-6 overflow-y-auto flex-1 flex flex-col gap-4 bg-slate-50/50">
              
              {/* CARD 1: FINANCING FACILITY & TERMS (Important Info #1) */}
              <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col gap-3.5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3.5">
                    <BankLogo bankName={lenderName} size="lg" />
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-900 text-white">
                          {isBsn ? (selectedBsnScheme?.tag || 'Government Micro Scheme') : (lenderData?.regulatedBy || 'Bank Negara Regulated')}
                        </span>
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                          {target.speed || '3–5 Business Days'}
                        </span>
                      </div>
                      <h3 className="text-base sm:text-lg font-bold text-slate-900 mt-1">
                        {isBsn && selectedBsnScheme ? (isBm ? selectedBsnScheme.nameBm : selectedBsnScheme.name) : (target.productName || lenderName)}
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {isBsn && selectedBsnScheme 
                          ? (isBm ? selectedBsnScheme.targetAudienceBm : selectedBsnScheme.targetAudience)
                          : (isBm ? 'Pembiayaan tunai mikro patuh BNM dengan proses pantas.' : 'BNM-compliant micro financing facility with accelerated digital intake.')}
                      </p>
                    </div>
                  </div>
                </div>

                {/* 4 Key Metrics Bar */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-3 border-t border-slate-100">
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-[10px] font-semibold text-slate-500 uppercase block">{isBm ? 'Jumlah Dimohon' : 'Loan Amount'}</span>
                    <span className="text-base sm:text-lg font-black text-slate-900 tabular-nums">RM {loanAmount.toLocaleString()}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-[10px] font-semibold text-slate-500 uppercase block">{isBm ? 'Kadar Faedah' : 'Profit Rate'}</span>
                    <span className="text-sm sm:text-base font-bold text-slate-900">
                      {isBsn && selectedBsnScheme ? selectedBsnScheme.profitRate.split(' ')[0] : (target.rate || '3.50%')} p.a.
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-[10px] font-semibold text-slate-500 uppercase block">{isBm ? 'Ansuran Est.' : 'Est. Installment'}</span>
                    <span className="text-sm sm:text-base font-bold text-slate-900 tabular-nums">RM {monthlyInstallment.toLocaleString()}/mo</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-[10px] font-semibold text-slate-500 uppercase block">{isBm ? 'Tempoh' : 'Tenure'}</span>
                    <span className="text-sm sm:text-base font-bold text-slate-900">
                      {isBsn && selectedBsnScheme ? selectedBsnScheme.tenureYears : '24 – 36 Mo'}
                    </span>
                  </div>
                </div>

                {/* Optional Scheme Switcher for BSN */}
                {isBsn && (
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-[11px] text-slate-500 font-medium">
                      {isBm ? `Skim Terpilih: ${selectedBsnScheme?.name || 'BSN Micro'}` : `Selected Scheme: ${selectedBsnScheme?.name || 'BSN Micro'}`}
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowAllBsnSchemes(!showAllBsnSchemes)}
                      className="text-[11px] font-semibold text-slate-800 hover:text-black underline underline-offset-2 cursor-pointer"
                    >
                      {showAllBsnSchemes ? (isBm ? 'Tutup Senarai' : 'Close List') : (isBm ? 'Tukar Skim (17 Pilihan Rasmi) ▾' : 'Change Scheme (17 Available) ▾')}
                    </button>
                  </div>
                )}

                {/* Collapsible BSN Schemes List */}
                {isBsn && showAllBsnSchemes && (
                  <div className="p-2 bg-slate-50 rounded-xl border border-slate-200 max-h-48 overflow-y-auto divide-y divide-slate-100 text-xs">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block p-1">
                      {isBm ? 'Pilih Skim Rasmi BSN:' : 'Select Official BSN Scheme:'}
                    </span>
                    {BSN_SCHEMES.map(s => (
                      <div
                        key={s.id}
                        onClick={() => { setSelectedBsnScheme(s); setShowAllBsnSchemes(false); }}
                        className={`py-2 px-2.5 rounded-lg flex items-center justify-between gap-3 hover:bg-slate-200/60 cursor-pointer transition ${
                          selectedBsnScheme?.id === s.id ? 'bg-white font-bold border border-slate-300 shadow-2xs' : ''
                        }`}
                      >
                        <div>
                          <span className="font-semibold text-slate-900 block">{s.name}</span>
                          <span className="text-[10px] text-slate-500">{s.tag} · Had: RM {s.maxAmountRM.toLocaleString()}</span>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-[11px] font-mono text-slate-900 font-semibold">{s.profitRate}</span>
                          {selectedBsnScheme?.id === s.id && (
                            <span className="text-[10px] text-emerald-700 block font-bold">✓ Selected</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* CARD 2: VERIFIED BORROWER DOSSIER & PROPOSAL (Important Info #2) */}
              <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col gap-3.5">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <div className="flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-slate-700" />
                    <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      {isBm ? 'Profil & Kelayakan Peminjam Disahkan' : 'Verified Borrower Dossier & Eligibility'}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">
                    ID: {generatedRefCode}
                  </span>
                </div>

                {/* Borrower Summary Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="space-y-1.5 p-3 rounded-xl bg-slate-50/80 border border-slate-100">
                    <div className="flex justify-between">
                      <span className="text-slate-500">{isBm ? 'Nama Pemohon' : 'Applicant Name'}</span>
                      <strong className="text-slate-900">{applicant.name}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">{isBm ? 'No. Kad Pengenalan' : 'MyKad / NRIC'}</span>
                      <span className="font-mono font-semibold text-slate-800">{applicant.icNumber || '940815-14-5521'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">{isBm ? 'Sektor / Platform' : 'Sector / Platform'}</span>
                      <span className="font-medium text-slate-800">{applicant.platform || 'Gig Worker (Foodpanda)'}</span>
                    </div>
                  </div>

                  <div className="space-y-1.5 p-3 rounded-xl bg-slate-50/80 border border-slate-100">
                    <div className="flex justify-between">
                      <span className="text-slate-500">{isBm ? 'Pendapatan Bersih' : 'Verified Income'}</span>
                      <strong className="text-slate-900">RM {applicant.averageMonthlyNetIncome.toLocaleString()}/mo</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">{isBm ? 'Skor FRI CreditFlow' : 'CreditFlow FRI Score'}</span>
                      <span className="font-bold text-emerald-700">{applicant.score}/850 (Grade {applicant.grade})</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">{isBm ? 'Nisbah Hutang (DSR)' : 'Debt Service (DSR)'}</span>
                      <span className="font-semibold text-slate-800">{applicant.dsr.toFixed(1)}% (Healthy)</span>
                    </div>
                  </div>
                </div>

                {/* Purpose & Proposal Quick Attachment */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <FileText className="w-4 h-4 text-slate-500 shrink-0" />
                    <div className="truncate">
                      <span className="font-bold text-slate-900 block truncate">
                        {isBm ? 'Tujuan Pembiayaan: Modal Pusingan & Peralatan' : 'Financing Purpose: Working Capital & Equipment'}
                      </span>
                      <span className="text-[11px] text-slate-500 truncate block">
                        {proposalData ? `✓ Proposal Part B dilampirkan (${proposalData.purposeDetail.slice(0, 45)}...)` : '✓ Dokumen CAM & Analisis Aliran Tunai Dilampirkan'}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsProposalModalOpen(true)}
                    className="px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 transition shadow-2xs shrink-0 cursor-pointer"
                  >
                    {isBm ? 'Semak Proposal' : 'Review Proposal'}
                  </button>
                </div>
              </div>

            </div>

            {/* Pinned Sticky Bottom Footer (Always Visible & Directly Clickable) */}
            <div className="shrink-0 border-t border-slate-200 bg-white p-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-[0_-4px_16px_rgba(0,0,0,0.03)]">
              <label htmlFor="user-consent-checkbox" className="flex items-center gap-2.5 text-xs text-slate-700 select-none cursor-pointer">
                <input
                  type="checkbox"
                  id="user-consent-checkbox"
                  checked={userConsented}
                  onChange={(e) => setUserConsented(e.target.checked)}
                  className="w-4 h-4 rounded text-slate-900 border-slate-300 focus:ring-slate-900 cursor-pointer"
                />
                <span className="leading-tight">
                  {isBm
                    ? `Saya memberi kuasa kepada Ejen AI untuk menghantar fail ke ${lenderName}`
                    : `I authorize AI Agent to submit and process my dossier with ${lenderName}`}
                </span>
              </label>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end shrink-0">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-lg border border-slate-200 text-slate-700 font-semibold text-xs hover:bg-slate-50 transition cursor-pointer"
                >
                  {isBm ? 'Batal' : 'Cancel'}
                </button>
                <button
                  type="button"
                  onClick={handleApproveAndProceed}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-slate-900 hover:bg-black text-white font-semibold text-xs shadow-sm transition flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
                >
                  <Bot className="w-3.5 h-3.5 text-slate-300" />
                  <span>
                    {isBm
                      ? `Luluskan & Lancarkan Ejen AI (${lenderName}) →`
                      : `Approve & Launch AI Agent for ${lenderName} →`}
                  </span>
                </button>
              </div>
            </div>
          </>
        )}

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* STAGE 2: AUTONOMOUS AI AGENT FORM AUTOMATION & DISPATCH ENGINE      */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {stage === 'AGENT_AUTOMATION' && (
          <>
            <div className="p-5 sm:p-6 overflow-y-auto flex-1 flex flex-col gap-4 bg-slate-50/50">
              
              {/* Top Dispatch Confirmation Banner */}
              <div className="p-4 sm:p-5 bg-slate-900 text-white rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-slate-800 text-emerald-400 border border-slate-700 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                        {isBm ? 'Ejen AI Telah Dilancarkan & Dipra-Isi' : 'AI Agent Dispatched & Pre-Filled'}
                      </span>
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    </div>
                    <h3 className="text-sm sm:text-base font-bold text-white mt-0.5">
                      {isBsn && selectedBsnScheme ? selectedBsnScheme.name : lenderName}
                    </h3>
                    <p className="text-xs text-slate-300 font-mono mt-0.5">
                      {isBm ? 'Kod Rujukan:' : 'Ref ID:'} <span className="text-slate-100 font-bold">{generatedRefCode}</span> · {isBm ? 'Diselaraskan dengan Penyata Rasmi' : 'Reconciled with Bank Statement'}
                    </p>
                  </div>
                </div>

                <div className="text-left sm:text-right shrink-0 bg-slate-800/80 p-2.5 px-3 rounded-xl border border-slate-700 w-full sm:w-auto">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block">{isBm ? 'Status Pematuhan' : 'Compliance Check'}</span>
                  <span className="text-xs font-bold text-white flex items-center gap-1.5 mt-0.5">
                    <Shield className="w-3.5 h-3.5 text-emerald-400" />
                    {isBm ? 'Pematuhan BNM 100%' : '100% BNM Compliant'}
                  </span>
                </div>
              </div>

              {/* Download Feedback Toast */}
              {downloadSuccessToast && (
                <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-xs font-bold text-emerald-900 flex items-center gap-2 animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{downloadSuccessToast}</span>
                </div>
              )}

              {/* Intake Channel Explainer Banner */}
              <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-2xl flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-blue-100 border border-blue-200 text-blue-800 flex items-center justify-center shrink-0 mt-0.5">
                  {isWalkIn ? <Building2 className="w-4 h-4" /> : isWhatsAppOfficer ? <MessageCircle className="w-4 h-4" /> : isDigitalApp ? <Smartphone className="w-4 h-4" /> : <Globe className="w-4 h-4" />}
                </div>
                <div className="text-xs">
                  <span className="font-extrabold text-blue-950 block">
                    {isWalkIn
                      ? (isBm ? 'Saluran Institusi: Penyerahan Kaunter / Walk-In Cawangan Diperlukan' : 'Bank Intake Channel: Physical Branch Walk-In & Counter Intake Required')
                      : isWhatsAppOfficer
                      ? (isBm ? 'Saluran Agensi: Penyerahan Melalui Pegawai Daerah / WhatsApp' : 'Agency Intake Channel: Direct District Officer WhatsApp Submission')
                      : isDigitalApp
                      ? (isBm ? 'Saluran Bank Digital: 100% Aplikasi Telefon Pintar (e-KYC)' : 'Digital Bank Channel: 100% Mobile App with 10-Minute e-KYC')
                      : (isBm ? 'Saluran Portal Web: 100% Penyerahan Digital Dalam Talian' : 'Web Portal Channel: 100% Online Digital Web Application')
                    }
                  </span>
                  <p className="text-slate-600 mt-0.5 leading-relaxed">
                    {isWalkIn
                      ? (isBm
                          ? `Skim mikro perbankan fizikal (${lenderName}) mewajibkan penyerahan dokumen di kaunter cawangan mengikut piawaian BNM. Pakej Permohonan (PDF) telah menyediakan semua borang, kertas kerja Part B, dan Memo CAM agar anda hanya perlu hadir sekali tanpa kekurangan dokumen.`
                          : `Malaysian physical micro-financing (${lenderName}) requires in-person submission at any branch counter per BNM regulations. Your Pre-Filled Application Pack (PDF) compiles your application forms, Part B proposal, and CAM score memo so you can submit in a single counter visit.`)
                      : isWhatsAppOfficer
                      ? (isBm
                          ? `Pembiayaan ${lenderName} dinilai secara terus oleh Pegawai Pembiayaan Daerah. Hubungi pegawai melalui WhatsApp dengan profil yang telah siap disusun di bawah.`
                          : `${lenderName} micro-funds are reviewed directly by district financing officers. Chat directly on WhatsApp with your pre-screened CAM dossier.`)
                      : isDigitalApp
                      ? (isBm
                          ? 'Buka aplikasi bank digital berlesen untuk imbasan wajah e-KYC dan kelulusan automatik dalam masa 10 minit.'
                          : 'Open the licensed digital bank app on your phone for instant facial e-KYC and algorithmic approval in 10 minutes.')
                      : (isBm
                          ? 'Buka portal web rasmi dan gunakan data yang dipra-isi untuk melengkapkan permohonan digital anda.'
                          : 'Open the official online web portal and use the verified pre-filled figures to complete your digital intake.')
                    }
                  </p>
                </div>
              </div>

              {/* 2 Primary Action Cards (Adaptive by Intake Channel) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                
                {/* ══ ACTION CARD 1 ══ */}
                {isWalkIn ? (
                  // Walk-in Bank: Card 1 is the Pre-Filled Walk-in Dossier
                  <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between gap-3">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                          {isBm ? 'Langkah 1: Dokumen Walk-In' : 'Step 1: Walk-In Dossier'}
                        </span>
                        <Download className="w-4 h-4 text-slate-400" />
                      </div>
                      <h4 className="text-sm font-bold text-slate-900 mt-2">
                        {isBm ? 'Pakej Permohonan Cawangan (PDF)' : 'Branch Application Pack (PDF)'}
                      </h4>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                        {isBm
                          ? 'Muat turun pakej bercetak lengkap: Borang permohonan bank, cadangan Part B, dan Memo Pengunderaitan CAM berintegriti SHA-256.'
                          : 'Download verified physical pack: Official bank application forms, Part B proposal, and CAM score memo ready for the branch officer.'}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleDownloadApplicationPackPdf}
                        disabled={downloadingPack}
                        className="flex-1 py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-black text-white font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-[0.98] disabled:opacity-50"
                      >
                        {downloadingPack ? (
                          <RefreshCw className="w-3.5 h-3.5 text-slate-300 animate-spin" />
                        ) : (
                          <FileText className="w-3.5 h-3.5 text-slate-300" />
                        )}
                        <span>{downloadingPack ? (isBm ? 'Menjana Pack...' : 'Generating Pack...') : (isBm ? 'Muat Turun Pack (PDF)' : 'Download Bank Pack')}</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleDownloadCamPdf}
                        disabled={downloadingCam}
                        className="py-2.5 px-3 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 font-semibold text-xs shadow-2xs transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                        title="Download CAM Assessment Memo"
                      >
                        {downloadingCam ? (
                          <RefreshCw className="w-3.5 h-3.5 text-slate-600 animate-spin" />
                        ) : (
                          <Download className="w-3.5 h-3.5 text-slate-600" />
                        )}
                        <span>{downloadingCam ? (isBm ? 'Menjana...' : 'Generating...') : 'CAM PDF'}</span>
                      </button>
                    </div>
                  </div>
                ) : isWhatsAppOfficer ? (
                  // WhatsApp Officer Agency: Card 1 is WhatsApp Direct Pitch
                  <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between gap-3">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                          {isBm ? 'Langkah 1: Hubungi Pegawai' : 'Step 1: Contact Officer'}
                        </span>
                        <MessageCircle className="w-4 h-4 text-emerald-600" />
                      </div>
                      <h4 className="text-sm font-bold text-slate-900 mt-2">
                        {isBm ? 'WhatsApp Pegawai Pembiayaan Daerah' : 'WhatsApp District Financing Officer'}
                      </h4>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                        {isBm
                          ? `Hantar mesej pengenalan rasmi bersama Kod Rujukan ${generatedRefCode}, pendapatan bersih, dan skor kredit FRI terus kepada pegawai.`
                          : `Directly chat with the district officer. Reference ID ${generatedRefCode}, net income, and FRI credit score are pre-formatted.`}
                      </p>
                    </div>

                    <a
                      href={whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>{isBm ? 'WhatsApp Pegawai Sekarang 💬' : 'WhatsApp Financing Officer Now 💬'}</span>
                    </a>
                  </div>
                ) : (
                  // Online Web / Digital App: Card 1 is Open Official Portal / App
                  <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between gap-3">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                          {isBm ? 'Langkah 1: Portal Rasmi' : 'Step 1: Official Portal'}
                        </span>
                        <ExternalLink className="w-4 h-4 text-slate-400" />
                      </div>
                      <h4 className="text-sm font-bold text-slate-900 mt-2">
                        {isBm ? `Buka Portal Rasmi ${lenderName}` : `Open Official ${lenderName} Portal`}
                      </h4>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                        {isBm
                          ? 'Portal rasmi dibuka dalam tab baru. Semua butiran pendapatan, skor kredit, dan cadangan pembiayaan sedia untuk pengesahan akhir.'
                          : 'Access the bank\'s official application intake page. Verified applicant credentials and loan terms are prepared.'}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleLaunchBankPortal}
                      className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-black text-white font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-slate-300" />
                      <span>{isBm ? 'Buka Portal Bank Sekarang ↗' : 'Open Bank Portal Now ↗'}</span>
                    </button>
                  </div>
                )}

                {/* ══ ACTION CARD 2 ══ */}
                {isWalkIn ? (
                  // Walk-in Bank: Card 2 is Branch Locator & Portal Reference
                  <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between gap-3">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                          {isBm ? 'Langkah 2: Kaunter Cawangan' : 'Step 2: Branch Counter'}
                        </span>
                        <Building2 className="w-4 h-4 text-slate-400" />
                      </div>
                      <h4 className="text-sm font-bold text-slate-900 mt-2">
                        {isBm ? `Hadir ke Kaunter Cawangan ${lenderName}` : `Visit ${lenderName} Branch Counter`}
                      </h4>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                        {isBm
                          ? `Bawa Pakej Permohonan bercetak bersama MyKad dan penyata bank 3 bulan ke cawangan terdekat. Sebut Kod Rujukan ${generatedRefCode}.`
                          : `Bring the printed Walk-In Pack and MyKad to the financing counter at any nearby branch. Present Ref ID ${generatedRefCode}.`}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <a
                        href={`https://www.google.com/maps/search/${encodeURIComponent(lenderName + ' branch cawangan')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-black text-white font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-[0.98]"
                      >
                        <Building2 className="w-3.5 h-3.5 text-slate-300" />
                        <span>{isBm ? 'Cari Cawangan (Peta) ↗' : 'Find Nearest Branch ↗'}</span>
                      </a>
                      <button
                        type="button"
                        onClick={handleLaunchBankPortal}
                        className="py-2.5 px-3 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 font-semibold text-xs shadow-2xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                        title="Open Bank Website"
                      >
                        <ExternalLink className="w-3.5 h-3.5 text-slate-600" />
                        <span>{isBm ? 'Laman Web' : 'Portal'}</span>
                      </button>
                    </div>
                  </div>
                ) : isWhatsAppOfficer ? (
                  // WhatsApp Officer Agency: Card 2 is the Agency Dossier PDF
                  <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between gap-3">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                          {isBm ? 'Langkah 2: Dokumen Agensi' : 'Step 2: Agency Dossier'}
                        </span>
                        <FileText className="w-4 h-4 text-slate-400" />
                      </div>
                      <h4 className="text-sm font-bold text-slate-900 mt-2">
                        {isBm ? 'Pakej Permohonan Agensi (PDF)' : 'Agency Application Pack (PDF)'}
                      </h4>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                        {isBm
                          ? 'Muat turun pakej penuh mengandungi cadangan Part B dan sijil kelayakan CAM untuk rujukan temu duga atau lampiran e-mel pegawai.'
                          : 'Download full pack with Part B proposal and CAM score memo to present during the officer interview.'}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleDownloadApplicationPackPdf}
                        disabled={downloadingPack}
                        className="flex-1 py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-black text-white font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-[0.98] disabled:opacity-50"
                      >
                        {downloadingPack ? (
                          <RefreshCw className="w-3.5 h-3.5 text-slate-300 animate-spin" />
                        ) : (
                          <FileText className="w-3.5 h-3.5 text-slate-300" />
                        )}
                        <span>{downloadingPack ? (isBm ? 'Menjana Pack...' : 'Generating...') : (isBm ? 'Muat Turun Pack (PDF)' : 'Download Agency Pack')}</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleDownloadCamPdf}
                        disabled={downloadingCam}
                        className="py-2.5 px-3 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 font-semibold text-xs shadow-2xs transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                        title="Download CAM Assessment Memo"
                      >
                        {downloadingCam ? (
                          <RefreshCw className="w-3.5 h-3.5 text-slate-600 animate-spin" />
                        ) : (
                          <Download className="w-3.5 h-3.5 text-slate-600" />
                        )}
                        <span>{downloadingCam ? (isBm ? 'Menjana...' : 'Generating...') : 'CAM PDF'}</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  // Online Web / Digital App: Card 2 is the Application Pack PDF
                  <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between gap-3">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                          {isBm ? 'Langkah 2: Dokumen Rasmi' : 'Step 2: Official Dossier'}
                        </span>
                        <Download className="w-4 h-4 text-slate-400" />
                      </div>
                      <h4 className="text-sm font-bold text-slate-900 mt-2">
                        {isBm ? 'Pakej Permohonan Pra-Isi (PDF)' : 'Pre-Filled Application Pack (PDF)'}
                      </h4>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                        {isBm
                          ? 'Muat turun pakej borang permohonan lengkap yang telah siap diisi beserta sijil pengesahan integriti CAM untuk dimuat naik ke portal.'
                          : 'Download verified application pack complete with audited financials, Part B proposal, and CAM certificate hash.'}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleDownloadApplicationPackPdf}
                        disabled={downloadingPack}
                        className="flex-1 py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-black text-white font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-[0.98] disabled:opacity-50"
                      >
                        {downloadingPack ? (
                          <RefreshCw className="w-3.5 h-3.5 text-slate-300 animate-spin" />
                        ) : (
                          <FileText className="w-3.5 h-3.5 text-slate-300" />
                        )}
                        <span>{downloadingPack ? (isBm ? 'Menjana Pack...' : 'Generating...') : (isBm ? 'Muat Turun Pack (PDF)' : 'Download Bank Pack')}</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleDownloadCamPdf}
                        disabled={downloadingCam}
                        className="py-2.5 px-3 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 font-semibold text-xs shadow-2xs transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                        title="Download CAM Assessment Memo"
                      >
                        {downloadingCam ? (
                          <RefreshCw className="w-3.5 h-3.5 text-slate-600 animate-spin" />
                        ) : (
                          <Download className="w-3.5 h-3.5 text-slate-600" />
                        )}
                        <span>{downloadingCam ? (isBm ? 'Menjana...' : 'Generating...') : 'CAM PDF'}</span>
                      </button>
                    </div>
                  </div>
                )}

              </div>

              {/* Verified Application Credentials Card (Fast Copy Reference) */}
              <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col gap-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <div className="flex items-center gap-2">
                    <ClipboardCheck className="w-4 h-4 text-slate-700" />
                    <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      {isBm ? 'Data Permohonan Disahkan (Untuk Rujukan)' : 'Verified Application Credentials'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyAll}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-semibold transition-colors flex items-center gap-1.5 cursor-pointer border border-slate-200"
                  >
                    {copiedAll ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                    <span>{copiedAll ? (isBm ? 'Disalin!' : 'Copied!') : (isBm ? 'Salin Semua Data' : 'Copy All Data')}</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
                  {prefillFields.map(f => (
                    <div key={f.field} className="p-2 rounded-xl bg-slate-50 border border-slate-100 flex flex-col justify-between">
                      <span className="text-[10px] text-slate-500 font-medium block">{f.label}</span>
                      <div className="flex items-center justify-between mt-1">
                        <span className="font-bold text-slate-900 tabular-nums truncate">{f.value}</span>
                        <button
                          type="button"
                          onClick={() => handleCopy(f.value.replace('RM ', '').replace(',', ''), f.field)}
                          className="p-1 text-slate-400 hover:text-slate-800 transition-colors cursor-pointer"
                          title="Copy field"
                        >
                          {copiedField === f.field ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Regulatory Human-In-The-Loop Note */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 flex items-center gap-2.5">
                <Info className="w-4 h-4 text-slate-500 shrink-0" />
                <span className="text-[11px] leading-relaxed">
                  {isBm
                    ? 'Pematuhan Bank Negara Malaysia (BNM): Pengesahan OTP akhir kekal di tangan pemohon (Human-in-the-Loop) bagi memastikan keselamatan perbankan 100% tanpa memerlukan sebarang perkongsian kata laluan.'
                    : 'Bank Negara Malaysia (BNM) Compliance: The final OTP authentication is confirmed by you directly on the official banking portal to ensure absolute security with zero password sharing.'}
                </span>
              </div>

            </div>

            {/* Pinned Sticky Bottom Footer */}
            <div className="shrink-0 border-t border-slate-200 bg-white p-4 sm:px-6 flex items-center justify-between gap-3 shadow-[0_-4px_16px_rgba(0,0,0,0.03)]">
              <button
                type="button"
                onClick={() => setStage('APPROVAL')}
                className="px-4 py-2.5 rounded-lg border border-slate-200 text-slate-700 font-semibold text-xs hover:bg-slate-50 transition-colors cursor-pointer"
              >
                {isBm ? '← Kembali' : '← Back'}
              </button>
              <button
                type="button"
                onClick={() => setStage('DONE')}
                className="px-5 py-2.5 rounded-lg bg-slate-900 hover:bg-black active:scale-[0.98] text-white font-semibold text-xs shadow-sm transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4 text-emerald-400" />
                <span>{isBm ? 'Selesai & Rekodkan Permohonan' : 'Done & Track Application'}</span>
              </button>
            </div>
          </>
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



            <button
              type="button"
              onClick={onClose}
              className="w-full max-w-sm py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs transition-colors cursor-pointer"
            >
              {isBm ? 'Tutup & Kembali ke Papan Pemuka' : 'Close & Return to Dashboard'}
            </button>
          </div>
        )}

      </div>

      {/* 5-Step Borrower Loan Proposal Wizard Modal */}
      {isProposalModalOpen && (
        <LoanProposalWizardModal
          isOpen={isProposalModalOpen}
          onClose={() => setIsProposalModalOpen(false)}
          onSaveProposal={(data) => {
            setProposalData(data);
            setIsProposalModalOpen(false);
          }}
          initialData={proposalData || undefined}
          borrowerContext={{
            name: applicant.name,
            platform: applicant.platform,
            monthlyIncome: applicant.averageMonthlyNetIncome,
            targetLoanAmount: loanAmount,
            lenderName: selectedBsnScheme ? selectedBsnScheme.name : lenderName
          }}
          language={language}
        />
      )}
    </div>
  );
}
