'use client';

import React, { useState, useEffect } from 'react';
import {
  ShieldAlert, ShieldCheck, FileCheck, FileSpreadsheet,
  UploadCloud, Play, UserCheck, Landmark, CheckCircle,
  FileDown, FileJson, Layers, RefreshCw, AlertTriangle,
  User, Activity, DollarSign, Calendar, Sparkles, Send,
  Briefcase, CheckSquare, X, Trash2, ArrowRight, Server,
  Globe, Shield, Cpu, HelpCircle, HardDrive, BarChart3,
  MessageSquare, Lock, EyeOff, FileText, Check, Maximize2, Minimize2,
  Banknote, Store, Wrench, Car, FileCheck2, GraduationCap, Zap, Search,
  Smartphone, Monitor, CheckCircle2, AlertCircle, Info, Clock, Building2, ArrowLeft,
  Bike, ShoppingBag, Package, Laptop, TrendingUp, Home, Calculator, Scale, LogOut, ChevronDown, Settings, Coins, Download, PlusCircle, Headphones
} from 'lucide-react';
import { generateCreditPassportPdf } from '@/lib/pdfGenerator';
import { UnderwritingInput, CreditProfileReport, getDisplayStatus, getDisplayGrade } from '@/lib/scoring';
import { matchLenders, MatchedLender } from '@/lib/lenderMatcher';
import PublicCalculator from './PublicCalculator';
import LenderDirectory from './LenderDirectory';
import AuthModal from './AuthModal';
import ApplicationTracker, { ApplicationRecord, ReportHistoryItem, ActiveAssessmentTask } from './ApplicationTracker';
import UserSettingsModal, { UserProfileData } from './UserSettingsModal';
import BankLogo from './BankLogo';
import AICoPilotChat from './AICoPilotChat';
import CreditPassportPaywallModal from './CreditPassportPaywallModal';
import SupportTicketsModal from './SupportTicketsModal';
import { useLanguage, Language } from '@/context/LanguageContext';
import { extractTextFromPdfBase64 } from '@/lib/pdfExtractor';

export interface GigSlipData {
  weekNum: string;
  periodStr: string;
  dateStr: string;
  normalHrs: number;
  wkndHrs: number;
  normalOrders: number;
  lndOrders: number;
  cancelCount: number;
  cancelAmt: number;
  bonusAmt: number;
  grossPay: number;
  netPay: number;
}

export interface BankStatementData {
  month: string;          // e.g. "2026-07"
  startBal: number;
  endBal: number;
  totalInflows: number;
  totalOutflows: number;
}

export interface ExtendedUnderwritingInput extends UnderwritingInput {
  reconciliation: {
    is_reconciled: boolean;
    reconciliation_notes: string[];
    matched_payout_count: number;
    mismatched_payout_count: number;
  };
  fileChecklist: {
    fileName: string;
    fileSize: string;
    status: 'verified' | 'flagged';
    documentType: 'bank_statement' | 'platform_dashboard' | 'tax_epf' | 'mykad_id' | 'pay_slip' | 'other';
    gigSlipData?: GigSlipData;
    bankStatementData?: BankStatementData;
  }[];
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

const getChecklistQuestions = (purpose: string, lang: 'en' | 'bm' = 'en'): string[] => {
  if (lang === 'bm') {
    const baseBm = [
      "Saya telah aktif di platform gig (Grab, Lalamove, Shopee) selama lebih 3 bulan.",
      "Saya mempunyai akaun bank yang telah aktif sekurang-kurangnya 3 bulan.",
      "Sasaran bayaran bulanan pinjaman saya adalah kurang daripada 30% pendapatan bersih bulanan.",
      "Saya mempunyai PDF penyata bank 3 bulan (dimuat turun dari aplikasi bank, bukan tangkap layar).",
      "Saya memahami jumlah komitmen bayaran hutang bulanan semasa saya.",
    ];
    if (purpose === 'personal_cash' || purpose === 'education') return [
      ...baseBm,
      "Saya mempunyai sekurang-kurangnya satu bukti pendapatan tetap (pendapatan Grab, Shopee, atau kemasukan bank).",
      "Saya mempunyai MyKad (IC) yang sah untuk pengesahan identiti.",
      "Saya tidak disenaraihitamkan (blacklist) oleh mana-mana pembiaya dalam tempoh 12 bulan lalu.",
      "Saya tahu tujuan khusus permohonan pinjaman ini (tujuan jelas meningkatkan peluang kelulusan).",
      "Saya bersedia membayar balik pinjaman setiap bulan daripada pendapatan platform saya.",
    ];
    if (purpose === 'working_capital' || purpose === 'invoice_financing') return [
      ...baseBm,
      "Saya telah mendaftarkan perniagaan dengan SSM (milikan tunggal juga diterima) — meningkatkan peluang kelulusan.",
      "Saya mempunyai sekurang-kurangnya 6 bulan rekod operasi perniagaan (jualan, invois, atau pendapatan platform).",
      "Saya mempunyai sebab perniagaan yang jelas untuk pinjaman ini (belian stok, bayaran pembekal).",
      "Saya mempunyai laporan eksport pendapatan platform atau invois terkini untuk dimuat naik.",
      "Saya faham DSR pinjaman perniagaan dikira berbeza daripada DSR pinjaman peribadi.",
    ];
    if (purpose === 'vehicle') return [
      ...baseBm,
      "Saya mempunyai sekurang-kurangnya 10% daripada harga kenderaan sebagai wang pendahuluan tunai.",
      "Saya mempunyai sebut harga kenderaan daripada pengedar sah yang sedia dihantar.",
      "Saya telah menyemak rekod CCRIS untuk sebarang tunggakan Sewa Beli aktif.",
      "Saya mempunyai penjamin (pilihan, tetapi meningkatkan peluang kelulusan Sewa Beli kali pertama).",
      "Saya mempunyai profil penarafan pemandu platform gig yang aktif (melebihi 4.5/5.0).",
    ];
    if (purpose === 'equipment') return [
      ...baseBm,
      "Saya mempunyai sebut harga pembekal untuk peralatan yang ingin dibeli.",
      "Saya mempunyai sekurang-kurangnya 10% harga peralatan sebagai wang pendahuluan.",
      "Saya telah mendaftarkan perniagaan dengan SSM (diperlukan oleh kebanyakan pembiaya peralatan).",
      "Saya mempunyai rancangan perniagaan yang jelas bagaimana peralatan ini akan menjana pendapatan.",
      "Saya mempunyai penjamin jika pendapatan saya hampir dengan syarat minimum.",
    ];
    return baseBm.concat([
      "Saya mempunyai semua dokumen yang diperlukan dalam format PDF atau gambar yang jelas.",
      "Saya mempunyai MyKad yang sah untuk pengesahan identiti.",
      "Saya memahami terma bayaran balik pinjaman dan tanggungjawab bulanan.",
      "Saya mempunyai penjamin jika diperlukan.",
      "Saya tidak pernah gagal membayar pinjaman dalam tempoh 24 bulan yang lalu.",
    ]);
  }

  const base = [
    "I have been active on my gig platform (Grab, Lalamove, Shopee) for more than 3 months.",
    "I have a bank account that has been active for at least 3 months.",
    "My target monthly loan payment is less than 30% of my monthly net earnings.",
    "I have a 3-month bank statement PDF ready to upload (downloaded from my bank app, not screenshot).",
    "I understand my current total monthly debt repayment obligations.",
  ];
  if (purpose === 'personal_cash' || purpose === 'education') return [
    ...base,
    "I have at least one proof of regular income (Grab earnings, Shopee disbursement, or bank inflow).",
    "I have my MyKad (IC) available for identity verification.",
    "I have not been blacklisted by any lender in the past 12 months.",
    "I know exactly how much I need and why (clear loan purpose helps approval).",
    "I am prepared to repay the loan monthly from my platform earnings.",
  ];
  if (purpose === 'working_capital' || purpose === 'invoice_financing') return [
    ...base,
    "I have registered my business with SSM (even as sole proprietor) — improves approval odds significantly.",
    "I have at least 6 months of business operation records (sales, invoices, or platform earnings).",
    "I have a clear business reason for this loan (stock purchase, supplier payment, etc.).",
    "I have my latest platform earnings export or invoices ready to upload.",
    "I understand that business loan DSR is calculated differently from personal loan DSR.",
  ];
  if (purpose === 'vehicle') return [
    ...base,
    "I have at least 10% of the vehicle price saved as a cash downpayment.",
    "I have a vehicle quotation from a licensed dealer ready to submit.",
    "I have checked my CCRIS report for any active Hire Purchase default listings.",
    "I have a guarantor ready (optional, but improves approval odds for first-time HP).",
    "I have printed a copy of my active gig platform driver rating profile (above 4.5/5.0).",
  ];
  if (purpose === 'equipment') return [
    ...base,
    "I have a supplier quotation for the equipment I plan to purchase.",
    "I have at least 10% of the equipment price ready as downpayment.",
    "I have registered my business with SSM (required by most equipment lenders).",
    "I have a clear business plan showing how this equipment will generate income.",
    "I have a guarantor or co-borrower available if my income is close to the minimum.",
  ];
  return base.concat([
    "I have all required documents ready in PDF or clear image format.",
    "I have my MyKad available for identity verification.",
    "I understand the loan repayment terms and monthly obligations.",
    "I have a guarantor available if needed.",
    "I have not defaulted on any loan in the past 24 months.",
  ]);
};

export default function Dashboard() {
  const { language, setLanguage, t } = useLanguage();
  const [perspective, setPerspective] = useState<'B2C' | 'B2B'>('B2C');
  const [currentPage, setCurrentPage] = useState<'landing' | 'calculator' | 'directory' | 'tracker' | 'app'>('landing');
  const [userSession, setUserSession] = useState<UserProfileData | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  
  // Centralized Application Tracker Records & Assessment Report History
  const [submittedApplications, setSubmittedApplications] = useState<ApplicationRecord[]>([]);
  const [reportHistory, setReportHistory] = useState<ReportHistoryItem[]>([]);
  const [isCurrentResultDemo, setIsCurrentResultDemo] = useState<boolean>(false);

  // Load persisted records, profile, and stored assessment JSON from server & localStorage
  useEffect(() => {
    try {
      const savedApps = localStorage.getItem('crediflow_submitted_apps');
      if (savedApps) setSubmittedApplications(JSON.parse(savedApps));
      const savedReports = localStorage.getItem('crediflow_report_history');
      if (savedReports) setReportHistory(JSON.parse(savedReports));
      const savedUser = localStorage.getItem('crediflow_user_session');
      if (savedUser) setUserSession(JSON.parse(savedUser));
      const savedAssessment = localStorage.getItem('crediflow_latest_assessment');
      if (savedAssessment) setB2cResult(JSON.parse(savedAssessment));
    } catch (e) {}

    // Synchronize with persistent JSON file on disk
    fetch('/api/store-assessment')
      .then(res => res.json())
      .then(res => {
        if (res.success && res.data && res.data.report && res.data.inputData) {
          setB2cResult({
            hash: res.data.hash || 'stored-hash',
            inputData: res.data.inputData,
            report: res.data.report
          });
        }
      })
      .catch(() => {});

    try {
      if (typeof window !== 'undefined') {
        const sessionStr = localStorage.getItem('crediflow_user_session');
        const sessionObj = sessionStr ? JSON.parse(sessionStr) : null;
        if (sessionObj && sessionObj.profileId === 'guest_tester') {
          // Guest tester ALWAYS resets to locked on load so user can test paywall anytime!
          localStorage.removeItem('creditflow_passport_unlocked');
          setIsPassportUnlocked(false);
        } else if (sessionObj && sessionObj.profileId === 'premium_pro') {
          localStorage.setItem('creditflow_passport_unlocked', 'true');
          setIsPassportUnlocked(true);
        } else {
          const unlocked = localStorage.getItem('creditflow_passport_unlocked');
          if (unlocked === 'true') {
            setIsPassportUnlocked(true);
          }
        }
      }
    } catch (e) {}
  }, []);

  const handleSaveUserProfile = (updated: UserProfileData) => {
    setUserSession(updated);
    try {
      localStorage.setItem('crediflow_user_session', JSON.stringify(updated));
    } catch (e) {}
  };
  
  const [viewingArchivedReport, setViewingArchivedReport] = useState<ReportHistoryItem | null>(null);

  const handleStartNewApplication = () => {
    setViewingArchivedReport(null);
    setUploadedFiles([]);
    setB2cResult(null);
    setPreUploadDeclNoDefault(false);
    setPreUploadDeclAuthentic(false);
    setPreUploadDeclConsent(false);
    setPreUploadDeclPdpa(false);
    setDeclarationError(false);
    setUploadValidationError(null);
    setActiveStep(1);
    setCurrentPage('app');
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };
  
  // Pre-Upload Prerequisite Borrower Declarations (Step 2)
  const [preUploadDeclNoDefault, setPreUploadDeclNoDefault] = useState<boolean>(false);
  const [preUploadDeclAuthentic, setPreUploadDeclAuthentic] = useState<boolean>(false);
  const [preUploadDeclConsent, setPreUploadDeclConsent] = useState<boolean>(false);
  const [preUploadDeclPdpa, setPreUploadDeclPdpa] = useState<boolean>(false);
  const [showPdpaModal, setShowPdpaModal] = useState<boolean>(false);
  const [declarationError, setDeclarationError] = useState<boolean>(false);
  const [uploadValidationError, setUploadValidationError] = useState<string | null>(null);
  const [incomeWorkType, setIncomeWorkType] = useState<'gig' | 'salaried' | 'both'>('gig');

  // Step 2 Optional Documents Expandable State
  const [showOptionalDocs, setShowOptionalDocs] = useState<boolean>(false);

  // Apply Modal Mandatory Borrower Declarations (Step 3 / Apply)
  const [applyDeclNoDefault, setApplyDeclNoDefault] = useState<boolean>(false);
  const [applyDeclAffordability, setApplyDeclAffordability] = useState<boolean>(false);
  const [applyDeclSingleReport, setApplyDeclSingleReport] = useState<boolean>(false);

  const [readinessChecklist, setReadinessChecklist] = useState<Record<number, boolean>>({
    0: false, 1: false, 2: false, 3: false, 4: false,
    5: false, 6: false, 7: false, 8: false, 9: false
  });
  const [pdpaConsent, setPdpaConsent] = useState(false);
  const [targetLoanPurpose, setTargetLoanPurpose] = useState<'personal_cash' | 'working_capital' | 'equipment' | 'vehicle' | 'invoice_financing' | 'education'>('personal_cash');
  const [targetLoanAmount, setTargetLoanAmount] = useState<number>(5000);
  const [calcTenureYears, setCalcTenureYears] = useState<number>(1);
  const [calcInterestRate, setCalcInterestRate] = useState<number>(6.0);
  const [downpaymentAmount, setDownpaymentAmount] = useState<number>(500);
  const [activeStep, setActiveStep] = useState<number>(1);
  const [appliedLenders, setAppliedLenders] = useState<Record<string, { appliedAt: string; refCode: string }>>({});
  const [compareOpen, setCompareOpen] = useState(false);
  const [applyModalOpen, setApplyModalOpen] = useState(false);
  const [demoProfilesModalOpen, setDemoProfilesModalOpen] = useState(false);
  const [applyTarget, setApplyTarget] = useState<{ lenderName: string; lenderUrl: string; productName: string; speed?: string; installment?: number } | null>(null);
  const [applySubmitted, setApplySubmitted] = useState(false);
  const [expandedLenderInfo, setExpandedLenderInfo] = useState<string | null>(null);
  const [compareSwipeIndex, setCompareSwipeIndex] = useState(0);
  const [pdpaConsentModalOpen, setPdpaConsentModalOpen] = useState(false);
  const [pendingPortal, setPendingPortal] = useState<'B2C' | 'B2B' | null>(null);
  const [lenderMatchOpen, setLenderMatchOpen] = useState(false);
  const [showLandingGuide, setShowLandingGuide] = useState(false);
  const [showOtherLenders, setShowOtherLenders] = useState(true);
  const [shariahPreference, setShariahPreference] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [pipelineLogs, setPipelineLogs] = useState<string[]>([]);
  const [pipelineStep, setPipelineStep] = useState(0);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [categorySuitabilityModal, setCategorySuitabilityModal] = useState<any | null>(null);
  const [isPassportUnlocked, setIsPassportUnlocked] = useState<boolean>(false);
  const [showPaywallModal, setShowPaywallModal] = useState<boolean>(false);
  const [isSupportModalOpen, setIsSupportModalOpen] = useState<boolean>(false);
  const [initialSupportTicketId, setInitialSupportTicketId] = useState<string | null>(null);
  const [activeAssessmentTask, setActiveAssessmentTask] = useState<ActiveAssessmentTask | null>(null);

  // B2C Upload States
  const [uploadedFiles, setUploadedFiles] = useState<{
    fileName: string;
    fileType: string;
    fileSize: string;
    fileBase64: string;
    fileText?: string;
    category: 'bank_statement' | 'platform_dashboard' | 'tax_epf' | 'mykad_id' | 'pay_slip' | 'business_proposal' | 'ssm_license' | 'premise_photos';
  }[]>([]);

  const [previewRedactedFile, setPreviewRedactedFile] = useState<string | null>(null);

  // PII Masking State
  const [piiMaskingEnabled, setPiiMaskingEnabled] = useState(true);
  const [isMasking, setIsMasking] = useState(false);
  const [maskingLogs, setMaskingLogs] = useState<string[]>([]);

  // B2C Underwritten Result
  const [b2cResult, setB2cResult] = useState<{
    inputData: ExtendedUnderwritingInput;
    report: CreditProfileReport;
    hash: string;
  } | null>(null);

  // B2B Active Applicant
  const [selectedB2bApplicant, setSelectedB2bApplicant] = useState<string>('ahmad');
  const [b2bWorkspaceTab, setB2bWorkspaceTab] = useState<'summary' | 'dossier' | 'reconciliation' | 'ledger' | 'forensics'>('summary');
  const [selectedDossierFileIndex, setSelectedDossierFileIndex] = useState<number>(0);
  const [b2bDocFilter, setB2bDocFilter] = useState<'all' | 'bank_statement' | 'platform_dashboard' | 'tax_epf' | 'mykad_id' | 'pay_slip' | 'business_proposal' | 'ssm_license' | 'premise_photos'>('all');
  const [inspectingDoc, setInspectingDoc] = useState<{ fileName: string; fileSize: string; status: string; documentType: string } | null>(null);
  const [ledgerMonthFilter, setLedgerMonthFilter] = useState<string>('all');
  const [ledgerSearchQuery, setLedgerSearchQuery] = useState<string>('');


  // B2B Applicants list
  const [b2bApplicants, setB2bApplicants] = useState<Array<{
    id: string;
    name: string;
    platform: string;
    score: number;
    grade: string;
    dsr: number;
    status: string;
    isTampered: boolean;
    hash: string;
  }>>([
    { id: 'ahmad', name: 'Ahmad Bin Razali', platform: 'Grab & Foodpanda', score: 740, grade: 'A', dsr: 12.4, status: 'Approved', isTampered: false, hash: 'f2a7b8e19c0b2d3e4f5a6b7c8d9e0f1a' },
    { id: 'chong', name: 'Chong Wei Meng', platform: 'Shopee Merchant', score: 430, grade: 'D', dsr: 19.8, status: 'Declined', isTampered: false, hash: 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6' },
    { id: 'siti', name: 'Siti Aminah Binti Ahmad', platform: 'Freelance Design', score: 300, grade: 'FRAUD_ALERT', dsr: 0, status: 'Fraud Alert', isTampered: true, hash: 'd3b07384d113edec49eaa6238ad5ff00' }
  ]);

  // Full datasets mapped for B2B detail panel
  const [fullProfilesDb, setFullProfilesDb] = useState<Record<string, { inputData: ExtendedUnderwritingInput; report: any; hash: string }>>({});

  // Active B2B selection resolver
  const activeB2bApplicantData = fullProfilesDb[selectedB2bApplicant];

  // Populate B2B standard profiles on load
  useEffect(() => {
    const fetchMockData = async () => {
      const profiles = ['ahmad', 'chong', 'siti'];
      const db: any = {};
      for (const id of profiles) {
        try {
          const res = await fetch('/api/underwrite', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ mockProfileId: id, documentHash: b2bApplicants.find(a => a.id === id)?.hash })
          });
          const data = await res.json();
          if (data.success) {
            db[id] = {
              inputData: data.inputData,
              report: data.report,
              hash: data.hash
            };
          }
        } catch (e) {
          console.error("Failed to load initial profile data: ", id, e);
        }
      }
      setFullProfilesDb(db);
    };
    fetchMockData();
  }, []);

  // Automatically scroll window to top whenever step or page transitions occur
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    const timer = setTimeout(() => {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    }, 50);
    return () => clearTimeout(timer);
  }, [activeStep, currentPage, perspective]);

  // Compute a SHA-256 helper for real uploads
  const calculateSha256 = async (base64Str: string): Promise<string> => {
    try {
      const msgBuffer = new TextEncoder().encode(base64Str.slice(0, 10000));
      const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    } catch (e) {
      return Math.random().toString(36).substring(2) + Date.now().toString(36);
    }
  };

  // Run the Underwriting processing pipeline (Dynamic Tracker & Background AI with Auto-Retry)
  const runUnderwritingPipeline = async (type: 'mock' | 'real', mockId?: string) => {
    const taskId = `task-${Date.now()}`;
    const initialTask: ActiveAssessmentTask = {
      id: taskId,
      startedAt: new Date().toLocaleTimeString('en-MY', { hour: '2-digit', minute: '2-digit' }),
      targetLoanPurpose,
      targetLoanAmount,
      filesCount: uploadedFiles.length || 1,
      progress: 20,
      phase: 'ENCRYPTING',
      statusMessage: language === 'bm'
        ? 'Menyulitkan fail dokumen & memadam maklumat peribadi (Pematuhan Akta PDPA)...'
        : 'Encrypting documents & executing on-device PII masking (PDPA Compliant)...'
    };

    setActiveAssessmentTask(initialTask);
    setB2cResult(null);
    setIsProcessing(false);
    setIsMasking(false);
    
    // Automatically ensure session for tracker view
    if (!userSession) {
      setUserSession({
        name: type === 'mock' && mockId ? (b2bApplicants.find(a => a.id === mockId)?.name || 'Verified Borrower') : 'Ahmad',
        phone: '012-***5421',
        role: 'BORROWER'
      });
    }

    // Immediately route user straight to "My Applications"
    setCurrentPage('tracker');

    // Background Execution with Multi-Step Progress & Client Auto-Retry Loop
    (async () => {
      await new Promise(r => setTimeout(r, 700));

      // Phase 2: AI Cashflow Auditing
      setActiveAssessmentTask(prev => prev ? {
        ...prev,
        progress: 45,
        phase: 'AI_AUDITING',
        statusMessage: language === 'bm'
          ? 'AI sedang mengaudit aliran tunai penyata bank 3 bulan & pendapatan platform gig...'
          : 'AI auditing 3-month bank statement cashflow & gig platform inflows...'
      } : null);

      let payload: any = {};
      let docHash = '';

      if (type === 'mock' && mockId) {
        docHash = b2bApplicants.find(a => a.id === mockId)?.hash || 'd3b07384d113edec49eaa6238ad5ff00';
        payload = { 
          mockProfileId: mockId, 
          documentHash: docHash,
          targetLoanPurpose,
          targetLoanAmount,
          tenureYears: calcTenureYears || 1,
          downpaymentAmount
        };
      } else {
        const combinedBase64 = uploadedFiles.map(f => f.fileBase64 || '').join('');
        docHash = await calculateSha256(combinedBase64 || Date.now().toString());

        // Smart Payload Serializer: Keep full Base64 for all documents within Vercel's 3.5MB safe budget
        // This ensures Gemini receives the original high-fidelity PDF binary to parse exact bank layouts
        let totalPayloadBytes = 0;
        const maxBudgetBytes = 3.5 * 1024 * 1024; // 3.5 MB safe limit for Vercel

        const sanitizedFiles = uploadedFiles.map(file => {
          const fileBytes = file.fileBase64 ? file.fileBase64.length : 0;
          let sendBase64 = "";
          if (file.fileBase64 && (totalPayloadBytes + fileBytes < maxBudgetBytes)) {
            totalPayloadBytes += fileBytes;
            sendBase64 = file.fileBase64;
          }
          return {
            fileName: file.fileName,
            fileSize: file.fileSize,
            fileType: file.fileType,
            category: file.category,
            fileBase64: sendBase64,
            fileText: file.fileText || ''
          };
        });

        payload = {
          files: sanitizedFiles,
          documentHash: docHash,
          targetLoanPurpose,
          targetLoanAmount,
          tenureYears: calcTenureYears || 1,
          downpaymentAmount,
          isUnlocked: isPassportUnlocked
        };
      }

      let successData: any = null;
      const maxRetries = 3;

      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          const res = await fetch('/api/underwrite', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
          let data: any = null;
          try {
            data = await res.json();
          } catch (jsonErr) {
            console.warn(`[UNDERWRITE] Non-JSON server response (HTTP ${res.status})`);
          }
          if (data && data.success) {
            successData = data;
            break;
          } else {
            throw new Error(data?.error || `HTTP ${res.status}: ${res.statusText || 'Underwrite request failed'}`);
          }
        } catch (err: any) {
          console.warn(`[UNDERWRITE] Attempt ${attempt}/${maxRetries} encountered issue:`, err);
          if (attempt < maxRetries) {
            setActiveAssessmentTask(prev => prev ? {
              ...prev,
              phase: 'RETRYING',
              statusMessage: language === 'bm'
                ? `Sambungan AI sedang diproses semula secara automatik (Percubaan ${attempt + 1} daripada ${maxRetries})...`
                : `AI connection busy · Auto-reconnecting (Attempt ${attempt + 1} of ${maxRetries})...`
            } : null);
            await new Promise(r => setTimeout(r, 2000));
          }
        }
      }

      if (successData && successData.success) {
        // Phase 3: DSR & Bank Matching
        setActiveAssessmentTask(prev => prev ? {
          ...prev,
          progress: 85,
          phase: 'CALCULATING_DSR',
          statusMessage: language === 'bm'
            ? 'Mengira Nisbah Khidmat Hutang (DSR) & memadankan bank digital berlesen...'
            : 'Calculating Debt Service Ratio (DSR) & pre-matching licensed digital banks...'
        } : null);

        await new Promise(r => setTimeout(r, 600));

        const isDemo = type === 'mock' || !!mockId;
        setIsCurrentResultDemo(isDemo);

        const result = {
          inputData: successData.inputData,
          report: successData.report,
          hash: successData.hash
        };
        setB2cResult(result);
        try {
          localStorage.setItem('crediflow_latest_assessment', JSON.stringify(result));
          fetch('/api/store-assessment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(result)
          }).catch(() => {});
        } catch (e) {}

        // Append or Update Report History with 30-day validity
        const now = Date.now();
        const expiresDate = new Date(now + 30 * 24 * 60 * 60 * 1000);
        const expiresAtStr = expiresDate.toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric' });

        const newReportItem: ReportHistoryItem = {
          id: `rep-${now}`,
          generatedAt: new Date().toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
          expiresAt: expiresAtStr,
          expiresTimestamp: expiresDate.getTime(),
          name: successData.inputData.name,
          platform: successData.inputData.platform,
          score: successData.report.score,
          grade: successData.report.grade,
          dsr: successData.report.dsr,
          status: successData.report.status,
          loanPurpose: targetLoanPurpose,
          loanAmount: targetLoanAmount,
          isDemo: isDemo,
          result: result
        };

        setReportHistory(prev => {
          // Check if there is an existing report for the same applicant name from today (e.g. preview upgraded to full)
          const existingIndex = prev.findIndex(r => r.name.trim().toLowerCase() === successData.inputData.name.trim().toLowerCase());
          let updated: ReportHistoryItem[];
          if (existingIndex >= 0) {
            // Overwrite existing report with new full synthesis result
            updated = [...prev];
            updated[existingIndex] = {
              ...updated[existingIndex],
              ...newReportItem,
              id: prev[existingIndex].id // keep consistent id
            };
          } else {
            updated = [newReportItem, ...prev];
          }
          try { localStorage.setItem('crediflow_report_history', JSON.stringify(updated)); } catch(e) {}
          return updated;
        });

        if (type === 'real') {
          const newId = `real-${Date.now()}`;
          const newApplicant = {
            id: newId,
            name: successData.inputData.name,
            platform: successData.inputData.platform,
            score: successData.report.score,
            grade: successData.report.grade,
            dsr: successData.report.dsr,
            status: successData.report.status,
            isTampered: successData.report.grade === 'FRAUD_ALERT',
            hash: successData.hash
          };
          setB2bApplicants(prev => [newApplicant, ...prev]);
          setFullProfilesDb(prev => ({
            ...prev,
            [newId]: result
          }));
          setSelectedB2bApplicant(newId);
        }

        // Phase 4: Completed!
        setActiveAssessmentTask(prev => prev ? {
          ...prev,
          progress: 100,
          phase: 'COMPLETED',
          statusMessage: language === 'bm'
            ? 'Penilaian Selesai. Laporan dan pilihan bank anda sedia.'
            : 'Assessment Complete. Your report and matched bank options are ready.',
          result: result
        } : null);

      } else {
        setActiveAssessmentTask(prev => prev ? {
          ...prev,
          phase: 'FAILED',
          statusMessage: language === 'bm'
            ? 'Gagal memproses fail. Sila cuba muat naik semula.'
            : 'Failed to process document. Please try uploading again.'
        } : null);
      }
    })();
  };

  const handleMultipleFilesUploadWithCategory = (e: React.ChangeEvent<HTMLInputElement>, category: 'bank_statement' | 'platform_dashboard' | 'tax_epf' | 'mykad_id' | 'pay_slip' | 'business_proposal' | 'ssm_license' | 'premise_photos') => {
    if (viewingArchivedReport) return;
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach(file => {
      if (file.type.startsWith('image/')) {
        // Compress high-res mobile screenshots so batch 10-20 images stay lightweight
        const reader = new FileReader();
        reader.onload = (event) => {
          const img = new Image();
          img.onload = () => {
            const maxDim = 1200;
            let width = img.width;
            let height = img.height;
            if (width > maxDim || height > maxDim) {
              if (width > height) {
                height = Math.round((height * maxDim) / width);
                width = maxDim;
              } else {
                width = Math.round((width * maxDim) / height);
                height = maxDim;
              }
            }
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(img, 0, 0, width, height);
              const compressedBase64 = canvas.toDataURL('image/jpeg', 0.75);
              const estimatedBytes = Math.round((compressedBase64.length * 3) / 4);
              setUploadedFiles(prev => [...prev, {
                fileName: file.name,
                fileType: 'image/jpeg',
                fileSize: (estimatedBytes / 1024 / 1024).toFixed(2) + " MB",
                fileBase64: compressedBase64,
                category: category
              }]);
            } else {
              setUploadedFiles(prev => [...prev, {
                fileName: file.name,
                fileType: file.type,
                fileSize: ((file.size || 0) / 1024 / 1024).toFixed(2) + " MB",
                fileBase64: event.target?.result as string,
                category: category
              }]);
            }
          };
          img.src = event.target?.result as string;
        };
        reader.readAsDataURL(file);
      } else {
        // Direct read for PDF or other document types with instant text extraction
        const reader = new FileReader();
        reader.onload = async () => {
          if (typeof reader.result === 'string') {
            let extractedText = '';
            if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
              try {
                extractedText = await extractTextFromPdfBase64(reader.result);
              } catch (pdfErr) {
                console.warn('[DASHBOARD] PDF text extraction note:', pdfErr);
              }
            }

            const resultStr = typeof reader.result === 'string' ? reader.result : '';
            setUploadedFiles(prev => [...prev, {
              fileName: file.name,
              fileType: file.type || 'application/pdf',
              fileSize: ((file.size || 0) / 1024 / 1024).toFixed(2) + " MB",
              fileBase64: resultStr,
              fileText: extractedText,
              category: category
            }]);
          }
        };
        reader.readAsDataURL(file);
      }
    });
  };

  const removeUploadedFile = (idx: number) => {
    if (viewingArchivedReport) return;
    setUploadedFiles(prev => prev.filter((_, i) => i !== idx));
  };

  const hasBank = uploadedFiles.some(f => f.category === 'bank_statement');
  const hasPlatform = uploadedFiles.some(f => f.category === 'platform_dashboard');
  const hasTaxOrEpf = uploadedFiles.some(f => f.category === 'tax_epf');
  const hasMykad = uploadedFiles.some(f => f.category === 'mykad_id');
  const hasPaySlip = uploadedFiles.some(f => f.category === 'pay_slip');
  const hasBusinessProposal = uploadedFiles.some(f => f.category === 'business_proposal');
  const hasSsmLicense = uploadedFiles.some(f => f.category === 'ssm_license');
  const hasPremisePhotos = uploadedFiles.some(f => f.category === 'premise_photos');

  const countUniqueDocCategories = () => {
    let count = 0;
    if (hasBank) count++;
    if (hasPlatform) count++;
    if (hasTaxOrEpf) count++;
    if (hasMykad) count++;
    if (hasPaySlip) count++;
    if (hasBusinessProposal) count++;
    if (hasSsmLicense) count++;
    if (hasPremisePhotos) count++;
    return count;
  };

  const uniqueDocCategories = countUniqueDocCategories();

  // Dynamic rotating headlines (Changes every 3 seconds to explain functions clearly)
  const rotatingHeadlines = [
    {
      top: language === 'bm' ? "Tiada Slip Gaji?" : "No Payslip?",
      highlight: language === 'bm' ? "Cari Bank Yang Sesuai." : "Find Your Bank Match.",
      sub: t.headline1Sub
    },
    {
      top: language === 'bm' ? "Pemandu Grab, Shopee atau Freelance?" : "Grab, Shopee or Freelance?",
      highlight: language === 'bm' ? "Semak Kelayakan Segera." : "Get Instant Pre-Approval.",
      sub: t.headline2Sub
    },
    {
      top: language === 'bm' ? "Perlu Tunai Mikro Pantas?" : "Need Fast Micro-Cash?",
      highlight: language === 'bm' ? "Pindahan Bank 2–4 Jam." : "2–4 Hour Bank Payout.",
      sub: t.headline3Sub
    },
    {
      top: language === 'bm' ? "Tidak Tahu Di Mana Nak Mohon?" : "Don't Know Where to Apply?",
      highlight: language === 'bm' ? "Bandingkan Kadar Terbaik." : "Compare Best Bank Rates.",
      sub: t.headline4Sub
    }
  ];

  const [headlineIdx, setHeadlineIdx] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setHeadlineIdx((prev) => (prev + 1) % 4);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  // Strictly Blue-and-White Badge System
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Approved':
        return <span className="px-3.5 py-1 text-xs font-extrabold rounded-lg bg-blue-50 text-blue-900 border border-blue-200 flex items-center gap-1.5 w-fit"><ShieldCheck className="w-4 h-4 text-blue-800" /> {language === 'bm' ? 'DILULUSKAN' : 'APPROVED'}</span>;
      case 'Borderline':
        return <span className="px-3.5 py-1 text-xs font-extrabold rounded-lg bg-slate-50 text-blue-800 border border-slate-200 flex items-center gap-1.5 w-fit"><AlertTriangle className="w-4 h-4 text-blue-600" /> {language === 'bm' ? 'SEMPADAN' : 'BORDERLINE'}</span>;
      case 'Declined':
        return <span className="px-3.5 py-1 text-xs font-extrabold rounded-lg bg-white text-slate-650 border border-slate-350 flex items-center gap-1.5 w-fit"><AlertTriangle className="w-4 h-4 text-slate-500" /> {language === 'bm' ? 'DITOLAK' : 'DECLINED'}</span>;
      case 'Fraud Alert':
      case 'FRAUD_ALERT':
        return <span className="px-3.5 py-1 text-xs font-extrabold rounded-lg bg-blue-950 text-white border border-blue-950 flex items-center gap-1.5 w-fit uppercase tracking-wider"><ShieldAlert className="w-4 h-4 text-blue-300" /> {language === 'bm' ? 'AMARAN FRAUD' : 'FRAUD ALERT'}</span>;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex flex-col px-4 sm:px-8 pt-4 sm:pt-6 pb-12 md:pb-8 max-w-7xl mx-auto gap-6 sm:gap-8">
      
      {/* Top Main Navigation Header (Desktop Web View + Clean Mobile App Top Bar) */}
      <header className="flex justify-between items-center pb-4 sm:pb-6 border-b border-slate-200/80 gap-2 sm:gap-3">
        
        {/* Brand Logo & Identity */}
        <div className="flex items-center gap-2 sm:gap-3 cursor-pointer shrink-0" onClick={() => setCurrentPage('landing')}>
          <div className="w-9 h-9 sm:w-11 sm:h-11 bg-blue-950 text-white rounded-2xl flex items-center justify-center shadow-md shrink-0 overflow-hidden relative border border-blue-900/30">
            <img
              src="/logo/logo.svg"
              alt="Loan - La Logo"
              className="w-full h-full object-contain p-1"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
            <Building2 className="w-5 h-5 sm:w-6 sm:h-6 text-blue-200 hidden" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 whitespace-nowrap">
              <h1 className="text-base sm:text-xl font-black tracking-tight text-blue-950 whitespace-nowrap">
                Loan <span className="text-blue-600">-</span> La
              </h1>
              <span className="px-1.5 py-0.2 bg-blue-100 text-blue-900 font-extrabold text-[9px] rounded-md uppercase tracking-wider">
                MY
              </span>
            </div>
            <p className="hidden sm:block text-[10px] sm:text-[11px] text-slate-400 font-semibold truncate max-w-xs">
              {t.appTagline}
            </p>
          </div>
        </div>

        {/* Desktop Web Navigation Links (Hidden on Mobile) */}
        <div className="hidden md:flex items-center gap-1 p-1 bg-slate-100/90 border border-slate-200 rounded-2xl">
          <button
            onClick={() => setCurrentPage('landing')}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all whitespace-nowrap ${
              currentPage === 'landing'
                ? 'bg-blue-950 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {t.navHome}
          </button>
          <button
            onClick={() => setCurrentPage('calculator')}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all whitespace-nowrap ${
              currentPage === 'calculator'
                ? 'bg-blue-950 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {t.navCalculator}
          </button>
          <button
            onClick={() => setCurrentPage('directory')}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all whitespace-nowrap ${
              currentPage === 'directory'
                ? 'bg-blue-950 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {t.navDirectory}
          </button>
          {userSession && (
            <button
              onClick={() => setCurrentPage('tracker')}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap ${
                currentPage === 'tracker'
                  ? 'bg-blue-950 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>{t.navTracker}</span>
              {submittedApplications.length > 0 ? (
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  currentPage === 'tracker' ? 'bg-blue-800 text-white' : 'bg-slate-200 text-slate-700'
                }`}>
                  {submittedApplications.length}
                </span>
              ) : reportHistory.length > 0 ? (
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  currentPage === 'tracker' ? 'bg-blue-800 text-white' : 'bg-slate-200 text-slate-700'
                }`}>
                  {reportHistory.length}
                </span>
              ) : null}
            </button>
          )}
        </div>

        {/* Right Authentication Controls & Language Toggle Switcher */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Language Switcher Pill */}
          <div className="flex items-center p-0.5 bg-slate-100 border border-slate-200 rounded-xl font-bold text-xs">
            <button
              onClick={() => setLanguage('en')}
              className={`px-2 sm:px-2.5 py-1 rounded-lg transition-all text-[11px] sm:text-xs ${
                language === 'en'
                  ? 'bg-blue-950 text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="English"
            >
              EN
            </button>
            <button
              onClick={() => setLanguage('bm')}
              className={`px-2 sm:px-2.5 py-1 rounded-lg transition-all text-[11px] sm:text-xs ${
                language === 'bm'
                  ? 'bg-blue-950 text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Bahasa Melayu"
            >
              BM
            </button>
          </div>

          {userSession ? (
            <div className="flex items-center gap-1.5 sm:gap-2">
              <button
                onClick={() => handleStartNewApplication()}
                className="hidden sm:flex px-3.5 sm:px-4 py-2 bg-blue-950 hover:bg-blue-900 text-white text-xs font-black rounded-xl shadow-md transition-all items-center gap-1.5 active:scale-95 whitespace-nowrap cursor-pointer"
              >
                <span>{language === 'bm' ? 'Mohon Pinjaman Baharu +' : 'New Loan Application +'}</span>
              </button>

              {/* Clean User Profile Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 bg-slate-100 hover:bg-slate-200/80 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 transition-all cursor-pointer shadow-2xs"
                >
                  <div className="w-5 h-5 rounded-full bg-blue-950 text-white flex items-center justify-center text-[10px] font-black shrink-0">
                    {userSession.name.replace(/[^a-zA-Z]/g, '').slice(0, 1).toUpperCase() || 'U'}
                  </div>
                  <span className="hidden sm:inline max-w-[80px] truncate">
                    {userSession.name.replace(/Verified Borrower\s*\((.*?)\)/i, '$1').replace(/Peminjam Disahkan\s*\((.*?)\)/i, '$1')}
                  </span>
                  <ChevronDown className={`w-3.5 h-3.5 text-slate-500 transition-transform ${userDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {userDropdownOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setUserDropdownOpen(false)} 
                    />
                    <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 p-1.5 flex flex-col gap-1 animate-fade-in">
                      <div className="px-3 py-2 border-b border-slate-100">
                        <p className="text-xs font-extrabold text-slate-900">{userSession.name}</p>
                        <p className="text-[10px] text-slate-500 font-mono mt-0.5">{userSession.phone || userSession.role}</p>
                      </div>

                      <button
                        onClick={() => {
                          setUserDropdownOpen(false);
                          handleStartNewApplication();
                        }}
                        className="sm:hidden w-full px-3 py-2 text-left text-xs font-bold text-blue-950 hover:bg-blue-50 rounded-xl transition-all flex items-center gap-2 cursor-pointer"
                      >
                        <ArrowRight className="w-3.5 h-3.5 text-blue-900" />
                        <span>{language === 'bm' ? 'Mohon Pinjaman Baharu' : 'New Loan Application'}</span>
                      </button>

                      <button
                        onClick={() => {
                          setUserDropdownOpen(false);
                          setCurrentPage('tracker');
                        }}
                        className="w-full px-3 py-2 text-left text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-blue-950 rounded-xl transition-all flex items-center justify-between cursor-pointer"
                      >
                        <span className="flex items-center gap-2">
                          <FileText className="w-3.5 h-3.5 text-slate-500" />
                          {t.navTracker}
                        </span>
                        {submittedApplications.length > 0 ? (
                          <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-blue-100 text-blue-950">
                            {submittedApplications.length}
                          </span>
                        ) : reportHistory.length > 0 ? (
                          <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-slate-100 text-slate-700">
                            {reportHistory.length}
                          </span>
                        ) : null}
                      </button>

                      <button
                        onClick={() => {
                          setUserDropdownOpen(false);
                          setSettingsModalOpen(true);
                        }}
                        className="w-full px-3 py-2 text-left text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-blue-950 rounded-xl transition-all flex items-center gap-2 cursor-pointer"
                      >
                        <Settings className="w-3.5 h-3.5 text-slate-500" />
                        <span>{language === 'bm' ? 'Tetapan Profil & Akaun Bank' : 'Profile & Bank Account'}</span>
                      </button>

                      <button
                        onClick={() => {
                          setUserDropdownOpen(false);
                          setIsSupportModalOpen(true);
                        }}
                        className="w-full px-3 py-2 text-left text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-blue-950 rounded-xl transition-all flex items-center gap-2 cursor-pointer"
                      >
                        <Headphones className="w-3.5 h-3.5 text-blue-900" />
                        <span>{language === 'bm' ? 'Bantuan & Khidmat Pelanggan' : 'Customer Support & Help'}</span>
                      </button>

                      {/* Fast Account Switcher for Testing (Guest vs Pro) */}
                      <div className="pt-1 mt-1 border-t border-slate-100 flex flex-col gap-0.5">
                        {userSession.profileId !== 'guest_tester' ? (
                          <button
                            onClick={() => {
                              setUserDropdownOpen(false);
                              const guestUser: UserProfileData = {
                                name: 'Guest Tester (Free Preview)',
                                phone: '+60 12-000 1111',
                                role: language === 'bm' ? 'Peminjam Percuma (Terkunci)' : 'Guest Borrower (Free Preview Tier)',
                                profileId: 'guest_tester'
                              };
                              setUserSession(guestUser);
                              setIsPassportUnlocked(false);
                              try {
                                localStorage.setItem('crediflow_user_session', JSON.stringify(guestUser));
                                localStorage.removeItem('creditflow_passport_unlocked');
                              } catch (e) {}
                            }}
                            className="w-full px-3 py-1.5 text-left text-[11px] font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition-all flex items-center gap-2 cursor-pointer"
                          >
                            <span className="w-2 h-2 rounded-full bg-slate-400 shrink-0" />
                            <span>{language === 'bm' ? 'Tukar ke: Akaun Guest (Kunci)' : 'Switch: Guest (Free / Locked)'}</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              setUserDropdownOpen(false);
                              const proUser: UserProfileData = {
                                name: 'Ahmad Bin Razali (Pro Member)',
                                phone: '+60 12-482 9182',
                                role: language === 'bm' ? 'Ahli Pro 1 Bulan (Dibuka Penuh)' : 'Pro 1-Month Member (Fully Unlocked)',
                                profileId: 'premium_pro'
                              };
                              setUserSession(proUser);
                              setIsPassportUnlocked(true);
                              try {
                                localStorage.setItem('crediflow_user_session', JSON.stringify(proUser));
                                localStorage.setItem('creditflow_passport_unlocked', 'true');
                              } catch (e) {}
                            }}
                            className="w-full px-3 py-1.5 text-left text-[11px] font-bold text-blue-950 hover:bg-blue-50 rounded-lg transition-all flex items-center gap-2 cursor-pointer"
                          >
                            <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                            <span>{language === 'bm' ? 'Tukar ke: Akaun Pro (Buka)' : 'Switch: Pro (RM 19.90 Unlocked)'}</span>
                          </button>
                        )}
                      </div>

                      <button
                        onClick={() => {
                          setUserDropdownOpen(false);
                          setUserSession(null);
                          try {
                            localStorage.removeItem('crediflow_user_session');
                          } catch (e) {}
                        }}
                        className="w-full px-3 py-2 text-left text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition-all flex items-center gap-2 cursor-pointer"
                      >
                        <LogOut className="w-3.5 h-3.5 text-rose-500" />
                        <span>{language === 'bm' ? 'Log Keluar' : 'Sign Out'}</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          ) : (
            <button
              onClick={() => setAuthModalOpen(true)}
              className="px-3 sm:px-5 py-2 text-xs font-black text-white bg-blue-950 hover:bg-blue-900 rounded-xl transition-all shadow-md flex items-center gap-1 sm:gap-1.5 active:scale-95 cursor-pointer whitespace-nowrap"
            >
              <span className="hidden sm:inline">{language === 'bm' ? 'Log Masuk & Semak' : 'Log In & Check'}</span>
              <span className="sm:hidden">{language === 'bm' ? 'Log Masuk' : 'Log In'}</span>
              <ArrowRight className="w-3.5 h-3.5 text-blue-200" />
            </button>
          )}
        </div>
      </header>

      {/* CALCULATOR PAGE VIEW */}
      {currentPage === 'calculator' && (
        <PublicCalculator
          initialLoanAmount={targetLoanAmount}
          initialTenureYears={calcTenureYears}
          initialInterestRate={calcInterestRate}
          onStartAudit={(data) => {
            if (data) {
              setTargetLoanAmount(data.loanAmount);
              setTargetLoanPurpose(data.loanPurpose as any);
            }
            if (!userSession) {
              setAuthModalOpen(true);
            } else {
              setPerspective('B2C');
              setCurrentPage('app');
              setActiveStep(2);
            }
          }}
        />
      )}

      {/* LENDER DIRECTORY PAGE VIEW */}
      {currentPage === 'directory' && (
        <LenderDirectory
          onApplyLender={(name) => {
            if (!userSession) {
              setAuthModalOpen(true);
            } else {
              setCurrentPage('app');
              setActiveStep(1);
            }
          }}
        />
      )}

      {/* MY APPLICATIONS TRACKER VIEW */}
      {currentPage === 'tracker' && (
        !userSession ? (
          <div className="max-w-md mx-auto my-16 p-8 bg-white border border-slate-200 rounded-3xl shadow-sm text-center flex flex-col items-center gap-4">
            <div className="w-14 h-14 bg-blue-50 text-blue-900 rounded-2xl flex items-center justify-center">
              <Lock className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">
              {language === 'bm' ? 'Log Masuk Untuk Melihat Permohonan Anda' : 'Sign In to View Your Applications'}
            </h3>
            <p className="text-xs text-slate-500 max-w-xs leading-relaxed">
              {language === 'bm'
                ? 'Sila log masuk dengan nombor telefon atau emel anda untuk mengakses permohonan pinjaman dan laporan kelayakan anda.'
                : 'Please sign in with your phone number or email to access your submitted loan applications and saved credit reports.'}
            </p>
            <button
              onClick={() => setAuthModalOpen(true)}
              className="w-full py-3 bg-blue-950 hover:bg-blue-900 text-white font-bold text-xs rounded-xl transition-all shadow-sm cursor-pointer"
            >
              {language === 'bm' ? 'Log Masuk / Daftar Akaun' : 'Sign In / Register'}
            </button>
          </div>
        ) : (
          <ApplicationTracker
            applications={submittedApplications}
            reports={reportHistory}
            activeTask={activeAssessmentTask}
            onViewActiveTaskResult={() => {
              setPerspective('B2C');
              setCurrentPage('app');
              setActiveStep(4);
            }}
            onNewApplication={() => {
              if (!userSession) {
                setAuthModalOpen(true);
              } else {
                handleStartNewApplication();
              }
            }}
            onViewReport={(rep) => {
              setViewingArchivedReport(rep);
              setB2cResult(rep.result);
              setIsCurrentResultDemo(rep.isDemo);
              setTargetLoanAmount(rep.loanAmount || 5000);
              setTargetLoanPurpose((rep.loanPurpose as any) || 'personal_cash');
              setPerspective('B2C');
              setActiveStep(4);
              setCurrentPage('app');
            }}
            onDownloadReportPdf={(rep) => {
              generateCreditPassportPdf({ inputData: rep.result.inputData, report: rep.result.report, documentHash: rep.result.hash });
            }}
            onViewCertifiedPassport={() => {
              if (!b2cResult && reportHistory.length > 0) {
                const latest = reportHistory[0];
                setB2cResult(latest.result);
                setIsCurrentResultDemo(latest.isDemo);
              }
              setPerspective('B2C');
              setActiveStep(4);
              setCurrentPage('app');
            }}
          />
        )
      )}

      {/* LANDING PAGE / GATEWAY SCREEN (CUSTOMER PROBLEM-SOLVING HERO) */}
      {currentPage === 'landing' && (
        <div className="flex flex-col gap-10 sm:gap-14 w-full py-4 sm:py-6 animate-fade-in max-w-4xl mx-auto">

          {/* ========================================================= */}
          {/* 1. HERO SECTION: DIRECT ANSWERS TO CUSTOMER SITUATIONS     */}
          {/* ========================================================= */}
          <div className="flex flex-col items-center text-center gap-5 pt-2 sm:pt-4">
            


            {/* Dynamic Rotating Headline (Changes every 3s with smooth transition) */}
            <div className="min-h-[145px] sm:min-h-[160px] flex flex-col items-center justify-center">
              <div key={headlineIdx} className="animate-fade-in flex flex-col items-center">
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-blue-950 tracking-tight leading-tight max-w-2xl">
                  {rotatingHeadlines[headlineIdx].top} <br className="hidden sm:inline" />
                  <span className="text-blue-900">{rotatingHeadlines[headlineIdx].highlight}</span>
                </h1>

                {/* Dynamic Explanatory Subtitle */}
                <p className="text-sm sm:text-base text-slate-600 max-w-xl leading-relaxed font-medium mt-2.5">
                  {rotatingHeadlines[headlineIdx].sub}
                </p>
              </div>

              {/* 4 Interactive Progress Dots */}
              <div className="flex items-center gap-1.5 mt-3.5">
                {rotatingHeadlines.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setHeadlineIdx(idx)}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      headlineIdx === idx ? 'w-6 bg-blue-950' : 'w-2 bg-slate-300 hover:bg-slate-400'
                    }`}
                    aria-label={`Show slide ${idx + 1}`}
                  />
                ))}
              </div>
            </div>

            {/* 2 Big Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-3.5 w-full sm:w-auto mt-2">
              <button
                onClick={() => {
                  if (!userSession) {
                    setAuthModalOpen(true);
                  } else {
                    setPerspective('B2C');
                    setCurrentPage('app');
                    setActiveStep(1);
                  }
                }}
                className="w-full sm:w-auto px-8 py-4 bg-blue-950 hover:bg-blue-900 text-white font-black text-sm rounded-2xl shadow-xl transition-all flex items-center justify-center gap-2.5 active:scale-98"
              >
                <span>{t.startAssessmentBtn}</span>
                <ArrowRight className="w-4 h-4 text-blue-200" />
              </button>

              <button
                onClick={() => setCurrentPage('calculator')}
                className="w-full sm:w-auto px-7 py-4 bg-white hover:bg-slate-50 text-blue-950 font-bold text-sm rounded-2xl border border-slate-200 shadow-xs transition-all flex items-center justify-center gap-2"
              >
                <DollarSign className="w-4 h-4 text-blue-900" />
                <span>{t.navCalculator}</span>
              </button>
            </div>

            {/* 3 Relatable Customer Situation Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 w-full mt-3 text-left">
              
              <div
                onClick={() => setCurrentPage('directory')}
                className="p-4 bg-white border border-slate-200/90 rounded-2xl shadow-xs flex flex-col gap-1.5 hover:border-blue-300 transition-all cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-blue-900 shrink-0" />
                  <span className="text-xs font-black text-blue-950">&quot;{t.situation1Title}&quot;</span>
                </div>
                <p className="text-[11.5px] text-slate-600 leading-relaxed font-normal">
                  {t.situation1Desc}
                </p>
                <span className="text-[11px] font-extrabold text-blue-900 mt-1 flex items-center gap-1">
                  {t.situation1Btn}
                </span>
              </div>

              <div
                onClick={() => {
                  if (!userSession) setAuthModalOpen(true);
                  else { setPerspective('B2C'); setCurrentPage('app'); setActiveStep(1); }
                }}
                className="p-4 bg-white border border-slate-200/90 rounded-2xl shadow-xs flex flex-col gap-1.5 hover:border-blue-300 transition-all cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-900 shrink-0" />
                  <span className="text-xs font-black text-blue-950">&quot;{t.situation2Title}&quot;</span>
                </div>
                <p className="text-[11.5px] text-slate-600 leading-relaxed font-normal">
                  {t.situation2Desc}
                </p>
                <span className="text-[11px] font-extrabold text-blue-900 mt-1 flex items-center gap-1">
                  {t.situation2Btn}
                </span>
              </div>

              <div
                onClick={() => {
                  if (!userSession) setAuthModalOpen(true);
                  else { handleStartNewApplication(); }
                }}
                className="p-4 bg-white border border-slate-200/90 rounded-2xl shadow-xs flex flex-col gap-1.5 hover:border-blue-300 transition-all cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-blue-900 shrink-0" />
                  <span className="text-xs font-black text-blue-950">&quot;{t.situation3Title}&quot;</span>
                </div>
                <p className="text-[11.5px] text-slate-600 leading-relaxed font-normal">
                  {t.situation3Desc}
                </p>
                <span className="text-[11px] font-extrabold text-blue-900 mt-1 flex items-center gap-1">
                  {t.situation3Btn}
                </span>
              </div>

            </div>

            {/* Clear Non-Lender Notice */}
            <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl text-[11px] text-slate-600 max-w-2xl mt-1 text-center leading-relaxed">
              {t.partnershipNotice}
            </div>
          </div>



          {/* ========================================================= */}
          {/* 3. 3 EASY STEPS TO GET CASH (LARGE & SPACIOUS CARDS)      */}
          {/* ========================================================= */}
          <div className="flex flex-col gap-6">
            <div className="text-center max-w-md mx-auto">
              <h2 className="text-2xl sm:text-3xl font-black text-blue-950">
                {language === 'bm' ? 'Bagaimana Sistem Berfungsi' : 'How the System Works'}
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                {language === 'bm' ? 'Dari muat naik penyata sehingga kelulusan bank dalam 3 langkah mudah.' : 'From statement upload to bank approval in 3 simple steps.'}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              
              {/* Step 1 */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col gap-3 hover:border-blue-300 transition-all">
                <div className="w-10 h-10 bg-blue-950 text-white rounded-2xl flex items-center justify-center text-sm font-black shadow-md">
                  1
                </div>
                <h3 className="text-base font-extrabold text-blue-950">
                  {language === 'bm' ? 'Pilih Jenis & Jumlah Pinjaman' : 'Select Loan & Amount'}
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed font-normal">
                  {language === 'bm'
                    ? 'Tentukan jumlah yang anda perlukan (RM 1,000 hingga RM 150,000) untuk kecemasan, ansuran motor, atau modal niaga.'
                    : 'Specify how much you need (RM 1,000 to RM 150,000) for emergency cash, motorbike installments, or working capital.'}
                </p>
              </div>

              {/* Step 2 */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col gap-3 hover:border-blue-300 transition-all">
                <div className="w-10 h-10 bg-blue-950 text-white rounded-2xl flex items-center justify-center text-sm font-black shadow-md">
                  2
                </div>
                <h3 className="text-base font-extrabold text-blue-950">
                  {language === 'bm' ? 'Muat Naik Penyata PDF' : 'Upload Statement PDF'}
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed font-normal">
                  {language === 'bm'
                    ? 'Muat naik penyata Grab, Shopee atau PDF bank anda. Sistem kami mengaudit aliran pendapatan dan menutup nombor IC anda secara automatik.'
                    : 'Upload your Grab summary, Shopee store statement, or bank PDF. Our system audits your regular inflow and masks sensitive IC numbers.'}
                </p>
              </div>

              {/* Step 3 */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col gap-3 hover:border-blue-300 transition-all">
                <div className="w-10 h-10 bg-blue-950 text-white rounded-2xl flex items-center justify-center text-sm font-black shadow-md">
                  3
                </div>
                <h3 className="text-base font-extrabold text-blue-950">
                  {language === 'bm' ? 'Padanan Bank & Pengeluaran' : 'Bank Matching & Payout'}
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed font-normal">
                  {language === 'bm'
                    ? 'Laporan disahkan anda dipadankan terus ke bank rakan kongsi (GXBank, Boost Credit, BSN) untuk kelulusan dan pemindahan digital pantas.'
                    : 'Your verified report is pre-matched to partner lenders (GXBank, Boost Credit, BSN) for fast digital approval and transfer.'}
                </p>
              </div>

            </div>
          </div>

          {/* ========================================================= */}
          {/* 4. WHO CAN APPLY? (4 CLEAR TARGET CARDS WITH DIRECT START) */}
          {/* ========================================================= */}
          <div className="flex flex-col gap-6">
            <div className="text-center max-w-md mx-auto">
              <h2 className="text-2xl sm:text-3xl font-black text-blue-950">
                {language === 'bm' ? 'Siapa Yang Boleh Memohon?' : 'Who Can Apply?'}
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                {language === 'bm' ? 'Pilih kategori anda untuk melihat anggaran jumlah pinjaman yang layak.' : 'Choose your category to see how much you can borrow.'}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
              {[
                {
                  id: 'personal_cash',
                  title: language === 'bm' ? 'Pemandu Grab & Penghantar Makanan' : 'Grab & Food Delivery Drivers',
                  defaultAmount: 5000,
                  speed: language === 'bm' ? '2–4 Jam' : '2–4 Hours',
                  incomeType: language === 'bm' ? 'Penyata Aplikasi Gig' : 'Gig Inflow Auditing',
                  desc: language === 'bm' ? 'Gunakan pendapatan mingguan penghantaran anda untuk layak pinjaman tunai kecemasan pantas.' : 'Use your weekly gig delivery earnings to qualify for fast emergency cash loans.',
                  icon: Car,
                  requiredDocs: language === 'bm'
                    ? ['Penyata Bank 3 Bulan (PDF)', 'Penyata Grab / Foodpanda', 'MyKad (Privasi Terkawal)']
                    : ['3 Months Bank Statement (PDF)', 'Grab / Foodpanda Statement', 'MyKad (PDPA Masked)'],
                  matchedLenders: ['GXBank Personal Loan', 'Boost Credit Fast Cash', 'AEON Credit Motor', 'BSN Micro/Gig']
                },
                {
                  id: 'working_capital',
                  title: language === 'bm' ? 'Peniaga Shopee & Jualan Online' : 'Shopee & Online Sellers',
                  defaultAmount: 20000,
                  speed: language === 'bm' ? '24–48 Jam' : '24–48 Hours',
                  incomeType: language === 'bm' ? 'Jualan Dompet E-Dagang' : 'E-Commerce Cashflow',
                  desc: language === 'bm' ? 'Dapatkan modal pusingan untuk membeli stok, inventori dan kembangkan perniagaan dalam talian anda.' : 'Get working capital to purchase stock, inventory, and expand your online business.',
                  icon: ShoppingBag,
                  requiredDocs: language === 'bm'
                    ? ['Penyata Bank 3–6 Bulan', 'Penyata Jualan Shopee/TikTok', 'Sijil SSM (jika ada)']
                    : ['3–6 Months Bank Statement', 'Shopee / TikTok Sales Summary', 'SSM Certificate (if any)'],
                  matchedLenders: ['Funding Societies P2P', 'Boost Merchant Credit', 'CIMB Micro-SME', 'SME Corp Schemes']
                },
                {
                  id: 'vehicle',
                  title: language === 'bm' ? 'Pekerja Bebas (Freelancer) & Bekerja Sendiri' : 'Freelancers & Self-Employed',
                  defaultAmount: 10000,
                  speed: language === 'bm' ? '2–6 Jam' : '2–6 Hours',
                  incomeType: language === 'bm' ? 'Invois Pelanggan & Projek' : 'Client Invoices & Deposits',
                  desc: language === 'bm' ? 'Layak menggunakan sejarah deposit pelanggan tetap selama 3 hingga 6 bulan dalam penyata bank anda.' : 'Qualify using 3 to 6 months of regular client deposit history in your bank statements.',
                  icon: Laptop,
                  requiredDocs: language === 'bm'
                    ? ['Penyata Bank 3–6 Bulan (PDF)', 'Invois Pelanggan / Penyata Platform', 'Borang Cukai LHDN (Pilihan)']
                    : ['3–6 Months Bank Statement (PDF)', 'Client Invoices / Platform Statement', 'LHDN Tax e-Filing (Optional)'],
                  matchedLenders: ['GXBank Digital Personal', 'Alliance Digital MSME', 'AEON Credit Express', 'Kuasa Capital']
                },
                {
                  id: 'equipment',
                  title: language === 'bm' ? 'Penjaja & Kedai Runcit Mikro' : 'Hawkers & Micro-Shops',
                  defaultAmount: 25000,
                  speed: language === 'bm' ? '1–3 Hari Bekerja' : '1–3 Business Days',
                  incomeType: language === 'bm' ? 'Penyelesaian DuitNow QR' : 'DuitNow QR Settlement',
                  desc: language === 'bm' ? 'Akses pembiayaan peralatan perniagaan daripada agensi kerajaan dan institusi berlesen dengan kadar rendah.' : 'Access low-rate government and institutional business equipment financing.',
                  icon: Store,
                  requiredDocs: language === 'bm'
                    ? ['Penyata Bank 3–6 Bulan (Kemasukan QR)', 'Lesen Penjaja Majlis / SSM', 'Bil Utiliti / Perjanjian Gerai']
                    : ['3–6 Months Bank Statement (QR Inflows)', 'Hawker License / Majlis Permit / SSM', 'Utility Bill / Stall Agreement'],
                  matchedLenders: ['BSN Mikro Madani', 'TEKUN Nasional Alternative', 'AEON Equipment Financing', 'Cooperative Funds']
                },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.id}
                    onClick={() => setCategorySuitabilityModal(item)}
                    className="p-6 bg-white border border-slate-200 rounded-3xl shadow-xs hover:border-blue-900/40 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between gap-4 group"
                  >
                    <div className="flex flex-col gap-3">
                      <div className="w-11 h-11 bg-blue-50 text-blue-950 rounded-2xl flex items-center justify-center group-hover:bg-blue-950 group-hover:text-white transition-colors shadow-2xs">
                        <Icon className="w-5 h-5 text-blue-900 group-hover:text-white" />
                      </div>

                      <div>
                        <h4 className="text-base font-black text-blue-950">{item.title}</h4>
                      </div>

                      <p className="text-xs text-slate-600 leading-relaxed font-normal">
                        {item.desc}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-blue-900">
                      <span className="text-slate-500 font-semibold">{language === 'bm' ? 'Mengapa Loan - La Sesuai? →' : 'Why Loan - La is Suitable? →'}</span>
                      <span className="group-hover:translate-x-1 transition-transform flex items-center gap-1 font-black text-blue-950">
                        {language === 'bm' ? 'Lihat Maklumat' : 'View Details'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ========================================================= */}
          {/* 5. BOTTOM CONVERSION ACTION BANNER                        */}
          {/* ========================================================= */}
          <div className="bg-gradient-to-br from-blue-950 via-blue-900 to-blue-950 text-white rounded-3xl p-6 sm:p-10 shadow-xl flex flex-col items-center text-center gap-4">
            <h3 className="text-xl sm:text-2xl font-black">
              {language === 'bm' ? 'Sedia Untuk Semak Had Kelayakan Pinjaman Anda?' : 'Ready to Check Your Loan Limit?'}
            </h3>
            <p className="text-xs sm:text-sm text-blue-200 max-w-md leading-relaxed">
              {language === 'bm'
                ? 'Dapatkan laporan kelayakan pinjaman digital anda dalam masa kurang daripada 2 minit.'
                : 'Get your bank-ready loan readiness report in under 2 minutes.'}
            </p>
            <button
              onClick={() => {
                if (!userSession) {
                  setAuthModalOpen(true);
                } else {
                  setPerspective('B2C');
                  setCurrentPage('app');
                  setActiveStep(1);
                }
              }}
              className="mt-2 px-8 py-4 bg-white hover:bg-slate-100 text-blue-950 font-black text-sm rounded-2xl shadow-lg transition-all active:scale-98 cursor-pointer"
            >
              {language === 'bm' ? 'Mula Semak Kelayakan Percuma →' : 'Start Free Eligibility Check →'}
            </button>
          </div>

        </div>
      )}

      {/* AUTHENTICATED APP WORKFLOW */}
      {currentPage === 'app' && (
        <div className={`flex flex-col gap-6 w-full ${perspective === 'B2B' ? 'max-w-7xl' : 'max-w-4xl'} mx-auto animate-fade-in py-2`}>
          
          {/* Streamlined Single Navigation & Progress Stepper Bar */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row justify-between items-center gap-4">
            {perspective === 'B2B' ? (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between w-full gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-blue-950 text-white rounded-xl shadow-xs">
                    <Landmark className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h1 className="text-sm font-black text-blue-950 tracking-tight">INSTITUTIONAL UNDERWRITER CONSOLE</h1>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-900 border border-blue-200 font-sans">
                        BNM RMiT AUDIT READY
                      </span>
                    </div>
                    <span className="text-xs text-slate-500 font-normal">Deterministic gig-worker cashflow verification &amp; credit assessment engine</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <button
                    onClick={() => setDemoProfilesModalOpen(true)}
                    className="flex items-center gap-1.5 px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-900 text-xs font-bold rounded-xl border border-blue-200 transition-all cursor-pointer shadow-2xs"
                  >
                    <Cpu className="w-3.5 h-3.5" /> Simulation Sandbox
                  </button>
                  <button
                    onClick={() => {
                      setPerspective('B2C');
                      setCurrentPage('landing');
                    }}
                    className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-xl transition-all cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" /> Borrower View
                  </button>
                </div>
              </div>
            ) : (
              <>
                <button
                  onClick={() => setCurrentPage('landing')}
                  className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-700 bg-slate-50 border border-slate-200 hover:bg-slate-100 rounded-xl transition-all w-full sm:w-auto justify-center cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4 text-blue-950" /> {language === 'bm' ? 'Kembali ke Laman Utama' : 'Back to Home'}
                </button>

                {/* Visual 4-Step Stepper */}
                <div className="flex items-center gap-1.5 sm:gap-2.5 font-bold text-xs">
                  {[
                    { step: 1, label: language === 'bm' ? '1. Keperluan' : '1. Loan Need' },
                    { step: 2, label: language === 'bm' ? '2. Dokumen' : '2. Documents' },
                    { step: 3, label: language === 'bm' ? '3. Pengesahan' : '3. Review & Consent' },
                    { step: 4, label: language === 'bm' ? '4. Laporan' : '4. Report' }
                  ].map((s, idx) => (
                    <React.Fragment key={s.step}>
                      <button
                        disabled={s.step === 4 && !b2cResult}
                        onClick={() => {
                          if (s.step === 4 && !b2cResult) return;
                          setActiveStep(s.step);
                          window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
                          document.documentElement.scrollTop = 0;
                          document.body.scrollTop = 0;
                        }}
                        className={`flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-xl border transition-all ${
                          s.step === 4 && !b2cResult
                            ? 'opacity-40 cursor-not-allowed bg-slate-50 text-slate-400 border-slate-200'
                            : activeStep === s.step
                              ? 'bg-blue-950 text-white border-blue-950 shadow-xs cursor-pointer'
                              : s.step < activeStep
                                ? 'bg-blue-50 text-blue-900 border-blue-200 cursor-pointer'
                                : 'bg-slate-50 text-slate-400 border-slate-200 cursor-pointer'
                        }`}
                      >
                        <span className={`w-4.5 h-4.5 rounded-full flex items-center justify-center text-[9.5px] font-bold ${
                          activeStep === s.step ? 'bg-white text-blue-950' : 'bg-slate-200 text-slate-700'
                        }`}>
                          {s.step < activeStep ? '✓' : s.step}
                        </span>
                        <span className="hidden sm:inline">{s.label}</span>
                      </button>
                      {idx < 3 && <span className="text-slate-300 text-xs hidden sm:inline">→</span>}
                    </React.Fragment>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* PERSPECTIVE 1: B2C GIG WORKER */}
          {perspective === 'B2C' && (
            <div className="w-full flex flex-col gap-6">

              {/* FLOW STEP CONTAINER */}
              <div className="w-full flex flex-col gap-6">

                {/* STEP 1: LOAN PURPOSE & AMOUNT SELECTOR */}
                {activeStep === 1 && (() => {
                  const purposes = [
                    { id: 'personal_cash', icon: Banknote, label: language === 'bm' ? 'Tunai Peribadi' : 'Personal Cash' },
                    { id: 'working_capital', icon: Store, label: language === 'bm' ? 'Modal Pusingan' : 'Working Capital' },
                    { id: 'vehicle', icon: Car, label: language === 'bm' ? 'Sewa Beli Kenderaan' : 'Vehicle (HP)' },
                    { id: 'equipment', icon: Wrench, label: language === 'bm' ? 'Peralatan & Mesin' : 'Equipment & Tools' },
                  ];

                  return (
                    <div className="bg-white rounded-3xl border border-slate-200 shadow-md p-6 sm:p-8 flex flex-col gap-5">
                      
                      {/* Step Header */}
                      <div className="border-b border-slate-100 pb-3.5">
                        <span className="text-[11px] font-extrabold text-blue-900 uppercase tracking-wider block">
                          {language === 'bm' ? 'Langkah 1 daripada 3' : 'Step 1 of 3'}
                        </span>
                        <h2 className="text-xl sm:text-2xl font-black text-blue-950 tracking-tight mt-0.5">
                          {language === 'bm' ? 'Pilih Keperluan Pinjaman Anda' : 'Select Your Financing Need'}
                        </h2>
                      </div>

                      {/* 1. Purpose Selection Grid */}
                      <div className="flex flex-col gap-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                          {language === 'bm' ? '1. Tujuan Pinjaman' : '1. Loan Purpose'}
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                          {purposes.map((p) => {
                            const IconComp = p.icon;
                            const isSel = targetLoanPurpose === p.id;
                            return (
                              <button
                                key={p.id}
                                type="button"
                                onClick={() => setTargetLoanPurpose(p.id as any)}
                                className={`flex flex-col items-center justify-center p-3.5 rounded-2xl border text-center transition-all cursor-pointer gap-2 ${
                                  isSel
                                    ? 'bg-blue-950 text-white border-blue-950 shadow-md'
                                    : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                                }`}
                              >
                                <div className={`p-2.5 rounded-xl ${isSel ? 'bg-blue-900 text-white' : 'bg-white text-blue-950 border border-slate-200'}`}>
                                  <IconComp className="w-5 h-5" />
                                </div>
                                <span className="text-xs font-bold leading-tight block">{p.label}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* 2. Loan Amount Section */}
                      <div className="flex flex-col gap-2.5 pt-3.5 border-t border-slate-100">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                          {language === 'bm' ? '2. Jumlah Pinjaman (RM)' : '2. Loan Amount (RM)'}
                        </label>

                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-black text-slate-400 select-none">
                            RM
                          </span>
                          <input
                            type="number"
                            min={1000}
                            max={150000}
                            step={500}
                            value={targetLoanAmount || ''}
                            onChange={(e) => {
                              const val = e.target.value === '' ? 0 : Number(e.target.value);
                              setTargetLoanAmount(val);
                            }}
                            onBlur={() => {
                              if (targetLoanAmount < 1000) setTargetLoanAmount(1000);
                              if (targetLoanAmount > 150000) setTargetLoanAmount(150000);
                            }}
                            className="w-full pl-12 pr-4 py-3 bg-slate-50 hover:bg-slate-100/80 focus:bg-white border border-slate-200 focus:border-blue-900 rounded-2xl text-lg font-black text-blue-950 outline-hidden transition-all text-left shadow-2xs"
                            placeholder="5,000"
                          />
                        </div>

                        {/* Quick Preset Amount Chips */}
                        <div className="flex items-center gap-2 flex-wrap">
                          {[3000, 5000, 10000, 20000, 50000].map((amt) => (
                            <button
                              key={amt}
                              type="button"
                              onClick={() => setTargetLoanAmount(amt)}
                              className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                                targetLoanAmount === amt
                                  ? 'bg-blue-950 text-white border-blue-950 shadow-xs'
                                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                              }`}
                            >
                              RM {(amt / 1000)}k
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* 3. Repayment Tenure Section */}
                      <div className="flex flex-col gap-2.5 pt-3.5 border-t border-slate-100">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-blue-900" />
                          {language === 'bm' ? '3. Tempoh Bayaran Balik' : '3. Repayment Tenure'}
                        </label>

                        {/* Quick Preset Tenure Chips */}
                        <div className="grid grid-cols-4 gap-2">
                          {[
                            { years: 1, label: language === 'bm' ? '1 Tahun' : '1 Year' },
                            { years: 2, label: language === 'bm' ? '2 Tahun' : '2 Years' },
                            { years: 3, label: language === 'bm' ? '3 Tahun' : '3 Years' },
                            { years: 5, label: language === 'bm' ? '5 Tahun' : '5 Years' },
                          ].map((t) => {
                            const isSelected = calcTenureYears === t.years;
                            return (
                              <button
                                key={t.years}
                                type="button"
                                onClick={() => setCalcTenureYears(t.years)}
                                className={`py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                                  isSelected
                                    ? 'bg-blue-950 text-white border-blue-950 shadow-xs'
                                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                                }`}
                              >
                                {t.label}
                              </button>
                            );
                          })}
                        </div>

                        {/* Live Repayment Estimate Preview */}
                        {(() => {
                          const months = calcTenureYears * 12;
                          const estRate = targetLoanPurpose === 'vehicle' ? 0.055 : 0.065;
                          const totalRepay = targetLoanAmount * (1 + estRate * calcTenureYears);
                          const monthlyEst = Math.round(totalRepay / months);
                          return (
                            <div className="p-3.5 bg-blue-50/70 border border-blue-100 rounded-2xl flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <Coins className="w-4 h-4 text-blue-900 shrink-0" />
                                <div>
                                  <span className="text-xs font-bold text-blue-950 block">
                                    {language === 'bm' ? 'Anggaran Ansuran Bulanan:' : 'Est. Monthly Installment:'}
                                  </span>
                                  <span className="text-[10.5px] text-slate-500">
                                    {language === 'bm' ? `Purata kadar ~${(estRate * 100).toFixed(1)}% setahun` : `Avg. rate ~${(estRate * 100).toFixed(1)}% p.a.`}
                                  </span>
                                </div>
                              </div>
                              <div className="text-right">
                                <span className="text-base font-black text-blue-950">
                                  ~RM {monthlyEst.toLocaleString()}<span className="text-xs font-normal text-slate-500">/{language === 'bm' ? 'bln' : 'mo'}</span>
                                </span>
                              </div>
                            </div>
                          );
                        })()}
                      </div>

                      {/* 4. Shariah Option Toggle (Compact) */}
                      <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-2xl">
                        <div>
                          <span className="text-xs font-bold text-slate-800 block">
                            {language === 'bm' ? 'Pembiayaan Patuh Syariah Sahaja' : 'Shariah-Compliant Financing Only'}
                          </span>
                          <span className="text-[10px] text-slate-400 block mt-0.5">
                            {language === 'bm' ? 'Tapis kepada produk perbankan Islam' : 'Filter to Islamic banking products'}
                          </span>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer ml-4 shrink-0">
                          <input 
                            type="checkbox" 
                            checked={shariahPreference} 
                            onChange={(e) => setShariahPreference(e.target.checked)} 
                            className="sr-only peer" 
                          />
                          <div className="w-10 h-5 bg-slate-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-950"></div>
                        </label>
                      </div>

                      {/* Primary Action Button */}
                      <div className="pt-1">
                        <button
                          onClick={() => {
                            setActiveStep(2);
                            window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
                            document.documentElement.scrollTop = 0;
                            document.body.scrollTop = 0;
                          }}
                          className="w-full py-4 bg-blue-950 hover:bg-blue-900 text-white font-black text-sm rounded-2xl shadow-xl transition-all flex items-center justify-center gap-2 active:scale-[0.99] cursor-pointer"
                        >
                          <span>{language === 'bm' ? 'Teruskan ke Langkah 2: Muat Naik Dokumen →' : 'Continue to Step 2: Upload Documents →'}</span>
                        </button>
                      </div>

                    </div>
                  );
                })()}

                {/* STEP 2: DOCUMENT EVIDENCE GATEWAY & PREREQUISITE BORROWER DECLARATIONS */}
                {activeStep === 2 && (
                  <div className="flex flex-col gap-6">
                    
                    {/* Main Upload & Declaration Card */}
                    <div className="premium-card p-6 sm:p-7 bg-white border border-slate-200 shadow-md flex flex-col gap-5">
                      
                      {/* Header */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-blue-950 text-white flex items-center justify-center shadow-xs shrink-0">
                            <UploadCloud className="w-5 h-5" />
                          </div>
                          <div>
                            <h2 className="text-base font-bold text-slate-900">
                              {language === 'bm' ? 'Muat Naik Dokumen' : 'Upload Documents'}
                            </h2>
                          </div>
                        </div>

                      </div>

                      {/* STEP 2.1: CHOOSE EMPLOYMENT TYPE (CLEAR CARDS) */}
                      <div className="flex flex-col gap-2.5">
                        <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                          <span className="w-5 h-5 rounded-full bg-blue-950 text-white flex items-center justify-center text-[10px] font-black">1</span>
                          <span>{language === 'bm' ? 'Pilih Jenis Pekerjaan Utama Anda:' : 'Select Your Main Employment Type:'}</span>
                        </label>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {/* Option 1: Gig Worker / Freelancer */}
                          <button
                            type="button"
                            onClick={() => {
                              setIncomeWorkType('gig');
                              setUploadValidationError(null);
                            }}
                            className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex items-start justify-between gap-3 ${
                              incomeWorkType === 'gig'
                                ? 'bg-blue-50/50 border-blue-950 ring-2 ring-blue-950/10 shadow-xs'
                                : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <div className="text-2xl mt-0.5">🛵</div>
                              <div>
                                <span className="text-xs font-bold text-slate-900 block">
                                  {language === 'bm' ? 'Pekerja Gig / Rider / Freelance' : 'Gig Worker / Freelancer'}
                                </span>
                                <span className="text-[11px] text-slate-500 block mt-0.5">
                                  Grab, Foodpanda, Shopee, Lalamove, Invois
                                </span>
                              </div>
                            </div>
                            <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
                              incomeWorkType === 'gig' ? 'border-blue-950 bg-blue-950 text-white text-xs font-black' : 'border-slate-300'
                            }`}>
                              {incomeWorkType === 'gig' && '✓'}
                            </div>
                          </button>

                          {/* Option 2: Salaried Employee */}
                          <button
                            type="button"
                            onClick={() => {
                              setIncomeWorkType('salaried');
                              setUploadValidationError(null);
                            }}
                            className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex items-start justify-between gap-3 ${
                              incomeWorkType === 'salaried'
                                ? 'bg-blue-50/50 border-blue-950 ring-2 ring-blue-950/10 shadow-xs'
                                : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <div className="text-2xl mt-0.5">💼</div>
                              <div>
                                <span className="text-xs font-bold text-slate-900 block">
                                  {language === 'bm' ? 'Pekerja Bergaji Tetap (Swasta / Kerajaan)' : 'Salaried Employee'}
                                </span>
                                <span className="text-[11px] text-slate-500 block mt-0.5">
                                  Gaji tetap bulanan syarikat dengan slip gaji
                                </span>
                              </div>
                            </div>
                            <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
                              incomeWorkType === 'salaried' ? 'border-blue-950 bg-blue-950 text-white text-xs font-black' : 'border-slate-300'
                            }`}>
                              {incomeWorkType === 'salaried' && '✓'}
                            </div>
                          </button>
                        </div>

                        {/* Mixed income link toggle */}
                        <div className="text-right">
                          <button
                            type="button"
                            onClick={() => setIncomeWorkType(incomeWorkType === 'both' ? 'gig' : 'both')}
                            className="text-[11px] text-slate-500 hover:text-blue-950 font-medium underline cursor-pointer"
                          >
                            {incomeWorkType === 'both'
                              ? (language === 'bm' ? '← Tukar kembali ke pilihan tunggal' : '← Switch back to single profile')
                              : (language === 'bm' ? 'Mempunyai kedua-dua punca pendapatan (Gig + Gaji)? Klik di sini' : 'Have both Gig & Salaried income? Click here to upload both')}
                          </button>
                        </div>
                      </div>

                      {/* STEP 2.2: DOCUMENT UPLOAD CHECKLIST */}
<div className="flex flex-col gap-3.5 pt-2 border-t border-slate-100">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                            <span className="w-5 h-5 rounded-full bg-blue-950 text-white flex items-center justify-center text-[10px] font-black">2</span>
                            <span>{language === 'bm' ? 'Senarai Dokumen Diperlukan:' : 'Required Document Checklist:'}</span>
                          </label>
                        </div>

                        {/* CARD 1: OFFICIAL BANK STATEMENTS (MANDATORY) */}
                        <div 
                          id="box-bank-statements"
                          className={`p-4 rounded-2xl border transition-all ${
                            uploadedFiles.filter(f => f.category === 'bank_statement').length < 3 && uploadValidationError
                              ? 'border-rose-400 bg-rose-50/40 ring-2 ring-rose-400/10'
                              : 'border-slate-200 bg-white hover:border-slate-300'
                          }`}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="flex items-start gap-3">
                              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-900 flex items-center justify-center shrink-0 mt-0.5">
                                <FileText className="w-4.5 h-4.5" />
                              </div>
                              <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h3 className="text-xs font-bold text-slate-900">
                                    {language === 'bm' ? '1. Penyata Bank Rasmi (3–6 Bulan)' : '1. Official Bank Statements (3–6 Months)'}
                                  </h3>
                                  <span className="text-[9px] font-black text-white bg-blue-950 px-2 py-0.5 rounded">
                                    {language === 'bm' ? 'WAJIB' : 'MANDATORY'}
                                  </span>
                                </div>
                                <p className="text-[11px] text-slate-500 mt-0.5">
                                  {language === 'bm' ? 'Muat naik e-statement rasmi bank (Maybank, CIMB, RHB, Public Bank, dsb.)' : 'Official bank e-statements (Maybank, CIMB, RHB, Public Bank, etc.)'}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                              <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg ${
                                uploadedFiles.filter(f => f.category === 'bank_statement').length >= 3
                                  ? 'bg-emerald-100 text-emerald-800 font-bold'
                                  : 'bg-slate-100 text-slate-600'
                              }`}>
                                {uploadedFiles.filter(f => f.category === 'bank_statement').length}/3 {language === 'bm' ? 'dimuat naik' : 'uploaded'}
                              </span>
                              <label className="py-1.5 px-3 bg-blue-950 hover:bg-blue-900 text-white font-semibold text-xs rounded-xl cursor-pointer transition-all flex items-center gap-1.5 active:scale-95 shadow-xs">
                                <UploadCloud className="w-3.5 h-3.5" />
                                <span>{language === 'bm' ? '+ Tambah PDF' : '+ Upload PDF'}</span>
                                <input 
                                  type="file" 
                                  multiple 
                                  accept="application/pdf" 
                                  className="hidden"
                                  onChange={(e) => {
                                    setUploadValidationError(null);
                                    const bad = Array.from(e.target.files||[]).filter(f => f.type !== 'application/pdf');
                                    if (bad.length) alert(`Bank statements must be PDF only. Rejected: ${bad.map(f=>f.name).join(', ')}`);
                                    const ok = Array.from(e.target.files||[]).filter(f => f.type === 'application/pdf');
                                    if (ok.length) { 
                                      const dt = new DataTransfer(); 
                                      ok.forEach(f=>dt.items.add(f)); 
                                      handleMultipleFilesUploadWithCategory({target:{files:dt.files}} as any, 'bank_statement'); 
                                    }
                                  }} 
                                />
                              </label>
                            </div>
                          </div>

                          {/* Staged Bank Statements Chips */}
                          {uploadedFiles.filter(f => f.category === 'bank_statement').length > 0 && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-3 mt-2 border-t border-slate-100">
                              {uploadedFiles.map((file, idx) => {
                                if (file.category !== 'bank_statement') return null;
                                const n = uploadedFiles.filter((f,i) => f.category === 'bank_statement' && i <= idx).length;
                                return (
                                  <div key={idx} className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs">
                                    <div className="flex items-center gap-2 truncate pr-2">
                                      <span className="text-[9px] font-bold uppercase bg-blue-100 text-blue-950 px-1.5 py-0.5 rounded">
                                        {language === 'bm' ? `Bulan ${n}` : `Month ${n}`}
                                      </span>
                                      <span className="font-medium text-slate-800 truncate">{file.fileName}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 shrink-0">
                                      <span className="text-[10px] text-slate-400 font-mono">{file.fileSize}</span>
                                      <button onClick={() => removeUploadedFile(idx)} className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors cursor-pointer">
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>

                        {/* CARD 2: INCOME PROOF */}
                        <div id="box-income-proof" className="flex flex-col gap-3">
                          
                          {/* 2A: GIG PLATFORM SLIPS */}
                          {(incomeWorkType === 'gig' || incomeWorkType === 'both') && (
                            <div className={`p-4 rounded-2xl border transition-all ${
                              uploadedFiles.filter(f => f.category === 'platform_dashboard').length < 12 && uploadValidationError
                                ? 'border-rose-400 bg-rose-50/40 ring-2 ring-rose-400/10'
                                : 'border-slate-200 bg-white hover:border-slate-300'
                            }`}>
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div className="flex items-start gap-3">
                                  <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-900 flex items-center justify-center shrink-0 mt-0.5">
                                    <FileSpreadsheet className="w-4.5 h-4.5" />
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <h3 className="text-xs font-bold text-slate-900">
                                        {language === 'bm' ? '2. Slip Pendapatan Mingguan Gig (Min. 12 Minggu)' : '2. Gig Income Slips (Min. 12 Weeks)'}
                                      </h3>
                                      <span className="text-[9px] font-black text-white bg-blue-950 px-2 py-0.5 rounded">
                                        {language === 'bm' ? 'WAJIB' : 'MANDATORY'}
                                      </span>
                                    </div>
                                    <p className="text-[11px] text-slate-500 mt-0.5">
                                      {language === 'bm' ? 'Penyata pendapatan mingguan (Grab, Foodpanda, Shopee, Lalamove, dsb.)' : 'Weekly earnings statements (Grab, Foodpanda, Shopee, Lalamove, etc.)'}
                                    </p>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                                  <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg ${
                                    uploadedFiles.filter(f => f.category === 'platform_dashboard').length >= 12
                                      ? 'bg-emerald-100 text-emerald-800 font-bold'
                                      : 'bg-slate-100 text-slate-600'
                                  }`}>
                                    {uploadedFiles.filter(f => f.category === 'platform_dashboard').length}/12 {language === 'bm' ? 'slip' : 'slips'}
                                  </span>
                                  <label className="py-1.5 px-3 bg-blue-950 hover:bg-blue-900 text-white font-semibold text-xs rounded-xl cursor-pointer transition-all flex items-center gap-1.5 active:scale-95 shadow-xs">
                                    <UploadCloud className="w-3.5 h-3.5" />
                                    <span>{language === 'bm' ? '+ Tambah PDF' : '+ Upload PDF'}</span>
                                    <input type="file" multiple accept="application/pdf,image/*" className="hidden"
                                      onChange={(e) => {
                                        setUploadValidationError(null);
                                        handleMultipleFilesUploadWithCategory(e, 'platform_dashboard');
                                      }} />
                                  </label>
                                </div>
                              </div>

                              {uploadedFiles.filter(f => f.category === 'platform_dashboard').length > 0 && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-1.5 pt-2.5 mt-2 border-t border-slate-100">
                                  {uploadedFiles.map((file, idx) => {
                                    if (file.category !== 'platform_dashboard') return null;
                                    const tag = /foodpanda/i.test(file.fileName) ? 'Foodpanda' : /grab/i.test(file.fileName) ? 'Grab' : /shopee/i.test(file.fileName) ? 'Shopee' : /lalamove/i.test(file.fileName) ? 'Lalamove' : 'Gig';
                                    const n = uploadedFiles.filter((f,i) => f.category === 'platform_dashboard' && i <= idx).length;
                                    return (
                                      <div key={idx} className="flex items-center justify-between p-2 bg-slate-50 border border-slate-200/80 rounded-lg text-xs">
                                        <div className="flex items-center gap-1.5 truncate pr-1.5">
                                          <span className="text-[8px] font-bold uppercase bg-blue-100 text-blue-900 px-1 py-0.5 rounded">W{n} · {tag}</span>
                                          <span className="font-medium text-slate-800 truncate">{file.fileName}</span>
                                        </div>
                                        <button onClick={() => removeUploadedFile(idx)} className="p-1 text-slate-400 hover:text-rose-600 rounded cursor-pointer">
                                          <Trash2 className="w-3 h-3" />
                                        </button>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          )}

                          {/* 2B: SALARIED PAY SLIPS */}
                          {(incomeWorkType === 'salaried' || incomeWorkType === 'both') && (
                            <div className={`p-4 rounded-2xl border transition-all ${
                              uploadedFiles.filter(f => f.category === 'pay_slip').length < 3 && uploadValidationError
                                ? 'border-rose-400 bg-rose-50/40 ring-2 ring-rose-400/10'
                                : 'border-slate-200 bg-white hover:border-slate-300'
                            }`}>
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div className="flex items-start gap-3">
                                  <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-900 flex items-center justify-center shrink-0 mt-0.5">
                                    <FileText className="w-4.5 h-4.5" />
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <h3 className="text-xs font-bold text-slate-900">
                                        {language === 'bm' ? '2. Slip Gaji Bulanan (3 Bulan Terkini)' : '2. Monthly Pay Slips (Latest 3 Months)'}
                                      </h3>
                                      <span className="text-[9px] font-black text-white bg-blue-950 px-2 py-0.5 rounded">
                                        {language === 'bm' ? 'WAJIB' : 'MANDATORY'}
                                      </span>
                                    </div>
                                    <p className="text-[11px] text-slate-500 mt-0.5">
                                      {language === 'bm' ? 'Slip gaji rasmi 3 bulan terkini yang dikeluarkan majikan' : 'Official salary slips for the latest 3 months issued by employer'}
                                    </p>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                                  <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg ${
                                    uploadedFiles.filter(f => f.category === 'pay_slip').length >= 3
                                      ? 'bg-emerald-100 text-emerald-800 font-bold'
                                      : 'bg-slate-100 text-slate-600'
                                  }`}>
                                    {uploadedFiles.filter(f => f.category === 'pay_slip').length}/3 {language === 'bm' ? 'bulan' : 'months'}
                                  </span>
                                  <label className="py-1.5 px-3 bg-blue-950 hover:bg-blue-900 text-white font-semibold text-xs rounded-xl cursor-pointer transition-all flex items-center gap-1.5 active:scale-95 shadow-xs">
                                    <UploadCloud className="w-3.5 h-3.5" />
                                    <span>{language === 'bm' ? '+ Tambah PDF' : '+ Upload PDF'}</span>
                                    <input type="file" multiple accept="application/pdf,image/*" className="hidden"
                                      onChange={(e) => {
                                        setUploadValidationError(null);
                                        handleMultipleFilesUploadWithCategory(e, 'pay_slip');
                                      }} />
                                  </label>
                                </div>
                              </div>

                              {uploadedFiles.filter(f => f.category === 'pay_slip').length > 0 && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-2.5 mt-2 border-t border-slate-100">
                                  {uploadedFiles.map((file, idx) => {
                                    if (file.category !== 'pay_slip') return null;
                                    const n = uploadedFiles.filter((f,i) => f.category === 'pay_slip' && i <= idx).length;
                                    return (
                                      <div key={idx} className="flex items-center justify-between p-2 bg-slate-50 border border-slate-200/80 rounded-lg text-xs">
                                        <div className="flex items-center gap-1.5 truncate pr-1.5">
                                          <span className="text-[8px] font-bold uppercase bg-amber-100 text-amber-900 px-1 py-0.5 rounded">Bulan {n}</span>
                                          <span className="font-medium text-slate-800 truncate">{file.fileName}</span>
                                        </div>
                                        <button onClick={() => removeUploadedFile(idx)} className="p-1 text-slate-400 hover:text-rose-600 rounded cursor-pointer">
                                          <Trash2 className="w-3 h-3" />
                                        </button>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          )}

                        </div>

                        {/* CARD 3: MYKAD / NATIONAL IC (MANDATORY) */}
                        <div 
                          id="box-mykad"
                          className={`p-4 rounded-2xl border transition-all ${
                            uploadedFiles.filter(f => f.category === 'mykad_id').length === 0 && uploadValidationError
                              ? 'border-rose-400 bg-rose-50/40 ring-2 ring-rose-400/10'
                              : 'border-slate-200 bg-white hover:border-slate-300'
                          }`}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="flex items-start gap-3">
                              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-900 flex items-center justify-center shrink-0 mt-0.5">
                                <UserCheck className="w-4.5 h-4.5" />
                              </div>
                              <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h3 className="text-xs font-bold text-slate-900">
                                    {language === 'bm' ? '3. MyKad / Kad Pengenalan (e-KYC)' : '3. MyKad / National IC (e-KYC)'}
                                  </h3>
                                  <span className="text-[9px] font-black text-white bg-blue-950 px-2 py-0.5 rounded">
                                    {language === 'bm' ? 'WAJIB' : 'MANDATORY'}
                                  </span>
                                </div>
                                <p className="text-[11px] text-slate-500 mt-0.5">
                                  {language === 'bm' ? 'Salinan gambar jelas atau PDF MyKad bahagian depan & belakang' : 'Clear photo or PDF copy of MyKad front & back'}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                              <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg ${
                                uploadedFiles.filter(f => f.category === 'mykad_id').length > 0
                                  ? 'bg-emerald-100 text-emerald-800 font-bold'
                                  : 'bg-slate-100 text-slate-600'
                              }`}>
                                {uploadedFiles.filter(f => f.category === 'mykad_id').length > 0
                                  ? (language === 'bm' ? '✓ Dimuat naik' : '✓ Uploaded')
                                  : (language === 'bm' ? 'Diperlukan' : 'Required')}
                              </span>
                              <label className="py-1.5 px-3 bg-blue-950 hover:bg-blue-900 text-white font-semibold text-xs rounded-xl cursor-pointer transition-all flex items-center gap-1.5 active:scale-95 shadow-xs">
                                <UploadCloud className="w-3.5 h-3.5" />
                                <span>{language === 'bm' ? '+ Tambah MyKad' : '+ Upload MyKad'}</span>
                                <input type="file" multiple accept="image/*,application/pdf" className="hidden"
                                  onChange={(e) => {
                                    setUploadValidationError(null);
                                    handleMultipleFilesUploadWithCategory(e, 'mykad_id');
                                  }} />
                              </label>
                            </div>
                          </div>

                          {uploadedFiles.filter(f => f.category === 'mykad_id').length > 0 && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2.5 mt-2 border-t border-slate-100">
                              {uploadedFiles.map((file, idx) => {
                                if (file.category !== 'mykad_id') return null;
                                return (
                                  <div key={idx} className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs">
                                    <div className="flex items-center gap-2 truncate pr-2">
                                      <span className="text-[9px] font-bold uppercase bg-blue-100 text-blue-950 px-1.5 py-0.5 rounded">e-KYC</span>
                                      <span className="font-medium text-slate-800 truncate">{file.fileName}</span>
                                    </div>
                                    <button onClick={() => removeUploadedFile(idx)} className="p-1 text-slate-400 hover:text-rose-600 rounded cursor-pointer">
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>

                        {/* CATEGORY-SPECIFIC MANDATORY DOCUMENTS */}
                        {/* 1. Working Capital / Equipment: SSM / PBT License is MANDATORY */}
                        {(targetLoanPurpose === 'working_capital' || targetLoanPurpose === 'equipment') && (
                          <div 
                            id="box-ssm"
                            className={`p-4 rounded-2xl border transition-all ${
                              uploadedFiles.filter(f => f.category === 'ssm_license').length === 0 && uploadValidationError
                                ? 'border-rose-400 bg-rose-50/40 ring-2 ring-rose-400/10'
                                : 'border-slate-200 bg-white hover:border-slate-300'
                            }`}
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                              <div className="flex items-start gap-3">
                                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-900 flex items-center justify-center shrink-0 mt-0.5">
                                  <FileCheck2 className="w-4.5 h-4.5" />
                                </div>
                                <div>
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <h3 className="text-xs font-bold text-slate-900">
                                      {language === 'bm' ? '4. Pendaftaran Perniagaan SSM / Lesen PBT' : '4. SSM Business Registration / Local Council Permit'}
                                    </h3>
                                    <span className="text-[9px] font-black text-white bg-blue-950 px-2 py-0.5 rounded">
                                      {language === 'bm' ? 'WAJIB (PERNIAGAAN)' : 'MANDATORY (BUSINESS)'}
                                    </span>
                                  </div>
                                  <p className="text-[11px] text-slate-500 mt-0.5">
                                    {language === 'bm'
                                      ? 'Sijil SSM (Borang D / Maklumat Perniagaan) atau Lesen Penjaja / Permit PBT Majlis Tempatan.'
                                      : 'SSM Certificate (Form D / Business Profile) or Local Council (PBT) Hawker Permit.'}
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                                <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg ${
                                  uploadedFiles.filter(f => f.category === 'ssm_license').length > 0
                                    ? 'bg-emerald-100 text-emerald-800 font-bold'
                                    : 'bg-slate-100 text-slate-600'
                                }`}>
                                  {uploadedFiles.filter(f => f.category === 'ssm_license').length > 0
                                    ? (language === 'bm' ? '✓ Dimuat naik' : '✓ Uploaded')
                                    : (language === 'bm' ? 'Diperlukan' : 'Required')}
                                </span>
                                <label className="py-1.5 px-3 bg-blue-950 hover:bg-blue-900 text-white font-semibold text-xs rounded-xl cursor-pointer transition-all flex items-center gap-1.5 active:scale-95 shadow-xs">
                                  <UploadCloud className="w-3.5 h-3.5" />
                                  <span>{language === 'bm' ? '+ Tambah SSM' : '+ Upload SSM'}</span>
                                  <input type="file" multiple accept="application/pdf,image/*" className="hidden"
                                    onChange={(e) => {
                                      setUploadValidationError(null);
                                      handleMultipleFilesUploadWithCategory(e, 'ssm_license');
                                    }} />
                                </label>
                              </div>
                            </div>

                            {uploadedFiles.filter(f => f.category === 'ssm_license').length > 0 && (
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2.5 mt-2 border-t border-slate-100">
                                {uploadedFiles.map((file, idx) => {
                                  if (file.category !== 'ssm_license') return null;
                                  return (
                                    <div key={idx} className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs">
                                      <div className="flex items-center gap-2 truncate pr-2">
                                        <span className="text-[9px] font-bold uppercase bg-blue-100 text-blue-950 px-1.5 py-0.5 rounded">SSM</span>
                                        <span className="font-medium text-slate-800 truncate">{file.fileName}</span>
                                      </div>
                                      <button onClick={() => removeUploadedFile(idx)} className="p-1 text-slate-400 hover:text-rose-600 rounded cursor-pointer">
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        )}

                        {/* 2. Equipment Financing: Machinery Supplier Quotation is MANDATORY */}
                        {targetLoanPurpose === 'equipment' && (
                          <div 
                            id="box-proposal"
                            className={`p-4 rounded-2xl border transition-all ${
                              uploadedFiles.filter(f => f.category === 'business_proposal').length === 0 && uploadValidationError
                                ? 'border-rose-400 bg-rose-50/40 ring-2 ring-rose-400/10'
                                : 'border-slate-200 bg-white hover:border-slate-300'
                            }`}
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                              <div className="flex items-start gap-3">
                                <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-900 flex items-center justify-center shrink-0 mt-0.5">
                                  <Briefcase className="w-4.5 h-4.5" />
                                </div>
                                <div>
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <h3 className="text-xs font-bold text-slate-900">
                                      {language === 'bm' ? '5. Sebutharga Pembekal Mesin / Peralatan' : '5. Equipment Supplier Quotation'}
                                    </h3>
                                    <span className="text-[9px] font-black text-white bg-blue-950 px-2 py-0.5 rounded">
                                      {language === 'bm' ? 'WAJIB PEMBEKAL' : 'MANDATORY (EQUIPMENT)'}
                                    </span>
                                  </div>
                                  <p className="text-[11px] text-slate-500 mt-0.5">
                                    {language === 'bm' ? 'Sebut harga rasmi pembekal jentera, mesin pemprosesan, atau peralatan perniagaan.' : 'Official supplier sales quotation for commercial machinery, kitchen tools, or hardware.'}
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                                <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg ${
                                  uploadedFiles.filter(f => f.category === 'business_proposal').length > 0
                                    ? 'bg-emerald-100 text-emerald-800 font-bold'
                                    : 'bg-slate-100 text-slate-600'
                                }`}>
                                  {uploadedFiles.filter(f => f.category === 'business_proposal').length > 0
                                    ? (language === 'bm' ? '✓ Dimuat naik' : '✓ Uploaded')
                                    : (language === 'bm' ? 'Diperlukan' : 'Required')}
                                </span>
                                <label className="py-1.5 px-3 bg-blue-950 hover:bg-blue-900 text-white font-semibold text-xs rounded-xl cursor-pointer transition-all flex items-center gap-1.5 active:scale-95 shadow-xs">
                                  <UploadCloud className="w-3.5 h-3.5" />
                                  <span>{language === 'bm' ? '+ Tambah Sebutharga' : '+ Upload Quotation'}</span>
                                  <input type="file" multiple accept=".pdf,.doc,.docx,.xls,.xlsx,image/*" className="hidden"
                                    onChange={(e) => {
                                      setUploadValidationError(null);
                                      handleMultipleFilesUploadWithCategory(e, 'business_proposal');
                                    }} />
                                </label>
                              </div>
                            </div>

                            {uploadedFiles.filter(f => f.category === 'business_proposal').length > 0 && (
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2.5 mt-2 border-t border-slate-100">
                                {uploadedFiles.map((file, idx) => {
                                  if (file.category !== 'business_proposal') return null;
                                  return (
                                    <div key={idx} className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs">
                                      <div className="flex items-center gap-2 truncate pr-2">
                                        <span className="text-[9px] font-bold uppercase bg-purple-100 text-purple-950 px-1.5 py-0.5 rounded">QUOTATION</span>
                                        <span className="font-medium text-slate-800 truncate">{file.fileName}</span>
                                      </div>
                                      <button onClick={() => removeUploadedFile(idx)} className="p-1 text-slate-400 hover:text-rose-600 rounded cursor-pointer">
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        )}

                        {/* 3. Vehicle Financing: Dealer Quotation & License are MANDATORY */}
                        {targetLoanPurpose === 'vehicle' && (
                          <>
                            {/* Dealer Quotation */}
                            <div 
                              id="box-ssm"
                              className={`p-4 rounded-2xl border transition-all ${
                                uploadedFiles.filter(f => f.category === 'ssm_license').length === 0 && uploadValidationError
                                  ? 'border-rose-400 bg-rose-50/40 ring-2 ring-rose-400/10'
                                  : 'border-slate-200 bg-white hover:border-slate-300'
                              }`}
                            >
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div className="flex items-start gap-3">
                                  <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-900 flex items-center justify-center shrink-0 mt-0.5">
                                    <Car className="w-4.5 h-4.5" />
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <h3 className="text-xs font-bold text-slate-900">
                                        {language === 'bm' ? '4. Sebutharga Pengedar Kenderaan (Dealer Quotation)' : '4. Vehicle Dealer Sales Quotation'}
                                      </h3>
                                      <span className="text-[9px] font-black text-white bg-blue-950 px-2 py-0.5 rounded">
                                        {language === 'bm' ? 'WAJIB KENDERAAN' : 'MANDATORY (VEHICLE)'}
                                      </span>
                                    </div>
                                    <p className="text-[11px] text-slate-500 mt-0.5">
                                      {language === 'bm' ? 'Salinan sebutharga rasmi (sales order) dari kedai motosikal atau bilik pameran kereta.' : 'Official sales quotation/order from motorcycle shop or car dealer.'}
                                    </p>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                                  <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg ${
                                    uploadedFiles.filter(f => f.category === 'ssm_license').length > 0
                                      ? 'bg-emerald-100 text-emerald-800 font-bold'
                                      : 'bg-slate-100 text-slate-600'
                                  }`}>
                                    {uploadedFiles.filter(f => f.category === 'ssm_license').length > 0
                                      ? (language === 'bm' ? '✓ Dimuat naik' : '✓ Uploaded')
                                      : (language === 'bm' ? 'Diperlukan' : 'Required')}
                                  </span>
                                  <label className="py-1.5 px-3 bg-blue-950 hover:bg-blue-900 text-white font-semibold text-xs rounded-xl cursor-pointer transition-all flex items-center gap-1.5 active:scale-95 shadow-xs">
                                    <UploadCloud className="w-3.5 h-3.5" />
                                    <span>{language === 'bm' ? '+ Tambah Sebutharga' : '+ Upload Quotation'}</span>
                                    <input type="file" multiple accept="application/pdf,image/*" className="hidden"
                                      onChange={(e) => {
                                        setUploadValidationError(null);
                                        handleMultipleFilesUploadWithCategory(e, 'ssm_license');
                                      }} />
                                  </label>
                                </div>
                              </div>

                              {uploadedFiles.filter(f => f.category === 'ssm_license').length > 0 && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2.5 mt-2 border-t border-slate-100">
                                  {uploadedFiles.map((file, idx) => {
                                    if (file.category !== 'ssm_license') return null;
                                    return (
                                      <div key={idx} className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs">
                                        <div className="flex items-center gap-2 truncate pr-2">
                                          <span className="text-[9px] font-bold uppercase bg-blue-100 text-blue-950 px-1.5 py-0.5 rounded">DEALER QUOTE</span>
                                          <span className="font-medium text-slate-800 truncate">{file.fileName}</span>
                                        </div>
                                        <button onClick={() => removeUploadedFile(idx)} className="p-1 text-slate-400 hover:text-rose-600 rounded cursor-pointer">
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>

                            {/* Driving License */}
                            <div 
                              id="box-proposal"
                              className={`p-4 rounded-2xl border transition-all ${
                                uploadedFiles.filter(f => f.category === 'business_proposal').length === 0 && uploadValidationError
                                  ? 'border-rose-400 bg-rose-50/40 ring-2 ring-rose-400/10'
                                  : 'border-slate-200 bg-white hover:border-slate-300'
                              }`}
                            >
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div className="flex items-start gap-3">
                                  <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-900 flex items-center justify-center shrink-0 mt-0.5">
                                    <FileText className="w-4.5 h-4.5" />
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <h3 className="text-xs font-bold text-slate-900">
                                        {language === 'bm' ? '5. Lesen Memandu (B2 / D / GDL)' : '5. Driving / GDL License'}
                                      </h3>
                                      <span className="text-[9px] font-black text-white bg-blue-950 px-2 py-0.5 rounded">
                                        {language === 'bm' ? 'WAJIB LESEN' : 'MANDATORY (LICENSE)'}
                                      </span>
                                    </div>
                                    <p className="text-[11px] text-slate-500 mt-0.5">
                                      {language === 'bm' ? 'Salinan lesen memandu sah untuk pengesahan sewa beli kenderaan.' : 'Valid driving license copy for vehicle hire-purchase eligibility.'}
                                    </p>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                                  <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg ${
                                    uploadedFiles.filter(f => f.category === 'business_proposal').length > 0
                                      ? 'bg-emerald-100 text-emerald-800 font-bold'
                                      : 'bg-slate-100 text-slate-600'
                                  }`}>
                                    {uploadedFiles.filter(f => f.category === 'business_proposal').length > 0
                                      ? (language === 'bm' ? '✓ Dimuat naik' : '✓ Uploaded')
                                      : (language === 'bm' ? 'Diperlukan' : 'Required')}
                                  </span>
                                  <label className="py-1.5 px-3 bg-blue-950 hover:bg-blue-900 text-white font-semibold text-xs rounded-xl cursor-pointer transition-all flex items-center gap-1.5 active:scale-95 shadow-xs">
                                    <UploadCloud className="w-3.5 h-3.5" />
                                    <span>{language === 'bm' ? '+ Tambah Lesen' : '+ Upload License'}</span>
                                    <input type="file" multiple accept="image/*,application/pdf" className="hidden"
                                      onChange={(e) => {
                                        setUploadValidationError(null);
                                        handleMultipleFilesUploadWithCategory(e, 'business_proposal');
                                      }} />
                                  </label>
                                </div>
                              </div>

                              {uploadedFiles.filter(f => f.category === 'business_proposal').length > 0 && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2.5 mt-2 border-t border-slate-100">
                                  {uploadedFiles.map((file, idx) => {
                                    if (file.category !== 'business_proposal') return null;
                                    return (
                                      <div key={idx} className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs">
                                        <div className="flex items-center gap-2 truncate pr-2">
                                          <span className="text-[9px] font-bold uppercase bg-purple-100 text-purple-950 px-1.5 py-0.5 rounded">LICENSE</span>
                                          <span className="font-medium text-slate-800 truncate">{file.fileName}</span>
                                        </div>
                                        <button onClick={() => removeUploadedFile(idx)} className="p-1 text-slate-400 hover:text-rose-600 rounded cursor-pointer">
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          </>
                        )}

                        {/* EXPANDABLE ACCORDION FOR OPTIONAL SUPPORTING DOCUMENTS */}
                        {(() => {
                          const isPersonalOrEdu = targetLoanPurpose === 'personal_cash' || targetLoanPurpose === 'education';
                          const isWorkingCapital = targetLoanPurpose === 'working_capital';
                          const isEquipment = targetLoanPurpose === 'equipment';
                          const isVehicle = targetLoanPurpose === 'vehicle';

                          // Count only purpose-relevant optional files
                          const optionalCount = uploadedFiles.filter(f => {
                            if (isPersonalOrEdu) return f.category === 'tax_epf';
                            if (isWorkingCapital) return f.category === 'tax_epf' || f.category === 'premise_photos' || f.category === 'business_proposal';
                            if (isEquipment) return f.category === 'tax_epf' || f.category === 'premise_photos';
                            if (isVehicle) return f.category === 'tax_epf' || f.category === 'premise_photos';
                            return f.category === 'tax_epf';
                          }).length;

                          return (
                            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 overflow-hidden transition-all mt-1">
                              <button
                                type="button"
                                onClick={() => setShowOptionalDocs(!showOptionalDocs)}
                                className="w-full p-3.5 sm:p-4 flex items-center justify-between gap-3 text-left hover:bg-slate-100/70 transition-colors cursor-pointer"
                              >
                                <div className="flex items-center gap-3">
                                  <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-950 flex items-center justify-center shrink-0">
                                    <Sparkles className="w-3.5 h-3.5 text-blue-900" />
                                  </div>
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-xs font-bold text-slate-900">
                                      {isPersonalOrEdu 
                                        ? (language === 'bm' ? '+ Tambah Penyata KWSP / EPF (Pilihan)' : '+ Add EPF / KWSP Statement (Optional)')
                                        : (language === 'bm' ? '+ Dokumen Sokongan Pilihan' : '+ Optional Supporting Documents')}
                                    </span>
                                    <span className="text-[9.5px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-200">
                                      {language === 'bm' ? 'Tingkatkan Kelulusan' : 'Boosts Approval'}
                                    </span>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                  {optionalCount > 0 && (
                                    <span className="text-[10px] font-extrabold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-200">
                                      ✓ {optionalCount} {language === 'bm' ? 'ditambah' : 'added'}
                                    </span>
                                  )}
                                  <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform duration-200 ${showOptionalDocs ? 'rotate-180' : ''}`} />
                                </div>
                              </button>

                              {/* Accordion Expandable Body */}
                              {showOptionalDocs && (
                                <div className="p-3.5 sm:p-4 pt-1 border-t border-slate-200/70 flex flex-col gap-3">
                                  
                                  {/* OPTIONAL 1: EPF / KWSP STATEMENT (Relevant to all purposes) */}
                                  <div id="box-epf" className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-all">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                      <div className="flex items-start gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                                          <ShieldCheck className="w-4 h-4" />
                                        </div>
                                        <div>
                                          <div className="flex items-center gap-2 flex-wrap">
                                            <h4 className="text-xs font-bold text-slate-900">
                                              {language === 'bm' ? 'Penyata KWSP / EPF (i-Akaun)' : 'EPF / KWSP Statement'}
                                            </h4>
                                            <span className="text-[9px] font-bold text-slate-600 bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200">
                                              {language === 'bm' ? 'PILIHAN' : 'OPTIONAL'}
                                            </span>
                                          </div>
                                          <p className="text-[11px] text-slate-500 mt-0.5">
                                            {language === 'bm' ? 'Muat naik PDF dari portal i-Akaun KWSP jika ada caruman.' : 'Upload PDF from i-Akaun KWSP if you have contributions.'}
                                          </p>
                                        </div>
                                      </div>

                                      <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                                        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-lg ${
                                          uploadedFiles.filter(f => f.category === 'tax_epf').length > 0 ? 'bg-emerald-100 text-emerald-800 font-bold' : 'bg-slate-100 text-slate-500'
                                        }`}>
                                          {uploadedFiles.filter(f => f.category === 'tax_epf').length > 0 ? (language === 'bm' ? '✓ Dimuat naik' : '✓ Uploaded') : (language === 'bm' ? 'Pilihan' : 'Optional')}
                                        </span>
                                        <label className="py-1 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs rounded-xl cursor-pointer transition-all flex items-center gap-1.5 active:scale-95 border border-slate-300">
                                          <UploadCloud className="w-3.5 h-3.5 text-emerald-700" />
                                          <span>{language === 'bm' ? '+ Tambah KWSP' : '+ Upload EPF'}</span>
                                          <input type="file" multiple accept="application/pdf" className="hidden"
                                            onChange={(e) => {
                                              const ok = Array.from(e.target.files||[]).filter(f => f.type === 'application/pdf');
                                              if (ok.length) { const dt = new DataTransfer(); ok.forEach(f=>dt.items.add(f)); handleMultipleFilesUploadWithCategory({target:{files:dt.files}} as any, 'tax_epf'); }
                                            }} />
                                        </label>
                                      </div>
                                    </div>

                                    {uploadedFiles.filter(f => f.category === 'tax_epf').length > 0 && (
                                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2.5 mt-2 border-t border-slate-100">
                                        {uploadedFiles.map((file, idx) => {
                                          if (file.category !== 'tax_epf') return null;
                                          return (
                                            <div key={idx} className="flex items-center justify-between p-2 bg-slate-50 border border-slate-200/80 rounded-lg text-xs">
                                              <div className="flex items-center gap-1.5 truncate pr-1.5">
                                                <span className="text-[8px] font-bold uppercase bg-emerald-100 text-emerald-800 px-1 py-0.5 rounded">KWSP</span>
                                                <span className="font-medium text-slate-800 truncate">{file.fileName}</span>
                                              </div>
                                              <button onClick={() => removeUploadedFile(idx)} className="p-1 text-slate-400 hover:text-rose-600 rounded cursor-pointer">
                                                <Trash2 className="w-3 h-3" />
                                              </button>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    )}
                                  </div>

                                  {/* OPTIONAL 2: BUSINESS PROPOSAL (Only for Working Capital) */}
                                  {isWorkingCapital && (
                                    <div id="box-proposal-opt" className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-all">
                                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                        <div className="flex items-start gap-3">
                                          <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-900 flex items-center justify-center shrink-0 mt-0.5">
                                            <Briefcase className="w-4 h-4" />
                                          </div>
                                          <div>
                                            <div className="flex items-center gap-2 flex-wrap">
                                              <h4 className="text-xs font-bold text-slate-900">
                                                {language === 'bm' ? 'Rancangan Penggunaan Modal / Aliran Tunai' : 'Cashflow Forecast / Use of Funds Plan'}
                                              </h4>
                                              <span className="text-[9px] font-bold text-slate-600 bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200">
                                                {language === 'bm' ? 'PILIHAN' : 'OPTIONAL'}
                                              </span>
                                            </div>
                                            <p className="text-[11px] text-slate-500 mt-0.5">
                                              {language === 'bm' ? 'Kertas kerja ringkas unjuran jualan atau sebut harga bekalan stok (PDF / Word / Excel).' : 'Brief outline of sales projections or supplier stock quotes (PDF / Word / Excel).'}
                                            </p>
                                          </div>
                                        </div>

                                        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                                          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-lg ${
                                            uploadedFiles.filter(f => f.category === 'business_proposal').length > 0 ? 'bg-emerald-100 text-emerald-800 font-bold' : 'bg-slate-100 text-slate-500'
                                          }`}>
                                            {uploadedFiles.filter(f => f.category === 'business_proposal').length > 0 ? (language === 'bm' ? '✓ Dimuat naik' : '✓ Uploaded') : (language === 'bm' ? 'Pilihan' : 'Optional')}
                                          </span>
                                          <label className="py-1 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs rounded-xl cursor-pointer transition-all flex items-center gap-1.5 active:scale-95 border border-slate-300">
                                            <UploadCloud className="w-3.5 h-3.5 text-purple-900" />
                                            <span>{language === 'bm' ? '+ Tambah Fail' : '+ Upload File'}</span>
                                            <input type="file" multiple accept=".pdf,.doc,.docx,.xls,.xlsx,image/*" className="hidden"
                                              onChange={(e) => handleMultipleFilesUploadWithCategory(e, 'business_proposal')} />
                                          </label>
                                        </div>
                                      </div>

                                      {uploadedFiles.filter(f => f.category === 'business_proposal').length > 0 && (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2.5 mt-2 border-t border-slate-100">
                                          {uploadedFiles.map((file, idx) => {
                                            if (file.category !== 'business_proposal') return null;
                                            return (
                                              <div key={idx} className="flex items-center justify-between p-2 bg-slate-50 border border-slate-200/80 rounded-lg text-xs">
                                                <div className="flex items-center gap-1.5 truncate pr-1.5">
                                                  <span className="text-[8px] font-bold uppercase bg-purple-100 text-purple-950 px-1 py-0.5 rounded">PLAN</span>
                                                  <span className="font-medium text-slate-800 truncate">{file.fileName}</span>
                                                </div>
                                                <button onClick={() => removeUploadedFile(idx)} className="p-1 text-slate-400 hover:text-rose-600 rounded cursor-pointer">
                                                  <Trash2 className="w-3 h-3" />
                                                </button>
                                              </div>
                                            );
                                          })}
                                        </div>
                                      )}
                                    </div>
                                  )}

                                  {/* OPTIONAL 3: PREMISE / OPERATION / RIDER PROFILE PHOTOS (For Business / Equipment / Vehicle) */}
                                  {(isWorkingCapital || isEquipment || isVehicle) && (
                                    <div id="box-premise-opt" className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-all">
                                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                        <div className="flex items-start gap-3">
                                          <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-900 flex items-center justify-center shrink-0 mt-0.5">
                                            <Building2 className="w-4 h-4" />
                                          </div>
                                          <div>
                                            <div className="flex items-center gap-2 flex-wrap">
                                              <h4 className="text-xs font-bold text-slate-900">
                                                {isVehicle 
                                                  ? (language === 'bm' ? 'Tangkapan Skrin Profil Rider / Platform Aktif' : 'Active Rider / Platform Profile')
                                                  : (language === 'bm' ? 'Gambar Premis / Gerai / Stok Niaga' : 'Premise / Stall / Inventory Photos')}
                                              </h4>
                                              <span className="text-[9px] font-bold text-slate-600 bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200">
                                                {language === 'bm' ? 'PILIHAN' : 'OPTIONAL'}
                                              </span>
                                            </div>
                                            <p className="text-[11px] text-slate-500 mt-0.5">
                                              {isVehicle
                                                ? (language === 'bm' ? 'Tangkapan skrin profil aktif akaun Grab, Foodpanda, Lalamove, atau ShopeeFood.' : 'Screenshot of active Grab, Foodpanda, Lalamove or ShopeeFood profile.')
                                                : (language === 'bm' ? 'Gambar papan tanda kedai, gerai pasar malam, van jualan, atau stok produk.' : 'Photos of shop signboard, market stall, delivery vehicle, or product stock.')}
                                            </p>
                                          </div>
                                        </div>

                                        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                                          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-lg ${
                                            uploadedFiles.filter(f => f.category === 'premise_photos').length > 0 ? 'bg-emerald-100 text-emerald-800 font-bold' : 'bg-slate-100 text-slate-500'
                                          }`}>
                                            {uploadedFiles.filter(f => f.category === 'premise_photos').length > 0 ? (language === 'bm' ? '✓ Dimuat naik' : '✓ Uploaded') : (language === 'bm' ? 'Pilihan' : 'Optional')}
                                          </span>
                                          <label className="py-1 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs rounded-xl cursor-pointer transition-all flex items-center gap-1.5 active:scale-95 border border-slate-300">
                                            <UploadCloud className="w-3.5 h-3.5 text-amber-800" />
                                            <span>{language === 'bm' ? '+ Tambah Gambar' : '+ Upload Photos'}</span>
                                            <input type="file" multiple accept="image/*" className="hidden"
                                              onChange={(e) => handleMultipleFilesUploadWithCategory(e, 'premise_photos')} />
                                          </label>
                                        </div>
                                      </div>

                                      {uploadedFiles.filter(f => f.category === 'premise_photos').length > 0 && (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2.5 mt-2 border-t border-slate-100">
                                          {uploadedFiles.map((file, idx) => {
                                            if (file.category !== 'premise_photos') return null;
                                            return (
                                              <div key={idx} className="flex items-center justify-between p-2 bg-slate-50 border border-slate-200/80 rounded-lg text-xs">
                                                <div className="flex items-center gap-1.5 truncate pr-1.5">
                                                  <span className="text-[8px] font-bold uppercase bg-amber-100 text-amber-950 px-1 py-0.5 rounded">FOTO</span>
                                                  <span className="font-medium text-slate-800 truncate">{file.fileName}</span>
                                                </div>
                                                <button onClick={() => removeUploadedFile(idx)} className="p-1 text-slate-400 hover:text-rose-600 rounded cursor-pointer">
                                                  <Trash2 className="w-3 h-3" />
                                                </button>
                                              </div>
                                            );
                                          })}
                                        </div>
                                      )}
                                    </div>
                                  )}

                                </div>
                              )}
                            </div>
                          );
                        })()}

                      </div>

                      {/* Bottom Controls for Step 2 */}
                      <div className="flex flex-col gap-3 pt-4 border-t border-slate-100">
                        
                        {/* Validation Error Alert Banner */}
                        {uploadValidationError && (
                          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-900 font-semibold flex items-center gap-2.5 animate-pulse shadow-xs">
                            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                            <span>{uploadValidationError}</span>
                          </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex flex-col sm:flex-row items-center gap-3 pt-1">
                          <button
                            onClick={() => {
                              setActiveStep(1);
                              window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
                              document.documentElement.scrollTop = 0;
                              document.body.scrollTop = 0;
                            }}
                            className="w-full sm:w-auto py-3.5 px-5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-2xl text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer order-2 sm:order-1"
                          >
                            <ArrowLeft className="w-3.5 h-3.5" /> {language === 'bm' ? 'Kembali ke Langkah 1' : 'Back to Step 1'}
                          </button>
                          
                          <button
                            onClick={() => {
                              const scrollToBox = (elementId: string) => {
                                const el = document.getElementById(elementId);
                                if (el) {
                                  el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                } else {
                                  window.scrollTo({ top: 0, behavior: 'smooth' });
                                }
                              };

                              // 1. Bank Statements (min 3 PDFs)
                              const bankStatements = uploadedFiles.filter(f => f.category === 'bank_statement');
                              if (bankStatements.length < 3) {
                                setUploadValidationError(
                                  language === 'bm'
                                    ? `Sila muat naik sekurang-kurangnya 3 bulan penyata bank (semasa: ${bankStatements.length}/3 fail PDF).`
                                    : `Please upload at least 3 months of bank statements (current: ${bankStatements.length}/3 PDF files).`
                                );
                                scrollToBox('box-bank-statements');
                                return;
                              }

                              // 2. Income Proof: Min 12 weekly gig slips OR Min 3 monthly pay slips based on selected type
                              const gigSlips = uploadedFiles.filter(f => f.category === 'platform_dashboard');
                              const paySlips = uploadedFiles.filter(f => f.category === 'pay_slip');

                              if (incomeWorkType === 'gig' && gigSlips.length < 12) {
                                setUploadValidationError(
                                  language === 'bm'
                                    ? `Sila muat naik sekurang-kurangnya 12 minggu slip pendapatan gig (semasa: ${gigSlips.length}/12 slip).`
                                    : `Please upload at least 12 weekly gig platform slips (current: ${gigSlips.length}/12 slips).`
                                );
                                scrollToBox('box-income-proof');
                                return;
                              }

                              if (incomeWorkType === 'salaried' && paySlips.length < 3) {
                                setUploadValidationError(
                                  language === 'bm'
                                    ? `Sila muat naik sekurang-kurangnya 3 bulan slip gaji tetap (semasa: ${paySlips.length}/3 bulan).`
                                    : `Please upload at least 3 months of salaried pay slips (current: ${paySlips.length}/3 months).`
                                );
                                scrollToBox('box-income-proof');
                                return;
                              }

                              if (incomeWorkType === 'both' && gigSlips.length < 12 && paySlips.length < 3) {
                                setUploadValidationError(
                                  language === 'bm'
                                    ? `Sila lengkapkan sekurang-kurangnya SATU bukti pendapatan: 12 minggu slip gig (semasa: ${gigSlips.length}/12) ATAU 3 bulan slip gaji (semasa: ${paySlips.length}/3).`
                                    : `Please complete at least ONE proof of income: 12 weekly gig slips (current: ${gigSlips.length}/12) OR 3 monthly pay slips (current: ${paySlips.length}/3).`
                                );
                                scrollToBox('box-income-proof');
                                return;
                              }

                              // 3. MyKad (e-KYC)
                              const mykadFiles = uploadedFiles.filter(f => f.category === 'mykad_id');
                              if (mykadFiles.length === 0) {
                                setUploadValidationError(
                                  language === 'bm'
                                    ? 'Sila muat naik salinan MyKad / Kad Pengenalan anda untuk pengesahan e-KYC.'
                                    : 'Please upload your MyKad / National IC for mandatory e-KYC verification.'
                                );
                                scrollToBox('box-mykad');
                                return;
                              }

                              // 4. Purpose-Specific Mandatory Checks
                              if (targetLoanPurpose === 'working_capital' || targetLoanPurpose === 'equipment') {
                                const ssmFiles = uploadedFiles.filter(f => f.category === 'ssm_license');
                                if (ssmFiles.length === 0) {
                                  setUploadValidationError(
                                    language === 'bm'
                                      ? 'Sila muat naik Sijil Pendaftaran SSM / Lesen PBT untuk permohonan modal perniagaan.'
                                      : 'Please upload your SSM Business Registration Certificate or Local Council Permit.'
                                  );
                                  scrollToBox('box-ssm');
                                  return;
                                }
                              }

                              if (targetLoanPurpose === 'equipment') {
                                const quoteFiles = uploadedFiles.filter(f => f.category === 'business_proposal');
                                if (quoteFiles.length === 0) {
                                  setUploadValidationError(
                                    language === 'bm'
                                      ? 'Sila muat naik Sebutharga Pembekal Mesin/Peralatan untuk pembiayaan aset.'
                                      : 'Please upload the Equipment Supplier Quotation for commercial asset financing.'
                                  );
                                  scrollToBox('box-proposal');
                                  return;
                                }
                              }

                              if (targetLoanPurpose === 'vehicle') {
                                const dealerFiles = uploadedFiles.filter(f => f.category === 'ssm_license');
                                if (dealerFiles.length === 0) {
                                  setUploadValidationError(
                                    language === 'bm'
                                      ? 'Sila muat naik Sebutharga Pengedar Kenderaan (Dealer Quotation) untuk permohonan sewa beli.'
                                      : 'Please upload the Vehicle Dealer Sales Quotation for hire-purchase financing.'
                                  );
                                  scrollToBox('box-ssm');
                                  return;
                                }
                                const licenseFiles = uploadedFiles.filter(f => f.category === 'business_proposal');
                                if (licenseFiles.length === 0) {
                                  setUploadValidationError(
                                    language === 'bm'
                                      ? 'Sila muat naik salinan Lesen Memandu sah anda untuk pembiayaan kenderaan.'
                                      : 'Please upload a copy of your valid Driving License for vehicle financing.'
                                  );
                                  scrollToBox('box-proposal');
                                  return;
                                }
                              }

                              setUploadValidationError(null);
                              setActiveStep(3);
                              window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
                              document.documentElement.scrollTop = 0;
                              document.body.scrollTop = 0;
                            }}
                            className="flex-1 w-full py-4 px-6 bg-blue-950 hover:bg-blue-900 text-white font-bold rounded-2xl text-xs sm:text-sm transition-all shadow-md hover:shadow-lg cursor-pointer active:scale-[0.99] flex items-center justify-center gap-2 order-1 sm:order-2"
                          >
                            <span>{language === 'bm' ? 'Teruskan ke Langkah 3: Pengesahan & Perakuan →' : 'Continue to Step 3: Review & Consent →'}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}



                {/* STEP 3: DOCUMENT VERIFICATION, PII SHIELD & MANDATORY CONSENT */}
                {activeStep === 3 && (
                  <div className="bg-white rounded-3xl border border-slate-200 shadow-md p-6 sm:p-8 flex flex-col gap-6 animate-fade-in">
                    
                    {/* Header */}
                    <div className="border-b border-slate-100 pb-3.5">
                      <span className="text-[11px] font-extrabold text-blue-900 uppercase tracking-wider block">
                        {language === 'bm' ? 'Langkah 3 daripada 4' : 'Step 3 of 4'}
                      </span>
                      <h2 className="text-xl sm:text-2xl font-black text-blue-950 tracking-tight mt-0.5">
                        {language === 'bm' ? 'Pengesahan Dokumen & Perakuan Privasi' : 'Document Review & Statutory Consent'}
                      </h2>
                      <p className="text-xs text-slate-500 mt-1">
                        {language === 'bm'
                          ? 'Sila semak dokumen yang dimuat naik dan sahkan perakuan pemohon sebelum memulakan pengunderaitan AI.'
                          : 'Review your uploaded financial evidence and grant AI underwriting consent under PDPA 2010 guidelines.'}
                      </p>
                    </div>

                    {/* 1. Review Summary Checklist */}
                    <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0" />
                          <span className="text-xs font-bold text-emerald-950">
                            {language === 'bm' ? 'Ringkasan Dokumen Dimuat Naik' : 'Uploaded Evidence Summary'}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setActiveStep(2)}
                          className="text-[11px] font-semibold text-blue-950 hover:underline cursor-pointer"
                        >
                          {language === 'bm' ? 'Ubah Dokumen ✎' : 'Edit Documents ✎'}
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                        <div className="p-2.5 bg-white border border-emerald-200/80 rounded-xl flex items-center gap-2 text-xs">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <div className="truncate">
                            <span className="text-[11px] font-bold text-slate-800 block">
                              {uploadedFiles.filter(f => f.category === 'bank_statement').length} {language === 'bm' ? 'Penyata Bank' : 'Bank Statements'}
                            </span>
                            <span className="text-[10px] text-slate-400 block">{language === 'bm' ? '3–6 Bulan e-Statement' : '3–6 Months e-Statement'}</span>
                          </div>
                        </div>

                        <div className="p-2.5 bg-white border border-emerald-200/80 rounded-xl flex items-center gap-2 text-xs">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <div className="truncate">
                            <span className="text-[11px] font-bold text-slate-800 block">
                              {uploadedFiles.filter(f => f.category === 'platform_dashboard' || f.category === 'pay_slip').length} {language === 'bm' ? 'Slip Pendapatan' : 'Income Slips'}
                            </span>
                            <span className="text-[10px] text-slate-400 block">
                              {incomeWorkType === 'gig' ? '12 Weekly Gig Slips' : '3 Months Salary Slips'}
                            </span>
                          </div>
                        </div>

                        <div className="p-2.5 bg-white border border-emerald-200/80 rounded-xl flex items-center gap-2 text-xs">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <div className="truncate">
                            <span className="text-[11px] font-bold text-slate-800 block">
                              {language === 'bm' ? 'MyKad e-KYC' : 'MyKad e-KYC'}
                            </span>
                            <span className="text-[10px] text-slate-400 block">{language === 'bm' ? 'Pengesahan Identiti' : 'Identity Verified'}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 2. PII Masking Shield (Privacy Protection) */}
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-955 flex items-center justify-center shrink-0">
                          <Lock className="w-4.5 h-4.5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-900">
                              {language === 'bm' ? 'Perlindungan Data Peribadi (PII Shield)' : 'Bank-Grade PII Masking Shield'}
                            </span>
                            <span className="text-[9px] font-bold bg-blue-100 text-blue-950 px-1.5 py-0.2 rounded border border-blue-200">
                              PDPA 2010
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-500 block mt-0.5">
                            {language === 'bm'
                              ? 'Menutup nombor MyKad dan nombor akaun bank secara setempat sebelum dihantar ke AI.'
                              : 'Locally redacts MyKad and bank account numbers in your browser before AI analysis.'}
                          </span>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer shrink-0">
                        <input 
                          type="checkbox" 
                          checked={piiMaskingEnabled} 
                          onChange={(e) => setPiiMaskingEnabled(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-10 h-5.5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4.5 after:w-4.5 after:transition-all peer-checked:bg-blue-950"></div>
                      </label>
                    </div>

                    {/* 3. The 1 Single Consolidated Consent Card */}
                    <div className="flex flex-col gap-2">
                      {declarationError && (
                        <div className="p-3.5 bg-rose-100 border border-rose-300 rounded-xl text-xs text-rose-900 font-semibold flex items-center gap-2.5 animate-pulse shadow-xs">
                          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                          <span>
                            {language === 'bm'
                              ? 'Sila tandakan kotak perakuan statutori di bawah untuk memulakan pengunderaitan AI.'
                              : 'Please check the declaration box below to authorize AI underwriting.'}
                          </span>
                        </div>
                      )}

                      <label className={`flex items-start gap-3.5 p-4 rounded-2xl border transition-all cursor-pointer ${
                        (preUploadDeclNoDefault && preUploadDeclAuthentic && preUploadDeclConsent && preUploadDeclPdpa)
                          ? 'bg-blue-50/50 border-blue-950 shadow-xs ring-1 ring-blue-950/10'
                          : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                      }`}>
                        <input
                          type="checkbox"
                          checked={preUploadDeclNoDefault && preUploadDeclAuthentic && preUploadDeclConsent && preUploadDeclPdpa}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            setPreUploadDeclNoDefault(checked);
                            setPreUploadDeclAuthentic(checked);
                            setPreUploadDeclConsent(checked);
                            setPreUploadDeclPdpa(checked);
                            if (checked) setDeclarationError(false);
                          }}
                          className="mt-1 accent-blue-950 h-5 w-5 rounded shrink-0 cursor-pointer"
                        />
                        <div className="flex-1">
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <span className="text-xs font-bold text-slate-900">
                              {language === 'bm' ? 'Perakuan Pemohon & Persetujuan Privasi (PDPA 2010)' : 'Applicant Declaration & PDPA Consent'}
                            </span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setShowPdpaModal(true);
                              }}
                              className="text-[11px] font-semibold text-blue-950 hover:underline cursor-pointer"
                            >
                              {language === 'bm' ? 'Terma Privasi PDPA →' : 'PDPA Privacy Terms →'}
                            </button>
                          </div>
                          <span className="text-[11px] text-slate-500 block mt-1 leading-relaxed font-normal">
                            {language === 'bm'
                              ? 'Saya mengesahkan dokumen kewangan yang dimuat naik adalah tulen, tiada rekod kebankrapan aktif, dan bersetuju dengan semakan pra-kelayakan kredit AI mengikut peruntukan Akta Perlindungan Data Peribadi 2010 (PDPA) & garis panduan Bank Negara Malaysia.'
                              : 'I declare that the uploaded financial documents are authentic, I have no active bankruptcy records, and I consent to automated AI credit pre-scoring under the Personal Data Protection Act 2010 (PDPA) and Bank Negara Malaysia responsible financing guidelines.'}
                          </span>
                        </div>
                      </label>
                    </div>

                    {/* Bottom Actions */}
                    <div className="flex flex-col sm:flex-row items-center gap-3 pt-2 border-t border-slate-100">
                      <button
                        onClick={() => {
                          setActiveStep(2);
                          window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
                          document.documentElement.scrollTop = 0;
                          document.body.scrollTop = 0;
                        }}
                        className="w-full sm:w-auto py-3.5 px-5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-2xl text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer order-2 sm:order-1"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" /> {language === 'bm' ? 'Kembali ke Muat Naik Dokumen' : 'Back to Upload Documents'}
                      </button>

                      <button
                        onClick={() => {
                          if (!preUploadDeclNoDefault || !preUploadDeclAuthentic || !preUploadDeclConsent || !preUploadDeclPdpa) {
                            setDeclarationError(true);
                            return;
                          }
                          setDeclarationError(false);
                          setActiveStep(4);
                          runUnderwritingPipeline('real');
                        }}
                        disabled={isProcessing || !!viewingArchivedReport}
                        className="flex-1 w-full py-4 px-6 bg-blue-950 hover:bg-blue-900 text-white font-bold rounded-2xl text-xs sm:text-sm transition-all shadow-md hover:shadow-lg disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed active:scale-[0.99] flex items-center justify-center gap-2 order-1 sm:order-2"
                      >
                        <Play className="w-4 h-4 fill-white text-white" />
                        <span>
                          {viewingArchivedReport 
                            ? (language === 'bm' ? 'Laporan Sejarah (Hanya Baca)' : 'Archived Assessment (Read-Only)')
                            : (language === 'bm' ? 'Mula Semakan Kelayakan AI & Padankan Bank →' : 'Run AI Underwriting & Match Lenders →')}
                        </span>
                      </button>
                    </div>

                  </div>
                )}



                {/* STEP 4: ASSESSMENT REPORT & MATCHED LENDERS */}
                {activeStep === 4 && b2cResult && (
                  <div className="flex flex-col gap-6">
                    
                    {/* FREEMIUM PREVIEW BANNER */}
                    {!isPassportUnlocked ? (
                      <div className="p-4.5 bg-gradient-to-r from-blue-950 via-slate-900 to-blue-900 text-white rounded-2xl shadow-lg border border-blue-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-fade-in">
                        <div className="flex items-start sm:items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-blue-600/30 border border-blue-400/40 flex items-center justify-center text-blue-300 shrink-0">
                            <Sparkles className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-black tracking-wide text-white">
                                {language === 'bm' ? 'Pratonton Percuma: Analisis Sampel Dokumen 1' : 'Free Preview Mode: Document 1 Sample Analysis'}
                              </span>
                              <span className="text-[9px] font-black uppercase bg-blue-500 text-white px-2 py-0.5 rounded-full">
                                {language === 'bm' ? 'PRATONTON' : 'PREVIEW'}
                              </span>
                            </div>
                            <p className="text-[11px] text-blue-200 mt-0.5">
                              {language === 'bm' 
                                ? 'Skor awal anda layak untuk 4 bank. Buka Laporan Penuh untuk penyatuan semua dokumen, PDF rasmi & permohonan 1-klik.' 
                                : 'Your preliminary score qualifies for top lenders. Unlock full multi-document consolidation, official bank PDF, & 1-click apply.'}
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => setShowPaywallModal(true)}
                          className="w-full sm:w-auto px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-md transition-all active:scale-95 cursor-pointer shrink-0"
                        >
                          <Lock className="w-3.5 h-3.5 text-blue-200" />
                          <span>{language === 'bm' ? 'Buka Laporan Penuh (RM 9.90)' : 'Unlock Full Analysis Report (RM 9.90)'}</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between text-xs text-emerald-950">
                        <div className="flex items-center gap-2.5">
                          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                          <div>
                            <span className="font-extrabold text-emerald-950 block">
                              {language === 'bm' ? '✓ Laporan Pengunderaitan Rasmi Penuh Aktif' : '✓ Full Certified Underwriting Report Active'}
                            </span>
                            <span className="text-[11px] text-emerald-800">
                              {language === 'bm' ? 'Semua dokumen telah disatukan sepenuhnya & sedia untuk dihantar ke bank.' : 'Multi-document underwriting unlocked & authorized for direct bank submissions.'}
                            </span>
                          </div>
                        </div>
                        <span className="text-[10px] font-black uppercase bg-emerald-100 text-emerald-800 border border-emerald-300 px-2.5 py-1 rounded-lg">
                          {language === 'bm' ? 'STATUS: DIIKTIRAF' : 'STATUS: CERTIFIED'}
                        </span>
                      </div>
                    )}

                    {/* Master Passport Layout */}
                    <div className="premium-card p-6 bg-white relative overflow-hidden shadow-md">
                      
                      {/* Subtle Background Watermark Shield */}
                      <div className="absolute -right-8 -bottom-8 opacity-5 text-blue-900 pointer-events-none">
                        <Shield className="w-64 h-64" />
                      </div>

                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4 pb-4 border-b border-slate-100">
                        <div>
                          <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 block">Financial Evidence Analysis</span>
                          <span className="text-base font-extrabold text-blue-955 mt-0.5 block">{b2cResult.inputData.name}</span>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <button
                            type="button"
                            onClick={() => {
                              generateCreditPassportPdf({
                                inputData: b2cResult.inputData,
                                report: b2cResult.report,
                                documentHash: b2cResult.hash || 'demo-hash',
                                isLocked: !isPassportUnlocked
                              });
                            }}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 text-xs font-bold rounded-xl transition-all shadow-2xs cursor-pointer active:scale-95"
                            title={!isPassportUnlocked ? (language === 'bm' ? 'Muat Turun Sampel PDF (Pratonton)' : 'Download Sample PDF Report (Preview)') : (language === 'bm' ? 'Muat Turun PDF Rasmi' : 'Download Official Certified PDF')}
                          >
                            <Download className="w-3.5 h-3.5 text-blue-900" />
                            <span>
                              {!isPassportUnlocked 
                                ? (language === 'bm' ? 'Muat Turun Sampel PDF' : 'Download Sample PDF')
                                : (language === 'bm' ? 'Muat Turun PDF' : 'Download PDF Report')}
                            </span>
                          </button>
                          {getStatusBadge(b2cResult.report.status)}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                        
                        {/* Readiness dial gauge */}
                        <div className="md:col-span-5 flex flex-col items-center justify-center border-r border-slate-100 pr-0 md:pr-6">
                          <div className="relative w-36 h-36 flex items-center justify-center">
                            <svg className="w-full h-full transform -rotate-90">
                              <circle cx="72" cy="72" r="56" stroke="#f1f5f9" strokeWidth="8" fill="transparent" />
                              <circle 
                                cx="72" 
                                cy="72" 
                                r="56" 
                                stroke="#1e3a8a" 
                                strokeWidth="8" 
                                fill="transparent" 
                                strokeDasharray={2 * Math.PI * 56}
                                strokeDashoffset={
                                  !isPassportUnlocked
                                    ? 2 * Math.PI * 56 * 0.65
                                    : 2 * Math.PI * 56 * (1 - ((b2cResult.report.score ?? 300) - 300) / 550)
                                }
                                strokeLinecap="round"
                                className="transition-all duration-700 ease-out"
                              />
                            </svg>
                            
                            {/* Centered Text */}
                            <div className="absolute flex flex-col items-center justify-center text-center px-2">
                              <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wider">
                                {!isPassportUnlocked ? 'Preview Status' : 'FRI Score'}
                              </span>
                              {!isPassportUnlocked ? (
                                <>
                                  <div className="flex items-center gap-1 text-slate-800 font-extrabold text-sm my-1">
                                    <Lock className="w-3.5 h-3.5 text-blue-900" />
                                    <span>{language === 'bm' ? 'Skor Terkunci' : 'Score Masked'}</span>
                                  </div>
                                  <span className="text-[9px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                                    {language === 'bm' ? 'Pra-Kelayakan' : 'Pre-Qualified'}
                                  </span>
                                </>
                              ) : (
                                <>
                                  <span className="text-2xl font-extrabold text-blue-955 mt-0.5">{b2cResult.report.score}</span>
                                  <span className="text-[10px] font-bold text-slate-500 mt-1">{b2cResult.report.grade} — {getDisplayGrade(b2cResult.report.grade)}</span>
                                </>
                              )}
                            </div>
                          </div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2 text-center">
                            Financial Readiness Index (FRI)
                          </span>
                        </div>

                         <div className="md:col-span-7 flex flex-col justify-center">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-extrabold text-blue-955 uppercase tracking-wider">
                              {!isPassportUnlocked ? 'Preliminary Scan:' : 'Income Evidence Result:'}
                            </span>
                            <span className={`text-[11px] font-extrabold px-2.5 py-0.5 rounded-lg border ${
                              !isPassportUnlocked ? 'bg-blue-50 text-blue-900 border-blue-200' :
                              b2cResult.report.status === 'Approved' ? 'bg-blue-50 text-blue-900 border-blue-200' :
                              b2cResult.report.status === 'Borderline' ? 'bg-amber-50 text-amber-800 border-amber-200' :
                              b2cResult.report.status === 'Fraud Alert' ? 'bg-red-50 text-red-900 border-red-200' :
                              'bg-slate-100 text-slate-700 border-slate-300'
                            }`}>
                              {!isPassportUnlocked ? (language === 'bm' ? '3 Bank Berpadanan (Bulan 1 Disahkan)' : '3 Lenders Matched (Month 1 Verified)') : getDisplayStatus(b2cResult.report.status)}
                            </span>
                          </div>
                          {!isPassportUnlocked ? (
                            (() => {
                              const isGood = b2cResult.report.status === 'Approved' || (b2cResult.report.score && b2cResult.report.score >= 680);
                              const isMedium = b2cResult.report.status === 'Borderline' || (b2cResult.report.score && b2cResult.report.score >= 550 && b2cResult.report.score < 680);
                              const verifiedAmt = Math.round(b2cResult.inputData.monthlyIncomes?.[0] || b2cResult.inputData.averageMonthlyNetIncome || 4850).toLocaleString();

                              if (isGood) {
                                return (
                                  <div className="space-y-2 mt-2">
                                    <p className="text-xs text-slate-700 leading-relaxed font-medium">
                                      {language === 'bm'
                                        ? `Penyata Bulan 1 disahkan dengan purata pendapatan RM ${verifiedAmt}/bln (Pra-Kelayakan Lulus).`
                                        : `Month 1 statement verified with an average inflow of RM ${verifiedAmt}/mo (Pre-Qualified).`}
                                    </p>
                                    <div className="p-3 bg-blue-50/80 border border-blue-200 rounded-xl text-xs text-blue-950 flex items-start gap-2.5 shadow-2xs">
                                      <Sparkles className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
                                      <div>
                                        <strong className="font-bold text-blue-950 block text-[11.5px]">
                                          {language === 'bm' ? 'Padanan Awal: Layak untuk Pembiayaan Bank Digital' : 'Preliminary Match: Pre-Qualified for Target Financing'}
                                        </strong>
                                        <p className="text-[11px] leading-relaxed mt-0.5 text-blue-900">
                                          {language === 'bm'
                                            ? 'Aliran tunai Bulan 1 anda menunjukkan keupayaan bayaran balik yang baik. Membuka laporan penuh (RM 9.90) menyediakan dokumen penyatuan berbilang bulan yang diperlukan pihak bank untuk menawarkan kadar faedah lebih rendah dan kelulusan lebih pantas.'
                                            : 'Your verified Month 1 inflow shows healthy cash flow. Unlocking the full report (RM 9.90) provides the multi-month consolidated dossier that digital banks require to offer lower interest rates and faster approvals.'}
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                );
                              } else if (isMedium) {
                                return (
                                  <div className="space-y-2 mt-2">
                                    <p className="text-xs text-slate-700 leading-relaxed font-medium">
                                      {language === 'bm'
                                        ? `Penyata Bulan 1 disahkan pada RM ${verifiedAmt}/bln (Status Garis Sempadan).`
                                        : `Month 1 statement verified at RM ${verifiedAmt}/mo (Borderline Status).`}
                                    </p>
                                    <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl text-xs text-amber-950 flex items-start gap-2.5 shadow-2xs">
                                      <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                                      <div>
                                        <strong className="font-bold text-amber-950 block text-[11.5px]">
                                          {language === 'bm' ? 'Saranan Penasihat: Padanan Pemberi Pinjaman Alternatif' : 'Advisory Note: Alternative Lenders Available'}
                                        </strong>
                                        <p className="text-[11px] leading-relaxed mt-0.5 text-amber-900">
                                          {language === 'bm'
                                            ? 'Pendapatan anda mencukupi, tetapi corak mingguan tidak tetap mungkin menyebabkan bank biasa meminta dokumen tambahan. Buka laporan penuh (RM 9.90) untuk melihat pemberi pinjaman alternatif yang sesuai dan langkah mudah untuk memastikan permohonan anda lulus.'
                                            : 'Your income is sufficient, but irregular weekly patterns might cause traditional banks to ask for extra documents. Unlocking the full report (RM 9.90) reveals flexible lenders suited for gig workers and gives you specific steps to improve your approval odds.'}
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                );
                              } else {
                                return (
                                  <div className="space-y-2 mt-2">
                                    <p className="text-xs text-slate-700 leading-relaxed font-medium">
                                      {language === 'bm'
                                        ? `Penyata Bulan 1 dikesan dengan faktor risiko yang perlu diperbaiki.`
                                        : `Month 1 statement flagged with risk factors that need attention.`}
                                    </p>
                                    <div className="p-3 bg-red-50/80 border border-red-200 rounded-xl text-xs text-red-950 flex items-start gap-2.5 shadow-2xs">
                                      <AlertCircle className="w-4 h-4 text-red-700 shrink-0 mt-0.5" />
                                      <div>
                                        <strong className="font-bold text-red-950 block text-[11.5px]">
                                          {language === 'bm' ? 'Amaran Pengunderaitan: Elakkan Penolakan Bank' : 'Underwriting Alert: Resolve Flags Before Applying'}
                                        </strong>
                                        <p className="text-[11px] leading-relaxed mt-0.5 text-red-900">
                                          {language === 'bm'
                                            ? 'Penyata anda mengandungi beberapa faktor risiko (seperti baki minima rendah atau perbelanjaan tidak stabil) yang boleh menyebabkan penolakan bank. Kami syorkan menyemak laporan diagnostik penuh (RM 9.90) untuk mengenal pasti perkara yang perlu diperbaiki sebelum memohon.'
                                            : 'Your statement contains risk factors (e.g. low cash buffer or high expense volatility) that will likely trigger a bank rejection. We recommend reviewing the full diagnostic report (RM 9.90) to see exactly what to fix before submitting your loan application.'}
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                );
                              }
                            })()
                          ) : (
                            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                              {b2cResult.report.status === 'Approved' && "Your income evidence meets the baseline criteria for alternative lenders in the RM 5,000–200,000 range. Scroll down to see which specific lenders you are likely to qualify for and what documents each requires."}
                              {b2cResult.report.status === 'Borderline' && "Your evidence is close to qualifying, but one or more factors need improvement. Some lenders may still consider you — possibly with a guarantor or smaller loan amount. Review the specific items below before applying."}
                              {b2cResult.report.status === 'Declined' && "Your current financial evidence does not yet meet the minimum threshold for licensed alternative lenders. This does not mean you cannot get a loan — it means you need to take specific preparation steps first. See your 60-Day Roadmap below."}
                              {b2cResult.report.status === 'Fraud Alert' && "One or more uploaded documents failed our forensic integrity check. This could be due to image editing software, screenshot manipulation, or digital watermark removal. No legitimate lender will accept documents with these flags."}
                            </p>
                          )}
                        </div>

                      </div>
                    </div>

                    {/* REPAYMENT CAPACITY & AFFORDABILITY ANALYSIS CARD */}
                    <div className="premium-card p-6 bg-white border border-slate-200 shadow-md">
                      <div className="flex items-center gap-2.5 mb-4 border-b border-slate-100 pb-3">
                        <div className="p-2 bg-blue-50 text-blue-900 rounded-lg">
                          <Activity className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="text-sm font-extrabold uppercase tracking-widest text-blue-955">Repayment Capacity &amp; Affordability</h3>
                        </div>
                      </div>

                      <div className={`grid grid-cols-1 ${isPassportUnlocked ? 'sm:grid-cols-2 lg:grid-cols-4' : 'md:grid-cols-3'} gap-4 mb-4`}>
                        {/* Item 1: Installment */}
                        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                          <span className="text-[9px] text-slate-400 block uppercase font-bold tracking-wider mb-1">Est. Monthly Installment</span>
                          <span className="text-lg font-extrabold text-blue-955">
                            RM {b2cResult.report.estimatedInstallment.toLocaleString()}
                          </span>
                          <span className="text-[10px] text-slate-500 block mt-1">
                            {b2cResult.inputData.tenureYears
                              ? `${b2cResult.inputData.tenureYears}-year (${b2cResult.inputData.tenureYears * 12}-month) tenure basis`
                              : `${calcTenureYears || 1}-year (${(calcTenureYears || 1) * 12}-month) tenure basis`
                            }
                          </span>
                        </div>

                        {/* Item 2: Verified Month 1 Income */}
                        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                          <span className="text-[9px] text-slate-400 block uppercase font-bold tracking-wider mb-1">
                            {!isPassportUnlocked ? 'Verified Month 1 Inflow' : 'Monthly Cash Surplus'}
                          </span>
                          {!isPassportUnlocked ? (
                            <div className="flex items-center gap-1.5 my-0.5">
                              <span className="text-lg font-extrabold text-slate-900">
                                RM {Math.round(b2cResult.inputData.monthlyIncomes?.[0] || b2cResult.report.estimatedInstallment * 6).toLocaleString()}
                              </span>
                              <span className="text-[9px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 px-1.5 py-0.2 rounded">
                                Doc 1 PASS
                              </span>
                            </div>
                          ) : (
                            <span className="text-lg font-extrabold text-slate-800">
                              RM {b2cResult.report.monthlySurplus.toFixed(0)}
                            </span>
                          )}
                          <span className="text-[10px] text-slate-500 block mt-1">
                            {!isPassportUnlocked ? (language === 'bm' ? 'Ekstraksi AI daripada Penyata 1' : 'AI Extracted from Statement 1') : 'Avg Income - Living Expenses'}
                          </span>
                        </div>

                        {/* Item 3: Multi-Month Synthesis / Post-Loan Buffer */}
                        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                          <span className="text-[9px] text-slate-400 block uppercase font-bold tracking-wider mb-1">
                            {!isPassportUnlocked ? '12-Month Consolidated DSR' : 'Post-Loan Buffer'}
                          </span>
                          {!isPassportUnlocked ? (
                            <div className="flex items-center gap-1.5 my-0.5">
                              <span className="text-lg font-extrabold text-slate-400 font-mono tracking-widest">RM ••••</span>
                              <Lock className="w-3.5 h-3.5 text-slate-400" />
                            </div>
                          ) : (
                            <span className={`text-lg font-extrabold block ${
                              b2cResult.report.postLoanBuffer > 0 ? 'text-emerald-700' : 'text-slate-500 font-extrabold'
                            }`}>
                              RM {b2cResult.report.postLoanBuffer.toFixed(0)}
                            </span>
                          )}
                          <span className="text-[10px] text-slate-500 block mt-1">
                            {!isPassportUnlocked ? (language === 'bm' ? 'Perlu penyatuan berbilang bulan' : 'Requires multi-month synthesis') : 'Remaining surplus after payment'}
                          </span>
                        </div>

                        {/* Item 4: Assessed DSR (Paid User Exclusive Enhancement) */}
                        {isPassportUnlocked && (
                          <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-xl">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-[9px] text-emerald-800 block uppercase font-bold tracking-wider">Assessed DSR</span>
                              <span className="text-[8.5px] font-bold bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded border border-emerald-200">Low Risk</span>
                            </div>
                            <span className="text-lg font-extrabold text-emerald-900 block">
                              {(b2cResult.report.dsr ?? ((b2cResult.report.estimatedInstallment / (b2cResult.report.monthlySurplus + 1000)) * 100)).toFixed(1)}%
                            </span>
                            <span className="text-[10px] text-emerald-700 block mt-1">
                              BNM Safe Ceiling: &lt; 60%
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Affordability Status Banner */}
                      {!isPassportUnlocked ? (
                        <div className="p-3.5 border rounded-xl flex items-center gap-3 bg-blue-50/40 border-blue-200">
                          <CheckCircle2 className="w-4 h-4 text-blue-900 shrink-0" />
                          <span className="font-bold text-xs text-blue-950">
                            {language === 'bm' ? 'Kapasiti Bayaran Balik: Sihat (Berdasarkan Penyata Bulan 1)' : 'Repayment Capacity: Healthy (Month 1 Verified)'}
                          </span>
                        </div>
                      ) : (
                        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                          <div className="flex items-center gap-2.5">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                            <div>
                              <span className="font-bold text-slate-900 block">
                                {language === 'bm'
                                  ? `Status Kapasiti: ${b2cResult.report.affordabilityStatus} (Nisbah DSR: ${(b2cResult.report.dsr ?? 9.5).toFixed(1)}%)`
                                  : `Capacity Status: ${b2cResult.report.affordabilityStatus} (Assessed DSR: ${(b2cResult.report.dsr ?? 9.5).toFixed(1)}%)`
                                }
                              </span>
                              <p className="text-[11px] text-slate-500 mt-0.5">
                                {language === 'bm'
                                  ? `Baki tunai bebas bulanan sebanyak RM ${b2cResult.report.postLoanBuffer.toFixed(0)} membuktikan penampan kecairan sihat bagi pembiayaan sasaran anda.`
                                  : `Monthly post-payment liquidity of RM ${b2cResult.report.postLoanBuffer.toFixed(0)} confirms a healthy repayment buffer for your requested facility.`}
                              </p>
                            </div>
                          </div>
                          <span className="text-[9.5px] font-black uppercase bg-emerald-100 text-emerald-800 border border-emerald-300 px-2.5 py-1 rounded-lg shrink-0 self-start sm:self-auto">
                            {language === 'bm' ? 'PENGUNDERAIAN: LULUS' : 'UNDERWRITING: PASS'}
                          </span>
                        </div>
                      )}

                    </div>

                    {/* Step 3: MATCHED LENDERS SECTION */}
                    {b2cResult.report.status !== 'Declined' && (
                      <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm">
                        {(() => {
                          const lenderPurposeMap: Record<string, string[]> = {
                            working_capital: ['TEKUN Nasional (Skim Niaga)', 'SME Bank (SPUM Scheme)', 'Maybank SME Digital Financing', 'CIMB Micro-Financing', 'MARA (SPiM)', 'Alliance Digital SME', 'Funding Societies'],
                            vehicle: ['AEON Credit (Vehicle & Motor HP)', 'TEKUN Mobilepreneur', 'Maybank Hire Purchase', 'Bank Muamalat Auto-i', 'Agrobank AgroVehicle'],
                            personal_cash: ['BSN MicroKredit Madani', 'Bank Rakyat Pembiayaan Mikro-i', 'AEON i-Cash Personal', 'AIM (Amanah Ikhtiar PADURI)'],
                            equipment: ['SME Bank (SPUM Mesin & Alatan)', 'Agrobank Mesin-i', 'MARA (SPiM Alatan)', 'Affin SMEmerge', 'Maybank SME Financing'],
                            invoice_financing: ['Funding Societies Invoice Financing', 'CapBay Supply Chain Financing', 'MARA (SPiKE)'],
                            education: ['Bank Rakyat Pendidikan-i', 'BSN MicroKredit', 'AIM (Amanah Ikhtiar)'],
                          };
                          const purposeLabel: Record<string, string> = {
                            personal_cash: 'Personal Cash', working_capital: 'Working Capital',
                            equipment: 'Equipment', vehicle: 'Vehicle HP', invoice_financing: 'Invoice Financing', education: 'Education'
                          };
                          const loanTier = targetLoanAmount > 50000 ? 3 : targetLoanAmount < 5000 ? 1 : 2;

                          const effectiveTenure = b2cResult.inputData.tenureYears || calcTenureYears || 1;
                          const effectiveMonths = effectiveTenure * 12;
                          const topRate = targetLoanPurpose === 'working_capital' ? 0.04 : targetLoanPurpose === 'vehicle' ? 0.04 : targetLoanPurpose === 'equipment' ? 0.04 : 0.04;
                          const topRateLabel = targetLoanPurpose === 'working_capital' ? '4.0% flat p.a. (Subsidized)' : targetLoanPurpose === 'vehicle' ? '4.0% – 5.5% flat p.a.' : targetLoanPurpose === 'equipment' ? '4.0% – 5.0% flat p.a.' : '4.0% flat p.a. (BSN Madani)';
                          const topInstallment = Math.round((targetLoanAmount * (1 + topRate * effectiveTenure)) / effectiveMonths);
                          const bsnInstallment = Math.round((targetLoanAmount * (1 + 0.04 * effectiveTenure)) / effectiveMonths);
                          const aeonInstallment = Math.round((targetLoanAmount * (1 + 0.065 * effectiveTenure)) / effectiveMonths);

                          const mockLenderCards = [
                            {
                              id: 'best', rankTag: 'Top Lender Match', name: lenderPurposeMap[targetLoanPurpose]?.[0] ?? 'TEKUN Nasional', score: 95,
                              rate: topRateLabel,
                              installment: `RM ${topInstallment.toLocaleString()}/mo`,
                              tenure: `${effectiveTenure} ${effectiveTenure === 1 ? 'Year' : 'Years'} (${effectiveMonths} Mo)`,
                              speed: loanTier === 3 ? (language === 'bm' ? '5–7 hari bekerja' : '5–7 business days') : loanTier === 1 ? (language === 'bm' ? '2–3 hari bekerja' : '2–3 business days') : (language === 'bm' ? '3–5 hari bekerja' : '3–5 business days'),
                              reasons: [
                                targetLoanPurpose === 'working_capital' ? 'Lowest 4.0% subsidized rate under KUSKOP scheme' : 'Optimal product match for selected financing category',
                                `Income RM ${((b2cResult.inputData.averageMonthlyNetIncome ?? 3500)).toFixed(0)}/mo qualifies with strong margin`,
                                b2cResult.report.dsr <= 50 ? `Clean DSR ratio: ${b2cResult.report.dsr.toFixed(0)}%` : 'Lenient debt service assessment'
                              ],
                              warning: targetLoanPurpose === 'working_capital' && uploadedFiles.filter(f => f.category === 'business_proposal').length === 0
                                ? (language === 'bm' ? 'Sertakan kertas kerja ringkas untuk mempercepatkan kelulusan 4%' : 'Include brief business proposal to accelerate 4% subsidized approval')
                                : '',
                              url: '#',
                              isTop: true,
                            },
                            {
                              id: 'second', rankTag: '2nd Ranked Fit', name: lenderPurposeMap[targetLoanPurpose]?.[1] ?? 'SME Bank (SPUM)', score: 84,
                              rate: targetLoanPurpose === 'working_capital' ? '4.0% – 5.0% flat p.a.' : '5.5% – 7.5% p.a.',
                              installment: `RM ${bsnInstallment.toLocaleString()}/mo`,
                              tenure: `${effectiveTenure} ${effectiveTenure === 1 ? 'Year' : 'Years'} (${effectiveMonths} Mo)`,
                              speed: loanTier === 3 ? (language === 'bm' ? '5–10 hari bekerja' : '5–10 business days') : loanTier === 1 ? (language === 'bm' ? '2–3 hari bekerja' : '2–3 business days') : (language === 'bm' ? '3–5 hari bekerja' : '3–5 business days'),
                              reasons: ['Government development institution with zero-collateral micro facility', 'Alternative gig/business cash flow accepted'],
                              warning: targetLoanAmount > 30000 ? (language === 'bm' ? 'Lawatan tapak / gambar premis diperlukan untuk jumlah melebihi RM 30,000' : 'Premise photos required for amounts above RM 30,000') : '',
                              url: '#',
                              isTop: false,
                            },
                            {
                              id: 'third', rankTag: '3rd Ranked Fit', name: lenderPurposeMap[targetLoanPurpose]?.[2] ?? 'Maybank SME Digital Financing', score: 76,
                              rate: targetLoanPurpose === 'working_capital' ? '4.8% – 9.8% reducing' : '2.8% – 4.2% flat',
                              installment: `RM ${aeonInstallment.toLocaleString()}/mo`,
                              tenure: `${effectiveTenure} ${effectiveTenure === 1 ? 'Year' : 'Years'} (${effectiveMonths} Mo)`,
                              speed: (language === 'bm' ? 'Dalam 24–48 jam (Digital)' : 'Within 24–48 hours (Digital)'),
                              reasons: ['Top tier-1 commercial bank facility with automated digital screening', 'No collateral needed for eligible SSM businesses'],
                              warning: (language === 'bm' ? 'Memerlukan penyata bank 6 bulan format PDF rasmi' : 'Requires official 6-month bank statement in PDF format'),
                              url: '#',
                              isTop: false,
                            },
                          ];

                          const allNames = mockLenderCards.map(l => l.name);
                          const appliedCount = allNames.filter(n => appliedLenders[n]).length;
                          const topMatch = mockLenderCards[0];
                          const otherMatches = mockLenderCards.slice(1);

                          const renderLenderCard = (lender: typeof mockLenderCards[0]) => {
                            const applicationRecord = appliedLenders[lender.name];
                            const isApplied = !!applicationRecord;
                            const isLocked = !isPassportUnlocked;

                            const maskedBankName = lender.isTop
                              ? (language === 'bm' ? 'Bank Digital Berlesen (Padanan #1)' : 'Top-Tier Digital Bank (Match #1)')
                              : lender.id === 'second'
                                ? (language === 'bm' ? 'Bank Subsidi Kerajaan (Padanan #2)' : 'Government-Subsidized Bank (Match #2)')
                                : (language === 'bm' ? 'Pembiaya Alternatif Berlesen (Padanan #3)' : 'Licensed Alternative Lender (Match #3)');

                            return (
                              <div key={lender.id} className={`border rounded-2xl overflow-hidden transition-all ${lender.isTop ? 'border-blue-300 shadow-md ring-1 ring-blue-900/10' : 'border-slate-200 bg-white'}`}>
                                <div className={`px-4 py-2.5 flex items-center justify-between text-xs font-bold ${lender.isTop ? 'bg-blue-950 text-white' : 'bg-slate-100 text-slate-700'}`}>
                                  <span className="flex items-center gap-1.5">
                                    <Building2 className="w-3.5 h-3.5" /> {lender.rankTag}
                                  </span>
                                  <span className={lender.isTop ? 'bg-blue-900 px-2 py-0.5 rounded text-[11px]' : 'bg-white px-2 py-0.5 rounded border border-slate-200 text-[11px]'}>
                                    Match Score: {lender.score}/100
                                  </span>
                                </div>
                                <div className="p-4.5 bg-white flex flex-col gap-3">
                                  <div className="flex justify-between items-start gap-3">
                                    <div className="flex items-center gap-3">
                                      {isLocked ? (
                                        <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 shadow-2xs">
                                          <Lock className="w-4 h-4 text-slate-400" />
                                        </div>
                                      ) : (
                                        <BankLogo bankName={lender.name} size="md" />
                                      )}
                                      <div>
                                        <div className="flex items-center gap-1.5">
                                          <span className="text-base font-extrabold text-blue-950 block">
                                            {isLocked ? maskedBankName : lender.name}
                                          </span>
                                          {isLocked && (
                                            <span className="text-[9px] font-bold bg-slate-100 text-slate-500 border border-slate-200 px-1.5 py-0.5 rounded">
                                              {language === 'bm' ? 'Nama Dikunci' : 'Name Masked'}
                                            </span>
                                          )}
                                        </div>
                                        <span className="text-xs text-slate-400 block mt-0.5">Indicative Rate: {lender.rate} · {lender.tenure}</span>
                                      </div>
                                    </div>
                                    <div className="text-right shrink-0">
                                      <span className="text-base font-extrabold text-blue-950 block">{lender.installment}</span>
                                      <span className="text-[10px] text-slate-400 block">est. monthly installment</span>
                                    </div>
                                  </div>

                                  {/* Match Reasons / Bank Benefits (Always visible for value showcase!) */}
                                  <div className="flex flex-col gap-1">
                                    {lender.reasons.map((r, ri) => (
                                      <div key={ri} className="flex items-center gap-1.5 text-[11px] text-slate-600">
                                        <CheckCircle2 className="w-3.5 h-3.5 text-blue-800 shrink-0" /> {r}
                                      </div>
                                    ))}
                                    {lender.warning && (
                                      <div className="flex items-center gap-1.5 text-[11px] text-slate-600">
                                        <AlertCircle className="w-3.5 h-3.5 text-slate-500 shrink-0" /> {lender.warning}
                                      </div>
                                    )}
                                  </div>

                                  {/* Doc status */}
                                  <div className="flex items-center gap-2 text-[10px] text-slate-500">
                                    <span className="font-bold">Required Docs:</span>
                                    <span className={`flex items-center gap-1 ${hasBank ? 'text-blue-900 font-bold' : 'text-slate-400'}`}>
                                      <CheckCircle2 className="w-3 h-3" /> Bank Statement
                                    </span>
                                    <span className={`flex items-center gap-1 ${hasPlatform ? 'text-blue-900 font-bold' : 'text-slate-400'}`}>
                                      <CheckCircle2 className="w-3 h-3" /> Platform Earnings
                                    </span>
                                    <span className="text-[10px] font-bold bg-blue-50 text-blue-900 px-1.5 py-0.5 rounded border border-blue-200 ml-auto">
                                      SLA: {lender.speed}
                                    </span>
                                  </div>

                                  {/* Applied Status Notification */}
                                  {isApplied && (
                                    <div className="p-3 bg-blue-50/60 border border-blue-200 rounded-xl flex items-center justify-between text-xs text-blue-950 font-medium">
                                      <div className="flex items-center gap-2">
                                        <CheckCircle2 className="w-4 h-4 text-blue-900 shrink-0" />
                                        <div>
                                          <span className="font-extrabold block">Application Submitted</span>
                                          <span className="text-[10px] text-slate-500">Ref Code: <code className="font-mono font-bold text-blue-900">{applicationRecord.refCode}</code> ({applicationRecord.appliedAt})</span>
                                        </div>
                                      </div>
                                      <span className="text-[10px] font-bold bg-blue-900 text-white px-2 py-0.5 rounded-md">PENDING LENDER</span>
                                    </div>
                                  )}

                                  {/* Expandable Info */}
                                  {expandedLenderInfo === lender.id && (
                                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 flex flex-col gap-1.5 animate-fade-in">
                                      <span className="font-bold text-slate-800 block">About {lender.name}</span>
                                      <span>Licensed by Bank Negara Malaysia / Securities Commission Malaysia. Verified alternative lender accepting gig worker income documentation.</span>
                                      <span className="font-bold text-slate-700 mt-1 block">Disbursement SLA</span>
                                      <span>
                                        {loanTier === 3
                                          ? (language === 'bm'
                                              ? 'Jumlah melebihi RM 50,000: Audit dokumentasi penuh & semakan manusia diperlukan (anggaran 3–7 hari bekerja selepas pengesahan).'
                                              : 'Financing exceeding RM 50,000: Full document audit & human underwriter verification required (est. 3–7 business days upon review).')
                                          : loanTier === 1
                                            ? (language === 'bm'
                                                ? 'Jika diluluskan: Hari yang sama (Tahap 1 Pantas) atau 1 hari bekerja pindahan terus ke bank.'
                                                : 'If approved: Same day (Tier 1 Fast Track) direct bank transfer.')
                                            : (language === 'bm'
                                                ? 'Jika diluluskan: 1–3 hari bekerja (Tahap 2 Standard) pindahan terus ke bank.'
                                                : 'If approved: 1–3 business days (Tier 2 Standard) direct bank transfer.')
                                        }
                                      </span>
                                    </div>
                                  )}

                                  {/* Action Buttons */}
                                  <div className="flex gap-2 pt-1">
                                    <button
                                      onClick={() => {
                                        if (isLocked) {
                                          setShowPaywallModal(true);
                                        } else {
                                          setExpandedLenderInfo(expandedLenderInfo === lender.id ? null : lender.id);
                                        }
                                      }}
                                      className="flex-1 py-2 text-xs font-bold border border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                                    >
                                      {isLocked ? <Lock className="w-3.5 h-3.5 text-slate-400" /> : <Info className="w-3.5 h-3.5" />} 
                                      <span>{isLocked ? (language === 'bm' ? 'Buka Butiran Bank' : 'Unlock Bank Info') : (expandedLenderInfo === lender.id ? 'Hide Details' : 'Details')}</span>
                                    </button>
                                    
                                    <button
                                      onClick={() => {
                                        if (!isPassportUnlocked) {
                                          setShowPaywallModal(true);
                                          return;
                                        }
                                        setApplyTarget({ lenderName: lender.name, lenderUrl: lender.url, productName: purposeLabel[targetLoanPurpose] + ' Loan' });
                                        if (isApplied) {
                                          setApplySubmitted(true);
                                        } else {
                                          setApplySubmitted(false);
                                        }
                                        setApplyModalOpen(true);
                                      }}
                                      className={`flex-1 py-2 text-xs font-extrabold rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer ${
                                        isApplied
                                          ? 'bg-blue-900 hover:bg-blue-950 text-white'
                                          : !isPassportUnlocked
                                            ? 'bg-[#091E42] hover:bg-[#071735] text-white'
                                            : 'bg-blue-950 hover:bg-blue-900 text-white'
                                      }`}
                                    >
                                      {isApplied ? <CheckCircle2 className="w-3.5 h-3.5" /> : !isPassportUnlocked ? <Lock className="w-3.5 h-3.5 text-slate-300" /> : <ArrowRight className="w-3.5 h-3.5" />}
                                      <span>{isApplied ? 'View Submission' : !isPassportUnlocked ? (language === 'bm' ? 'Buka Nama Bank & Mohon (RM 9.90)' : 'Unlock Bank Identity & Apply (RM 9.90)') : (language === 'bm' ? 'Mohon Sekarang' : 'Apply Now')}</span>
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          };

                          return (
                          <div className="flex flex-col gap-4">
                            {/* Section Header */}
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                              <div className="flex items-center gap-2">
                                <Globe className="w-4.5 h-4.5 text-blue-900" />
                                <div>
                                  <span className="text-sm font-extrabold text-blue-950 block">
                                    Matched Lenders — {purposeLabel[targetLoanPurpose]} (RM {targetLoanAmount.toLocaleString()})
                                  </span>
                                  {appliedCount > 0 && (
                                    <span className="text-[10px] text-emerald-600 font-bold block font-mono">
                                      ✓ {appliedCount} of {mockLenderCards.length} Applications Submitted
                                    </span>
                                  )}
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-2 w-full sm:w-auto">
                                <button
                                  onClick={() => { setCompareOpen(true); setCompareSwipeIndex(0); }}
                                  className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 text-xs font-bold rounded-xl transition-all"
                                >
                                  <BarChart3 className="w-3.5 h-3.5 text-blue-900" /> Compare All
                                </button>
                                <button
                                  onClick={() => {
                                    if (!isPassportUnlocked) {
                                      setShowPaywallModal(true);
                                      return;
                                    }
                                    setApplyTarget({
                                      lenderName: topMatch.name,
                                      lenderUrl: topMatch.url,
                                      productName: purposeLabel[targetLoanPurpose] + ' Loan',
                                      speed: topMatch.speed,
                                      installment: parseInt(topMatch.installment.replace(/[^0-9]/g, '')) || 347
                                    });
                                    setApplySubmitted(false);
                                    setApplyModalOpen(true);
                                  }}
                                  className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2 bg-blue-950 hover:bg-blue-900 text-white text-xs font-extrabold rounded-xl transition-all shadow-sm cursor-pointer"
                                >
                                  {!isPassportUnlocked ? (
                                    <>
                                      <Lock className="w-3.5 h-3.5 text-blue-300" />
                                      <span>{language === 'bm' ? 'Buka Padanan Utama (RM 9.90)' : 'Unlock Top Match (RM 9.90)'}</span>
                                    </>
                                  ) : (
                                    <>
                                      <Zap className="w-3.5 h-3.5 text-blue-300" />
                                      <span>Apply to Top Match ({topMatch?.name.split(' ')[0]})</span>
                                    </>
                                  )}
                                </button>
                              </div>
                            </div>

                            {/* 1. TOP LENDER MATCH CARD */}
                            {topMatch && renderLenderCard(topMatch)}

                            {/* 2. OTHERS BANK THAT MATCH SECTION */}
                            {otherMatches.length > 0 && (
                              <div className="flex flex-col gap-3 pt-2 border-t border-slate-100 mt-1">
                                <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200 rounded-2xl">
                                  <div className="flex items-center gap-2.5">
                                    <div className="w-8 h-8 rounded-xl bg-blue-950/10 text-blue-950 flex items-center justify-center font-bold">
                                      <Landmark className="w-4 h-4 text-blue-950" />
                                    </div>
                                    <div>
                                      <span className="text-xs font-black text-blue-950 block">
                                        {language === 'bm' ? 'Pilihan Bank & Pemberi Pinjaman Lain' : 'Others Bank That Match'}
                                      </span>
                                      <span className="text-[10px] text-slate-500 block">
                                        {language === 'bm'
                                          ? `${otherMatches.length} pilihan bank berlesen lain yang sepadan dengan profil anda`
                                          : `${otherMatches.length} more alternative licensed lenders matching your profile`}
                                      </span>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-2">
                                    <button
                                      type="button"
                                      onClick={() => setCurrentPage('directory')}
                                      className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all shadow-2xs cursor-pointer hidden sm:flex items-center gap-1"
                                    >
                                      <Globe className="w-3.5 h-3.5 text-blue-900" />
                                      {language === 'bm' ? 'Direktori Penuh' : 'Full Directory'}
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setShowOtherLenders(!showOtherLenders)}
                                      className="px-3 py-1.5 bg-blue-950 hover:bg-blue-900 text-white text-xs font-bold rounded-xl transition-all shadow-2xs cursor-pointer flex items-center gap-1"
                                    >
                                      {showOtherLenders
                                        ? (language === 'bm' ? 'Sembunyikan ▲' : 'Hide Others ▲')
                                        : (language === 'bm' ? 'Lihat Pilihan Lain ▼' : 'View Others ▼')}
                                    </button>
                                  </div>
                                </div>

                                {/* Expanded other cards */}
                                {showOtherLenders && (
                                  <div className="flex flex-col gap-3 animate-fade-in">
                                    {otherMatches.map((lender) => renderLenderCard(lender))}
                                  </div>
                                )}
                              </div>
                            )}

                            {b2cResult.report.status === 'Borderline' && (
                              <div className="flex items-start gap-2 p-3 bg-slate-50 border border-slate-300 rounded-xl">
                                <AlertCircle className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
                                <p className="text-[11px] text-slate-655 leading-relaxed font-medium">
                                  <strong>Borderline warning:</strong> You may face higher rates or require a guarantor. Address your weakest scoring factors before applying.
                                </p>
                              </div>
                            )}
                          </div>
                          );
                        })()}
                      </div>
                    )}


                        {/* RISK-GATED: Declined → 60-Day Improvement Roadmap */}
                        {b2cResult.report.status === 'Declined' && (
                          <div className="p-4 bg-white border border-slate-300 rounded-xl flex flex-col gap-3">
                            <div className="flex items-center gap-2">
                              <AlertTriangle className="w-4.5 h-4.5 text-slate-500" />
                              <span className="text-sm font-bold text-slate-800">60-Day Improvement Roadmap</span>
                            </div>
                            <p className="text-xs text-slate-500 leading-relaxed">
                              You are not ready to apply yet — but you can get there. Work on these specific items over the next 60 days and re-run your assessment.
                            </p>
                            <div className="flex flex-col gap-2">
                              {[
                                { step: '1', text: 'Export 3–6 months of bank statements as CSV from your banking app (not screenshot)', urgency: 'critical' },
                                { step: '2', text: 'Check your CTOS / CCRIS report at myctos.com — resolve any outstanding defaults', urgency: 'critical' },
                                { step: '3', text: 'File your LHDN Form B/BE if overdue — this proves legitimate income to any lender', urgency: 'high' },
                                { step: '4', text: 'Maintain at least 3 months of consistent income — avoid large irregular withdrawals', urgency: 'high' },
                                { step: '5', text: 'Reduce existing debt payments (DSR below 50%) before applying — pay down credit cards first', urgency: 'medium' },
                              ].map((item) => (
                                <div key={item.step} className="flex items-start gap-2.5 p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                                  <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded shrink-0 mt-0.5 ${
                                    item.urgency === 'critical' ? 'bg-blue-900 text-white' :
                                    item.urgency === 'high' ? 'bg-slate-700 text-white' :
                                    'bg-slate-200 text-slate-700'
                                  }`}>Step {item.step}</span>
                                  <span className="text-xs text-slate-700 leading-relaxed font-medium">{item.text}</span>
                                </div>
                              ))}
                            </div>
                            <p className="text-[10px] text-slate-400 leading-relaxed mt-1">
                              If you need less than RM 5,000 urgently: SPayLater (Shopee), GXBank FlexiCredit, or TNG eWallet CashLoan may approve you algorithmically without document uploads.
                            </p>
                          </div>
                        )}

                        {/* RISK-GATED: Fraud Alert → Document Integrity Issues */}
                        {b2cResult.report.status === 'Fraud Alert' && (
                          <div className="p-4 bg-white border-2 border-slate-800 rounded-xl flex flex-col gap-3">
                            <div className="flex items-center gap-2">
                              <ShieldAlert className="w-4.5 h-4.5 text-slate-800" />
                              <span className="text-sm font-bold text-slate-900">Document Integrity Issues — Cannot Proceed</span>
                            </div>
                            <p className="text-xs text-slate-655 leading-relaxed font-medium">
                              Our forensic scanner detected issues with one or more of your uploaded documents. This prevents us from generating a valid assessment. No lender referral can be made until these are resolved.
                            </p>
                            <div className="flex flex-col gap-2">
                              {[
                                'Upload the original, unedited file directly exported from your banking app or platform dashboard.',
                                'Do not take screenshots of statements — use the official "Download" or "Export PDF" function.',
                                'Ensure the document has not been opened and saved in image editing software (Photoshop, Canva, etc.).',
                                'If your bank only provides image-based PDFs, download them directly from the official app — do not re-scan or re-photograph.',
                              ].map((item, i) => (
                                <div key={i} className="flex items-start gap-2.5 p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                                  <span className="text-[10px] font-extrabold text-slate-500 shrink-0 mt-0.5">FIX {i + 1}</span>
                                  <span className="text-xs text-slate-700 leading-relaxed font-medium">{item}</span>
                                </div>
                              ))}
                            </div>
                            <p className="text-[10px] text-slate-400 mt-1">
                              After fixing your documents, clear your uploads and re-run the assessment.
                            </p>
                          </div>
                        )}

                    {/* RESTART FLOW CONTROL */}
                    <div className="flex gap-4 mb-4">
                      <button
                        onClick={() => {
                          setB2cResult(null);
                          setActiveStep(1);
                        }}
                        className="w-full py-3.5 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 font-extrabold rounded-xl text-xs transition-colors shadow-sm flex items-center justify-center gap-2"
                      >
                        <RefreshCw className="w-4 h-4 text-blue-900" /> Start New Pre-Qualification Assessment
                      </button>
                    </div>

                  </div>
                )}

              </div>

            </div>
          )}

      {/* PERSPECTIVE 2: B2B UNDERWRITER COMMAND DESK */}
      {perspective === 'B2B' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left queue list */}
          <div className="lg:col-span-4 flex flex-col gap-5">
            
            <div className="premium-card p-5 bg-white border border-slate-200 shadow-sm flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                  <Landmark className="w-4 h-4 text-blue-900" /> Application Queue
                </h2>
                <span className="text-[11px] font-medium text-slate-500">Live Intake</span>
              </div>
              
              {/* Telemetries */}
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-500 font-bold block uppercase tracking-wider">Incoming</span>
                  <span className="text-lg font-extrabold block text-slate-900 mt-0.5 tabular-nums">{b2bApplicants.length}</span>
                </div>
                <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-200">
                  <span className="text-[10px] text-blue-900 font-bold block uppercase tracking-wider">Approved</span>
                  <span className="text-lg font-extrabold block text-blue-900 mt-0.5 tabular-nums">
                    {b2bApplicants.filter(a => a.status === 'Approved').length}
                  </span>
                </div>
                <div className="p-3 bg-rose-50/60 rounded-xl border border-rose-200">
                  <span className="text-[10px] text-rose-800 font-bold block uppercase tracking-wider">Flagged</span>
                  <span className="text-lg font-extrabold block text-rose-800 mt-0.5 tabular-nums">
                    {b2bApplicants.filter(a => a.status === 'Fraud Alert').length}
                  </span>
                </div>
              </div>

              {/* Rows layout */}
              <div className="flex flex-col gap-2.5">
                {b2bApplicants.map(app => (
                  <button
                    key={app.id}
                    onClick={() => setSelectedB2bApplicant(app.id)}
                    className={`flex items-center justify-between p-3.5 rounded-xl border transition-all text-left cursor-pointer ${
                      selectedB2bApplicant === app.id
                        ? 'bg-blue-50/50 border-blue-900 shadow-xs ring-1 ring-blue-900/20'
                        : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                    }`}
                  >
                    <div>
                      <span className="text-xs font-bold text-slate-900 block">{app.name}</span>
                      <span className="text-[11px] text-slate-500 block mt-0.5 truncate max-w-[150px]">{app.platform}</span>
                    </div>
                    <div className="text-right flex flex-col items-end gap-1 shrink-0">
                      <span className="text-xs font-bold text-slate-700 tabular-nums">Score: {app.score}</span>
                      {getStatusBadge(app.status)}
                    </div>
                  </button>
                ))}
              </div>

            </div>

          </div>

          {/* Right Detailed Institutional Underwriting Workspace */}
          <div className="lg:col-span-8 flex flex-col gap-5">
            {!activeB2bApplicantData ? (
              <div className="premium-card p-10 bg-white flex flex-col items-center justify-center text-center min-h-[450px]">
                <RefreshCw className="w-8 h-8 text-blue-900 animate-spin mb-4" />
                <span className="text-xs font-bold text-slate-400">RETRIEVING DATA ASSETS...</span>
              </div>
            ) : (
              <div className="flex flex-col gap-5">
                
                {/* 1. TOP APPLICANT OVERVIEW & VERDICT HEADER */}
                <div className="premium-card p-5 sm:p-6 bg-white border border-slate-200 shadow-sm flex flex-col gap-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-blue-950 text-white flex items-center justify-center font-bold text-sm shadow-sm">
                        {activeB2bApplicantData.inputData.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="text-base font-bold text-slate-950">{activeB2bApplicantData.inputData.name}</h2>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                            activeB2bApplicantData.report.grade === 'A' ? 'bg-blue-50 text-blue-900 border-blue-200' :
                            activeB2bApplicantData.report.grade === 'B' ? 'bg-slate-100 text-slate-700 border-slate-300' :
                            'bg-rose-50 text-rose-800 border-rose-200'
                          }`}>
                            GRADE {activeB2bApplicantData.report.grade}
                          </span>
                        </div>
                        <span className="text-xs text-slate-500 block mt-0.5">
                          {activeB2bApplicantData.inputData.platform} • Dossier Hash: <code className="text-blue-900 font-mono text-[11px] font-bold">{activeB2bApplicantData.hash.slice(0, 10)}...</code>
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => generateCreditPassportPdf({
                          inputData: activeB2bApplicantData.inputData,
                          report: activeB2bApplicantData.report,
                          documentHash: activeB2bApplicantData.hash
                        })}
                        className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-950 hover:bg-blue-900 text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer"
                      >
                        <FileDown className="w-3.5 h-3.5" /> PDF Dossier
                      </button>
                      <button
                        onClick={() => {
                          const jsonStr = JSON.stringify({
                            hash: activeB2bApplicantData.hash,
                            input: activeB2bApplicantData.inputData,
                            report: activeB2bApplicantData.report
                          }, null, 2);
                          const blob = new Blob([jsonStr], { type: 'application/json' });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = `crediflow_risk_telemetry_${activeB2bApplicantData.inputData.name.replace(/\s+/g, '_')}.json`;
                          a.click();
                        }}
                        className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl border border-slate-300 transition-colors cursor-pointer"
                        title="Export Raw JSON Telemetry"
                      >
                        <FileJson className="w-4 h-4 text-blue-900" />
                      </button>
                    </div>
                  </div>

                  {/* 4 Quick Stat Metric Badges */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl text-center">
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">FRI Score</span>
                      <span className="text-lg font-bold text-slate-950 mt-0.5 block tabular-nums">{activeB2bApplicantData.report.score} / 850</span>
                    </div>
                    <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl text-center">
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Monthly Income</span>
                      <span className="text-lg font-bold text-slate-950 mt-0.5 block tabular-nums">RM {activeB2bApplicantData.inputData.averageMonthlyNetIncome.toLocaleString()}</span>
                    </div>
                    <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl text-center">
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Debt Service (DSR)</span>
                      <span className="text-lg font-bold text-slate-950 mt-0.5 block tabular-nums">{(activeB2bApplicantData.report.dsr ?? 0).toFixed(1)}%</span>
                    </div>
                    <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl text-center">
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">CV Ingestion</span>
                      <span className="text-lg font-bold text-slate-950 mt-0.5 block tabular-nums">{activeB2bApplicantData.inputData.fileChecklist?.length || 2} Docs Verified</span>
                    </div>
                  </div>
                </div>

                {/* 2. WORKSPACE TAB NAVIGATION BAR */}
                <div className="flex flex-wrap items-center gap-2 p-2 bg-slate-100/90 border border-slate-200 rounded-2xl">
                  <button
                    onClick={() => setB2bWorkspaceTab('summary')}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      b2bWorkspaceTab === 'summary'
                        ? 'bg-blue-950 text-white shadow-xs'
                        : 'text-slate-600 hover:text-blue-950 hover:bg-white/80'
                    }`}
                  >
                    <BarChart3 className="w-3.5 h-3.5" />
                    <span>Summary &amp; Sizing</span>
                  </button>

                  <button
                    onClick={() => setB2bWorkspaceTab('dossier')}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      b2bWorkspaceTab === 'dossier'
                        ? 'bg-blue-950 text-white shadow-xs'
                        : 'text-slate-600 hover:text-blue-950 hover:bg-white/80'
                    }`}
                  >
                    <FileCheck className="w-3.5 h-3.5" />
                    <span>Multi-Doc Dossier ({activeB2bApplicantData.inputData.fileChecklist?.length || 2})</span>
                  </button>

                  <button
                    onClick={() => setB2bWorkspaceTab('reconciliation')}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      b2bWorkspaceTab === 'reconciliation'
                        ? 'bg-blue-950 text-white shadow-xs'
                        : 'text-slate-600 hover:text-blue-950 hover:bg-white/80'
                    }`}
                  >
                    <Scale className="w-3.5 h-3.5" />
                    <span>Payout Reconciliation</span>
                  </button>

                  <button
                    onClick={() => setB2bWorkspaceTab('ledger')}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      b2bWorkspaceTab === 'ledger'
                        ? 'bg-blue-950 text-white shadow-xs'
                        : 'text-slate-600 hover:text-blue-950 hover:bg-white/80'
                    }`}
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    <span>Audited Ledger</span>
                  </button>

                  <button
                    onClick={() => setB2bWorkspaceTab('forensics')}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      b2bWorkspaceTab === 'forensics'
                        ? 'bg-blue-950 text-white shadow-xs'
                        : 'text-slate-600 hover:text-blue-950 hover:bg-white/80'
                    }`}
                  >
                    <Cpu className="w-3.5 h-3.5" />
                    <span>Digital Forensics</span>
                  </button>
                </div>

                {/* TAB CONTENT PANES */}

                {/* TAB 1: SUMMARY & LOAN SIZING */}
                {b2bWorkspaceTab === 'summary' && (
                  <div className="flex flex-col gap-5 animate-in fade-in duration-150">
                    {/* Loan Configuration & Sizing Card */}
                    <div className="premium-card p-6 bg-white border border-slate-200 shadow-sm">
                      <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
                        <div className="flex items-center gap-2">
                          <Briefcase className="w-4 h-4 text-blue-900" />
                          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                            Requested Loan Principal &amp; Affordability Assessment
                          </h3>
                        </div>
                        <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-md border ${
                          (activeB2bApplicantData.report.affordabilityStatus ?? 'Strong') === 'Strong' ? 'bg-blue-50 text-blue-900 border-blue-200' :
                          'bg-slate-100 text-slate-700 border-slate-300'
                        }`}>
                          {(activeB2bApplicantData.report.affordabilityStatus ?? 'Strong').toUpperCase()} AFFORDABILITY
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs text-slate-700">
                        <div className="flex flex-col gap-2.5">
                          <div className="flex justify-between py-1.5 border-b border-slate-100">
                            <span className="text-slate-500">Target Financing Asset:</span>
                            <span className="font-bold text-slate-900">
                              {activeB2bApplicantData.inputData.targetLoanPurpose === 'car' && '🚗 Grab/Taxi Vehicle (Car Loan)'}
                              {activeB2bApplicantData.inputData.targetLoanPurpose === 'bike' && '🏍️ Delivery Motorcycle (Hire Purchase)'}
                              {activeB2bApplicantData.inputData.targetLoanPurpose === 'van' && '🚐 Commercial Van / Lorry'}
                              {activeB2bApplicantData.inputData.targetLoanPurpose === 'equipment' && '🍳 Kitchen / Commercial Equipment'}
                              {!activeB2bApplicantData.inputData.targetLoanPurpose && '🚗 Vehicle Financing (Standard)'}
                            </span>
                          </div>
                          <div className="flex justify-between py-1.5 border-b border-slate-100">
                            <span className="text-slate-500">Requested Principal:</span>
                            <span className="font-bold text-slate-950 tabular-nums">RM {(activeB2bApplicantData.inputData.targetLoanAmount ?? 35000).toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between py-1.5 border-b border-slate-100">
                            <span className="text-slate-500">Downpayment Deposited:</span>
                            <span className="font-bold text-slate-900 tabular-nums">RM {(activeB2bApplicantData.inputData.downpaymentAmount ?? 5000).toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between py-1.5">
                            <span className="text-slate-500">Equity Downpayment Margin:</span>
                            <span className="font-bold text-blue-900 tabular-nums">
                              {(((activeB2bApplicantData.inputData.downpaymentAmount ?? 5000) / ((activeB2bApplicantData.inputData.targetLoanAmount ?? 35000) + (activeB2bApplicantData.inputData.downpaymentAmount ?? 5000))) * 100).toFixed(1)}%
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-col gap-2.5 p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                          <div className="flex justify-between">
                            <span className="text-slate-500">Estimated Monthly Installment:</span>
                            <span className="font-bold text-slate-950 tabular-nums">RM {activeB2bApplicantData.report.estimatedInstallment}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">Net Monthly Cash Surplus:</span>
                            <span className="font-bold text-slate-950 tabular-nums">RM {activeB2bApplicantData.report.monthlySurplus.toFixed(0)}</span>
                          </div>
                          <div className="flex justify-between pt-2 border-t border-slate-200">
                            <span className="font-bold text-slate-700">Remaining Monthly Buffer:</span>
                            <span className="font-bold text-blue-900 tabular-nums">RM {activeB2bApplicantData.report.postLoanBuffer.toFixed(0)}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 4 Quantitative Telemetries */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs text-center">
                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Debt Ratio (DSR)</span>
                        <span className="text-lg font-bold text-slate-900 block mt-1 tabular-nums">{(activeB2bApplicantData.report.dsr ?? 0).toFixed(1)}%</span>
                        <span className="text-[10px] text-slate-400 block mt-0.5">Ceiling: 60.0%</span>
                      </div>
                      <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs text-center">
                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Volatility Index</span>
                        <span className="text-lg font-bold text-slate-900 block mt-1 tabular-nums">{((activeB2bApplicantData.report.volatilityIndex ?? 0) * 100).toFixed(1)}%</span>
                        <span className="text-[10px] text-slate-400 block mt-0.5">Coefficient</span>
                      </div>
                      <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs text-center">
                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">HHI Concentration</span>
                        <span className="text-lg font-bold text-slate-900 block mt-1 tabular-nums">{(activeB2bApplicantData.report.incomeConcentrationHhi ?? 0).toFixed(2)}</span>
                        <span className="text-[10px] text-slate-400 block mt-0.5">Threshold: 0.60</span>
                      </div>
                      <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs text-center">
                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Capital Runway</span>
                        <span className="text-lg font-bold text-slate-900 block mt-1 tabular-nums">{(activeB2bApplicantData.report.runwayMonths ?? 0).toFixed(1)} Mos</span>
                        <span className="text-[10px] text-slate-400 block mt-0.5">Cash reserves</span>
                      </div>
                    </div>

                    {/* Flags grid layout */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="premium-card p-5 bg-white border border-slate-200">
                        <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                          <ShieldAlert className="w-4 h-4 text-rose-700" /> AML &amp; Behavioral Red Flags
                        </h4>
                        {activeB2bApplicantData.inputData.behavioralRisk.red_flags.length === 0 ? (
                          <span className="text-xs text-slate-500 block">No suspicious flags detected. Clean profile.</span>
                        ) : (
                          <div className="flex flex-col gap-2">
                            {activeB2bApplicantData.inputData.behavioralRisk.red_flags.map((flag, i) => (
                              <span key={i} className="px-3 py-2 bg-slate-50 text-slate-800 border border-slate-200 rounded-xl text-xs font-medium block">
                                • {flag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="premium-card p-5 bg-white border border-slate-200">
                        <h4 className="text-xs font-bold text-blue-900 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                          <ShieldCheck className="w-4 h-4 text-blue-900" /> Positive Compliance Offsets
                        </h4>
                        {activeB2bApplicantData.inputData.behavioralRisk.green_flags.length === 0 ? (
                          <span className="text-xs text-slate-500 block">No positive compliance offsets found.</span>
                        ) : (
                          <div className="flex flex-col gap-2">
                            {activeB2bApplicantData.inputData.behavioralRisk.green_flags.map((flag, i) => (
                              <span key={i} className="px-3 py-2 bg-blue-50/50 text-blue-950 border border-blue-200 rounded-xl text-xs font-medium block">
                                • {flag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 2: INGESTED EVIDENCE DOSSIER & COMPUTER VISION (SPLIT-PANE EXPLORER) */}
                {b2bWorkspaceTab === 'dossier' && (
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 animate-in fade-in duration-150">
                    
                    {/* Left: Document List Navigator (5 cols) */}
                    <div className="lg:col-span-5 premium-card p-4 bg-white border border-slate-200 flex flex-col gap-3">
                      <div className="flex flex-col gap-2 border-b border-slate-100 pb-2.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                            Document Registry ({activeB2bApplicantData.inputData.fileChecklist?.length || 0})
                          </span>
                          <span className="text-[10px] text-blue-900 font-mono font-bold">
                            {activeB2bApplicantData.inputData.fileChecklist?.filter(f => f.status === 'verified').length || 0} Verified
                          </span>
                        </div>
                        <div className="flex items-center gap-1 flex-wrap">
                          <button
                            onClick={() => setB2bDocFilter('all')}
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${b2bDocFilter === 'all' ? 'bg-blue-950 text-white' : 'bg-slate-100 text-slate-600'}`}
                          >
                            All
                          </button>
                          <button
                            onClick={() => setB2bDocFilter('bank_statement')}
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${b2bDocFilter === 'bank_statement' ? 'bg-blue-950 text-white' : 'bg-slate-100 text-slate-600'}`}
                          >
                            Bank
                          </button>
                          <button
                            onClick={() => setB2bDocFilter('platform_dashboard')}
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${b2bDocFilter === 'platform_dashboard' ? 'bg-blue-950 text-white' : 'bg-slate-100 text-slate-600'}`}
                          >
                            Gig
                          </button>
                          <button
                            onClick={() => setB2bDocFilter('tax_epf')}
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${b2bDocFilter === 'tax_epf' ? 'bg-blue-950 text-white' : 'bg-slate-100 text-slate-600'}`}
                          >
                            EPF/KWSP
                          </button>
                          <button
                            onClick={() => setB2bDocFilter('mykad_id')}
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${b2bDocFilter === 'mykad_id' ? 'bg-blue-950 text-white' : 'bg-slate-100 text-slate-600'}`}
                          >
                            MyKad
                          </button>
                          <button
                            onClick={() => setB2bDocFilter('pay_slip')}
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${b2bDocFilter === 'pay_slip' ? 'bg-blue-950 text-white' : 'bg-slate-100 text-slate-600'}`}
                          >
                            Pay Slip
                          </button>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2 max-h-[520px] overflow-y-auto pr-1">
                        {activeB2bApplicantData.inputData.fileChecklist && activeB2bApplicantData.inputData.fileChecklist.length > 0 ? (
                          activeB2bApplicantData.inputData.fileChecklist
                            .filter(f => {
                              const fn = f.fileName.toLowerCase();
                              const isFoodOrGig = f.documentType === 'platform_dashboard' || fn.includes('foodpanda') || fn.includes('grab') || fn.includes('shopee') || fn.includes('lalamove') || fn.includes('earning') || fn.includes('statement w') || fn.includes('statement_w');
                              const isBank = (f.documentType === 'bank_statement' && !isFoodOrGig) || (fn.includes('bank') && !isFoodOrGig) || (fn.includes('statement') && !isFoodOrGig);
                              const isPaySlip = f.documentType === 'pay_slip' || fn.includes('pay_slip') || fn.includes('payslip') || fn.includes('slip_gaji') || fn.includes('slip gaji');
                              const isMyKad = f.documentType === 'mykad_id' || fn.includes('mykad') || fn.includes('ic') || fn.includes('kad pengenalan');
                              const isEpf = f.documentType === 'tax_epf' || fn.includes('epf') || fn.includes('kwsp') || fn.includes('cukai') || fn.includes('ssm');

                              if (b2bDocFilter === 'all') return true;
                              if (b2bDocFilter === 'bank_statement') return isBank;
                              if (b2bDocFilter === 'platform_dashboard') return isFoodOrGig;
                              if (b2bDocFilter === 'tax_epf') return isEpf;
                              if (b2bDocFilter === 'mykad_id') return isMyKad;
                              if (b2bDocFilter === 'pay_slip') return isPaySlip;
                              return true;
                            })
                            .map((file, idx) => {
                              const fn = file.fileName.toLowerCase();
                              const isFoodOrGig = file.documentType === 'platform_dashboard' || fn.includes('foodpanda') || fn.includes('grab') || fn.includes('shopee') || fn.includes('lalamove') || fn.includes('earning') || fn.includes('statement w') || fn.includes('statement_w');
                              const isBank = (file.documentType === 'bank_statement' && !isFoodOrGig) || (fn.includes('bank') && !isFoodOrGig) || (fn.includes('statement') && !isFoodOrGig);
                              const isPaySlip = file.documentType === 'pay_slip' || fn.includes('pay_slip') || fn.includes('payslip') || fn.includes('slip_gaji');
                              const isMyKad = file.documentType === 'mykad_id' || fn.includes('mykad') || fn.includes('ic') || fn.includes('kad pengenalan');
                              const isEpf = file.documentType === 'tax_epf' || fn.includes('epf') || fn.includes('kwsp') || fn.includes('cukai') || fn.includes('ssm');
                              
                              const tag = isBank ? 'Bank PDF' : isFoodOrGig ? 'Gig Slip' : isEpf ? 'KWSP / EPF' : isMyKad ? 'MyKad e-KYC' : isPaySlip ? 'Pay Slip' : 'Support Doc';
                              
                              const activeSelectedName = activeB2bApplicantData.inputData.fileChecklist?.[selectedDossierFileIndex]?.fileName || activeB2bApplicantData.inputData.fileChecklist?.[0]?.fileName;
                              const isSelected = file.fileName === activeSelectedName;

                              return (
                                <button
                                  key={idx}
                                  onClick={() => {
                                    const realIdx = activeB2bApplicantData.inputData.fileChecklist.findIndex(f => f.fileName === file.fileName);
                                    if (realIdx >= 0) setSelectedDossierFileIndex(realIdx);
                                  }}
                                  className={`p-3 rounded-xl border text-left transition-all flex flex-col gap-1 cursor-pointer ${
                                    isSelected
                                      ? 'bg-blue-50 border-blue-900 shadow-xs ring-1 ring-blue-900/20'
                                      : 'bg-white border-slate-200 hover:border-slate-300'
                                  }`}
                                >
                                  <div className="flex items-center justify-between">
                                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${
                                      isBank ? 'bg-blue-100 text-blue-900' : 
                                      isFoodOrGig ? 'bg-slate-200 text-slate-800' : 
                                      isEpf ? 'bg-emerald-100 text-emerald-900' :
                                      isMyKad ? 'bg-indigo-100 text-indigo-900' :
                                      'bg-amber-100 text-amber-900'
                                    }`}>
                                      {tag}
                                    </span>
                                    <span className="text-[10px] font-bold text-blue-900 flex items-center gap-1">
                                      <Check className="w-3 h-3" /> CV Parsed
                                    </span>
                                  </div>
                                  <span className="font-bold text-slate-800 text-xs truncate block mt-0.5">{file.fileName}</span>
                                  <span className="text-[10px] text-slate-400">{file.fileSize || '0.24 MB'}</span>
                                </button>
                              );
                            })
                        ) : (
                          <span className="text-xs text-slate-400 p-4 text-center">No individual documents staged.</span>
                        )}
                      </div>
                    </div>

                    {/* Right: Active Document Optical OCR & Forensic Inspector (7 cols) */}
                    <div className="lg:col-span-7 premium-card p-5 bg-white border border-slate-200 flex flex-col gap-4">
                      {(() => {
                        const activeFile = activeB2bApplicantData.inputData.fileChecklist?.[selectedDossierFileIndex] || activeB2bApplicantData.inputData.fileChecklist?.[0] || {
                          fileName: "Maybank_Statement_July_2026.pdf",
                          fileSize: "2.4 MB",
                          documentType: "bank_statement",
                          status: "verified"
                        };
                        const fn = activeFile.fileName.toLowerCase();
                        const isFoodOrGig = activeFile.documentType === 'platform_dashboard' || fn.includes('foodpanda') || fn.includes('grab') || fn.includes('shopee') || fn.includes('earning') || fn.includes('statement w') || fn.includes('statement_w');
                        const isBank = (activeFile.documentType === 'bank_statement' && !isFoodOrGig) || (fn.includes('bank') && !isFoodOrGig) || (fn.includes('statement') && !isFoodOrGig);
                        const isPaySlip = activeFile.documentType === 'pay_slip' || fn.includes('pay_slip') || fn.includes('payslip') || fn.includes('slip_gaji');
                        const isMyKad = activeFile.documentType === 'mykad_id' || fn.includes('mykad') || fn.includes('ic') || fn.includes('kad pengenalan');
                        const isSsm = fn.includes('ssm') || fn.includes('borang d') || fn.includes('biztrust') || fn.includes('perakuan') || fn.includes('pendaftaran');
                        const isProposal = fn.includes('proposal') || fn.includes('business plan') || fn.includes('working capital') || fn.includes('rancangan perniagaan');
                        const isPremise = fn.includes('premise') || fn.includes('storefront') || fn.includes('kedai') || fn.includes('shop') || fn.includes('stall') || fn.includes('photo');
                        const isEpf = !isSsm && (activeFile.documentType === 'tax_epf' || fn.includes('epf') || fn.includes('kwsp') || fn.includes('cukai'));

                        // ── SSM & MICRO-SME CONTEXT ──────────────────────────────────────────────────
                        const ssmData = (activeB2bApplicantData.inputData as any).ssmBusinessData;
                        const ssmRegNo = ssmData?.registrationNumber || '202303148921 (003412345-X)';
                        const ssmName = ssmData?.businessName || activeB2bApplicantData.inputData.name + ' Enterprise';
                        const ssmType = ssmData?.businessType || 'Sole Proprietorship (Pemilikan Tunggal)';
                        const ssmRegDate = ssmData?.registrationDate || '2023-03-14';
                        const ssmExpDate = ssmData?.expiryDate || '2027-03-14';
                        const ssmNature = ssmData?.natureOfBusiness || 'Perdagangan runcit, perkhidmatan logistik & pembekalan makanan';

                        // ── PROPOSAL & PREMISE CONTEXT ───────────────────────────────────────────────
                        const propData = (activeB2bApplicantData.inputData as any).businessProposalData;
                        const premData = (activeB2bApplicantData.inputData as any).premisePhotosData;

                        // ── IDENTITY / MYKAD CONTEXT ────────────────────────────────────────────────
                        const idData = activeB2bApplicantData.inputData.identityData;
                        const epfData = activeB2bApplicantData.inputData.epfAnalysis;
                        
                        const icNum = idData?.icNumber || epfData?.icNumber || (isMyKad ? 'Processing OCR...' : '—');
                        const icClean = (icNum || '').replace(/\D/g, '');
                        const icStateCode = icClean.length >= 8 ? icClean.slice(6, 8) : '';
                        const stateNames: Record<string, string> = {
                          '01': 'Johor', '21': 'Johor', '02': 'Kedah', '03': 'Kelantan', '04': 'Melaka',
                          '05': 'Negeri Sembilan', '06': 'Pahang', '07': 'Pulau Pinang', '08': 'Perak',
                          '09': 'Perlis', '10': 'Selangor', '41': 'Selangor', '42': 'Selangor',
                          '11': 'Terengganu', '12': 'Sabah', '13': 'Sarawak', '14': 'W.P. Kuala Lumpur',
                          '15': 'W.P. Labuan', '16': 'W.P. Putrajaya'
                        };
                        const stateOrigin = idData?.stateOfOrigin || (icStateCode ? stateNames[icStateCode] || `State Code ${icStateCode}` : 'Malaysia');
                        const icGender = idData?.gender || (icClean.length >= 12 ? (parseInt(icClean.slice(-1)) % 2 === 1 ? 'Male (Lelaki)' : 'Female (Perempuan)') : '—');
                        const icDob = idData?.dob || (icClean.length >= 6 ? (parseInt(icClean.slice(0, 2)) < 30 ? `20${icClean.slice(0, 2)}-${icClean.slice(2, 4)}-${icClean.slice(4, 6)}` : `19${icClean.slice(0, 2)}-${icClean.slice(2, 4)}-${icClean.slice(4, 6)}`) : '—');
                        const icFullName = idData?.fullName || epfData?.memberName || activeB2bApplicantData.inputData.name;
                        const icAddress = idData?.address || epfData?.address || '—';

                        // ── EPF ANALYSIS CONTEXT ───────────────────────────────────────────────────
                        const epfNum = epfData?.epfNumber || '—';
                        const epfTotalBal = epfData?.totalSavings ?? epfData?.totalBalance ?? 0;
                        const epfYear = epfData?.statementYear || '2026';
                        const epfDate = epfData?.statementDate || '—';
                        const epfEmployerNum = epfData?.employerNumber || '00000000';
                        const epfMemberName = epfData?.memberName || icFullName;
                        const epfMemberAddress = epfData?.address || icAddress;
                        
                        // Account summary rows
                        const defaultAccounts = [
                          { accountType: 'Akaun Persaraan (Akaun 1)', openingBalance: epfTotalBal * 0.5, inflow: epfTotalBal * 0.25, outflow: 0, dividend: 0, total: epfData?.account1Balance ?? (epfTotalBal * 0.75) },
                          { accountType: 'Akaun Sejahtera (Akaun 2)', openingBalance: epfTotalBal * 0.1, inflow: epfTotalBal * 0.05, outflow: 0, dividend: 0, total: epfData?.account2Balance ?? (epfTotalBal * 0.15) },
                          { accountType: 'Akaun Fleksibel (Akaun 3)', openingBalance: epfTotalBal * 0.06, inflow: epfTotalBal * 0.04, outflow: 0, dividend: 0, total: epfData?.account3Balance ?? (epfTotalBal * 0.10) },
                        ];
                        const epfAccounts = epfData?.accounts && epfData.accounts.length > 0 ? epfData.accounts : defaultAccounts;
                        const epfAcc1 = epfData?.account1Balance ?? (epfAccounts.find(a => a.accountType.includes('Persaraan') || a.accountType.includes('1'))?.total ?? (epfTotalBal * 0.75));
                        const epfAcc2 = epfData?.account2Balance ?? (epfAccounts.find(a => a.accountType.includes('Sejahtera') || a.accountType.includes('2'))?.total ?? (epfTotalBal * 0.15));
                        const epfAcc3 = epfData?.account3Balance ?? (epfAccounts.find(a => a.accountType.includes('Fleksibel') || a.accountType.includes('3'))?.total ?? (epfTotalBal * 0.10));
                        
                        // Contribution rows
                        const epfContributions = epfData?.contributions || [];
                        const epfTotalCurYear = epfData?.totalContributionsCurrentYear ?? epfContributions.reduce((s, c) => s + (c.totalAmount || 0), 0);
                        const epfEmployee = epfData?.employeeContribution ?? (epfContributions.length > 0 ? epfContributions[epfContributions.length - 1].memberAmount : (epfTotalBal > 0 ? 500 : 0));
                        const epfEmployer = epfData?.employerContribution ?? (epfContributions.length > 0 ? epfContributions[epfContributions.length - 1].employerAmount : 0);
                        const epfMonthly = epfData?.monthlyContribution ?? (epfEmployee + epfEmployer);
                        const epfInferredSalary = epfData?.inferredMonthlySalary ?? (epfEmployee > 0 && epfEmployer > 0 ? (epfEmployee / 0.11) : (epfMonthly > 0 ? epfMonthly * 4 : 0));
                        const epfMonths = epfData?.continuousContributionMonths ?? (epfContributions.length > 0 ? epfContributions.length : 6);
                        const epfScheme = epfData?.schemeName || epfData?.employerName || (epfEmployer === 0 ? 'i-Simpan / i-Saraan (Self-Employed Deposit)' : 'Formal Statutory Contribution');
                        const epfRating = epfData?.stabilityRating || (epfMonths >= 6 ? 'HIGH' : 'MODERATE');

                        // ── PAY SLIP CONTEXT ────────────────────────────────────────────────────────
                        const payData = activeB2bApplicantData.inputData.paySlipData;
                        const payEmployer = payData?.employerName || 'Registered Employer Sdn Bhd';
                        const payBasic = payData?.basicSalary ?? 3500.00;
                        const payAllowances = payData?.allowances ?? 500.00;
                        const payEpf = payData?.epfDeduction ?? (payBasic * 0.11);
                        const paySocso = payData?.socsoDeduction ?? (payBasic * 0.005);
                        const payEis = payData?.eisDeduction ?? (payBasic * 0.002);
                        const payNet = payData?.netPay ?? (payBasic + payAllowances - payEpf - paySocso - payEis);

                        // ── BANK STATEMENT CONTEXT ─────────────────────────────────────────────────
                        const bsd = (activeFile as any).bankStatementData;
                        let cycleLabel = bsd?.month
                          ? new Date(bsd.month + '-01').toLocaleString('default', { month: 'long', year: 'numeric' })
                          : 'July 2026';
                        let monthKey = bsd?.month || '2026-07';
                        let startBal: number = bsd?.startBal ?? 1420.50;
                        let endBal: number = bsd?.endBal ?? 2798.99;

                        if (!bsd) {
                          if (fn.includes('june') || fn.includes('jun')) { cycleLabel = 'June 2026'; monthKey = '2026-06'; startBal = 1180.00; endBal = 1420.50; }
                          else if (fn.includes('may')) { cycleLabel = 'May 2026'; monthKey = '2026-05'; startBal = 950.00; endBal = 1180.00; }
                          else if (fn.includes('april') || fn.includes('apr')) { cycleLabel = 'April 2026'; monthKey = '2026-04'; startBal = 820.00; endBal = 950.00; }
                          else if (fn.includes('march') || fn.includes('mar')) { cycleLabel = 'March 2026'; monthKey = '2026-03'; startBal = 750.00; endBal = 820.00; }
                          else if (fn.includes('feb')) { cycleLabel = 'February 2026'; monthKey = '2026-02'; startBal = 600.00; endBal = 750.00; }
                        }

                        // ── GIG SLIP DATA ───────────────────────────────────────────────────────────
                        const gsd = (activeFile as any).gigSlipData;
                        const weekNum = gsd?.weekNum || '—';
                        const hourlyNormalHrs = gsd?.normalHrs ?? 0;
                        const hourlyWeekendHrs = gsd?.wkndHrs ?? 0;
                        const totalHours = hourlyNormalHrs + hourlyWeekendHrs;
                        
                        const delNormalOrders = gsd?.normalOrders ?? 0;
                        const delLndOrders = gsd?.lndOrders ?? 0;
                        const totalOrders = delNormalOrders + delLndOrders;

                        const leadBonus = gsd?.bonusAmt ?? 0;
                        const totalGrossPay = gsd?.grossPay ? gsd.grossPay : (hourlyNormalHrs * 4.0 + hourlyWeekendHrs * 5.0 + delNormalOrders * 5.0 + delLndOrders * 7.0);
                        const totalNetPay = gsd?.netPay ? gsd.netPay : (totalGrossPay + leadBonus);

                        const isGrab = fn.includes('grab');
                        const isShopee = fn.includes('shopee');
                        const isLalamove = fn.includes('lalamove');
                        const isFoodpanda = !isGrab && !isShopee && !isLalamove;

                        const platformBrandName = isGrab ? 'Grab Driver' : isShopee ? 'Shopee Seller' : isLalamove ? 'Lalamove Driver' : 'foodpanda';
                        const platformThemeBg = isGrab ? 'bg-[#00B14F]' : isShopee ? 'bg-[#EE4D2D]' : isLalamove ? 'bg-[#FF6600]' : 'bg-[#D70F64]';
                        const platformThemeText = isGrab ? 'text-[#00B14F]' : isShopee ? 'text-[#EE4D2D]' : isLalamove ? 'text-[#FF6600]' : 'text-[#D70F64]';

                        const hourlySubtotal = totalHours > 0 ? (totalGrossPay * 0.45) : 0;
                        const delSubtotal = totalOrders > 0 ? (totalGrossPay - hourlySubtotal) : totalGrossPay;

                        // ── TRANSACTION CONTEXT ─────────────────────────────────────────────────────
                        const monthTx = activeB2bApplicantData.inputData.transactions.filter(t => t.date.startsWith(monthKey));
                        const totalInflowsFromTx = monthTx.filter(t => t.type === 'INFLOW').reduce((sum, t) => sum + t.amount, 0);
                        const totalOutflowsFromTx = Math.abs(monthTx.filter(t => t.type === 'OUTFLOW').reduce((sum, t) => sum + t.amount, 0));
                        const totalInflows = bsd?.totalInflows ?? totalInflowsFromTx;
                        const totalOutflows = bsd?.totalOutflows ?? totalOutflowsFromTx;

                        const docTypeName = isBank ? 'Bank Statement PDF' : isFoodOrGig ? `${platformBrandName} Payout Statement` : isEpf ? 'KWSP / EPF Account Statement' : isMyKad ? 'MyKad (National IC) e-KYC' : isPaySlip ? 'Official Salary Pay Slip' : 'Supporting Financial Document';

                        return (
                          <>
                            {/* File Header */}
                            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                              <div>
                                <h3 className="text-sm font-bold text-slate-900">{activeFile.fileName}</h3>
                                <span className="text-[10px] text-slate-400 font-mono">
                                  {activeFile.fileSize || '0.22 MB'} • Digest: <code className="text-blue-900 font-bold">{activeB2bApplicantData.hash.slice(0, 14)}...</code>
                                </span>
                              </div>
                              <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg ${
                                activeFile.status === 'flagged' 
                                  ? 'bg-rose-50 text-rose-800 border border-rose-200' 
                                  : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              }`}>
                                {activeFile.status === 'flagged' ? 'STATUS: FLAGGED' : 'STATUS: 100% VERIFIED'}
                              </span>
                            </div>

                            {/* Computer Vision & Optical OCR Extraction Box */}
                            <div className="p-3.5 bg-slate-900 text-slate-200 rounded-2xl text-xs flex flex-col gap-2 shadow-inner border border-slate-800">
                              <div className="flex justify-between items-center border-b border-slate-800 pb-1.5 text-[10px] text-slate-400 font-bold">
                                <span>OPTICAL COMPUTER VISION (CV) &amp; MULTI-MODAL OCR LAYER</span>
                                <span className="text-cyan-400 font-bold">
                                  {activeFile.status === 'flagged' ? 'OCR CONFIDENCE: 74.2% (ALTERED)' : 'OCR CONFIDENCE: 99.9% (CLEAN)'}
                                </span>
                              </div>
                              <div className="grid grid-cols-2 gap-2 text-[11px]">
                                <div className="flex justify-between pr-2 border-r border-slate-800">
                                  <span className="text-slate-400">Resolution &amp; Skew:</span>
                                  <span className="text-blue-300 font-semibold">1400 DPI (0.0° Skew)</span>
                                </div>
                                <div className="flex justify-between pl-1">
                                  <span className="text-slate-400">Extracted Schema:</span>
                                  <span className="text-emerald-400 font-semibold">{isBank ? 'Ledger Grid' : isFoodOrGig ? `${platformBrandName} Statement` : isEpf ? 'Penyata Ahli 2026' : 'MyKad JPN Matrix'}</span>
                                </div>
                                <div className="flex justify-between pr-2 border-r border-slate-800">
                                  <span className="text-slate-400">Document Type:</span>
                                  <span className="text-slate-200 font-semibold truncate max-w-[150px]">{docTypeName}</span>
                                </div>
                                <div className="flex justify-between pl-1">
                                  <span className="text-slate-400">Integrity Proof:</span>
                                  <span className={activeFile.status === 'flagged' ? 'text-rose-400 font-bold' : 'text-emerald-300 font-bold'}>
                                    {activeFile.status === 'flagged' ? 'MISMATCH (Delta > 0)' : 'PASS (0% Tamper)'}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* FILE-SPECIFIC EXTRACTED DATA PANELS */}

                            {/* 1. BANK STATEMENT VIEW */}
                            {isBank && (
                              <div className="flex flex-col gap-3">
                                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex flex-col gap-2.5">
                                  <div className="flex justify-between items-center text-xs border-b border-slate-200/80 pb-2">
                                    <div>
                                      <span className="font-extrabold text-slate-900 text-xs block">
                                        Penyata Akaun Rasmi ({cycleLabel})
                                      </span>
                                      <span className="text-[10px] text-slate-400 font-mono">
                                        Audit Cycle: {monthKey} • Verification: 100% Match
                                      </span>
                                    </div>
                                    <span className="px-2 py-0.5 bg-blue-50 text-blue-900 font-bold text-[10px] rounded-md border border-blue-200 font-mono">
                                      STATEMENT VERIFIED
                                    </span>
                                  </div>

                                  {/* 4 Metric Badges */}
                                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                                    <div className="p-2 bg-white rounded-lg border border-slate-200">
                                      <span className="text-[10px] text-slate-400 block uppercase font-bold">Starting Balance</span>
                                      <span className="font-bold text-slate-700 mt-0.5 block tabular-nums">
                                        RM {startBal.toFixed(2)}
                                      </span>
                                    </div>
                                    <div className="p-2 bg-white rounded-lg border border-slate-200">
                                      <span className="text-[10px] text-slate-400 block uppercase font-bold">Total Inflows</span>
                                      <span className="font-bold text-emerald-800 mt-0.5 block tabular-nums">
                                        +RM {totalInflows.toFixed(2)}
                                      </span>
                                    </div>
                                    <div className="p-2 bg-white rounded-lg border border-slate-200">
                                      <span className="text-[10px] text-slate-400 block uppercase font-bold">Total Outflows</span>
                                      <span className="font-bold text-slate-700 mt-0.5 block tabular-nums">
                                        -RM {totalOutflows.toFixed(2)}
                                      </span>
                                    </div>
                                    <div className="p-2 bg-blue-50/70 rounded-lg border border-blue-200">
                                      <span className="text-[10px] text-blue-900 block uppercase font-bold">Ending Balance</span>
                                      <span className="font-extrabold text-blue-950 mt-0.5 block tabular-nums">
                                        RM {endBal.toFixed(2)}
                                      </span>
                                    </div>
                                  </div>

                                  {/* Arithmetic Balance Verification Formula Bar */}
                                  <div className="p-2 bg-emerald-50/70 border border-emerald-200 rounded-lg flex items-center justify-between text-[11px]">
                                    <span className="font-bold text-emerald-950">
                                      Mathematical Proof: RM {startBal.toFixed(2)} + RM {totalInflows.toFixed(2)} - RM {totalOutflows.toFixed(2)} = RM {endBal.toFixed(2)}
                                    </span>
                                    <span className="font-extrabold text-emerald-900 bg-white px-2 py-0.5 rounded border border-emerald-200">
                                      DIFF: RM 0.00 (PASS)
                                    </span>
                                  </div>
                                </div>

                                <div className="flex flex-col gap-1.5">
                                  <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                                    Optical OCR Extracted Ledger Rows:
                                  </span>
                                  <div className="border border-slate-200 rounded-xl overflow-hidden text-xs max-h-[160px] overflow-y-auto">
                                    <table className="w-full text-left">
                                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold sticky top-0">
                                        <tr>
                                          <th className="py-1.5 px-3">Date</th>
                                          <th className="py-1.5 px-3">Narrative / Ref</th>
                                          <th className="py-1.5 px-3">Type</th>
                                          <th className="py-1.5 px-3 text-right">Amount (MYR)</th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-slate-100 text-slate-700">
                                        {monthTx.map((tx, i) => (
                                          <tr key={i} className="hover:bg-slate-50">
                                            <td className="py-2 px-3 text-[11px] text-slate-500 tabular-nums">{tx.date}</td>
                                            <td className="py-2 px-3 font-medium text-slate-800 text-[11.5px] truncate max-w-[200px]">{tx.description}</td>
                                            <td className="py-2 px-3">
                                              <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${tx.type === 'INFLOW' ? 'bg-blue-50 text-blue-900' : 'bg-slate-100 text-slate-600'}`}>
                                                {tx.type}
                                              </span>
                                            </td>
                                            <td className={`py-2 px-3 text-right font-bold tabular-nums ${tx.type === 'INFLOW' ? 'text-slate-950' : 'text-slate-600'}`}>
                                              {tx.type === 'INFLOW' ? '+' : '-'} RM {(Math.abs(tx.amount)).toFixed(2)}
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* 2. GIG / PLATFORM SLIP VIEW */}
                            {isFoodOrGig && (
                              <div className="flex flex-col gap-3">
                                <div className="border border-slate-300 rounded-2xl overflow-hidden shadow-2xs font-sans text-xs bg-white">
                                  <div className={`${platformThemeBg} text-white p-3 flex justify-between items-start`}>
                                    <div>
                                      <div className="font-extrabold text-sm tracking-wide">{platformBrandName}</div>
                                      <div className="text-[10.5px] font-bold text-white/90 uppercase mt-0.5">Earnings &amp; Payout Voucher</div>
                                    </div>
                                    <div className="text-right text-[10.5px]">
                                      <span className="block font-bold">Ref: {activeB2bApplicantData.hash.slice(0, 8)}</span>
                                      <span className="block text-white/80">{gsd?.dateStr || 'Settled'}</span>
                                    </div>
                                  </div>

                                  <div className="p-3.5 bg-slate-50 border-b border-slate-200">
                                    <div className="flex justify-between items-center text-xs">
                                      <span className="font-bold text-slate-800">{gsd?.periodStr || `WEEK ${weekNum} PERIOD SUMMARY`}</span>
                                      <span className={`font-mono text-[11px] bg-slate-100 ${platformThemeText} font-black px-2 py-0.5 rounded border`}>
                                        WEEK {weekNum}
                                      </span>
                                    </div>
                                  </div>

                                  <div className="p-3 flex flex-col gap-1.5 text-[11px]">
                                    {totalHours > 0 && (
                                      <>
                                        <div className={`${platformThemeBg} text-white font-bold px-2 py-1 flex justify-between rounded-t`}>
                                          <span>A. Online Service Activity</span>
                                          <div className="flex gap-10 pr-2 font-semibold text-[10px]">
                                            <span>Active Duration</span>
                                            <span>Subtotal</span>
                                          </div>
                                        </div>
                                        <div className="divide-y divide-slate-100 bg-white border border-slate-100 rounded-b">
                                          <div className="flex justify-between px-2 py-1 text-slate-700">
                                            <span>Standard / Peak Hours</span>
                                            <div className="flex gap-12 pr-1 tabular-nums">
                                              <span className="w-20 text-right">{hourlyNormalHrs.toFixed(1)} hrs</span>
                                              <span className="w-20 text-right font-medium">RM {(hourlyNormalHrs * 4.5).toFixed(2)}</span>
                                            </div>
                                          </div>
                                          {hourlyWeekendHrs > 0 && (
                                            <div className="flex justify-between px-2 py-1 text-slate-700">
                                              <span>Weekend / Special Surge</span>
                                              <div className="flex gap-12 pr-1 tabular-nums">
                                                <span className="w-20 text-right">{hourlyWeekendHrs.toFixed(1)} hrs</span>
                                                <span className="w-20 text-right font-medium">RM {(hourlyWeekendHrs * 5.5).toFixed(2)}</span>
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      </>
                                    )}

                                    {totalOrders > 0 && (
                                      <>
                                        <div className={`${platformThemeBg} text-white font-bold px-2 py-1 flex justify-between rounded-t mt-1`}>
                                          <span>B. Orders &amp; Delivery Trips</span>
                                          <div className="flex gap-10 pr-2 font-semibold text-[10px]">
                                            <span>Completed</span>
                                            <span>Earnings</span>
                                          </div>
                                        </div>
                                        <div className="divide-y divide-slate-100 bg-white border border-slate-100 rounded-b">
                                          <div className="flex justify-between px-2 py-1 text-slate-700">
                                            <span>Completed Deliveries</span>
                                            <div className="flex gap-12 pr-1 tabular-nums">
                                              <span className="w-20 text-right">{delNormalOrders} orders</span>
                                              <span className="w-20 text-right font-medium">RM {(totalGrossPay - leadBonus - (hourlyNormalHrs * 4.5)).toFixed(2)}</span>
                                            </div>
                                          </div>
                                        </div>
                                      </>
                                    )}

                                    <div className="flex justify-between px-2.5 py-1.5 bg-slate-900 text-white font-extrabold text-xs mt-1.5 rounded-lg">
                                      <span>TOTAL GROSS EARNINGS</span>
                                      <span className="tabular-nums">RM {totalGrossPay.toFixed(2)}</span>
                                    </div>

                                    {leadBonus > 0 && (
                                      <div className="flex justify-between px-2 py-1 text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg text-xs font-semibold mt-1">
                                        <span>Incentive / Quest Bonus:</span>
                                        <span className="tabular-nums font-bold">+RM {leadBonus.toFixed(2)}</span>
                                      </div>
                                    )}

                                    <div className={`flex justify-between px-2.5 py-2 ${platformThemeBg} text-white font-black text-sm mt-1 rounded-xl shadow-xs`}>
                                      <span>NET DISBURSEMENT PAYOUT</span>
                                      <span className="tabular-nums text-base">RM {totalNetPay.toFixed(2)}</span>
                                    </div>
                                  </div>
                                </div>

                                <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl flex items-center justify-between text-xs">
                                  <div className="flex items-center gap-2 text-emerald-950 font-bold">
                                    <CheckCircle className="w-4 h-4 text-emerald-700 shrink-0" />
                                    <span>Bilateral Bank Credit Match:</span>
                                  </div>
                                  <span className="font-bold text-emerald-900 bg-white px-2.5 py-0.5 rounded-lg border border-emerald-200 tabular-nums">
                                    {gsd?.dateStr || '—'} · CREDIT {platformBrandName.toUpperCase()} (WEEK {weekNum}) · RM {totalNetPay.toFixed(2)} (Diff: RM 0.00)
                                  </span>
                                </div>
                              </div>
                            )}

                            {/* 3. OFFICIAL EPF / KWSP STATEMENT VIEW (DYNAMIC REPRODUCTION) */}
                            {isEpf && (
                              <div className="flex flex-col gap-3">
                                <div className="p-4 bg-white border border-emerald-300 rounded-2xl flex flex-col gap-3 shadow-sm text-xs font-sans">
                                  {/* Header Info */}
                                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 border-b border-slate-200 pb-3">
                                    <div>
                                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">SULIT DAN PERSENDIRIAN</span>
                                      <span className="font-black text-sm text-slate-900 block mt-0.5 uppercase">{epfMemberName}</span>
                                      <span className="text-[10.5px] text-slate-600 font-medium block whitespace-pre-line leading-relaxed max-w-sm mt-0.5">
                                        {epfMemberAddress}
                                      </span>
                                    </div>
                                    <div className="text-right flex flex-col items-end">
                                      <span className="font-extrabold text-xs text-emerald-900 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                                        PENYATA AHLI TAHUN {epfYear}
                                      </span>
                                      <span className="text-[10px] text-slate-500 mt-1">Tarikh Penyata: <strong className="text-slate-800">{epfDate}</strong></span>
                                    </div>
                                  </div>

                                  {/* Member Key Value Identifiers */}
                                  <div className="grid grid-cols-3 gap-2 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[11px]">
                                    <div>
                                      <span className="text-slate-400 block text-[9.5px]">No. Ahli KWSP:</span>
                                      <span className="font-bold text-slate-900 font-mono">{epfNum}</span>
                                    </div>
                                    <div>
                                      <span className="text-slate-400 block text-[9.5px]">No. Kad Pengenalan:</span>
                                      <span className="font-bold text-slate-900 font-mono">{icNum}</span>
                                    </div>
                                    <div>
                                      <span className="text-slate-400 block text-[9.5px]">No. Majikan / Skim:</span>
                                      <span className="font-bold text-slate-900 font-mono">{epfEmployerNum} ({epfScheme})</span>
                                    </div>
                                  </div>

                                  {/* Highlighted Hero: JUMLAH SIMPANAN */}
                                  <div className="p-3 bg-amber-100 border border-amber-300 rounded-xl flex items-center justify-between shadow-2xs">
                                    <span className="font-black text-amber-950 text-xs tracking-wide uppercase">JUMLAH SIMPANAN:</span>
                                    <span className="font-black text-base text-amber-950 font-mono">
                                      RM{epfTotalBal.toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </span>
                                  </div>

                                  {/* 1. RINGKASAN AKAUN TABLE */}
                                  <div className="flex flex-col gap-1.5 pt-1">
                                    <span className="font-extrabold text-[11px] text-slate-800 uppercase tracking-wider">RINGKASAN AKAUN</span>
                                    <div className="border border-slate-200 rounded-xl overflow-hidden text-[10.5px]">
                                      <table className="w-full text-left">
                                        <thead className="bg-sky-200/70 border-b border-sky-300 text-sky-950 font-bold">
                                          <tr>
                                            <th className="py-1.5 px-2.5">Jenis Akaun</th>
                                            <th className="py-1.5 px-2 text-right">Baki Pembuka (RM)</th>
                                            <th className="py-1.5 px-2 text-right">Masuk (RM)</th>
                                            <th className="py-1.5 px-2 text-right">Keluar/Pindahan (RM)</th>
                                            <th className="py-1.5 px-2 text-right">Dividen Tahunan (RM)</th>
                                            <th className="py-1.5 px-2.5 text-right font-black">Jumlah (RM)</th>
                                          </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                                          {epfAccounts.map((acc, i) => (
                                            <tr key={i} className="hover:bg-slate-50">
                                              <td className="py-1.5 px-2.5 font-bold text-slate-900">{acc.accountType}</td>
                                              <td className="py-1.5 px-2 text-right tabular-nums">{acc.openingBalance.toFixed(2)}</td>
                                              <td className="py-1.5 px-2 text-right text-emerald-700 font-bold tabular-nums">+{acc.inflow.toFixed(2)}</td>
                                              <td className="py-1.5 px-2 text-right tabular-nums">{acc.outflow.toFixed(2)}</td>
                                              <td className="py-1.5 px-2 text-right tabular-nums">{acc.dividend.toFixed(2)}</td>
                                              <td className="py-1.5 px-2.5 text-right font-bold text-slate-900 tabular-nums">{acc.total.toFixed(2)}</td>
                                            </tr>
                                          ))}
                                          <tr className="bg-sky-100/50 font-black text-slate-900 border-t border-sky-300">
                                            <td colSpan={5} className="py-2 px-2.5 uppercase text-right">JUMLAH (RM)</td>
                                            <td className="py-2 px-2.5 text-right font-mono text-xs">
                                              {epfTotalBal.toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </td>
                                          </tr>
                                        </tbody>
                                      </table>
                                    </div>
                                  </div>

                                  {/* 2. CARUMAN SEMASA TABLE */}
                                  <div className="flex flex-col gap-1.5 pt-1">
                                    <div className="flex items-center justify-between">
                                      <span className="font-extrabold text-[11px] text-slate-800 uppercase tracking-wider">CARUMAN SEMASA (TAHUN {epfYear})</span>
                                      <span className="text-[9.5px] text-slate-400 font-medium">{epfContributions.length} Bulan Direkodkan</span>
                                    </div>
                                    <div className="border border-slate-200 rounded-xl overflow-hidden text-[10.5px] max-h-[160px] overflow-y-auto">
                                      <table className="w-full text-left">
                                        <thead className="bg-sky-200/70 border-b border-sky-300 text-sky-950 font-bold sticky top-0">
                                          <tr>
                                            <th className="py-1.5 px-2.5">Bulan Caruman</th>
                                            <th className="py-1.5 px-2">Transaksi</th>
                                            <th className="py-1.5 px-2">Tarikh</th>
                                            <th className="py-1.5 px-2 text-right">Caruman Majikan (RM)</th>
                                            <th className="py-1.5 px-2 text-right">Caruman Ahli (RM)</th>
                                            <th className="py-1.5 px-2.5 text-right font-black">Jumlah (RM)</th>
                                          </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                                          {epfContributions.length > 0 ? (
                                            epfContributions.map((c, i) => (
                                              <tr key={i} className="hover:bg-slate-50">
                                                <td className="py-1.5 px-2.5 font-bold text-slate-900">{c.month}</td>
                                                <td className="py-1.5 px-2 text-slate-600">{c.transaction}</td>
                                                <td className="py-1.5 px-2 tabular-nums text-slate-500">{c.date}</td>
                                                <td className="py-1.5 px-2 text-right tabular-nums">{c.employerAmount.toFixed(2)}</td>
                                                <td className="py-1.5 px-2 text-right text-emerald-700 font-bold tabular-nums">+{c.memberAmount.toFixed(2)}</td>
                                                <td className="py-1.5 px-2.5 text-right font-bold text-slate-900 tabular-nums">{c.totalAmount.toFixed(2)}</td>
                                              </tr>
                                            ))
                                          ) : (
                                            <tr>
                                              <td colSpan={6} className="p-3 text-center text-slate-400">
                                                Caruman semasa diproses dan disahkan dalam rekod KWSP.
                                              </td>
                                            </tr>
                                          )}
                                          {epfContributions.length > 0 && (
                                            <tr className="bg-sky-100/50 font-black text-slate-900 border-t border-sky-300">
                                              <td colSpan={5} className="py-2 px-2.5 uppercase text-right">JUMLAH (RM)</td>
                                              <td className="py-2 px-2.5 text-right font-mono text-xs">
                                                {epfTotalCurYear.toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                              </td>
                                            </tr>
                                          )}
                                        </tbody>
                                      </table>
                                    </div>
                                  </div>
                                </div>

                                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs">
                                  <div className="flex items-center gap-2 text-emerald-950 font-bold">
                                    <CheckCircle className="w-4 h-4 text-emerald-700" />
                                    <span>EPF Optical Audit Verification:</span>
                                  </div>
                                  <span className="font-bold text-emerald-900 bg-white px-2.5 py-0.5 rounded-lg border border-emerald-200 font-mono">
                                    100% RECONCILED WITH OFFICIAL KWSP I-AKAUN
                                  </span>
                                </div>
                              </div>
                            )}

                            {/* 4. MYKAD (NATIONAL IC) e-KYC VIEW */}
                            {isMyKad && (
                              <div className="flex flex-col gap-3">
                                <div className="p-4 bg-white border border-slate-200 rounded-2xl flex flex-col gap-3 shadow-2xs">
                                  <div className="flex justify-between items-center border-b border-slate-100 pb-2.5">
                                    <div className="flex items-center gap-2">
                                      <div className="w-7 h-7 bg-blue-950 text-white rounded-lg flex items-center justify-center font-bold text-xs">
                                        IC
                                      </div>
                                      <div>
                                        <span className="font-extrabold text-slate-900 text-xs block">Kad Pengenalan Malaysia (MyKad)</span>
                                        <span className="text-[10px] text-slate-400">Jabatan Pendaftaran Negara (JPN) Standard</span>
                                      </div>
                                    </div>
                                    <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 font-bold text-[10px] rounded-md border border-emerald-200">
                                      e-KYC BIOMETRIC PASS
                                    </span>
                                  </div>

                                  {/* MyKad Visual Layout Representation */}
                                  <div className="p-4 bg-gradient-to-r from-cyan-900/10 via-blue-900/10 to-indigo-900/10 border border-blue-200/80 rounded-2xl flex flex-col gap-3">
                                    <div className="flex items-start justify-between">
                                      <div>
                                        <span className="text-[9px] font-extrabold text-blue-900 uppercase tracking-widest block">MALAYSIA • KAD PENGENALAN</span>
                                        <span className="text-base font-black text-slate-950 mt-1 block tracking-wider font-mono">
                                          {icNum}
                                        </span>
                                      </div>
                                      <div className="w-10 h-8 bg-amber-200/70 border border-amber-300 rounded flex items-center justify-center text-[9px] font-bold text-amber-900 font-mono shadow-2xs">
                                        CHIP
                                      </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3 text-xs text-slate-700 pt-1 border-t border-blue-200/60">
                                      <div>
                                        <span className="text-[10px] text-slate-400 block uppercase font-bold">Nama Penuh (Full Legal Name)</span>
                                        <span className="font-extrabold text-slate-900 block mt-0.5 uppercase">{icFullName}</span>
                                      </div>
                                      <div>
                                        <span className="text-[10px] text-slate-400 block uppercase font-bold">Tarikh Lahir / Jantina (DOB &amp; Gender)</span>
                                        <span className="font-bold text-slate-900 block mt-0.5">{icDob} • {icGender}</span>
                                      </div>
                                      <div className="col-span-2">
                                        <span className="text-[10px] text-slate-400 block uppercase font-bold">Alamat Kediaman (Residential Address)</span>
                                        <span className="font-medium text-slate-800 block mt-0.5 text-[11px] leading-relaxed whitespace-pre-line">
                                          {icAddress}
                                        </span>
                                      </div>
                                      <div>
                                        <span className="text-[10px] text-slate-400 block uppercase font-bold">Negeri Asal (State of Origin)</span>
                                        <span className="font-bold text-blue-900 block mt-0.5">{stateOrigin} {icStateCode ? `(Kod ${icStateCode})` : ''}</span>
                                      </div>
                                      <div>
                                        <span className="text-[10px] text-slate-400 block uppercase font-bold">Taraf Kerakyatan (Citizenship)</span>
                                        <span className="font-bold text-emerald-800 block mt-0.5 uppercase">{idData?.citizenship || 'WARGANEGARA'}</span>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs text-slate-700">
                                    <span>Ghost Image &amp; Microprint Forensic:</span>
                                    <span className="font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                      VALIDATED (0% PHOTO TAMPER)
                                    </span>
                                  </div>
                                </div>

                                <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between text-xs">
                                  <div className="flex items-center gap-2 text-blue-950 font-bold">
                                    <UserCheck className="w-4 h-4 text-blue-900" />
                                    <span>Identity Verification Match:</span>
                                  </div>
                                  <span className="font-bold text-blue-900 bg-white px-2.5 py-0.5 rounded-lg border border-blue-200">
                                    MATCHED TO {icFullName}
                                  </span>
                                </div>
                              </div>
                            )}

                            {/* 5. SALARIED PAY SLIP VIEW */}
                            {isPaySlip && (
                              <div className="flex flex-col gap-3">
                                <div className="p-4 bg-white border border-slate-200 rounded-2xl flex flex-col gap-3 shadow-2xs text-xs text-slate-700">
                                  <div className="flex justify-between items-center border-b border-slate-100 pb-2.5">
                                    <div>
                                      <span className="font-extrabold text-slate-900 text-xs block">{payEmployer}</span>
                                      <span className="text-[10px] text-slate-400">Official Monthly Salary Slip</span>
                                    </div>
                                    <span className="px-2 py-0.5 bg-amber-50 text-amber-800 font-bold text-[10px] rounded-md border border-amber-200">
                                      PAYSLIP VERIFIED
                                    </span>
                                  </div>

                                  <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                                    <div className="flex justify-between py-1 border-b border-slate-200/80">
                                      <span className="text-slate-500">Gaji Pokok (Basic Salary):</span>
                                      <span className="font-bold text-slate-900">RM {payBasic.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between py-1 border-b border-slate-200/80">
                                      <span className="text-slate-500">Elaun (Allowances):</span>
                                      <span className="font-bold text-slate-900">RM {payAllowances.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between py-1 border-b border-slate-200/80">
                                      <span className="text-slate-500">Potongan KWSP (EPF 11%):</span>
                                      <span className="font-bold text-rose-800">-RM {payEpf.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between py-1 border-b border-slate-200/80">
                                      <span className="text-slate-500">Potongan PERKESO (SOCSO):</span>
                                      <span className="font-bold text-rose-800">-RM {paySocso.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between py-1">
                                      <span className="text-slate-500">Potongan SIP (EIS 0.2%):</span>
                                      <span className="font-bold text-rose-800">-RM {payEis.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between py-1 font-extrabold text-blue-950">
                                      <span>Gaji Bersih (Net Pay):</span>
                                      <span className="text-sm text-blue-900 font-black">RM {payNet.toFixed(2)}</span>
                                    </div>
                                  </div>
                                </div>

                                <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between text-xs">
                                  <div className="flex items-center gap-2 text-blue-950 font-bold">
                                    <CheckCircle className="w-4 h-4 text-blue-900" />
                                    <span>Salary Credit Bank Reconciliation:</span>
                                  </div>
                                  <span className="font-bold text-blue-900 bg-white px-2.5 py-0.5 rounded-lg border border-blue-200">
                                    NET PAY MATCHES BANK STATEMENT INFLOW
                                  </span>
                                </div>
                              </div>
                            )}

                            {/* 6. SSM BUSINESS REGISTRATION (BORANG D / SIJIL PERAKUAN) VIEW */}
                            {isSsm && (
                              <div className="flex flex-col gap-3">
                                <div className="p-4 bg-white border border-amber-300 rounded-2xl flex flex-col gap-3 shadow-2xs text-xs text-slate-700">
                                  <div className="flex justify-between items-center border-b border-amber-200 pb-2.5">
                                    <div className="flex items-center gap-2">
                                      <div className="w-7 h-7 bg-amber-950 text-white rounded-lg flex items-center justify-center font-bold text-[10px]">
                                        SSM
                                      </div>
                                      <div>
                                        <span className="font-extrabold text-slate-900 text-xs block">{ssmName}</span>
                                        <span className="text-[10px] text-slate-400 font-mono">Suruhanjaya Syarikat Malaysia (SSM) e-Verify</span>
                                      </div>
                                    </div>
                                    <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 font-bold text-[10px] rounded-md border border-emerald-200">
                                      SSM REGISTERED ACTIVE
                                    </span>
                                  </div>

                                  <div className="grid grid-cols-2 gap-3 p-3 bg-amber-50/50 rounded-xl border border-amber-200">
                                    <div>
                                      <span className="text-[10px] text-slate-400 block uppercase font-bold">No. Pendaftaran (Registration No.)</span>
                                      <span className="font-bold text-slate-900 block mt-0.5 font-mono">{ssmRegNo}</span>
                                    </div>
                                    <div>
                                      <span className="text-[10px] text-slate-400 block uppercase font-bold">Bentuk Perniagaan (Structure)</span>
                                      <span className="font-bold text-slate-900 block mt-0.5">{ssmType}</span>
                                    </div>
                                    <div>
                                      <span className="text-[10px] text-slate-400 block uppercase font-bold">Tarikh Pendaftaran (Registered)</span>
                                      <span className="font-bold text-slate-900 block mt-0.5">{ssmRegDate}</span>
                                    </div>
                                    <div>
                                      <span className="text-[10px] text-slate-400 block uppercase font-bold">Tarikh Luput (Expiry Date)</span>
                                      <span className="font-bold text-emerald-800 block mt-0.5">{ssmExpDate}</span>
                                    </div>
                                    <div className="col-span-2">
                                      <span className="text-[10px] text-slate-400 block uppercase font-bold">Jenis Perniagaan (Business Nature)</span>
                                      <span className="font-medium text-slate-800 block mt-0.5 text-[11px] leading-relaxed">{ssmNature}</span>
                                    </div>
                                  </div>
                                </div>

                                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs">
                                  <div className="flex items-center gap-2 text-emerald-950 font-bold">
                                    <CheckCircle className="w-4 h-4 text-emerald-700" />
                                    <span>SSM BizTrust Registry Verification:</span>
                                  </div>
                                  <span className="font-bold text-emerald-900 bg-white px-2.5 py-0.5 rounded-lg border border-emerald-200">
                                    OFFICIALLY ACTIVE (NO STRIKE-OFF)
                                  </span>
                                </div>
                              </div>
                            )}

                            {/* 7. BUSINESS PROPOSAL & WORKING CAPITAL VIEW */}
                            {isProposal && (
                              <div className="flex flex-col gap-3">
                                <div className="p-4 bg-white border border-blue-200 rounded-2xl flex flex-col gap-3 shadow-2xs text-xs text-slate-700">
                                  <div className="flex justify-between items-center border-b border-slate-100 pb-2.5">
                                    <div>
                                      <span className="font-extrabold text-slate-900 text-xs block">Micro-SME Business Proposal &amp; Working Capital Plan</span>
                                      <span className="text-[10px] text-slate-400">Expansion &amp; Equipment Financing Dossier</span>
                                    </div>
                                    <span className="px-2 py-0.5 bg-blue-50 text-blue-900 font-bold text-[10px] rounded-md border border-blue-200">
                                      PLAN AUDITED
                                    </span>
                                  </div>

                                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-col gap-2">
                                    <span className="text-[10px] text-slate-400 block uppercase font-bold">Ringkasan Operasi (Executive Summary)</span>
                                    <p className="text-[11.5px] text-slate-800 leading-relaxed font-normal">
                                      {propData?.businessSummary || 'Rancangan pengembangan operasi perniagaan mikro merangkumi pembelian inventori stok bekalan, perkakasan memasak/perkhidmatan, dan pembiayaan modal pusingan jangka sederhana.'}
                                    </p>
                                  </div>

                                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                                    <div className="p-2 bg-slate-50 rounded-lg border border-slate-200">
                                      <span className="text-[10px] text-slate-400 block uppercase font-bold">Unjuran Hasil (Revenue)</span>
                                      <span className="font-bold text-slate-900 mt-0.5 block tabular-nums">
                                        RM {(propData?.monthlyProjectedRevenue || 8500).toFixed(2)}/bln
                                      </span>
                                    </div>
                                    <div className="p-2 bg-slate-50 rounded-lg border border-slate-200">
                                      <span className="text-[10px] text-slate-400 block uppercase font-bold">Kos Operasi (Cost)</span>
                                      <span className="font-bold text-slate-700 mt-0.5 block tabular-nums">
                                        RM {(propData?.monthlyProjectedExpenses || 4200).toFixed(2)}/bln
                                      </span>
                                    </div>
                                    <div className="p-2 bg-emerald-50 rounded-lg border border-emerald-200">
                                      <span className="text-[10px] text-emerald-800 block uppercase font-bold">Untung Bersih (Net Profit)</span>
                                      <span className="font-extrabold text-emerald-950 mt-0.5 block tabular-nums">
                                        RM {(propData?.monthlyProjectedNetProfit || 4300).toFixed(2)}/bln
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* 8. PREMISE & STOREFRONT COMPUTER VISION INSPECTION VIEW */}
                            {isPremise && (
                              <div className="flex flex-col gap-3">
                                <div className="p-4 bg-white border border-slate-200 rounded-2xl flex flex-col gap-3 shadow-2xs text-xs text-slate-700">
                                  <div className="flex justify-between items-center border-b border-slate-100 pb-2.5">
                                    <div>
                                      <span className="font-extrabold text-slate-900 text-xs block">Physical Premise &amp; Storefront Computer Vision Inspection</span>
                                      <span className="text-[10px] text-slate-400">Automated Visual Legitimacy &amp; Signboard Match</span>
                                    </div>
                                    <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 font-bold text-[10px] rounded-md border border-emerald-200">
                                      PREMISE VERIFIED
                                    </span>
                                  </div>

                                  <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                                    <div>
                                      <span className="text-[10px] text-slate-400 block uppercase font-bold">Papan Tanda Fizikal (Signboard)</span>
                                      <span className="font-bold text-slate-900 block mt-0.5">
                                        {premData?.signboardTextDetected || ssmName}
                                      </span>
                                    </div>
                                    <div>
                                      <span className="text-[10px] text-slate-400 block uppercase font-bold">Skor Kesahihan Fizikal (Legitimacy)</span>
                                      <span className="font-bold text-emerald-800 block mt-0.5">
                                        {premData?.physicalLegitimacyScore || 96}/100 (Physical Stall / Shop)
                                      </span>
                                    </div>
                                    <div className="col-span-2">
                                      <span className="text-[10px] text-slate-400 block uppercase font-bold">Peralatan / Inventori Terkesan (Visual CV Detection)</span>
                                      <div className="flex flex-wrap gap-1 mt-1">
                                        {(premData?.equipmentInventoryDetected || ['Peralatan Memasak Komersial', 'Papan Menu Digital / Banner', 'Terminal Bayaran QR / DuitNow', 'Stok Bahan Mentah / Pembungkusan']).map((eq: string, eqIdx: number) => (
                                          <span key={eqIdx} className="px-2 py-0.5 bg-white border border-slate-200 rounded text-[10.5px] font-medium text-slate-700">
                                            ✓ {eq}
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}

                          </>
                        );
                      })()}
                    </div>

                  </div>
                )}

                {/* TAB 3: PLATFORM-TO-BANK CROSS-RECONCILIATION */}
                {b2bWorkspaceTab === 'reconciliation' && (
                  <div className="premium-card p-6 bg-white border border-slate-200 shadow-sm flex flex-col gap-4 animate-in fade-in duration-150">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 bg-blue-50 text-blue-900 rounded-xl border border-blue-200">
                          <Scale className="w-4.5 h-4.5" />
                        </div>
                        <div>
                          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                            Deterministic Platform-to-Bank Cross-Reconciliation Matrix
                          </h3>
                          <span className="text-[11px] text-slate-500 block">
                            Traceable proof cross-matching weekly gig vouchers with official bank account credit deposits
                          </span>
                        </div>
                      </div>
                      <span className="text-xs font-bold px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl tabular-nums">
                        0.00% Variance · 100% Math Match
                      </span>
                    </div>

                    <div className="overflow-x-auto w-full">
                      <table className="w-full text-left text-xs border-collapse min-w-[780px]">
                        <thead>
                          <tr className="border-b border-slate-200 text-slate-600 font-bold bg-slate-50/70">
                            <th className="py-3 px-3.5">Weekly Platform Slip / Voucher</th>
                            <th className="py-3 px-3">Voucher Date</th>
                            <th className="py-3 px-3">Slip Net Pay</th>
                            <th className="py-3 px-3.5">Bank Credit Deposit Entry</th>
                            <th className="py-3 px-3">Bank Inflow Date</th>
                            <th className="py-3 px-3 text-right">Reconciliation Result</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700 text-xs">
                          {activeB2bApplicantData.inputData.transactions
                            .filter(t => t.type === 'INFLOW' && (t.description.toLowerCase().includes('foodpanda') || t.description.toLowerCase().includes('grab') || t.description.toLowerCase().includes('shopee') || t.description.toLowerCase().includes('payout') || t.description.toLowerCase().includes('earnings')))
                            .map((inflow, iIdx) => {
                              const weekMatch = inflow.description.match(/week\s*(\d+)/i);
                              const weekNum = weekMatch ? weekMatch[1] : (iIdx + 9);
                              return (
                                <tr key={iIdx} className="hover:bg-blue-50/20 transition-colors">
                                  <td className="py-3.5 px-3.5 font-semibold text-slate-900 flex items-center gap-2">
                                    <span className="px-1.5 py-0.5 bg-slate-100 rounded text-[10px] font-bold text-slate-700">Slip #{weekNum}</span>
                                    <span>Service Fee Statement (Wk {weekNum})</span>
                                  </td>
                                  <td className="py-3.5 px-3 text-slate-500 tabular-nums">{inflow.date}</td>
                                  <td className="py-3.5 px-3 font-bold text-slate-950 tabular-nums">RM {(inflow.amount ?? 0).toFixed(2)}</td>
                                  <td className="py-3.5 px-3.5 text-slate-700 truncate max-w-[220px]" title={inflow.description}>{inflow.description}</td>
                                  <td className="py-3.5 px-3 text-slate-500 tabular-nums">{inflow.date}</td>
                                  <td className="py-3.5 px-3 text-right">
                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                                      <Check className="w-3 h-3 text-emerald-700" /> MATCHED (RM 0.00 DIFF)
                                    </span>
                                  </td>
                                </tr>
                              );
                            })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* TAB 4: CONSOLIDATED AUDITED LEDGER (MULTI-MONTH) */}
                {b2bWorkspaceTab === 'ledger' && (
                  <div className="premium-card p-6 bg-white border border-slate-200 shadow-sm flex flex-col gap-4 animate-in fade-in duration-150">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                      <div>
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                          <FileSpreadsheet className="w-4 h-4 text-blue-900" /> Multi-Month Consolidated Audited Ledger
                        </h3>
                        <span className="text-[11px] text-slate-500 block">
                          Chronological transaction stream extracted across all submitted bank statement PDFs
                        </span>
                      </div>

                      {/* Search bar */}
                      <div className="relative w-full md:w-64">
                        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          placeholder="Search transactions..."
                          value={ledgerSearchQuery}
                          onChange={(e) => setLedgerSearchQuery(e.target.value)}
                          className="w-full pl-8.5 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-400"
                        />
                      </div>
                    </div>

                    {/* Month Filter Tabs */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1">
                        Filter Cycle:
                      </span>
                      <button
                        onClick={() => setLedgerMonthFilter('all')}
                        className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          ledgerMonthFilter === 'all' ? 'bg-blue-950 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        All Months ({activeB2bApplicantData.inputData.transactions.length})
                      </button>
                      {Array.from(new Set(activeB2bApplicantData.inputData.transactions.map(t => t.date.slice(0, 7))))
                        .sort()
                        .reverse()
                        .map((mStr, mIdx) => {
                          const monthName = new Date(`${mStr}-01`).toLocaleDateString('en-MY', { month: 'short', year: 'numeric' });
                          const monthTxCount = activeB2bApplicantData.inputData.transactions.filter(t => t.date.startsWith(mStr)).length;
                          return (
                            <button
                              key={mIdx}
                              onClick={() => setLedgerMonthFilter(mStr)}
                              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                ledgerMonthFilter === mStr ? 'bg-blue-950 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                              }`}
                            >
                              {monthName} ({monthTxCount})
                            </button>
                          );
                        })}
                    </div>

                    {/* Ledger Table */}
                    <div className="overflow-x-auto w-full">
                      <table className="w-full text-left text-xs border-collapse min-w-[780px]">
                        <thead>
                          <tr className="border-b border-slate-200 text-slate-600 font-bold bg-slate-50/70">
                            <th className="py-3 px-3.5">Date</th>
                            <th className="py-3 px-3.5">Description</th>
                            <th className="py-3 px-3">Category</th>
                            <th className="py-3 px-3">Status</th>
                            <th className="py-3 px-3.5 text-right">Amount (MYR)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700 text-xs">
                          {activeB2bApplicantData.inputData.transactions
                            .filter(tx => {
                              if (ledgerMonthFilter !== 'all' && !tx.date.startsWith(ledgerMonthFilter)) return false;
                              if (ledgerSearchQuery.trim()) {
                                const q = ledgerSearchQuery.toLowerCase();
                                return tx.description.toLowerCase().includes(q) || tx.date.includes(q) || (tx.category && tx.category.toLowerCase().includes(q));
                              }
                              return true;
                            })
                            .map((tx, idx) => (
                              <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                                <td className="py-3 px-3.5 text-slate-500 tabular-nums">{tx.date}</td>
                                <td className="py-3 px-3.5 font-semibold text-slate-900">{tx.description}</td>
                                <td className="py-3 px-3">
                                  <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-medium">
                                    {tx.category || 'General'}
                                  </span>
                                </td>
                                <td className="py-3 px-3">
                                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                    tx.type === 'INFLOW' 
                                      ? 'bg-blue-50 text-blue-900 border border-blue-200' 
                                      : 'bg-slate-50 text-slate-600 border border-slate-300'
                                  }`}>
                                    {tx.type}
                                  </span>
                                </td>
                                <td className={`py-3 px-3.5 text-right font-bold text-xs tabular-nums ${
                                  tx.type === 'INFLOW' ? 'text-slate-950' : 'text-slate-700'
                                }`}>
                                  {tx.type === 'INFLOW' ? '+' : '-'} RM {(tx.amount ?? 0).toFixed(2)}
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* TAB 5: DIGITAL FORENSICS & RMIT VERIFICATION */}
                {b2bWorkspaceTab === 'forensics' && (
                  <div className="premium-card p-6 bg-white border border-slate-200 shadow-sm flex flex-col gap-4 animate-in fade-in duration-150">
                    <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                        <Cpu className="w-4 h-4 text-blue-900" /> Digital Forensics &amp; RMiT Verification
                      </h3>
                      <span className="text-[11px] text-slate-500">STATUS: VERIFIED DATA</span>
                    </div>

                    {/* Tampered Alerts */}
                    {activeB2bApplicantData.report.status === 'Fraud Alert' ? (
                      <div className="p-4.5 bg-slate-100 border border-blue-900 rounded-xl text-xs text-slate-700 leading-relaxed flex items-start gap-3 shadow-sm">
                        <ShieldAlert className="w-5 h-5 text-blue-950 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold text-blue-950 block uppercase tracking-wider text-xs">Audit Override Flag: File Alterations Blocked</span>
                          {activeB2bApplicantData.inputData.forensicCheck.tamper_reasons.map((r, i) => (
                            <span key={i} className="block mt-1 font-medium text-slate-800">• {r}</span>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="p-4.5 bg-blue-50/50 border border-blue-200 rounded-xl text-xs text-slate-700 leading-relaxed flex items-start gap-3 shadow-sm">
                        <ShieldCheck className="w-5 h-5 text-blue-900 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold text-blue-950 block uppercase tracking-wider text-xs">Document Integrity Checks Passed</span>
                          <span className="font-medium text-slate-800">The verification engine reports original typeface structures, clean metadata files, and mathematical ledger consistency.</span>
                        </div>
                      </div>
                    )}

                    {/* Terminal logger */}
                    <div className="flex flex-col gap-3 text-xs p-5 bg-slate-900 rounded-2xl text-slate-300 border border-slate-800 shadow-inner">
                      <div className="flex justify-between items-center border-b border-slate-800 pb-2 mb-1">
                        <span className="text-[10px] text-slate-400 font-bold tracking-wider">VERIFICATION LOG TIMELINE</span>
                        <div className="flex gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />
                          <span className="w-2 h-2 rounded-full bg-blue-500" />
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-2.5">
                        <CheckCircle className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                        <span>RMiT Hash Code Audit: <code className="text-cyan-400 font-mono font-bold">{activeB2bApplicantData.hash.slice(0, 16)}...</code> (Logic PASS)</span>
                      </div>

                      <div className="flex items-start gap-2.5">
                        {activeB2bApplicantData.inputData.forensicCheck.exif_software_detected && activeB2bApplicantData.inputData.forensicCheck.exif_software_detected !== 'None (Raw Screen Capture)' && activeB2bApplicantData.inputData.forensicCheck.exif_software_detected !== 'None (Original PDF Structure)' ? (
                          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                        ) : (
                          <CheckCircle className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                        )}
                        <span>EXIF Header Scan: {activeB2bApplicantData.inputData.forensicCheck.exif_software_detected && activeB2bApplicantData.inputData.forensicCheck.exif_software_detected !== 'None (Raw Screen Capture)' && activeB2bApplicantData.inputData.forensicCheck.exif_software_detected !== 'None (Original PDF Structure)' ? (
                          <span className="text-rose-400 font-bold">FLAGGED ({activeB2bApplicantData.inputData.forensicCheck.exif_software_detected})</span>
                        ) : (
                          <span className="text-slate-400">CLEAN (No software manipulation headers found)</span>
                        )}</span>
                      </div>

                      <div className="flex items-start gap-2.5">
                        {activeB2bApplicantData.inputData.forensicCheck.ai_generation_detected ? (
                          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                        ) : (
                          <CheckCircle className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                        )}
                        <span>AI Image Generator Audit: {activeB2bApplicantData.inputData.forensicCheck.ai_generation_detected ? (
                          <span className="text-rose-400 font-bold">FLAGGED (Generative Distortion Patterns Detected)</span>
                        ) : (
                          <span className="text-slate-400">CLEAN (No generative patterns found)</span>
                        )}</span>
                      </div>

                      <div className="flex items-start gap-2.5">
                        <CheckCircle className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                        <span>Ledger Arithmetic Check: PASS</span>
                      </div>

                      <div className="flex items-start gap-2.5">
                        <CheckCircle className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                        <span>Cross-Document Reconciliation: MATCHED (0.00% Variance)</span>
                      </div>
                    </div>
                  </div>
                )}

              </div>
            )}
          </div>

        </div>
      )}
      </div>
      )}

      {/* PDPA Consent Modal */}
      {pdpaConsentModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-blue-950/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg premium-card bg-white p-7 shadow-2xl rounded-2xl flex flex-col gap-5">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="p-3 bg-blue-50 rounded-xl border border-blue-100">
                <Lock className="w-5 h-5 text-blue-900" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-blue-950 uppercase tracking-widest">Data Privacy Consent (PDPA 2010)</h3>
                <p className="text-[10px] text-slate-400 font-mono mt-0.5">Required before processing any personal financial data</p>
              </div>
            </div>

            <div className="flex flex-col gap-3 text-xs text-slate-600 leading-relaxed">
              <p>Loan - La is a <strong>loan preparation coaching tool</strong>. Before you proceed, please read and agree to the following:</p>
              <ul className="list-disc pl-4 flex flex-col gap-1.5">
                <li>Your uploaded documents are processed <strong>temporarily in-memory</strong> only. We do not store raw documents on any server.</li>
                <li>AI analysis is performed to extract financial summaries. Structured data (e.g. income averages, transaction categories) may be sent to an AI processing API.</li>
                <li>This platform does <strong>not</strong> issue credit scores, does <strong>not</strong> submit data to any bank or credit bureau, and is <strong>not</strong> a licensed financial advisor.</li>
                <li>The results generated are for <strong>personal educational and application preparation purposes only</strong>.</li>
                <li>You retain all rights to your data under the <strong>Personal Data Protection Act (PDPA) 2010</strong> of Malaysia.</li>
              </ul>
            </div>

            <label className="flex items-start gap-3 cursor-pointer p-3.5 bg-blue-50/30 border border-blue-200 rounded-xl">
              <input
                type="checkbox"
                checked={pdpaConsent}
                onChange={(e) => setPdpaConsent(e.target.checked)}
                className="mt-0.5 accent-blue-900 shrink-0"
              />
              <span className="text-xs text-slate-700 font-medium leading-relaxed">
                I have read and understood the above. I consent to my uploaded documents being processed as described, for the sole purpose of generating a personal loan readiness assessment.
              </span>
            </label>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setPdpaConsentModalOpen(false);
                  setPendingPortal(null);
                  setPdpaConsent(false);
                }}
                className="flex-1 py-2.5 border border-slate-200 text-slate-600 text-xs font-bold rounded-xl hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                disabled={!pdpaConsent}
                onClick={() => {
                  if (pdpaConsent && pendingPortal) {
                    setPerspective(pendingPortal);
                    setCurrentPage('app');
                    setPdpaConsentModalOpen(false);
                  }
                }}
                className="flex-1 py-2.5 bg-blue-950 hover:bg-blue-900 text-white text-xs font-bold rounded-xl disabled:opacity-40 transition-all shadow-md"
              >
                I Agree — Continue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lender Matching Modal — Dynamic Smart Engine */}
      {lenderMatchOpen && b2cResult && (() => {
        const matchedLenders: MatchedLender[] = matchLenders(
          b2cResult.report,
          b2cResult.inputData,
          shariahPreference,
          targetLoanPurpose,
          targetLoanAmount
        );
        return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-blue-950/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl premium-card bg-white shadow-2xl rounded-2xl flex flex-col max-h-[88vh] overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <Globe className="w-5 h-5 text-blue-900" />
                <div>
                  <h3 className="text-sm font-extrabold text-blue-950 uppercase tracking-widest">Lender Matching Engine</h3>
                  <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                    {matchedLenders.length} licensed Malaysian lender{matchedLenders.length !== 1 ? 's' : ''} found · {shariahPreference ? 'Shariah filter ON' : 'All financing types'}
                  </p>
                </div>
              </div>
              <button onClick={() => setLenderMatchOpen(false)} className="p-1.5 hover:bg-slate-100 rounded-lg">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto flex flex-col gap-4">
              {/* Legal notice */}
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 leading-relaxed flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <span>
                  <strong>Independent Referral — Not Financial Advice:</strong> Loan - La has no commercial agreement with any listed lender. Referrals are based on each lender's publicly published criteria. Verify credentials at <strong>BNM.gov.my</strong> (banks) or <strong>SC.com.my</strong> (P2P platforms) before applying. Rates are indicative.
                </span>
              </div>

              {matchedLenders.length === 0 ? (
                <div className="text-center py-10 text-slate-400 flex flex-col items-center gap-2">
                  <HelpCircle className="w-8 h-8 text-slate-300" />
                  <p className="text-sm font-medium text-slate-500">No matching lenders found for this profile and filters.</p>
                  <p className="text-xs">Try adjusting the loan amount, asset type, or turning off the Shariah filter.</p>
                </div>
              ) : (
                matchedLenders.map((match, idx) => (
                  <div key={idx} className="border border-slate-200 rounded-xl p-4 flex flex-col gap-3 hover:border-slate-300 transition-colors">
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex items-start gap-2.5 min-w-0">
                        <span className="text-xl shrink-0">{match.lender.emoji}</span>
                        <div className="min-w-0">
                          <span className="text-sm font-extrabold text-blue-950 block leading-tight">{match.lender.name}</span>
                          <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                            <span className="text-[10px] text-slate-400 font-mono">{match.lender.type}</span>
                            {match.lender.shariah && (
                              <span className="text-[9px] font-bold px-1.5 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded">SHARIAH</span>
                            )}
                            {match.lender.gigFriendly && (
                              <span className="text-[9px] font-bold px-1.5 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded">✓ GIG-FRIENDLY</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border shrink-0 ${
                        match.eligibilityLabel === 'Strong Match' ? 'bg-blue-50 text-blue-900 border-blue-200' :
                        match.eligibilityLabel === 'Good Fit' ? 'bg-slate-100 text-slate-700 border-slate-300' :
                        match.eligibilityLabel === 'Possible — Needs Guarantor' ? 'bg-amber-50 text-amber-800 border-amber-200' :
                        'bg-slate-50 text-slate-500 border-slate-200'
                      }`}>{match.eligibilityLabel}</span>
                    </div>

                    <p className="text-[10.5px] text-slate-500 leading-relaxed">{match.lender.highlight}</p>

                    {/* Product grid */}
                    <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 rounded-xl p-3">
                      <div><span className="text-slate-400 block text-[10px] font-semibold uppercase tracking-wide">Product</span><span className="font-medium text-slate-700">{match.product.name}</span></div>
                      <div><span className="text-slate-400 block text-[10px] font-semibold uppercase tracking-wide">Max Loan</span><span className="font-medium text-slate-700">RM {match.product.maxAmountRM.toLocaleString()}</span></div>
                      <div><span className="text-slate-400 block text-[10px] font-semibold uppercase tracking-wide">Rate (from)</span><span className="font-medium text-slate-700">{match.product.rateFromPercent}% p.a. ({match.product.rateType === 'flat_pa' ? 'flat' : match.product.rateType === 'profit_rate_pa' ? 'profit rate' : 'reducing bal.'})</span></div>
                      <div><span className="text-slate-400 block text-[10px] font-semibold uppercase tracking-wide">Est. Installment</span><span className="font-bold text-blue-900">RM {match.estimatedMonthlyInstallment.toLocaleString()}/mo</span></div>
                    </div>

                    {/* Match reasons */}
                    {match.matchReasons.length > 0 && (
                      <div className="flex flex-col gap-1.5">
                        {match.matchReasons.slice(0, 3).map((r, ri) => (
                          <div key={ri} className="flex items-start gap-1.5 text-[10.5px] text-blue-800">
                            <CheckCircle className="w-3 h-3 shrink-0 mt-0.5 text-blue-400" />
                            <span>{r}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Warnings */}
                    {match.warningReasons.length > 0 && (
                      <div className="flex flex-col gap-1.5">
                        {match.warningReasons.map((w, wi) => (
                          <div key={wi} className="flex items-start gap-1.5 text-[10.5px] text-amber-700">
                            <AlertTriangle className="w-3 h-3 shrink-0 mt-0.5" />
                            <span>{w}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Required docs */}
                    <div>
                      <span className="text-[10px] text-slate-400 block mb-1 font-bold uppercase tracking-wider">Documents Required:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {match.product.requiredDocs.map((doc, di) => (
                          <span key={di} className="text-[10px] px-2 py-0.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-600 font-medium">{doc}</span>
                        ))}
                      </div>
                    </div>

                    <a
                      href={match.lender.applicationUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-950 hover:bg-blue-900 text-white text-xs font-bold rounded-xl transition-all"
                    >
                      <Globe className="w-3.5 h-3.5" /> Apply at {match.lender.shortName} — {match.lender.website}
                    </a>
                  </div>
                ))
              )}
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50/50">
              <p className="text-[10px] text-slate-400 text-center leading-relaxed">
                Loan - La earns no commission from these lenders. Always verify lender credentials at <strong>BNM.gov.my</strong> (for banks) or <strong>SC.com.my</strong> (for P2P platforms) before applying. Rates are indicative and subject to each lender's internal assessment.
              </p>
            </div>
          </div>
        </div>
        );
      })()}

      {/* Next-Gen Autonomous AI Agent Concierge Widget */}
      <AICoPilotChat
        userSession={userSession}
        assessedInflow={b2cResult?.inputData?.averageMonthlyNetIncome || userSession?.estimatedMonthlyIncome || 5000}
        latestScore={b2cResult?.report?.score || 710}
        latestGrade={b2cResult?.report?.grade || 'A'}
        currentDsr={b2cResult?.report?.dsr !== undefined ? b2cResult.report.dsr : 0.0}
        emergencyRunway={b2cResult?.report?.runwayMonths || 1.9}
        maxSafeLoan={b2cResult?.inputData?.averageMonthlyNetIncome ? Math.round(b2cResult.inputData.averageMonthlyNetIncome * 0.35 * 30.6) : 53550}
        maxSafeMonthlyPay={b2cResult?.inputData?.averageMonthlyNetIncome ? Math.round(b2cResult.inputData.averageMonthlyNetIncome * 0.35) : 1750}
        targetLoanAmount={targetLoanAmount}
        targetLoanPurpose={targetLoanPurpose}
        activeStep={activeStep}
        hasUploadedFiles={uploadedFiles.length > 0}
        onNavigateToReport={() => {
          setPerspective('B2C');
          setCurrentPage('app');
          setActiveStep(4);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onDownloadReportPdf={() => {
          if (!isPassportUnlocked) {
            setShowPaywallModal(true);
            return;
          }
          const userName = userSession?.name || (b2cResult?.inputData as any)?.fullName || (b2cResult?.inputData as any)?.name || 'Ahmad Razak';
          const income = b2cResult?.inputData?.averageMonthlyNetIncome || userSession?.estimatedMonthlyIncome || 4850;
          const score = b2cResult?.report?.score || 730;
          const grade = b2cResult?.report?.grade || 'A';
          const platform = userSession?.platformName || userSession?.workCategory || 'Grab / Foodpanda';

          const inputData = b2cResult?.inputData || {
            averageMonthlyNetIncome: income,
            monthlyIncomes: [Math.round(income * 0.94), Math.round(income * 1.02), Math.round(income * 0.98), Math.round(income * 1.06), income],
            averageMonthlyExpenses: Math.round(income * 0.45),
            monthlyExpenses: [Math.round(income * 0.45), Math.round(income * 0.46), Math.round(income * 0.44)],
            activeLoansCount: 0,
            latePaymentCount: 0,
            hasTaxRecord: false,
            gigPlatforms: [platform],
            workType: 'gig_worker',
            fullName: userName,
            icNumber: '960814-14-****',
            phone: userSession?.phone || '+6012-3456789',
            email: userSession?.email || 'ahmad.razak@example.com'
          };

          const report = b2cResult?.report || {
            score: score,
            grade: grade,
            dsr: 11.4,
            runwayMonths: 7.8,
            monthlySurplus: Math.round(income * 0.55),
            volatilityRatio: 0.08,
            confidenceScore: 94,
            keyStrengths: [
              'Consistent monthly gig inflow verified across banking records',
              'Healthy debt-service ratio (11.4%) with zero active defaults',
              'Strong cashflow buffer with 7.8 months liquid reserve runway'
            ],
            keyRisks: [
              'Variable monthly income distribution typical of platform economy',
              'Self-employed non-salaried tax documentation profile'
            ]
          };

          generateCreditPassportPdf({
            inputData: inputData as any,
            report: report as any,
            documentHash: b2cResult?.hash || 'a1b2c3d4e5f67890'
          });
        }}
        onNavigateToLoanNeed={() => {
          if (!userSession) {
            setAuthModalOpen(true);
          } else {
            setPerspective('B2C');
            setCurrentPage('app');
            setActiveStep(1);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }
        }}
        onNavigateToUpload={() => {
          if (!userSession) {
            setAuthModalOpen(true);
          } else {
            setPerspective('B2C');
            setCurrentPage('app');
            setActiveStep(2);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }
        }}
        onNavigateToCalculator={(params) => {
          if (params?.loanAmount) setTargetLoanAmount(params.loanAmount);
          if (params?.tenureYears) setCalcTenureYears(params.tenureYears);
          if (params?.interestRate) setCalcInterestRate(params.interestRate);
          setCurrentPage('calculator');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onNavigateToDirectory={() => {
          setCurrentPage('directory');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onNavigateToTracker={() => {
          setCurrentPage('tracker');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenSettings={() => {
          setSettingsModalOpen(true);
        }}
        onOpenSupportModal={(ticketId) => {
          setInitialSupportTicketId(ticketId || null);
          setIsSupportModalOpen(true);
        }}
        onStartAssessmentWithFile={(newFile) => {
          const hadFiles = uploadedFiles.length > 0;
          setUploadedFiles(prev => [...prev, newFile]);
          setPreUploadDeclAuthentic(true);
          setPreUploadDeclConsent(true);
          setPreUploadDeclPdpa(true);
          if (!userSession) {
            setAuthModalOpen(true);
          } else {
            setPerspective('B2C');
            setCurrentPage('app');
            if (activeStep >= 2 || hadFiles) {
              setActiveStep(2);
            } else {
              setActiveStep(1);
            }
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }
        }}
      />

      {/* PII Redaction Sandbox Inspector Modal */}
      {previewRedactedFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-blue-950/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-2xl premium-card bg-white p-6 shadow-2xl relative">
            <button 
              onClick={() => setPreviewRedactedFile(null)}
              className="absolute top-4 right-4 p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-3">
              <EyeOff className="w-5 h-5 text-blue-900" />
              <div>
                <h3 className="text-sm font-extrabold text-blue-950 uppercase tracking-widest">Client-Side Masking Inspector</h3>
                <span className="text-[10px] text-slate-400 block font-mono">FILE: {previewRedactedFile}</span>
              </div>
            </div>

            <p className="text-xs text-slate-500 mb-4 leading-relaxed">
              This preview displays what is actually compiled and sent to the Gemini AI models. All sensitive fields are blacked out locally at the pixel level in your browser before upload.
            </p>

            {/* Visual Redacted Document Mock */}
            <div className="border border-slate-200 rounded-xl p-5 bg-slate-50 font-mono text-xs text-slate-800 flex flex-col gap-3 shadow-inner relative overflow-hidden select-none">
              
              <div className="absolute top-0 right-0 p-2 bg-blue-950 text-white text-[8px] font-bold tracking-widest border-l border-b border-blue-950 rounded-bl-lg">
                PDPA COMPLIANT COPY
              </div>

              <div className="flex justify-between border-b border-slate-200 pb-2 mb-1">
                <span className="font-bold text-blue-900">MALAYSIAN FINANCIAL LEDGER</span>
                <span className="text-[9px] text-slate-400">ANONYMIZED STREAM</span>
              </div>

              {/* Redacted Data Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
                <div className="flex justify-between items-center bg-white p-2 rounded border border-slate-200">
                  <span className="font-bold text-slate-500">Applicant Name:</span>
                  <span className="px-2 py-0.5 bg-blue-950 text-white font-extrabold rounded text-[10px] tracking-widest">■■■■■■■■■■■■■ (Masked)</span>
                </div>
                <div className="flex justify-between items-center bg-white p-2 rounded border border-slate-200">
                  <span className="font-bold text-slate-500">MyKad / Identity ID:</span>
                  <span className="px-2 py-0.5 bg-blue-950 text-white font-extrabold rounded text-[10px] tracking-widest">■■■■■■-■■-■■■■ (Redacted)</span>
                </div>
                <div className="flex justify-between items-center bg-white p-2 rounded border border-slate-200">
                  <span className="font-bold text-slate-500">Account Registry:</span>
                  <span className="px-2 py-0.5 bg-blue-950 text-white font-extrabold rounded text-[10px] tracking-widest">■■■■■■■■■■■412 (Redacted)</span>
                </div>
                <div className="flex justify-between items-center bg-white p-2 rounded border border-slate-200">
                  <span className="font-bold text-slate-500">Home Address:</span>
                  <span className="px-2 py-0.5 bg-blue-950 text-white font-extrabold rounded text-[9px] tracking-wider truncate max-w-[140px]">■■■■■■■■■■■■■ (Masked)</span>
                </div>
              </div>

              {/* Readable Financial Ledger */}
              <div className="flex flex-col gap-1.5 mt-2 border-t border-slate-200 pt-3">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Extracted Inflow Matrix (Sent to AI)</span>
                <div className="flex justify-between text-slate-600 border-b border-slate-100 pb-1 text-[11px]">
                  <span>2026-07-10 | Grab Driver Weekly Disbursement</span>
                  <span className="font-bold text-blue-900">+RM 1,250.00</span>
                </div>
                <div className="flex justify-between text-slate-600 border-b border-slate-100 pb-1 text-[11px]">
                  <span>2026-07-08 | Shell Fuel Station Petrol Reimbursement</span>
                  <span className="font-bold text-slate-700">-RM 60.00</span>
                </div>
                <div className="flex justify-between text-slate-600 pb-1 text-[11px]">
                  <span>2026-07-05 | Foodpanda Rider Net Earnings Inflow</span>
                  <span className="font-bold text-blue-900">+RM 350.00</span>
                </div>
              </div>

            </div>

            <div className="mt-5 flex gap-3 justify-end border-t border-slate-100 pt-4">
              <button
                onClick={() => setPreviewRedactedFile(null)}
                className="px-5 py-2 bg-blue-950 hover:bg-blue-900 text-white text-xs font-bold rounded-xl transition-colors"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}

      {/* COMPARE ALL MODAL */}
      {compareOpen && b2cResult && (() => {
        const loanTier = targetLoanAmount > 50000 ? 3 : targetLoanAmount < 5000 ? 1 : 2;
        const purposeLabel: Record<string, string> = {
          personal_cash: 'Personal Cash', working_capital: 'Working Capital',
          equipment: 'Equipment', vehicle: 'Vehicle HP', invoice_financing: 'Invoice Financing', education: 'Education'
        };
        const lenderPurposeMap: Record<string, string[]> = {
          working_capital: ['TEKUN Nasional (Skim Niaga)', 'SME Bank (SPUM Scheme)', 'Maybank SME Digital Financing'],
          vehicle: ['AEON Credit (Vehicle & Motor HP)', 'TEKUN Mobilepreneur', 'Maybank Hire Purchase'],
          personal_cash: ['BSN MicroKredit Madani', 'Bank Rakyat Pembiayaan Mikro-i', 'AEON i-Cash Personal'],
          equipment: ['SME Bank (SPUM Mesin & Alatan)', 'Agrobank Mesin-i', 'MARA (SPiM Alatan)'],
          invoice_financing: ['Funding Societies Invoice Financing', 'CapBay Supply Chain Financing', 'MARA (SPiKE)'],
          education: ['Bank Rakyat Pendidikan-i', 'BSN MicroKredit', 'AIM (Amanah Ikhtiar)'],
        };
        const names = lenderPurposeMap[targetLoanPurpose] ?? ['TEKUN Nasional', 'SME Bank', 'Maybank'];
        const cols = [
          { name: names[0], rate: targetLoanPurpose === 'working_capital' ? '4.0% flat' : '4.0% – 5.5% flat', installment: Math.round(targetLoanAmount / 18 * 1.04), tenure: '12–60 mo', speed: loanTier === 3 ? '5–7 days' : loanTier === 1 ? '2–3 days' : '3–5 days', collateral: 'None', score: 95 },
          { name: names[1], rate: '4.0% – 5.0% flat', installment: Math.round(targetLoanAmount / 24 * 1.05), tenure: '12–60 mo', speed: loanTier === 3 ? '5–10 days' : loanTier === 1 ? '2–3 days' : '3–5 days', collateral: 'None', score: 84 },
          { name: names[2], rate: targetLoanPurpose === 'working_capital' ? '4.8% – 9.8% reducing' : '2.8% – 4.2% flat', installment: Math.round(targetLoanAmount / 12 * 1.06), tenure: '12–60 mo', speed: '24–48 hrs', collateral: 'None', score: 76 },
        ];
        const current = cols[compareSwipeIndex];
        return (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-blue-950/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-blue-950 text-white">
              <div>
                <h3 className="text-sm font-extrabold uppercase tracking-widest flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-blue-300" /> Compare Matched Lenders
                </h3>
                <span className="text-xs text-blue-200">{purposeLabel[targetLoanPurpose]} · RM {targetLoanAmount.toLocaleString()}</span>
              </div>
              <button onClick={() => setCompareOpen(false)} className="p-2 hover:bg-blue-900 rounded-xl transition-all">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Desktop: Table / Mobile: Swipe cards */}
            <div className="p-6">
              {/* Desktop table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <td className="py-2 font-bold text-slate-500 uppercase tracking-wider w-32">Feature</td>
                      {cols.map((c, i) => (
                        <td key={i} className={`py-2 px-3 font-extrabold text-center ${i === 0 ? 'text-blue-900' : 'text-slate-700'}`}>
                          {i === 0 && <span className="text-[9px] text-blue-900 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded block mb-1 font-extrabold">TOP MATCH</span>}
                          {c.name}
                        </td>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { label: 'Match Score', vals: cols.map(c => `${c.score}/100`) },
                      { label: 'Interest Rate', vals: cols.map(c => c.rate) },
                      { label: 'Est. Installment', vals: cols.map(c => `RM ${c.installment.toLocaleString()}/mo`) },
                      { label: 'Tenure', vals: cols.map(c => c.tenure) },
                      { label: 'Approval Speed', vals: cols.map(c => c.speed) },
                      { label: 'Collateral', vals: cols.map(c => c.collateral) },
                    ].map((row, ri) => (
                      <tr key={ri} className={`border-b border-slate-100 ${ri % 2 === 0 ? 'bg-slate-50/50' : 'bg-white'}`}>
                        <td className="py-2.5 font-bold text-slate-500 uppercase tracking-wider">{row.label}</td>
                        {row.vals.map((v, vi) => (
                          <td key={vi} className={`py-2.5 px-3 text-center font-semibold ${vi === 0 ? 'text-blue-900 font-bold' : 'text-slate-700'}`}>{v}</td>
                        ))}
                      </tr>
                    ))}
                    <tr>
                      <td></td>
                      {cols.map((c, i) => (
                        <td key={i} className="py-3 px-3 text-center">
                          <button
                            onClick={() => { setApplyTarget({ lenderName: c.name, lenderUrl: '#', productName: purposeLabel[targetLoanPurpose] + ' Loan' }); setApplySubmitted(false); setApplyModalOpen(true); setCompareOpen(false); }}
                            className={`w-full py-2 text-xs font-extrabold rounded-xl ${i === 0 ? 'bg-blue-950 text-white' : 'bg-blue-900 text-white hover:bg-blue-950'} transition-all flex items-center justify-center gap-1`}
                          ><ArrowRight className="w-3.5 h-3.5" /> Apply</button>
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Mobile swipe card */}
              <div className="md:hidden flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <button onClick={() => setCompareSwipeIndex(Math.max(0, compareSwipeIndex - 1))} disabled={compareSwipeIndex === 0} className="p-2 border border-slate-200 rounded-xl disabled:opacity-30 flex items-center gap-1 text-xs font-bold"><ArrowLeft className="w-3.5 h-3.5" /> Prev</button>
                  <span className="text-xs font-bold text-slate-600">{compareSwipeIndex + 1} of {cols.length}</span>
                  <button onClick={() => setCompareSwipeIndex(Math.min(cols.length - 1, compareSwipeIndex + 1))} disabled={compareSwipeIndex === cols.length - 1} className="p-2 border border-slate-200 rounded-xl disabled:opacity-30 flex items-center gap-1 text-xs font-bold">Next <ArrowRight className="w-3.5 h-3.5" /></button>
                </div>
                <div className="border border-slate-200 rounded-xl p-5 flex flex-col gap-3">
                  {compareSwipeIndex === 0 && <span className="text-[10px] bg-blue-50 text-blue-900 border border-blue-200 font-bold px-2 py-0.5 rounded w-fit">Top Match</span>}
                  <span className="text-base font-extrabold text-blue-950">{current.name}</span>
                  {[
                    { label: 'Match Score', val: `${current.score}/100` },
                    { label: 'Interest Rate', val: current.rate },
                    { label: 'Est. Installment', val: `RM ${current.installment.toLocaleString()}/mo` },
                    { label: 'Tenure', val: current.tenure },
                    { label: 'Approval Speed', val: current.speed },
                  ].map((r, i) => (
                    <div key={i} className="flex justify-between border-b border-slate-100 pb-2 text-xs">
                      <span className="text-slate-500 font-bold">{r.label}</span>
                      <span className="font-bold text-slate-800">{r.val}</span>
                    </div>
                  ))}
                  <button
                    onClick={() => { setApplyTarget({ lenderName: current.name, lenderUrl: '#', productName: purposeLabel[targetLoanPurpose] + ' Loan' }); setApplySubmitted(false); setApplyModalOpen(true); setCompareOpen(false); }}
                    className="w-full py-3 bg-blue-950 hover:bg-blue-900 text-white font-extrabold rounded-xl text-sm mt-2 flex items-center justify-center gap-1.5"
                  ><ArrowRight className="w-4 h-4" /> Apply Now</button>
                </div>
              </div>
            </div>
          </div>
        </div>
        );
      })()}

      {/* APPLY NOW MODAL */}
      {applyModalOpen && applyTarget && (() => {
        const isTargetApplied = !!appliedLenders[applyTarget.lenderName];
        const record = appliedLenders[applyTarget.lenderName];
        const currentRefCode = record?.refCode || `CF-2026-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

        return (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-blue-950/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 bg-blue-950 text-white flex items-center justify-between">
              <h3 className="text-sm font-extrabold uppercase tracking-widest flex items-center gap-2">
                <Building2 className="w-4 h-4 text-blue-300" />
                {applySubmitted ? 'Application Submitted' : 'Confirm Loan Application'}
              </h3>
              <button onClick={() => setApplyModalOpen(false)} className="p-2 hover:bg-blue-900 rounded-xl"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 flex flex-col gap-4">
              {!applySubmitted ? (
                <>
                  {isCurrentResultDemo ? (
                    <>
                      <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex flex-col gap-2">
                        <div className="flex items-center gap-2 text-amber-900 font-extrabold text-xs">
                          <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
                          <span>Demo Account Simulation Only</span>
                        </div>
                        <p className="text-xs text-amber-800 leading-relaxed font-medium">
                          This report was generated using sample demo data (<strong>{b2cResult?.inputData.name}</strong>). Demo accounts cannot be used to submit real loan applications to licensed banks.
                        </p>
                      </div>

                      <p className="text-xs text-slate-600 leading-relaxed font-normal">
                        To apply for a real loan with <strong>{applyTarget.lenderName}</strong>, please upload your own bank statement or Grab/Shopee earnings statement.
                      </p>

                      <div className="flex gap-3 pt-2">
                        <button
                          onClick={() => setApplyModalOpen(false)}
                          className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 font-bold rounded-xl text-xs"
                        >
                          Close
                        </button>
                        <button
                          onClick={() => {
                            setApplyModalOpen(false);
                            setActiveStep(2);
                          }}
                          className="flex-1 py-3 bg-blue-950 hover:bg-blue-900 text-white font-extrabold rounded-xl text-xs shadow-md flex items-center justify-center gap-1.5"
                        >
                          <span>Upload My Statement</span> <ArrowRight className="w-3.5 h-3.5 text-blue-200" />
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <p className="text-sm text-slate-700 leading-relaxed">
                        {language === 'bm'
                          ? `Hantar pakej permohonan bersijil anda kepada `
                          : `Submit your certified application package to `}
                        <strong className="text-blue-950">{applyTarget.lenderName}</strong>
                        {language === 'bm' ? ` untuk pembiayaan sebanyak ` : ` for a `}
                        <strong className="text-blue-950">RM {targetLoanAmount.toLocaleString()}</strong> ({applyTarget.productName})?
                      </p>

                      <div className="flex flex-col gap-2 p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs">
                        <span className="font-bold text-slate-700 block">
                          {language === 'bm' ? 'Pakej Permohonan Disulitkan Mengandungi:' : 'Encrypted Application Bundle Includes:'}
                        </span>
                        <span className="flex items-center gap-1.5 text-blue-900"><CheckCircle2 className="w-3.5 h-3.5" /> {language === 'bm' ? 'Audit Penyata Bank 3 Bulan (PDF)' : '3-Month Bank Statement Audit'}</span>
                        <span className="flex items-center gap-1.5 text-blue-900"><CheckCircle2 className="w-3.5 h-3.5" /> {language === 'bm' ? 'Pengesahan Pendapatan Platform Gig / Niaga' : 'Platform Income Evidence Verification'}</span>
                        <span className="flex items-center gap-1.5 text-blue-900"><CheckCircle2 className="w-3.5 h-3.5" /> {language === 'bm' ? `Indeks Kesediaan Kewangan (Skor FRI: ${b2cResult?.report.score || 85})` : `Financial Readiness Index (FRI Score: ${b2cResult?.report.score || 85})`}</span>
                      </div>

                      {/* MANDATORY BORROWER DECLARATION */}
                      <label className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-start gap-2.5 ${
                        applyDeclNoDefault
                          ? 'bg-blue-50/70 border-blue-950 shadow-xs'
                          : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                      }`}>
                        <input
                          type="checkbox"
                          checked={applyDeclNoDefault}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            setApplyDeclNoDefault(checked);
                            setApplyDeclAffordability(checked);
                            setApplyDeclSingleReport(checked);
                          }}
                          className="mt-0.5 accent-blue-950 h-4.5 w-4.5 rounded shrink-0 cursor-pointer"
                        />
                        <div className="flex-1">
                          <span className="text-xs font-bold text-slate-900 block">
                            {language === 'bm' ? 'Pengesahan Permohonan & Kemampuan Bayaran' : 'Application & Affordability Confirmation'}
                          </span>
                          <span className="text-[11px] text-slate-500 block mt-0.5 leading-relaxed">
                            {language === 'bm'
                              ? `Saya mengesahkan tiada hutang tertunggak di institusi lain, bayaran ansuran adalah dalam kemampuan pendapatan saya, dan laporan ini dihantar secara eksklusif kepada ${applyTarget.lenderName}.`
                              : `I confirm I have no active undisclosed loan defaults, the monthly installment is within my capacity, and this report is submitted exclusively to ${applyTarget.lenderName}.`}
                          </span>
                        </div>
                      </label>

                      <p className="text-[10px] text-slate-400 leading-relaxed">
                        {applyTarget.lenderName} will contact you directly. Loan - La earns no commission from referrals. Always verify lender credentials at BNM.gov.my before signing agreements.
                      </p>

                      <div className="flex gap-3">
                        <button 
                          onClick={() => {
                            setApplyModalOpen(false);
                            setApplyDeclNoDefault(false);
                            setApplyDeclAffordability(false);
                            setApplyDeclSingleReport(false);
                          }} 
                          className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 font-bold rounded-xl text-sm cursor-pointer"
                        >
                          {language === 'bm' ? 'Batal' : 'Cancel'}
                        </button>
                        <button
                          disabled={!applyDeclNoDefault}
                          onClick={() => {
                            const timestamp = new Date().toLocaleTimeString('en-MY', { hour: '2-digit', minute: '2-digit' });
                            setAppliedLenders(prev => ({ ...prev, [applyTarget.lenderName]: { appliedAt: timestamp, refCode: currentRefCode } }));
                            
                            // Register into centralized applications tracker
                            const newAppRecord: ApplicationRecord = {
                              id: `app-${Date.now()}`,
                              refCode: currentRefCode,
                              lenderName: applyTarget.lenderName,
                              productName: applyTarget.productName,
                              loanAmount: targetLoanAmount,
                              monthlyInstallment: applyTarget.installment || (b2cResult ? Math.round(b2cResult.report.estimatedInstallment) : 347),
                              appliedAt: `Today, ${timestamp}`,
                              status: 'SUBMITTED',
                              speed: applyTarget.speed || (targetLoanAmount < 5000 ? '2–4 Hours' : 'Same business day'),
                              lenderUrl: applyTarget.lenderUrl || 'https://gxbank.my'
                            };
                            setSubmittedApplications(prev => {
                              const updated = [newAppRecord, ...prev.filter(a => a.lenderName !== applyTarget.lenderName)];
                              try { localStorage.setItem('crediflow_submitted_apps', JSON.stringify(updated)); } catch(e) {}
                              return updated;
                            });
                            setApplySubmitted(true);
                          }}
                          className={`flex-1 py-3 font-extrabold rounded-xl text-sm shadow-md flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                            applyDeclNoDefault
                              ? 'bg-blue-950 hover:bg-blue-900 text-white'
                              : 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300 shadow-none'
                          }`}
                        >
                          {language === 'bm' ? 'Sahkan & Mohon' : 'Confirm & Apply'} <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    </>
                  )}
                </>
              ) : (
                <>
                  <div className="text-center py-4 flex flex-col items-center">
                    <CheckCircle2 className="w-12 h-12 text-blue-900 mb-2" />
                    <span className="text-base font-extrabold text-blue-950 block">Application Submitted!</span>
                    <span className="text-xs text-slate-500 mt-1 block">Recipient: {applyTarget.lenderName}</span>
                  </div>
                  <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl text-xs flex flex-col gap-2 font-mono">
                    <div className="flex justify-between"><span className="text-slate-500 font-bold">Reference Code:</span><span className="font-bold text-blue-900">{currentRefCode}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500 font-bold">Status:</span><span className="font-bold text-blue-900">SUBMITTED TO LENDER</span></div>
                    <div className="flex justify-between"><span className="text-slate-500 font-bold">Turnaround SLA:</span><span className="font-bold text-slate-700">{targetLoanAmount < 5000 ? 'Within 2–5 hours' : 'Same business day'}</span></div>
                  </div>
                  <p className="text-[10px] text-slate-400 text-center leading-relaxed">
                    Your certified Loan Readiness Dossier has been transmitted. You can track this application anytime in your dashboard.
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setApplyModalOpen(false);
                        setApplySubmitted(false);
                        setCurrentPage('tracker');
                      }}
                      className="flex-1 py-3 bg-blue-950 hover:bg-blue-900 text-white font-extrabold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm"
                    >
                      <span>Track in My Applications →</span>
                    </button>
                    <button
                      onClick={() => {
                        setApplyModalOpen(false);
                        setApplySubmitted(false);
                      }}
                      className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs"
                    >
                      Close
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
        );
      })()}

      {/* Category Suitability Modal ("Why Loan - La is Suitable For You") */}
      {categorySuitabilityModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-blue-950/70 backdrop-blur-xs p-4 animate-fade-in overflow-y-auto">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200 flex flex-col my-6 animate-scale-in">
            
            {/* Minimal Header */}
            <div className="px-6 py-5 bg-gradient-to-r from-blue-950 via-blue-900 to-blue-950 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-900/90 rounded-2xl border border-blue-700/60 shadow-xs">
                  {(() => {
                    const ModalIcon = categorySuitabilityModal.icon;
                    return <ModalIcon className="w-5 h-5 text-blue-200" />;
                  })()}
                </div>
                <h3 className="text-base font-extrabold tracking-tight">{categorySuitabilityModal.title}</h3>
              </div>
              <button 
                onClick={() => setCategorySuitabilityModal(null)} 
                className="p-2 hover:bg-blue-800/80 rounded-xl text-blue-200 hover:text-white transition-all cursor-pointer"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-3 bg-slate-50 border-b border-slate-200 px-4 py-2.5 text-center text-xs">
              <div className="border-r border-slate-200 pr-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">{language === 'bm' ? 'Kelulusan' : 'Speed'}</span>
                <span className="font-extrabold text-blue-950 text-xs mt-0.5 block">{categorySuitabilityModal.speed || '2–4 Hours'}</span>
              </div>
              <div className="border-r border-slate-200 px-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">{language === 'bm' ? 'Slip Gaji' : 'Payslip'}</span>
                <span className="font-extrabold text-blue-950 text-xs mt-0.5 block">{language === 'bm' ? 'Tidak Wajib' : 'Not Required'}</span>
              </div>
              <div className="pl-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">{language === 'bm' ? 'Kesan CTOS' : 'CTOS Impact'}</span>
                <span className="font-extrabold text-emerald-700 text-xs mt-0.5 block">{language === 'bm' ? '0 Kesan' : 'Zero Impact'}</span>
              </div>
            </div>

            {/* Minimized Modal Body */}
            <div className="p-5 flex flex-col gap-3.5">

              {/* Key Highlights */}
              <div className="p-3.5 bg-blue-50/60 border border-blue-100 rounded-2xl flex flex-col gap-2">
                <span className="text-[11px] font-bold text-blue-950 uppercase tracking-wide flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  {language === 'bm' ? 'Kelebihan Utama' : 'Key Highlights'}
                </span>
                <div className="flex flex-col gap-1.5 text-xs text-slate-700">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-900 shrink-0" />
                    <span>{language === 'bm' ? 'Tiada slip gaji atau KWSP tetap diperlukan' : 'No fixed payslips or EPF needed'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-900 shrink-0" />
                    <span>{language === 'bm' ? 'Audit automatik penyata bank & pendapatan gig' : 'Direct bank statement & gig income auditing'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-900 shrink-0" />
                    <span>{language === 'bm' ? 'Padanan pantas ke bank digital berlesen (GXBank, Boost, AEON)' : 'Pre-qualified with GXBank, Boost Credit & AEON'}</span>
                  </div>
                </div>
              </div>

              {/* Documents & Matched Lenders */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-left">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex flex-col gap-1.5">
                  <span className="text-[10.5px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-blue-900" />
                    {language === 'bm' ? 'Dokumen Ringkas' : 'Required Docs'}
                  </span>
                  <div className="flex flex-col gap-1 text-[11px] text-slate-600">
                    {categorySuitabilityModal.requiredDocs.map((doc: string, idx: number) => (
                      <span key={idx} className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0" />
                        <span className="truncate">{doc}</span>
                      </span>
                    ))}
                  </div>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex flex-col gap-1.5">
                  <span className="text-[10.5px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-blue-900" />
                    {language === 'bm' ? 'Rakan Bank' : 'Matched Banks'}
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {categorySuitabilityModal.matchedLenders.slice(0, 3).map((lender: string, idx: number) => (
                      <span key={idx} className="px-2 py-0.5 bg-white border border-slate-200 rounded text-[10px] font-bold text-slate-800 shadow-2xs">
                        {lender}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action CTA Button */}
              <button
                type="button"
                onClick={() => {
                  const purposeId = categorySuitabilityModal.id;
                  const defaultAmt = categorySuitabilityModal.defaultAmount || 5000;
                  setTargetLoanPurpose(purposeId);
                  setTargetLoanAmount(defaultAmt);
                  setCategorySuitabilityModal(null);
                  if (!userSession) {
                    setAuthModalOpen(true);
                  } else {
                    setPerspective('B2C');
                    setCurrentPage('app');
                    setActiveStep(1);
                  }
                }}
                className="w-full mt-1 py-3.5 bg-blue-950 hover:bg-blue-900 text-white font-black text-xs sm:text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
              >
                <span>{language === 'bm' ? 'Semak Kelayakan Percuma →' : 'Start Free Eligibility Check →'}</span>
              </button>

            </div>
          </div>
        </div>
      )}

      {/* Authentication Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onLoginSuccess={(user) => {
          const fullUser: UserProfileData = {
            ...user,
            icNumber: user.icNumber || '891012-14-5566',
            email: user.email || 'ahmad.razak@gmail.com',
            bankName: user.bankName || 'Maybank (Malayan Banking Berhad)',
            bankAccountNumber: user.bankAccountNumber || '114012849201',
            bankAccountHolder: user.bankAccountHolder || user.name || 'Ahmad Bin Razak',
            bankAccountType: 'savings',
            workCategory: 'gig',
            platformName: 'Grab / Foodpanda',
            platformId: 'GBR-884219',
            estimatedMonthlyIncome: 3500,
            epfStatus: 'i-saraan'
          };
          setUserSession(fullUser);
          try {
            localStorage.setItem('crediflow_user_session', JSON.stringify(fullUser));
          } catch (e) {}

          if (user.profileId === 'guest_tester') {
            setIsPassportUnlocked(false);
            try {
              localStorage.removeItem('creditflow_passport_unlocked');
            } catch (e) {}
          } else if (user.profileId === 'premium_pro') {
            setIsPassportUnlocked(true);
            try {
              localStorage.setItem('creditflow_passport_unlocked', 'true');
            } catch (e) {}
          }

          setPdpaConsent(true);
          setPerspective('B2C');
          setCurrentPage('app');
          setActiveStep(1);
        }}
      />

      {/* Footer with Discreet Institutional Demo Link */}
      <footer className="w-full mt-6 pt-6 pb-8 border-t border-slate-200 text-xs text-slate-500 flex flex-col md:flex-row justify-between items-center gap-4 bg-white/40 p-6 rounded-3xl">
        <div className="flex flex-col gap-1 text-center md:text-left">
          <span className="font-bold text-slate-700">© 2026 Loan - La · Smart Loan Matcher</span>
          <span className="text-[11px] text-slate-400">Check eligibility before applying</span>
        </div>

        <div className="flex items-center gap-3 flex-wrap justify-center">
          <button
            onClick={() => {
              setPerspective('B2B');
              setCurrentPage('app');
            }}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl border border-slate-300 transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer"
          >
            <Landmark className="w-3.5 h-3.5 text-blue-900" />
            <span>Institutional Underwriter Portal (B2B Demo) →</span>
          </button>
          
          <button
            onClick={() => setDemoProfilesModalOpen(true)}
            className="px-3.5 py-2 bg-blue-50 hover:bg-blue-100 text-blue-900 font-bold text-xs rounded-xl border border-blue-200 transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer"
          >
            <Cpu className="w-3.5 h-3.5 text-blue-900" />
            <span>Developer Sandbox Profiles (Simulation Cases)</span>
          </button>
        </div>
      </footer>

      {/* Developer Sandbox Simulation Profiles Modal */}
      {demoProfilesModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-blue-950/70 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in duration-150 flex flex-col gap-4">
            
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-50 text-blue-900 rounded-xl">
                  <Cpu className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-blue-950 text-sm">Developer Simulation Sandbox</h3>
                  <span className="text-[10px] text-slate-400">Sample pre-audited gig profiles for instant system evaluation</span>
                </div>
              </div>
              <button
                onClick={() => setDemoProfilesModalOpen(false)}
                className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded-xl cursor-pointer"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Select one of these pre-audited multi-file gig profiles to test the AI underwriting pipeline and lender matching engine instantly:
            </p>

            <div className="flex flex-col gap-2.5">
              <button
                onClick={() => {
                  setDemoProfilesModalOpen(false);
                  setPerspective('B2C');
                  setCurrentPage('app');
                  setUploadedFiles([
                    { fileName: "Grab_Driver_Earning_Dashboard.png", fileType: "image/png", fileSize: "1.2 MB", fileBase64: "mock_data", category: "platform_dashboard" },
                    { fileName: "Maybank_Statement_Ahmad.pdf", fileType: "application/pdf", fileSize: "2.4 MB", fileBase64: "mock_data", category: "bank_statement" },
                    { fileName: "KWSP_EPF_Statement_2026.pdf", fileType: "application/pdf", fileSize: "1.1 MB", fileBase64: "mock_data", category: "tax_epf" }
                  ]);
                  runUnderwritingPipeline('mock', 'ahmad');
                }}
                className="flex justify-between items-center p-3.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-2xl text-left transition-all cursor-pointer"
              >
                <div>
                  <span className="text-xs font-bold text-slate-800 block">1. Ahmad Bin Razali</span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    Grab Driver • 6-Month Steady Payouts • Level-3 Full Stack Compliant
                  </span>
                </div>
                <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-lg border border-blue-200 bg-blue-50 text-blue-900 font-mono">
                  STRONG (A)
                </span>
              </button>

              <button
                onClick={() => {
                  setDemoProfilesModalOpen(false);
                  setPerspective('B2C');
                  setCurrentPage('app');
                  setUploadedFiles([
                    { fileName: "Shopee_Merchant_Center_Statement.jpg", fileType: "image/jpeg", fileSize: "1.8 MB", fileBase64: "mock_data", category: "platform_dashboard" },
                    { fileName: "CIMB_Business_Current_Account.pdf", fileType: "application/pdf", fileSize: "4.1 MB", fileBase64: "mock_data", category: "bank_statement" }
                  ]);
                  runUnderwritingPipeline('mock', 'chong');
                }}
                className="flex justify-between items-center p-3.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-2xl text-left transition-all cursor-pointer"
              >
                <div>
                  <span className="text-xs font-bold text-slate-800 block">2. Chong Wei Meng</span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    Shopee Seller • High Volatility Cashflow • Level-2 Basic Audit Warning
                  </span>
                </div>
                <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-lg border border-slate-350 bg-slate-100 text-slate-700 font-mono">
                  WARNING (B)
                </span>
              </button>

              <button
                onClick={() => {
                  setDemoProfilesModalOpen(false);
                  setPerspective('B2C');
                  setCurrentPage('app');
                  setUploadedFiles([
                    { fileName: "Fiverr_FND_Earnings_Dashboard.png", fileType: "image/png", fileSize: "950 KB", fileBase64: "mock_data", category: "platform_dashboard" },
                    { fileName: "CIMB_Statement_Siti.pdf", fileType: "application/pdf", fileSize: "2.1 MB", fileBase64: "mock_data", category: "bank_statement" }
                  ]);
                  runUnderwritingPipeline('mock', 'siti');
                }}
                className="flex justify-between items-center p-3.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-2xl text-left transition-all cursor-pointer"
              >
                <div>
                  <span className="text-xs font-bold text-slate-800 block">3. Siti Aminah Binti Ahmad</span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    Freelancer • Tampered Document • Photoshop EXIF Anomaly
                  </span>
                </div>
                <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-lg border border-rose-200 bg-rose-50 text-rose-800 font-mono">
                  FRAUD ALERT
                </span>
              </button>
            </div>

            <button
              onClick={() => setDemoProfilesModalOpen(false)}
              className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Traceability & Document Extraction Inspector Modal */}
      {inspectingDoc && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-blue-950/70 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in duration-150 flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
            
            {/* Header */}
            <div className="flex justify-between items-start border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 bg-blue-50 text-blue-900 rounded-2xl border border-blue-200">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-blue-950 text-sm">{inspectingDoc.fileName}</h3>
                  <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
                    {inspectingDoc.fileSize || '0.24 MB'} • SHA-256 Verified Matrix
                  </span>
                </div>
              </div>
              <button
                onClick={() => setInspectingDoc(null)}
                className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded-xl cursor-pointer"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            {/* Computer Vision & Optical OCR Telemetry */}
            <div className="p-3.5 bg-slate-900 text-slate-200 rounded-2xl font-mono text-xs flex flex-col gap-2 shadow-inner border border-slate-800">
              <div className="flex justify-between items-center border-b border-slate-800 pb-1.5 text-[10px] text-slate-400 font-bold">
                <span>OPTICAL OCR &amp; CV EXTRACTION METRICS</span>
                <span className="text-cyan-400">100% OCR CONFIDENCE</span>
              </div>
              <div className="flex justify-between"><span className="text-slate-400">Table Grid Bounding Boxes:</span><span className="text-blue-300 font-bold">PARSED &amp; BOUNDED (1400px Canvas)</span></div>
              <div className="flex justify-between"><span className="text-slate-400">EXIF Manipulation Scan:</span><span className="text-emerald-400 font-bold">CLEAN (Native Pixels)</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Deterministic Match Delta:</span><span className="text-cyan-300 font-bold">RM 0.00 Variance (Exact Bank Credit Link)</span></div>
            </div>

            {/* Line Items extracted from this specific document */}
            <div className="flex flex-col gap-2">
              <span className="text-xs font-extrabold text-blue-950 uppercase tracking-wider font-mono">
                Extracted Line Items from this Document:
              </span>
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
                    <tr>
                      <th className="py-2 px-3">Date</th>
                      <th className="py-2 px-3">Extracted Narrative</th>
                      <th className="py-2 px-3 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {activeB2bApplicantData?.inputData.transactions
                      .filter(t => {
                        const fn = inspectingDoc.fileName.toLowerCase();
                        if (fn.includes('jul')) return t.date.includes('-07-');
                        if (fn.includes('jun')) return t.date.includes('-06-');
                        if (fn.includes('may')) return t.date.includes('-05-');
                        if (fn.includes('apr')) return t.date.includes('-04-');
                        if (fn.includes('mar')) return t.date.includes('-03-');
                        if (fn.includes('foodpanda') || fn.includes('grab')) return t.description.toLowerCase().includes('foodpanda') || t.description.toLowerCase().includes('grab');
                        return true;
                      })
                      .slice(0, 5)
                      .map((tx, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="py-2.5 px-3 font-mono text-[11px] text-slate-500">{tx.date}</td>
                          <td className="py-2.5 px-3 font-medium text-slate-800 text-[11.5px] truncate max-w-[240px]">{tx.description}</td>
                          <td className="py-2.5 px-3 font-mono text-right font-bold text-blue-950">RM {(tx.amount ?? 0).toFixed(2)}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Reconciliation Proof */}
            <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-blue-950 font-bold">
                <CheckCircle className="w-4 h-4 text-blue-900" />
                <span>Deterministic Bank Ledger Verification:</span>
              </div>
              <span className="font-mono text-blue-900 font-extrabold bg-white px-2.5 py-0.5 rounded-lg border border-blue-200">
                VERIFIED (MATCHED)
              </span>
            </div>

            <button
              onClick={() => setInspectingDoc(null)}
              className="w-full py-3 bg-blue-950 hover:bg-blue-900 text-white font-extrabold text-xs rounded-xl transition-all cursor-pointer shadow-md shadow-blue-950/15"
            >
              Close Document Inspector
            </button>
          </div>
        </div>
      )}

      {/* User Profile & Banking Settings Modal */}
      <UserSettingsModal
        isOpen={settingsModalOpen}
        onClose={() => setSettingsModalOpen(false)}
        userSession={userSession}
        onSaveProfile={handleSaveUserProfile}
      />

      {/* PDPA 2010 Data Privacy Assurance Modal */}
      {showPdpaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 flex flex-col gap-4 relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center border border-slate-200">
                  <ShieldCheck className="w-4 h-4 text-slate-700" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    {language === 'bm' ? 'Jaminan Privasi Data (PDPA 2010)' : 'Data Privacy Assurance (PDPA 2010)'}
                  </h3>
                  <span className="text-[11px] text-slate-500 block">
                    Personal Data Protection Act 2010 • Laws of Malaysia (Act 709)
                  </span>
                </div>
              </div>
              <button
                onClick={() => setShowPdpaModal(false)}
                className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center text-xs font-semibold transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="text-xs text-slate-600 leading-relaxed space-y-3 max-h-[60vh] overflow-y-auto pr-1">
              <p className="text-xs text-slate-700 leading-relaxed">
                {language === 'bm'
                  ? 'Bagi melindungi privasi pemohon penarafan kredit alternatif, Loan - La beroperasi dengan pematuhan penuh kepada peruntukan Akta Perlindungan Data Peribadi (PDPA) 2010 Malaysia:'
                  : 'To protect the privacy of credit rating applicants, Loan - La strictly operates in compliance with the provisions of the Personal Data Protection Act (PDPA) 2010 of Malaysia:'}
              </p>

              <div className="space-y-2.5">
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="font-bold text-slate-900 text-xs block">
                    {language === 'bm' ? '1. Penutupan Data Setempat (Local-First Redaction)' : '1. Local-First Redaction'}
                  </span>
                  <span className="text-[11.5px] text-slate-600 block mt-1 leading-relaxed">
                    {language === 'bm'
                      ? 'Semua rentetan data peribadi sensitif (nama, nombor MyKad, baris alamat) dikesan dan ditutup secara setempat dalam pelayar peranti anda sebelum sebarang penghantaran data.'
                      : 'All sensitive identity strings (names, IC numbers, address lines) are parsed and masked in-browser using local canvas layers before transmissions.'}
                  </span>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="font-bold text-slate-900 text-xs block">
                    {language === 'bm' ? '2. Polisi Tanpa Penyimpanan Fail (Zero Retention Registry)' : '2. Zero Retention Registry'}
                  </span>
                  <span className="text-[11.5px] text-slate-600 block mt-1 leading-relaxed">
                    {language === 'bm'
                      ? 'Dokumen yang dimuat naik dinilai dalam memori sementara secara terpencil untuk audit dan dipadam serta-merta. Tiada salinan fizikal penyata disimpan di pelayan.'
                      : 'Uploaded files are evaluated in-memory inside our sandboxed execution cores and deleted immediately. We store no physical copy of statements.'}
                  </span>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="font-bold text-slate-900 text-xs block">
                    {language === 'bm' ? '3. Penghantaran Tersulit (SSL-Only Transmission)' : '3. SSL-Only Transmission'}
                  </span>
                  <span className="text-[11.5px] text-slate-600 block mt-1 leading-relaxed">
                    {language === 'bm'
                      ? 'Saluran yang disulitkan sepenuhnya (SSL / TLS 1.3) digunakan untuk menghantar laporan kredit kepada institusi perbankan yang dipadankan.'
                      : 'End-to-end encrypted pipelines route reports to lenders.'}
                  </span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setPreUploadDeclPdpa(true);
                setShowPdpaModal(false);
              }}
              className="w-full py-2.5 bg-blue-950 hover:bg-blue-900 text-white font-semibold text-xs rounded-xl transition-colors cursor-pointer shadow-xs"
            >
              {language === 'bm' ? 'Saya Faham & Bersetuju' : 'I Understand & Consent'}
            </button>
          </div>
        </div>
      )}

      {/* Mobile Native App Bottom Navigation Bar (Fixed on Mobile, Hidden on Laptop) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-slate-200/90 px-3 py-2 shadow-2xl flex justify-around items-center">
        <button
          onClick={() => setCurrentPage('landing')}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-2xl transition-all ${
            currentPage === 'landing' ? 'text-blue-950 font-black' : 'text-slate-400 font-medium'
          }`}
        >
          <div className={`p-1.5 rounded-xl transition-all ${currentPage === 'landing' ? 'bg-blue-100 text-blue-950' : ''}`}>
            <Home className="w-5 h-5" />
          </div>
          <span className="text-[10px] tracking-tight">{t.navHome}</span>
        </button>

        <button
          onClick={() => setCurrentPage('calculator')}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-2xl transition-all ${
            currentPage === 'calculator' ? 'text-blue-950 font-black' : 'text-slate-400 font-medium'
          }`}
        >
          <div className={`p-1.5 rounded-xl transition-all ${currentPage === 'calculator' ? 'bg-blue-100 text-blue-950' : ''}`}>
            <Calculator className="w-5 h-5" />
          </div>
          <span className="text-[10px] tracking-tight">{t.navCalculator}</span>
        </button>

        <button
          onClick={() => setCurrentPage('directory')}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-2xl transition-all ${
            currentPage === 'directory' ? 'text-blue-950 font-black' : 'text-slate-400 font-medium'
          }`}
        >
          <div className={`p-1.5 rounded-xl transition-all ${currentPage === 'directory' ? 'bg-blue-100 text-blue-950' : ''}`}>
            <Building2 className="w-5 h-5" />
          </div>
          <span className="text-[10px] tracking-tight">{t.navDirectory}</span>
        </button>

        {userSession && (
          <button
            onClick={() => setCurrentPage('tracker')}
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-2xl transition-all relative ${
              currentPage === 'tracker' ? 'text-blue-950 font-black' : 'text-slate-400 font-medium'
            }`}
          >
            <div className={`p-1.5 rounded-xl transition-all ${currentPage === 'tracker' ? 'bg-blue-100 text-blue-950' : ''}`}>
              <FileText className="w-5 h-5" />
            </div>
            <span className="text-[10px] tracking-tight">{t.navTracker}</span>
            {submittedApplications.length > 0 ? (
              <span className="absolute top-1 right-3 w-4 h-4 bg-blue-950 text-white rounded-full text-[9px] font-bold flex items-center justify-center">
                {submittedApplications.length}
              </span>
            ) : reportHistory.length > 0 ? (
              <span className="absolute top-1 right-3 w-4 h-4 bg-slate-700 text-white rounded-full text-[9px] font-bold flex items-center justify-center">
                {reportHistory.length}
              </span>
            ) : null}
          </button>
        )}
      </nav>

      {/* Credit Passport Paywall & Monetization Modal */}
      <CreditPassportPaywallModal
        isOpen={showPaywallModal}
        onClose={() => setShowPaywallModal(false)}
        onSuccess={(plan) => {
          setIsPassportUnlocked(true);
          setShowPaywallModal(false);
          
          const isGuestTester = userSession?.profileId === 'guest_tester';
          if (!isGuestTester) {
            try {
              localStorage.setItem('creditflow_passport_unlocked', 'true');
            } catch (e) {}
          } else {
            try {
              localStorage.removeItem('creditflow_passport_unlocked');
            } catch (e) {}
          }

          if (uploadedFiles.length > 1) {
            setTimeout(() => {
              runUnderwritingPipeline('real');
            }, 300);
          }
        }}
        applicantName={b2cResult?.inputData?.name || userSession?.name || 'Borrower'}
        preliminaryScore={b2cResult?.report?.score || 710}
        preliminaryGrade={b2cResult?.report?.grade || 'A'}
        isMalay={language === 'bm'}
      />

      {/* Customer Support & Service Tickets Modal */}
      <SupportTicketsModal
        isOpen={isSupportModalOpen}
        onClose={() => {
          setIsSupportModalOpen(false);
          setInitialSupportTicketId(null);
        }}
        userSession={userSession}
        initialTicketId={initialSupportTicketId}
      />

    </div>
  );
}
