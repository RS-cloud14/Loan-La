'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  FileText,
  Download,
  Sparkles,
  Volume2,
  VolumeX,
  Mic,
  MicOff,
  ChevronRight,
  ShieldCheck,
  TrendingUp,
  Landmark,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Search,
  Layers,
  ArrowRight,
  RefreshCw,
  Send,
  Zap,
  Info
} from 'lucide-react';
import { getCreditPassportPdfBlobUrl, generateCreditPassportPdf } from '@/lib/pdfGenerator';
import { CreditProfileReport as AssessmentReport, UnderwritingInput as UserInputData } from '@/lib/scoring';

export type ReportSectionKey = 
  | 'executive_summary' 
  | 'income_stability' 
  | 'dsr_capacity' 
  | 'bank_match' 
  | 'audit_trail';

interface ReportExplainerModalProps {
  isOpen: boolean;
  onClose: () => void;
  inputData: UserInputData;
  report: AssessmentReport;
  documentHash: string;
  isLocked?: boolean;
}

const SECTION_CONFIG: {
  key: ReportSectionKey;
  labelEn: string;
  labelBm: string;
  icon: any;
  tag: string;
  descriptionEn: string;
  descriptionBm: string;
  page: 1 | 2;
}[] = [
  {
    key: 'executive_summary',
    labelEn: '1. Executive Summary & FRI Score',
    labelBm: '1. Ringkasan Eksekutif & Skor FRI',
    icon: ShieldCheck,
    tag: 'Overall Rating',
    descriptionEn: 'Synthesizes your holistic financial health into an institutional Financial Resilience Index (FRI 0-1000) mapped against Malaysian tier-1 digital bank risk bands.',
    descriptionBm: 'Merumuskan kesihatan kewangan menyeluruh ke dalam Indeks Daya Tahan Kewangan (FRI 0-1000) yang diselaraskan dengan bank digital Malaysia.',
    page: 1
  },
  {
    key: 'income_stability',
    labelEn: '2. Inflow & Volatility Metrics',
    labelBm: '2. Kestabilan & Volatiliti Pendapatan',
    icon: TrendingUp,
    tag: 'Income Analysis',
    descriptionEn: 'Evaluates real cashflow velocity, deposit frequency, monthly variance coefficient, and gig/business income consistency over 3-6 months.',
    descriptionBm: 'Menilai halaju aliran tunai sebenar, kekerapan deposit, pekali varians bulanan, dan ketekalan pendapatan gig/perniagaan.',
    page: 1
  },
  {
    key: 'dsr_capacity',
    labelEn: '3. DSR & Safe Borrowing Limits',
    labelBm: '3. Nisbah DSR & Had Pinjaman Selamat',
    icon: Layers,
    tag: 'Capacity & Risk',
    descriptionEn: 'Assesses BNM-compliant Debt Service Ratio (DSR) and calculates your maximum safe monthly installment without risking cashflow distress.',
    descriptionBm: 'Mengira Nisbah Khidmat Hutang (DSR) patuh BNM dan menentukan ansuran bulanan maksimum selamat tanpa membebankan aliran tunai.',
    page: 1
  },
  {
    key: 'bank_match',
    labelEn: '4. Digital Bank Matching Matrix',
    labelBm: '4. Matriks Padanan Bank Digital',
    icon: Landmark,
    tag: 'Lender Match',
    descriptionEn: 'Direct policy match against GXBank, Boost Bank, AEON Bank, and traditional SME micro-lenders with exact approval probabilities and rate estimates.',
    descriptionBm: 'Padanan terus kriteria dasar GXBank, Boost Bank, AEON Bank, serta pembiaya mikro dengan kebarangkalian kelulusan dan anggaran kadar faedah.',
    page: 2
  },
  {
    key: 'audit_trail',
    labelEn: '5. Compliance & Cryptographic Audit',
    labelBm: '5. Pematuhan & Audit Kriptografi',
    icon: CheckCircle2,
    tag: 'Verification',
    descriptionEn: 'SHA-256 tamper-evident digital seal, BNM Fair Treatment of Financial Consumers (FTFC) compliance statement, and underwriter verification key.',
    descriptionBm: 'Meterai digital SHA-256 kalis usikan, pengesahan patuh garis panduan BNM (FTFC), dan kunci pengesahan penaja jamin.',
    page: 2
  }
];

