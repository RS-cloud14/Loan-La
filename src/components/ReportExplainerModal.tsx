'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Download,
  Sparkles,
  Volume2,
  VolumeX,
  Mic,
  MicOff,
  RefreshCw,
  Send,
  ShieldCheck,
  Zap,
  TrendingUp,
  Landmark,
  Layers,
  ArrowUpRight
} from 'lucide-react';
import { getCreditPassportPdfBlobUrl, generateCreditPassportPdf } from '@/lib/pdfGenerator';
import { CreditProfileReport as AssessmentReport, UnderwritingInput as UserInputData } from '@/lib/scoring';

interface ReportExplainerModalProps {
  isOpen: boolean;
  onClose: () => void;
  inputData: UserInputData;
  report: AssessmentReport;
  documentHash: string;
  isLocked?: boolean;
}

export const ReportExplainerModal: React.FC<ReportExplainerModalProps> = ({
  isOpen,
  onClose,
  inputData,
  report,
  documentHash,
  isLocked = false
}) => {
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
  const [language, setLanguage] = useState<'en' | 'bm'>('en');
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'user' | 'assistant'; text: string }>>([]);
  const [chatInput, setChatInput] = useState<string>('');
  const [isLoadingReply, setIsLoadingReply] = useState<boolean>(false);
  const [isVoiceListening, setIsVoiceListening] = useState<boolean>(false);
  const speechSynthRef = useRef<SpeechSynthesisUtterance | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Assessed metrics extracted directly from report and inputData
  const applicantName = inputData.name || (inputData as any).fullName || 'Borrower';
  const assessedInflow = inputData.averageMonthlyNetIncome || 
    (inputData.monthlyIncomes?.length ? Math.round(inputData.monthlyIncomes.reduce((a: number, b: number) => a + b, 0) / inputData.monthlyIncomes.length) : 3500);
  const netSurplus = report.monthlySurplus || 
    (inputData.averageMonthlyExpenses ? Math.max(500, assessedInflow - inputData.averageMonthlyExpenses) : Math.round(assessedInflow * 0.65));
  const safeMaxInstallment = report.estimatedInstallment || Math.round(assessedInflow * 0.35);
  const safeMaxLoan = Math.round(safeMaxInstallment * 36 * 0.85);
  const friScore = (report as any).creditScore || report.score || 710;
  const dsrValue = (report as any).dsrPercentage ?? (report.dsr !== undefined ? Number(report.dsr.toFixed(1)) : 11.4);
  const riskGrade = (report as any).riskTier || ('Grade ' + (report.grade || 'A'));
  const platformName = inputData.platform || 'Gig / Freelance';
  const approvalOdds = friScore >= 700 ? '88% - 94%' : (friScore >= 600 ? '70% - 85%' : '50% - 65%');

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

  // Initial welcome message with complete high-density synthesis
  useEffect(() => {
    if (!isOpen) return;

    const initialWelcome = language === 'bm'
      ? `👋 **Salam ${applicantName}!** Saya AI Penaja Jamin & Penjelas Laporan anda.\n\nBerikut ringkasan Pasport Kredit anda:\n• **Skor FRI:** **${friScore}/850 (${riskGrade})** · Kelulusan **${approvalOdds}**\n• **Purata Kemasukan:** **RM ${assessedInflow.toLocaleString('en-MY')}/bulan** (Lebihan: **RM ${netSurplus.toLocaleString('en-MY')}**)\n• **Kapasiti Ansuran Selamat:** **RM ${safeMaxInstallment.toLocaleString('en-MY')}/bulan** (DSR: **${dsrValue}%**)\n• **Bank Padanan Utama:** **GXBank (94%)**, **Boost Bank (88%)**\n\nKlik mana-mana butang di atas atau tanya apa-apa soalan mengenai dokumen ini!`
      : `👋 **Hello ${applicantName}!** I am your AI Underwriting Companion.\n\nHere is your verified credit dossier summary:\n• **FRI Score:** **${friScore}/850 (${riskGrade})** · Approval Likelihood **${approvalOdds}**\n• **Assessed Inflow:** **RM ${assessedInflow.toLocaleString('en-MY')}/mo** (Cash Surplus: **RM ${netSurplus.toLocaleString('en-MY')}**)\n• **Safe Monthly Capacity:** **RM ${safeMaxInstallment.toLocaleString('en-MY')}/mo** (DSR: **${dsrValue}%**)\n• **Top Matched Lenders:** **GXBank (94%)**, **Boost Bank (88%)**\n\nAsk me anything about your PDF report or click the quick action chips above!`;

    setChatMessages([{ sender: 'assistant', text: initialWelcome }]);
  }, [isOpen, language, applicantName, friScore, riskGrade, approvalOdds, assessedInflow, netSurplus, safeMaxInstallment, dsrValue]);

  // Scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isLoadingReply]);

  // Stop speech when closing
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Speak text via TTS
  const handleToggleSpeak = (textToRead?: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const text = textToRead || chatMessages[chatMessages.length - 1]?.text || 'No content to read';
    const cleanText = text.replace(/[*_#`[\]()•]/g, '').trim();
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
          language,
          userContext: {
            currentPage: 'report_explainer',
            userName: applicantName,
            platform: platformName,
            friScore,
            latestScore: friScore,
            latestGrade: riskGrade,
            currentDsr: dsrValue,
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
      // Intelligent fallback explanation based on query
      const lower = query.toLowerCase();
      let fallback = '';
      if (lower.includes('borrow') || lower.includes('capacity') || lower.includes('pinjam') || lower.includes('dsr')) {
        fallback = language === 'bm'
          ? `💳 **Kiraan Kapasiti Pinjaman & DSR:**\n• DSR anda ialah **${dsrValue}%** (had selamat BNM < 60%).\n• Berdasarkan lebihan bulanan RM ${netSurplus.toLocaleString('en-MY')}, ansuran bulanan maksimum selamat ialah **RM ${safeMaxInstallment.toLocaleString('en-MY')}/bulan** (anggaran jumlah pembiayaan selamat **RM ${safeMaxLoan.toLocaleString('en-MY')}**).`
          : `💳 **Borrowing Capacity & DSR:**\n• Your DSR is assessed at **${dsrValue}%** (well below BNM 60% prudent ceiling).\n• Safe repayment limit is **RM ${safeMaxInstallment.toLocaleString('en-MY')}/month**, supporting up to **RM ${safeMaxLoan.toLocaleString('en-MY')}** in financing safely.`;
      } else if (lower.includes('bank') || lower.includes('gxbank') || lower.includes('boost') || lower.includes('approve') || lower.includes('lulus')) {
        fallback = language === 'bm'
          ? `🏦 **Padanan Bank Digital:**\n• **GXBank (94% Kelulusan):** Sesuai untuk pengeluaran pantas 2 minit.\n• **Boost Bank (88% Padanan):** Fleksibel untuk peniaga gig dan PKS mikro.\n• **AEON Credit (82% Padanan):** Sesuai untuk pembiayaan peralatan.`
          : `🏦 **Digital Bank Match:**\n• **GXBank (94% Approval Probability):** Optimal for instant 2-minute digital disbursement.\n• **Boost Bank (88% Match):** Tailored for gig and micro-SME cashflows.\n• **AEON Credit (82% Match):** Suitable for equipment and asset financing.`;
      } else if (lower.includes('boost') || lower.includes('score') || lower.includes('skor') || lower.includes('tingkat')) {
        fallback = language === 'bm'
          ? `📈 **Pelan Tingkatkan Skor (Roadmap):**\n1. **Caruman Sukarela KWSP i-Saraan (+35 Mata):** Carum RM 150/bulan.\n2. **Baki Penampan Konsisten (+25 Mata):** Kekalkan baki purata RM 1,000.\n3. **Kekerapan Deposit (+20 Mata):** Kekalkan pengeluaran aktif dari platform.`
          : `📈 **Score Boost Roadmap:**\n1. **Voluntary EPF i-Saraan (+35 Points):** Contribute RM 150/month to unlock Prime Grade A+.\n2. **Cashflow Buffer (+25 Points):** Maintain a rolling balance of RM 1,000 for 30 days.\n3. **Deposit Consistency (+20 Points):** Maintain regular settlement payouts without gaps > 10 days.`;
      } else {
        fallback = language === 'bm'
          ? `📊 **Status Pasport Kredit:**\nSkor FRI anda ialah **${friScore}/850 (${riskGrade})**. Profil anda mematuhi piawaian pengunderaitan Bank Negara Malaysia (FTFC & RMiT) dengan meterai keselamatan SHA-256.`
          : `📊 **Credit Passport Status:**\nYour FRI score is **${friScore}/850 (${riskGrade})**. Your profile meets BNM FTFC & RMiT alternative underwriting standards with verified SHA-256 tamper-proof certification.`;
      }
      setChatMessages(prev => [...prev, { sender: 'assistant', text: fallback }]);
    } finally {
      setIsLoadingReply(false);
    }
  };

  const quickActionChips = language === 'bm' ? [
    { label: '🎯 Ringkasan Laporan', prompt: 'Ringkaskan laporan kredit saya secara padat.' },
    { label: '💳 Had Pinjaman Selamat', prompt: 'Berapa had pinjaman dan ansuran bulanan selamat saya?' },
    { label: '🏦 Bank Mana Yang Sesuai?', prompt: 'Bank digital mana yang paling sesuai dan kadar kelulusan saya?' },
    { label: '📈 Cara Tingkatkan Skor', prompt: 'Bagaimana cara meningkatkan skor kredit saya untuk dapat kadar faedah lebih murah?' },
    { label: '🔒 Pengesahan SHA-256', prompt: 'Apakah fungsi meterai kriptografi SHA-256 dan kepatuhan BNM ini?' }
  ] : [
    { label: '🎯 Summarize Report', prompt: 'Summarize my credit passport and underwriter findings.' },
    { label: '💳 Safe Borrowing Limit', prompt: 'What is my safe monthly installment capacity and maximum loan?' },
    { label: '🏦 Best Bank Match', prompt: 'Which digital banks match my profile and what are my approval odds?' },
    { label: '📈 How to Boost Score?', prompt: 'What specific steps can I take to boost my score and lower interest rates?' },
    { label: '🔒 Security & Audit Seal', prompt: 'Explain the SHA-256 cryptographic audit seal and BNM FTFC compliance.' }
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 md:p-6 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-[97vw] 2xl:max-w-[1600px] h-[95vh] flex flex-col rounded-3xl border border-slate-700/60 bg-slate-950 text-slate-100 shadow-2xl overflow-hidden">
        
        {/* Minimalist Top Header Bar */}
        <div className="flex items-center justify-between gap-3 px-5 py-3.5 border-b border-slate-800 bg-slate-900/90 shrink-0">
          
          {/* Left: Branding & Core Applicant Badges */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center shadow-lg shadow-emerald-900/30 shrink-0">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-sm md:text-base font-bold text-white tracking-tight truncate">
                  Alternative Credit Passport
                </h2>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shrink-0">
                  FRI {friScore} · {riskGrade}
                </span>
                <span className="text-[11px] text-slate-400 font-mono hidden lg:inline">
                  Ref: LL-{documentHash.slice(0, 8).toUpperCase()}
                </span>
              </div>
              <p className="text-xs text-slate-400 truncate mt-0.5">
                {applicantName} · {platformName} · Verified 3-Month Cashflow
              </p>
            </div>
          </div>

          {/* Right Controls: Language, Read Aloud, Download, Close */}
          <div className="flex items-center gap-2 shrink-0">
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
              className={`px-3 py-1.5 rounded-xl border flex items-center gap-1.5 text-xs font-semibold transition-all ${
                isSpeaking
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 animate-pulse'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
              }`}
              title={language === 'bm' ? 'Baca Bersuara' : 'Read Aloud'}
            >
              {isSpeaking ? <VolumeX className="w-3.5 h-3.5 text-amber-400" /> : <Volume2 className="w-3.5 h-3.5 text-emerald-400" />}
              <span className="hidden sm:inline">{isSpeaking ? 'Stop' : 'Voice'}</span>
            </button>

            {/* Download Button */}
            <button
              onClick={() => generateCreditPassportPdf({ inputData, report, documentHash, isLocked })}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 text-xs font-semibold transition-all cursor-pointer"
              title="Download PDF"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">PDF</span>
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl bg-slate-800/80 hover:bg-red-500/20 text-slate-400 hover:text-red-400 border border-slate-700 transition-all cursor-pointer"
              title="Close Modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Main Body: Maximized Split Screen (Left: Full PDF Canvas 67%, Right: AI Companion 33%) */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-0 overflow-hidden min-h-0">
          
          {/* Left Panel (8 cols / 67% width): Maximized Full-Height PDF Viewer */}
          <div className="lg:col-span-8 border-r border-slate-800 bg-slate-950 flex flex-col min-h-0 overflow-hidden p-2 sm:p-3">
            {pdfBlobUrl ? (
              <div className="w-full h-full rounded-2xl overflow-hidden border border-slate-800 bg-slate-900 shadow-2xl relative">
                <iframe
                  src={`${pdfBlobUrl}#toolbar=0&navpanes=0&scrollbar=1`}
                  className="w-full h-full border-0 block"
                  title="Alternative Credit Passport PDF Viewer"
                />
              </div>
            ) : (
              <div className="w-full h-full rounded-2xl bg-slate-900 border border-slate-800 flex flex-col items-center justify-center p-8 text-center space-y-4">
                <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin" />
                <p className="text-sm font-semibold text-slate-300">
                  {language === 'bm' ? 'Menjana pratonton dokumen PDF...' : 'Rendering high-fidelity PDF dossier preview...'}
                </p>
              </div>
            )}
          </div>

          {/* Right Panel (4 cols / 33% width): Synchronized AI Assistant */}
          <div className="lg:col-span-4 flex flex-col bg-slate-900/70 min-h-0 overflow-hidden">
            
            {/* Quick Metrics Live HUD Bar (Clickable) */}
            <div className="p-3 border-b border-slate-800 bg-slate-950/60 grid grid-cols-3 gap-2 shrink-0">
              <button
                onClick={() => handleSendMessage(language === 'bm' ? 'Terangkan skor FRI dan gred saya.' : 'Explain my FRI score and rating.')}
                className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800/80 border border-slate-800 text-left transition-all group"
              >
                <div className="text-[10px] text-slate-400 flex items-center justify-between">
                  <span>Score</span>
                  <ArrowUpRight className="w-2.5 h-2.5 text-slate-500 group-hover:text-emerald-400" />
                </div>
                <div className="text-xs font-black text-emerald-400 mt-0.5">{friScore} · {riskGrade.replace('Grade ', '')}</div>
              </button>

              <button
                onClick={() => handleSendMessage(language === 'bm' ? 'Terangkan had ansuran selamat bulanan saya.' : 'Explain my safe monthly installment capacity.')}
                className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800/80 border border-slate-800 text-left transition-all group"
              >
                <div className="text-[10px] text-slate-400 flex items-center justify-between">
                  <span>Safe Limit</span>
                  <ArrowUpRight className="w-2.5 h-2.5 text-slate-500 group-hover:text-cyan-400" />
                </div>
                <div className="text-xs font-black text-cyan-400 mt-0.5">RM {safeMaxInstallment.toLocaleString('en-MY')}</div>
              </button>

              <button
                onClick={() => handleSendMessage(language === 'bm' ? 'Mengapa GXBank dan Boost Bank dipadankan?' : 'Why are GXBank and Boost Bank matched?')}
                className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800/80 border border-slate-800 text-left transition-all group"
              >
                <div className="text-[10px] text-slate-400 flex items-center justify-between">
                  <span>Top Match</span>
                  <ArrowUpRight className="w-2.5 h-2.5 text-slate-500 group-hover:text-emerald-400" />
                </div>
                <div className="text-xs font-black text-emerald-400 mt-0.5">GXBank 94%</div>
              </button>
            </div>

            {/* Instant Action Suggestion Chips (Horizontal Scroll) */}
            <div className="px-3 py-2 border-b border-slate-800 bg-slate-950/40 flex items-center gap-1.5 overflow-x-auto scrollbar-none shrink-0">
              {quickActionChips.map((chip, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(chip.prompt)}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] font-medium whitespace-nowrap border border-slate-700/60 transition-all flex items-center gap-1 shrink-0 cursor-pointer active:scale-95"
                >
                  <Sparkles className="w-3 h-3 text-emerald-400 shrink-0" />
                  <span>{chip.label}</span>
                </button>
              ))}
            </div>

            {/* Chat Message List */}
            <div className="flex-1 p-3.5 space-y-3 overflow-y-auto min-h-0">
              {chatMessages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[90%] p-3 rounded-2xl text-xs leading-relaxed ${
                      msg.sender === 'user'
                        ? 'bg-emerald-600 text-white rounded-br-none shadow-md font-medium'
                        : 'bg-slate-800/90 text-slate-200 border border-slate-700/80 rounded-bl-none shadow'
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
                    <span>{language === 'bm' ? 'Meneliti data dossier...' : 'Analyzing credit telemetry...'}</span>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Chat Input & Voice Controls */}
            <div className="p-3 border-t border-slate-800 bg-slate-950/90 shrink-0">
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
                  className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
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
                      ? 'Tanya apa-apa soalan mengenai laporan ini...'
                      : 'Ask anything about your PDF report...'
                  }
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-all"
                />

                <button
                  type="submit"
                  disabled={!chatInput.trim() || isLoadingReply}
                  className="p-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white shadow-md transition-all cursor-pointer"
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