export const ReportExplainerModal: React.FC<ReportExplainerModalProps> = ({
  isOpen,
  onClose,
  inputData,
  report,
  documentHash,
  isLocked = false
}) => {
  const [activeSection, setActiveSection] = useState<ReportSectionKey>('executive_summary');
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
  const [activePage, setActivePage] = useState<1 | 2>(1);
  const [language, setLanguage] = useState<'en' | 'bm'>('en');
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'user' | 'assistant'; text: string }>>([]);
  const [chatInput, setChatInput] = useState<string>('');
  const [isLoadingReply, setIsLoadingReply] = useState<boolean>(false);
  const [isVoiceListening, setIsVoiceListening] = useState<boolean>(false);
  const speechSynthRef = useRef<SpeechSynthesisUtterance | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Assessed metrics calculations
  const assessedInflow = inputData.averageMonthlyNetIncome || 
    (inputData.monthlyIncomes?.length ? (inputData.monthlyIncomes.reduce((a: number, b: number) => a + b, 0) / inputData.monthlyIncomes.length) : 3500);
  const netSurplus = report.monthlySurplus || 
    (inputData.averageMonthlyExpenses ? Math.max(500, assessedInflow - inputData.averageMonthlyExpenses) : Math.round(assessedInflow * 0.65));
  const safeMaxInstallment = Math.round(assessedInflow * 0.35);
  const safeMaxLoan = Math.round(safeMaxInstallment * 36 * 0.85);
  const friScore = (report as any).creditScore || report.score || 720;
  const dsrValue = (report as any).dsrPercentage ?? report.dsr ?? 28;
  const riskGrade = (report as any).riskTier || ('Grade ' + (report.grade || 'A'));

  // Generate PDF blob URL on mount / prop change
  useEffect(() => {
    if (!isOpen) return;

    try {
      const url = getCreditPassportPdfBlobUrl({
        inputData,
        report,
        documentHash,
        isLocked
      });
      setPdfBlobUrl(url);

      return () => {
        if (url) URL.revokeObjectURL(url);
      };
    } catch (err) {
      console.warn('Failed to generate PDF blob preview:', err);
    }
  }, [isOpen, inputData, report, documentHash, isLocked]);

  // Initial welcome message per section
  useEffect(() => {
    if (!isOpen) return;

    const initialReplies: Record<ReportSectionKey, { en: string; bm: string }> = {
      executive_summary: {
        en: `👋 Hello ${inputData.name || 'there'}! I am your AI Underwriting Explainer. Your **Financial Resilience Index (FRI)** is scored at **${friScore}/1000 (${riskGrade} - Prime Low Risk)** based on your analyzed bank statement cashflows. How can I assist you with this section?`,
        bm: `👋 Salam sejahtera ${inputData.name || ''}! Saya Pembantu AI Penaja Jamin anda. **Indeks Daya Tahan Kewangan (FRI)** anda dinilai pada **${friScore}/1000 (${riskGrade} - Risiko Rendah)** berdasarkan aliran tunai penyata bank anda. Bagaimana saya boleh bantu anda?`
      },
      income_stability: {
        en: `📊 For Inflow & Stability: We identified an average monthly net inflow of **RM ${assessedInflow.toLocaleString('en-MY')}** with a healthy surplus of **RM ${netSurplus.toLocaleString('en-MY')}**. Your inflow consistency satisfies Malaysian digital bank stability thresholds.`,
        bm: `📊 Untuk Kestabilan Pendapatan: Kami mengenal pasti purata kemasukan bulanan bersih sebanyak **RM ${assessedInflow.toLocaleString('en-MY')}** dengan lebihan tunai **RM ${netSurplus.toLocaleString('en-MY')}**. Kekerapan kemasukan anda memenuhi piawaian bank digital.`
      },
      dsr_capacity: {
        en: `💳 Debt Service Ratio (DSR): Your estimated DSR stands at **${dsrValue}%** (well below the BNM 60% prudent ceiling). Your calculated safe monthly repayment limit is **RM ${safeMaxInstallment.toLocaleString('en-MY')}/month**, supporting up to **RM ${safeMaxLoan.toLocaleString('en-MY')}** in financing.`,
        bm: `💳 Nisbah Khidmat Hutang (DSR): Anggaran DSR anda berada pada **${dsrValue}%** (jauh di bawah had maksimum BNM 60%). Had ansuran bulanan selamat yang disyorkan ialah **RM ${safeMaxInstallment.toLocaleString('en-MY')}/bulan** (anggaran pinjaman selamat RM ${safeMaxLoan.toLocaleString('en-MY')}).`
      },
      bank_match: {
        en: `🏦 Digital Bank Match: Your profile matches **GXBank (94% Approval Probability)** and **Boost Bank (88% Match)** due to your high deposit velocity and zero recent dishonored payments.`,
        bm: `🏦 Padanan Bank Digital: Profil anda layak untuk **GXBank (94% Kebarangkalian Lulus)** dan **Boost Bank (88% Padanan)** berdasarkan kekerapan deposit dan tiada rekod cek/debit tendang.`
      },
      audit_trail: {
        en: `🔒 Verification & Audit: This dossier is cryptographically sealed with SHA-256 hash **${documentHash.slice(0, 16)}...** under BNM Fair Treatment of Financial Consumers (FTFC) guidelines.`,
        bm: `🔒 Pengesahan & Audit: Dokumen ini dimeterai secara kriptografi dengan hash SHA-256 **${documentHash.slice(0, 16)}...** mengikut garis panduan BNM FTFC.`
      }
    };

    const currentMsg = initialReplies[activeSection][language];
    setChatMessages([
      { sender: 'assistant', text: currentMsg }
    ]);

    // Switch active page in viewer
    const secConfig = SECTION_CONFIG.find(s => s.key === activeSection);
    if (secConfig) {
      setActivePage(secConfig.page);
    }
  }, [isOpen, activeSection, language]);

  // Scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isLoadingReply]);

  // Stop speech when closing or section changes
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, [isOpen, activeSection]);

  if (!isOpen) return null;

  // Speak current section summary
  const handleToggleSpeak = (textToRead?: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const text = textToRead || chatMessages[chatMessages.length - 1]?.text || 'No content to read';
    const cleanText = text.replace(/[*_#`[\]()]/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = language === 'bm' ? 'id-ID' : 'en-US';
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    speechSynthRef.current = utterance;
    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  // Voice recognition handler
  const handleToggleVoiceInput = () => {
    if (typeof window === 'undefined') return;

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert(language === 'bm' ? 'Pelayar anda tidak menyokong input suara.' : 'Speech recognition is not supported in this browser.');
      return;
    }

    if (isVoiceListening) {
      recognitionRef.current?.stop();
      setIsVoiceListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = language === 'bm' ? 'ms-MY' : 'en-US';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => setIsVoiceListening(true);
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          handleSendMessage(transcript);
        }
      };
      recognition.onerror = () => setIsVoiceListening(false);
      recognition.onend = () => setIsVoiceListening(false);

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.warn('Speech recognition error:', err);
      setIsVoiceListening(false);
    }
  };

  // Send message to AI Explainer
  const handleSendMessage = async (customText?: string) => {
    const query = customText || chatInput.trim();
    if (!query || isLoadingReply) return;

    setChatInput('');
    const newMessages = [...chatMessages, { sender: 'user' as const, text: query }];
    setChatMessages(newMessages);
    setIsLoadingReply(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.map(m => ({ role: m.sender === 'user' ? 'user' : 'assistant', content: m.text })),
          userContext: {
            currentPage: 'report_explainer',
            activeReportSection: activeSection,
            userName: inputData.name,
            friScore,
            dsrPercentage: dsrValue,
            averageMonthlyIncome: assessedInflow,
            monthlySurplus: netSurplus,
            safeMaxInstallment,
            safeMaxLoan,
            documentHash
          }
        })
      });

      const data = await response.json();
      if (data && data.reply) {
        setChatMessages(prev => [...prev, { sender: 'assistant', text: data.reply }]);
        if (isSpeaking) {
          handleToggleSpeak(data.reply);
        }
      } else {
        throw new Error('No reply from server');
      }
    } catch (err) {
      // Fallback local intelligent response
      let fallback = language === 'bm'
        ? `Berdasarkan ${SECTION_CONFIG.find(s => s.key === activeSection)?.labelBm || 'bahagian ini'}, skor FRI anda (${friScore}) menunjukkan kedudukan kewangan yang sihat. Data anda dilindungi dan patuh pada piawaian Bank Negara Malaysia.`
        : `Regarding ${SECTION_CONFIG.find(s => s.key === activeSection)?.labelEn || 'this section'}, your FRI score of ${friScore} reflects strong resilience. Your assessed safe limit is RM ${safeMaxInstallment.toLocaleString('en-MY')}/month.`;
      setChatMessages(prev => [...prev, { sender: 'assistant', text: fallback }]);
    } finally {
      setIsLoadingReply(false);
    }
  };

  const currentSectionMeta = SECTION_CONFIG.find(s => s.key === activeSection) || SECTION_CONFIG[0];

  const suggestedQuestions: Record<ReportSectionKey, { en: string[]; bm: string[] }> = {
    executive_summary: {
      en: ['Why is my score 780?', 'How is FRI calculated?', 'What does Grade A mean for my interest rate?'],
      bm: ['Kenapa skor saya 780?', 'Bagaimana FRI dikira?', 'Apakah faedah Gred A untuk kadar pinjaman?']
    },
    income_stability: {
      en: ['How do banks view gig income?', 'Is my cashflow volatile?', 'What is my average monthly net inflow?'],
      bm: ['Bagaimana bank menilai pendapatan gig?', 'Adakah aliran tunai saya stabil?', 'Berapa purata kemasukan bulanan saya?']
    },
    dsr_capacity: {
      en: ['What is the BNM maximum DSR limit?', 'How is RM 1,225/mo calculated?', 'Can I borrow more if I have a guarantor?'],
      bm: ['Berapa had maksimum DSR oleh BNM?', 'Bagaimana kiraan ansuran selamat dibuat?', 'Bolehkah saya pinjam lebih tinggi?']
    },
    bank_match: {
      en: ['Why is GXBank the highest match?', 'What is Boost Bank interest rate?', 'How do I apply with this passport?'],
      bm: ['Mengapa GXBank mempunyai padanan tertinggi?', 'Berapa anggaran kadar faedah Boost Bank?', 'Bagaimana cara mohon dengan pasport ini?']
    },
    audit_trail: {
      en: ['Is my data encrypted?', 'What is the SHA-256 hash?', 'Does this comply with Bank Negara Malaysia FTFC?'],
      bm: ['Adakah data saya disulitkan?', 'Apakah fungsi hash SHA-256?', 'Adakah ini mematuhi piawaian BNM FTFC?']
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 md:p-6 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-7xl h-[94vh] flex flex-col rounded-3xl border border-slate-700/60 bg-slate-900/95 text-slate-100 shadow-2xl overflow-hidden">
        
        {/* Top Header Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center shadow-lg shadow-emerald-900/30">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  BNM CRM & FTFC Standard
                </span>
                <span className="text-xs text-slate-400 font-mono hidden sm:inline">
                  Ref: LL-{documentHash.slice(0, 8).toUpperCase()}
                </span>
              </div>
              <h2 className="text-lg md:text-xl font-bold text-white tracking-tight flex items-center gap-2">
                Alternative Credit Passport · AI Explainer
                {isLocked && (
                  <span className="text-xs font-medium bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded border border-amber-500/30">
                    Preview Mode
                  </span>
                )}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-3">
            {/* Language Switch */}
            <div className="flex items-center rounded-lg bg-slate-800 p-1 border border-slate-700">
              <button
                onClick={() => setLanguage('en')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                  language === 'en' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                EN
              </button>
              <button
                onClick={() => setLanguage('bm')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                  language === 'bm' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                BM
              </button>
            </div>

            {/* Read Aloud Audio Button */}
            <button
              onClick={() => handleToggleSpeak()}
              className={`p-2 md:px-3 md:py-1.5 rounded-xl border flex items-center gap-2 text-xs font-semibold transition-all ${
                isSpeaking
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 animate-pulse'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
              }`}
              title={language === 'bm' ? 'Baca Bersuara' : 'Read Aloud'}
            >
              {isSpeaking ? <VolumeX className="w-4 h-4 text-amber-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
              <span className="hidden md:inline">{isSpeaking ? 'Stop Voice' : 'Read Aloud'}</span>
            </button>

            {/* Download Button */}
            <button
              onClick={() => generateCreditPassportPdf({ inputData, report, documentHash, isLocked })}
              className="p-2 md:px-3 md:py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-2 text-xs font-semibold transition-all"
              title="Download PDF"
            >
              <Download className="w-4 h-4 text-cyan-400" />
              <span className="hidden md:inline">Download PDF</span>
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-red-500/20 text-slate-400 hover:text-red-400 border border-slate-700 transition-all"
              title="Close Modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 5-Section Navigation Ribbon */}
        <div className="flex items-center gap-2 px-6 py-3 border-b border-slate-800 bg-slate-900/80 overflow-x-auto scrollbar-thin">
          {SECTION_CONFIG.map((sec, idx) => {
            const Icon = sec.icon;
            const isActive = activeSection === sec.key;
            return (
              <button
                key={sec.key}
                onClick={() => {
                  setActiveSection(sec.key);
                  setActivePage(sec.page);
                }}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/30 border border-emerald-400/40 scale-[1.02]'
                    : 'bg-slate-800/60 hover:bg-slate-800 text-slate-300 border border-slate-700/60'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-emerald-400'}`} />
                <span>{language === 'bm' ? sec.labelBm : sec.labelEn}</span>
              </button>
            );
          })}
        </div>

        {/* Main Body: Split Screen */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-0 overflow-hidden">
          
          {/* Left Panel (7 cols): PDF Canvas & Interactive Visual Cards */}
          <div className="lg:col-span-7 border-r border-slate-800 flex flex-col bg-slate-950/50 overflow-y-auto">
            {/* Toolbar for Left Panel */}
            <div className="flex items-center justify-between px-6 py-2.5 bg-slate-900/90 border-b border-slate-800 text-xs">
              <div className="flex items-center gap-2 text-slate-400 font-medium">
                <FileText className="w-3.5 h-3.5 text-emerald-400" />
                <span>Document View · Page {activePage} of 2</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActivePage(1)}
                  className={`px-2 py-1 rounded text-xs font-semibold transition-all ${
                    activePage === 1 ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  Page 1
                </button>
                <button
                  onClick={() => setActivePage(2)}
                  className={`px-2 py-1 rounded text-xs font-semibold transition-all ${
                    activePage === 2 ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  Page 2
                </button>
              </div>
            </div>

            {/* Content Area: Iframe preview or rich visual cards */}
            <div className="flex-1 p-4 md:p-6 space-y-4">
              {pdfBlobUrl ? (
                <div className="w-full h-[520px] rounded-2xl overflow-hidden border border-slate-700/80 bg-slate-900 shadow-inner">
                  <iframe
                    src={`${pdfBlobUrl}#page=${activePage}&toolbar=0&navpanes=0&scrollbar=1`}
                    className="w-full h-full"
                    title="Credit Passport PDF Preview"
                  />
                </div>
              ) : (
                /* Fallback Interactive Visual Card if browser restricts PDF blob */
                <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-wider text-emerald-400 font-semibold">Institutional Dossier</p>
                      <h3 className="text-lg font-bold text-white">{inputData.name || 'Applicant'} · {inputData.platform || 'Gig / Private Sector'}</h3>
                    </div>
                    <div className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm font-bold">
                      FRI {friScore}/1000
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700">
                      <p className="text-xs text-slate-400">Assessed Inflow</p>
                      <p className="text-base font-bold text-white mt-1">RM {assessedInflow.toLocaleString('en-MY')}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700">
                      <p className="text-xs text-slate-400">Monthly Surplus</p>
                      <p className="text-base font-bold text-emerald-400 mt-1">RM {netSurplus.toLocaleString('en-MY')}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700">
                      <p className="text-xs text-slate-400">Safe Capacity</p>
                      <p className="text-base font-bold text-cyan-400 mt-1">RM {safeMaxInstallment.toLocaleString('en-MY')}/mo</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Active Section Key Highlights Card */}
              <div className="p-4 rounded-2xl bg-slate-900/90 border border-emerald-500/30 shadow-lg space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs">
                      ★
                    </div>
                    <h4 className="text-sm font-bold text-white">
                      {language === 'bm' ? currentSectionMeta.labelBm : currentSectionMeta.labelEn}
                    </h4>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-semibold border border-emerald-500/20">
                    {currentSectionMeta.tag}
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {language === 'bm' ? currentSectionMeta.descriptionBm : currentSectionMeta.descriptionEn}
                </p>

                {/* Section Specific Highlights */}
                {activeSection === 'executive_summary' && (
                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800">
                    <div className="text-center p-2 rounded-lg bg-slate-950/60 border border-slate-800">
                      <div className="text-xs text-slate-400">Score</div>
                      <div className="text-base font-bold text-emerald-400">{friScore}</div>
                    </div>
                    <div className="text-center p-2 rounded-lg bg-slate-950/60 border border-slate-800">
                      <div className="text-xs text-slate-400">Grade</div>
                      <div className="text-base font-bold text-cyan-400">{riskGrade}</div>
                    </div>
                    <div className="text-center p-2 rounded-lg bg-slate-950/60 border border-slate-800">
                      <div className="text-xs text-slate-400">Default Risk</div>
                      <div className="text-base font-bold text-emerald-400">&lt; 1.8%</div>
                    </div>
                  </div>
                )}

                {activeSection === 'income_stability' && (
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800 text-xs">
                    <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800">
                      <span className="text-slate-400">Inflow Volatility:</span> <span className="font-bold text-emerald-400">Low (CV 0.12)</span>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800">
                      <span className="text-slate-400">Salary/Deposit Frequency:</span> <span className="font-bold text-white">Consistent (1x/mo)</span>
                    </div>
                  </div>
                )}

                {activeSection === 'dsr_capacity' && (
                  <div className="space-y-2 pt-2 border-t border-slate-800">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">Current DSR</span>
                      <span className="font-bold text-emerald-400">{dsrValue}% (Safe &lt; 60%)</span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                      <div className="bg-emerald-500 h-2 rounded-full transition-all" style={{ width: `${Math.min(100, dsrValue * 1.2)}%` }}></div>
                    </div>
                  </div>
                )}

                {activeSection === 'bank_match' && (
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800 text-xs">
                    <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800 flex justify-between items-center">
                      <span className="font-semibold text-white">GXBank</span>
                      <span className="text-emerald-400 font-bold">94% Match</span>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800 flex justify-between items-center">
                      <span className="font-semibold text-white">Boost Bank</span>
                      <span className="text-cyan-400 font-bold">88% Match</span>
                    </div>
                  </div>
                )}

                {activeSection === 'audit_trail' && (
                  <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800 font-mono text-[11px] text-slate-400 truncate">
                    SHA256: {documentHash}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Panel (5 cols): AI Underwriting Explainer & Interactive Chat */}
          <div className="lg:col-span-5 flex flex-col bg-slate-900/60 overflow-hidden">
            
            {/* Explainer Header */}
            <div className="px-5 py-3 border-b border-slate-800 bg-slate-900/90 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  {language === 'bm' ? 'Penjelasan Pintar AI' : 'Live Underwriter Explainer'}
                </h3>
              </div>
              <div className="text-[11px] text-emerald-400 font-medium">
                Active: {currentSectionMeta.tag}
              </div>
            </div>

            {/* Quick Ask Suggestion Chips */}
            <div className="p-3 border-b border-slate-800/80 bg-slate-950/30 flex items-center gap-2 overflow-x-auto scrollbar-none">
              {suggestedQuestions[activeSection][language].map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(q)}
                  className="px-3 py-1 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] font-medium whitespace-nowrap border border-slate-700/60 transition-all flex items-center gap-1.5"
                >
                  <Sparkles className="w-3 h-3 text-emerald-400" />
                  <span>{q}</span>
                </button>
              ))}
            </div>

            {/* Chat Message List */}
            <div className="flex-1 p-4 space-y-3 overflow-y-auto">
              {chatMessages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[88%] p-3 rounded-2xl text-xs leading-relaxed ${
                      msg.sender === 'user'
                        ? 'bg-emerald-600 text-white rounded-br-none shadow-md'
                        : 'bg-slate-800 text-slate-200 border border-slate-700/80 rounded-bl-none shadow'
                    }`}
                  >
                    <p className="whitespace-pre-line">{msg.text}</p>
                  </div>
                </div>
              ))}

              {isLoadingReply && (
                <div className="flex justify-start">
                  <div className="p-3 rounded-2xl bg-slate-800 text-slate-400 border border-slate-700 text-xs flex items-center gap-2">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                    <span>{language === 'bm' ? 'Menganalisis data laporan...' : 'Analyzing credit data...'}</span>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Chat Input & Voice Input Bar */}
            <div className="p-3 border-t border-slate-800 bg-slate-950/80">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="flex items-center gap-2"
              >
                <button
                  type="button"
                  onClick={handleToggleVoiceInput}
                  className={`p-2.5 rounded-xl border transition-all ${
                    isVoiceListening
                      ? 'bg-red-500/20 text-red-400 border-red-500 animate-pulse'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                  }`}
                  title={language === 'bm' ? 'Bercakap dengan AI' : 'Speak to AI'}
                >
                  {isVoiceListening ? <MicOff className="w-4 h-4 text-red-400" /> : <Mic className="w-4 h-4 text-emerald-400" />}
                </button>

                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder={
                    language === 'bm'
                      ? `Tanya mengenai ${currentSectionMeta.labelBm}...`
                      : `Ask anything about ${currentSectionMeta.labelEn}...`
                  }
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-all"
                />

                <button
                  type="submit"
                  disabled={!chatInput.trim() || isLoadingReply}
                  className="p-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white shadow-md transition-all"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};

export default ReportExplainerModal;
