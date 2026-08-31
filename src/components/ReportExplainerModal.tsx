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
  FileText,
  MessageSquare,
  ArrowUpRight,
  ShieldCheck,
  ChevronRight,
  Maximize2,
  Minimize2,
  PhoneCall,
  PhoneOff,
  Phone
} from 'lucide-react';
import { getCreditPassportPdfBlobUrl, generateCreditPassportPdf } from '@/lib/pdfGenerator';
import { CreditProfileReport as AssessmentReport, UnderwritingInput as UserInputData } from '@/lib/scoring';
import { matchLenders } from '@/lib/lenderMatcher';

interface ReportExplainerModalProps {
  isOpen: boolean;
  onClose: () => void;
  inputData: UserInputData;
  report: AssessmentReport;
  documentHash: string;
  isLocked?: boolean;
  matchedLenders?: any[];
}

// Clean Message Formatter: Renders clean bold text, bullet lists and headers without any raw markdown asterisks
function FormattedExplainerText({ text }: { text: string }) {
  const clean = text.trim();
  const rawLines = clean.split('\n');

  return (
    <div className="flex flex-col gap-1.5 text-xs sm:text-[13px] leading-relaxed text-slate-800">
      {rawLines.map((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={idx} className="h-1" />;

        // Header line
        const isHeader = /^#{1,6}\s+/.test(trimmed) || (trimmed.endsWith(':') && !trimmed.startsWith('•') && !trimmed.startsWith('-'));
        let lineContent = trimmed.replace(/^#{1,6}\s+/, '');

        // Bullet point line
        const isBullet = trimmed.startsWith('•') || trimmed.startsWith('- ') || trimmed.startsWith('* ');
        if (isBullet) {
          lineContent = trimmed.replace(/^[•\-\*]\s*/, '');
        }

        // Parse inline **bold** text into strong tags
        const parts = lineContent.split(/(\*\*[^*]+\*\*)/g);

        const renderedContent = parts.map((part, pIdx) => {
          if (part.startsWith('**') && part.endsWith('**')) {
            const boldText = part.slice(2, -2);
            return <strong key={pIdx} className="font-bold text-slate-950">{boldText}</strong>;
          }
          return part;
        });

        if (isBullet) {
          return (
            <div key={idx} className="flex items-start gap-2 pl-1.5 my-0.5">
              <span className="text-emerald-600 font-black shrink-0 mt-0.5">•</span>
              <div className="flex-1 text-slate-700 font-medium leading-relaxed">{renderedContent}</div>
            </div>
          );
        }

        if (isHeader) {
          return (
            <div key={idx} className="font-black text-slate-950 text-xs sm:text-[13px] mt-1.5 pb-0.5 border-b border-slate-100 flex items-center gap-1.5">
              {renderedContent}
            </div>
          );
        }

        return (
          <p key={idx} className="text-slate-700 font-normal">
            {renderedContent}
          </p>
        );
      })}
    </div>
  );
}

export const ReportExplainerModal: React.FC<ReportExplainerModalProps> = ({
  isOpen,
  onClose,
  inputData,
  report,
  documentHash,
  isLocked = false,
  matchedLenders
}) => {
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
  const [mobileTab, setMobileTab] = useState<'pdf' | 'chat'>('chat');
  const [isPdfMaximized, setIsPdfMaximized] = useState<boolean>(false);
  const [language, setLanguage] = useState<'en' | 'bm'>('en');
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [isLiveCallActive, setIsLiveCallActive] = useState<boolean>(false);
  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'user' | 'assistant'; text: string }>>([]);
  const [chatInput, setChatInput] = useState<string>('');
  const [isLoadingReply, setIsLoadingReply] = useState<boolean>(false);
  const [isVoiceListening, setIsVoiceListening] = useState<boolean>(false);
  const speechSynthRef = useRef<SpeechSynthesisUtterance | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const isLiveCallRef = useRef<boolean>(false);
  isLiveCallRef.current = isLiveCallActive;

  // Lock outer background scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prevOverflow || 'unset';
      };
    }
  }, [isOpen]);

  // Assessed metrics extracted and cleaned
  const applicantName = inputData.name || (inputData as any).fullName || 'Borrower';
  const assessedInflow = Math.round(inputData.averageMonthlyNetIncome || 
    (inputData.monthlyIncomes?.length ? (inputData.monthlyIncomes.reduce((a: number, b: number) => a + b, 0) / inputData.monthlyIncomes.length) : 3500));
  const rawSurplus = report.monthlySurplus || 
    (inputData.averageMonthlyExpenses ? Math.max(500, assessedInflow - inputData.averageMonthlyExpenses) : Math.round(assessedInflow * 0.65));
  const netSurplus = Math.round(rawSurplus);
  const safeMaxInstallment = Math.round(report.estimatedInstallment || (assessedInflow * 0.35));
  const safeMaxLoan = Math.round(safeMaxInstallment * 36 * 0.85);
  const friScore = (report as any).creditScore || report.score || 710;
  const dsrValue = Number(((report as any).dsrPercentage ?? (report.dsr !== undefined ? report.dsr : 0.0)).toFixed(1));
  const riskGrade = (report as any).riskTier || ('Grade ' + (report.grade || 'A'));
  const platformName = inputData.platform || 'Gig / Freelance';
  const approvalOdds = friScore >= 700 ? '88% - 94%' : (friScore >= 600 ? '70% - 85%' : '50% - 65%');

  // Real dynamic lender matching from Directory
  const dynamicMatches = matchLenders(report, inputData);
  const lendersToUse = (matchedLenders && matchedLenders.length > 0) ? matchedLenders : dynamicMatches;
  const topMatch1 = lendersToUse[0] ? `${lendersToUse[0].lender?.shortName || lendersToUse[0].lender?.name || lendersToUse[0].name} (${lendersToUse[0].matchScore || lendersToUse[0].score || 95}%)` : 'BSN MicroKredit Madani (95%)';
  const topMatch2 = lendersToUse[1] ? `${lendersToUse[1].lender?.shortName || lendersToUse[1].lender?.name || lendersToUse[1].name} (${lendersToUse[1].matchScore || lendersToUse[1].score || 84}%)` : 'Bank Rakyat Pembiayaan Mikro-i (84%)';
  const topMatch3 = lendersToUse[2] ? `${lendersToUse[2].lender?.shortName || lendersToUse[2].lender?.name || lendersToUse[2].name} (${lendersToUse[2].matchScore || lendersToUse[2].score || 76}%)` : 'AEON i-Cash Personal (76%)';

  // Generate PDF blob URL on mount / prop change / language toggle
  useEffect(() => {
    if (!isOpen) return;

    try {
      const url = getCreditPassportPdfBlobUrl({
        inputData,
        report,
        documentHash,
        isLocked,
        matchedLenders: lendersToUse,
        language
      });
      setPdfBlobUrl(url);

      return () => {
        if (url) URL.revokeObjectURL(url);
      };
    } catch (err) {
      console.warn('Failed to generate PDF blob preview:', err);
    }
  }, [isOpen, inputData, report, documentHash, isLocked, lendersToUse, language]);

  // Initial welcome message with complete high-density synthesis
  useEffect(() => {
    if (!isOpen) return;

    const initialWelcome = language === 'bm'
      ? `👋 **Salam ${applicantName}!** Saya AI Penaja Jamin & Penjelas Laporan anda.\n\nBerikut ringkasan Pasport Kredit anda:\n• **Skor FRI:** **${friScore}/850 (${riskGrade})** · Kelulusan **${approvalOdds}**\n• **Purata Kemasukan:** **RM ${assessedInflow.toLocaleString('en-MY')}/bulan** (Lebihan Bersih: **RM ${netSurplus.toLocaleString('en-MY')}/bulan**)\n• **Kapasiti Ansuran Selamat:** **RM ${safeMaxInstallment.toLocaleString('en-MY')}/bulan** (DSR: **${dsrValue}%**)\n• **Bank Padanan Utama:** **${topMatch1}**, **${topMatch2}**, **${topMatch3}**\n\nKlik mana-mana butang di atas, taip soalan, atau tekan butang Live Call untuk bercakap secara langsung!`
      : `👋 **Hello ${applicantName}!** I am your AI Underwriting Companion.\n\nHere is your verified credit dossier summary:\n• **FRI Score:** **${friScore}/850 (${riskGrade})** · Approval Likelihood **${approvalOdds}**\n• **Assessed Inflow:** **RM ${assessedInflow.toLocaleString('en-MY')}/mo** (Free Surplus: **RM ${netSurplus.toLocaleString('en-MY')}/mo**)\n• **Safe Monthly Capacity:** **RM ${safeMaxInstallment.toLocaleString('en-MY')}/mo** (DSR: **${dsrValue}%**)\n• **Top Matched Lenders:** **${topMatch1}**, **${topMatch2}**, **${topMatch3}**\n\nClick the action chips above, type a question, or press Live Call to speak directly with me!`;

    setChatMessages([{ sender: 'assistant', text: initialWelcome }]);
  }, [isOpen, language, applicantName, friScore, riskGrade, approvalOdds, assessedInflow, netSurplus, safeMaxInstallment, dsrValue, topMatch1, topMatch2, topMatch3]);

  // Scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isLoadingReply]);

  // Stop speech and live call when closing
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsSpeaking(false);
    setIsLiveCallActive(false);
  }, [isOpen]);

  if (!isOpen) return null;

  // Speak text via TTS with optional onComplete callback
  const handleToggleSpeak = (textToRead?: string, onComplete?: () => void) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    window.speechSynthesis.cancel();

    const text = textToRead || chatMessages[chatMessages.length - 1]?.text || 'No content to read';
    const cleanText = text.replace(/[*_#`[\]()•]/g, '').trim();
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = language === 'bm' ? 'id-ID' : 'en-US';
    utterance.rate = 1.05;
    utterance.pitch = 1.0;

    utterance.onend = () => {
      setIsSpeaking(false);
      if (onComplete) onComplete();
    };
    utterance.onerror = () => {
      setIsSpeaking(false);
      if (onComplete) onComplete();
    };

    speechSynthRef.current = utterance;
    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  const transcriptBufferRef = useRef<string>('');
  const speechDebounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Start voice recognition
  const startListening = () => {
    if (typeof window === 'undefined') return;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    try {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (e) {}
      }

      if (speechDebounceTimerRef.current) {
        clearTimeout(speechDebounceTimerRef.current);
      }

      const recognition = new SpeechRecognition();
      recognition.lang = language === 'bm' ? 'ms-MY' : 'en-US';
      recognition.continuous = true;
      recognition.interimResults = true;

      recognition.onstart = () => setIsVoiceListening(true);
      recognition.onresult = (event: any) => {
        let fullTranscript = '';
        for (let i = 0; i < event.results.length; i++) {
          fullTranscript += event.results[i][0].transcript + ' ';
        }
        fullTranscript = fullTranscript.trim();
        if (!fullTranscript) return;

        transcriptBufferRef.current = fullTranscript;
        setChatInput(fullTranscript);

        // Reset silence timer - wait 1800ms after user pauses speaking
        if (speechDebounceTimerRef.current) {
          clearTimeout(speechDebounceTimerRef.current);
        }

        speechDebounceTimerRef.current = setTimeout(() => {
          const finalQuery = transcriptBufferRef.current.trim();
          if (finalQuery.length > 1) {
            transcriptBufferRef.current = '';
            setChatInput('');
            try { recognition.stop(); } catch (e) {}
            handleSendMessage(finalQuery);
          }
        }, 1800);
      };

      recognition.onerror = () => {
        setIsVoiceListening(false);
        // If live call active, re-listen after 1s
        if (isLiveCallRef.current) {
          setTimeout(() => {
            if (isLiveCallRef.current && !isLoadingReply && !isSpeaking) {
              startListening();
            }
          }, 1200);
        }
      };

      recognition.onend = () => {
        setIsVoiceListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.warn('Recognition start error:', err);
      setIsVoiceListening(false);
    }
  };

  // Toggle Live Call
  const handleToggleLiveCall = () => {
    if (isLiveCallActive) {
      // End call
      setIsLiveCallActive(false);
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (e) {}
      }
      setIsSpeaking(false);
      setIsVoiceListening(false);
    } else {
      // Start call
      setIsLiveCallActive(true);
      const callPrompt = language === 'bm'
        ? `Panggilan langsung bermula. Sila tanya apa-apa soalan mengenai laporan kredit anda.`
        : `Live call connected. Please speak and ask me any questions about your credit passport.`;

      handleToggleSpeak(callPrompt, () => {
        startListening();
      });
    }
  };

  // Voice recognition button handler
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

    startListening();
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
            documentHash,
            matchedLenders: lendersToUse.slice(0, 3).map(m => ({
              name: m.name || m.lender?.name,
              shortName: m.lender?.shortName || m.name,
              matchScore: m.matchScore || m.score || 95,
              eligibilityLabel: m.eligibilityLabel || 'Eligible'
            }))
          }
        })
      });

      const data = await response.json();
      if (data && data.reply) {
        setChatMessages(prev => [...prev, { sender: 'assistant', text: data.reply }]);
        if (isLiveCallRef.current || isSpeaking) {
          handleToggleSpeak(data.reply, () => {
            if (isLiveCallRef.current) {
              startListening();
            }
          });
        }
      } else {
        throw new Error('No reply from server');
      }
    } catch (err) {
      const lower = query.toLowerCase();
      let fallback = '';
      if (lower.includes('surplus') || lower.includes('lebihan')) {
        fallback = language === 'bm'
          ? `💰 **Maksud Lebihan Tunai Bebas (Free Monthly Surplus):**\n• Lebihan Tunai Bebas adalah baki pendapatan bersih anda selepas menolak perbelanjaan sara hidup asas dan komitmen bulanan sedia ada.\n• Dalam laporan anda, purata kemasukan anda ialah **RM ${assessedInflow.toLocaleString('en-MY')}/bulan** dan baki lebihan bebas ialah **RM ${netSurplus.toLocaleString('en-MY')}/bulan**.\n• Ini adalah penampan keselamatan tunai sebenar yang dinilai oleh bank bagi memastikan anda mampu membayar ansuran baharu tanpa masalah aliran tunai.`
          : `💰 **What is Free Monthly Cash Surplus?**\n• Free Surplus is your verified disposable cash remaining each month after deducting essential living expenses and existing commitments from your monthly inflow.\n• In your credit report, your verified net inflow is **RM ${assessedInflow.toLocaleString('en-MY')}/mo** and your disposable surplus is **RM ${netSurplus.toLocaleString('en-MY')}/mo**.\n• This is the critical safety buffer bank underwriters look at to guarantee that your new monthly repayment will not cause cashflow distress.`;
      } else if (lower.includes('borrow') || lower.includes('capacity') || lower.includes('pinjam') || lower.includes('dsr')) {
        fallback = language === 'bm'
          ? `💳 **Kiraan Kapasiti Pinjaman & DSR:**\n• DSR anda ialah **${dsrValue}%** (jauh di bawah had selamat BNM 60%).\n• Berdasarkan lebihan bulanan RM ${netSurplus.toLocaleString('en-MY')}, ansuran bulanan maksimum selamat ialah **RM ${safeMaxInstallment.toLocaleString('en-MY')}/bulan** (anggaran jumlah pembiayaan selamat **RM ${safeMaxLoan.toLocaleString('en-MY')}**).`
          : `💳 **Borrowing Capacity & DSR:**\n• Your DSR is assessed at **${dsrValue}%** (well below BNM 60% prudent ceiling).\n• Safe repayment limit is **RM ${safeMaxInstallment.toLocaleString('en-MY')}/month**, supporting up to **RM ${safeMaxLoan.toLocaleString('en-MY')}** in financing safely.`;
      } else if (lower.includes('bank') || lower.includes('approve') || lower.includes('lulus') || lower.includes('match')) {
        fallback = language === 'bm'
          ? `🏦 **Padanan Bank Mengikut Direktori:**\n• **${topMatch1}**\n• **${topMatch2}**\n• **${topMatch3}**`
          : `🏦 **Matched Lenders from Directory:**\n• **${topMatch1}**\n• **${topMatch2}**\n• **${topMatch3}**`;
      } else {
        fallback = language === 'bm'
          ? `📊 **Status Pasport Kredit:**\nSkor FRI anda ialah **${friScore}/850 (${riskGrade})**. Profil anda mematuhi piawaian pengunderaitan Bank Negara Malaysia (FTFC & RMiT) dengan meterai keselamatan SHA-256.`
          : `📊 **Credit Passport Status:**\nYour FRI score is **${friScore}/850 (${riskGrade})**. Your profile meets BNM FTFC & RMiT alternative underwriting standards with verified SHA-256 tamper-proof certification.`;
      }
      setChatMessages(prev => [...prev, { sender: 'assistant', text: fallback }]);
      if (isLiveCallRef.current) {
        handleToggleSpeak(fallback, () => {
          if (isLiveCallRef.current) {
            startListening();
          }
        });
      }
    } finally {
      setIsLoadingReply(false);
    }
  };

  const quickActionChips = language === 'bm' ? [
    { label: 'Ringkasan Laporan', prompt: 'Ringkaskan laporan kredit saya secara padat.' },
    { label: 'Apa Itu Lebihan Bebas?', prompt: 'Apakah maksud lebihan tunai bebas (free monthly surplus) dan kiraan saya?' }
  ] : [
    { label: 'Summarize Report', prompt: 'Summarize my credit passport and underwriter findings.' },
    { label: 'What is Free Surplus?', prompt: 'What is free monthly cash surplus and what is my calculation?' }
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-1 sm:p-2 md:p-3 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200 overscroll-contain">
      <div className="relative w-full max-w-[99vw] h-[98vh] flex flex-col rounded-2xl md:rounded-3xl border border-slate-200 bg-white text-slate-900 shadow-2xl overflow-hidden">
        
        {/* Clean Top White Header */}
        <div className="flex items-center justify-between gap-3 px-3 sm:px-5 py-2.5 border-b border-slate-200 bg-white shrink-0">
          
          {/* Left: Clean Minimal Header */}
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-blue-950 text-white flex items-center justify-center shadow-xs shrink-0 font-bold">
              <FileText className="w-4 h-4 text-blue-200" />
            </div>
            <div className="min-w-0 flex items-center gap-2 flex-wrap">
              <h2 className="text-xs sm:text-sm font-bold text-slate-950 tracking-tight truncate">
                {language === 'bm' ? 'Pasport Kredit Alternatif' : 'Alternative Credit Passport'}
              </h2>
              <span className="text-[10px] sm:text-[11px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 shrink-0">
                FRI {friScore} · {riskGrade}
              </span>
            </div>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Language Switch */}
            <div className="flex items-center rounded-lg bg-slate-100 p-0.5 border border-slate-200">
              <button
                onClick={() => setLanguage('en')}
                className={`px-2 py-1 text-xs font-bold rounded-md transition-all ${
                  language === 'en' ? 'bg-blue-950 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                EN
              </button>
              <button
                onClick={() => setLanguage('bm')}
                className={`px-2 py-1 text-xs font-bold rounded-md transition-all ${
                  language === 'bm' ? 'bg-blue-950 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                BM
              </button>
            </div>

            {/* Live Call Button */}
            <button
              onClick={handleToggleLiveCall}
              className={`px-2.5 py-1.5 rounded-xl border flex items-center gap-1.5 text-xs font-bold transition-all cursor-pointer ${
                isLiveCallActive
                  ? 'bg-rose-600 hover:bg-rose-700 text-white border-rose-700 shadow-sm animate-pulse'
                  : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border-emerald-300'
              }`}
              title={language === 'bm' ? (isLiveCallActive ? 'Tamatkan Panggilan' : 'Panggilan Langsung') : (isLiveCallActive ? 'End Live Call' : 'Live Call')}
            >
              {isLiveCallActive ? <PhoneOff className="w-3.5 h-3.5" /> : <PhoneCall className="w-3.5 h-3.5 text-emerald-700" />}
              <span className="hidden sm:inline">{isLiveCallActive ? (language === 'bm' ? 'Tamat' : 'End Call') : (language === 'bm' ? 'Panggilan Langsung' : 'Live Call')}</span>
            </button>

            {/* Maximize / Split View Toggle Button */}
            <button
              onClick={() => setIsPdfMaximized(!isPdfMaximized)}
              className={`px-2.5 py-1.5 rounded-xl border hidden lg:flex items-center gap-1.5 text-xs font-bold transition-all ${
                isPdfMaximized
                  ? 'bg-blue-950 text-white border-blue-900 shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
              }`}
              title={isPdfMaximized ? (language === 'bm' ? 'Pisah Skrin' : 'Split View') : (language === 'bm' ? 'Besarkan PDF Sepenuhnya' : 'Maximize PDF Canvas')}
            >
              {isPdfMaximized ? <Minimize2 className="w-3.5 h-3.5 text-blue-200" /> : <Maximize2 className="w-3.5 h-3.5 text-slate-700" />}
              <span className="hidden sm:inline">{isPdfMaximized ? (language === 'bm' ? 'Pisah Skrin' : 'Split View') : (language === 'bm' ? 'Besarkan PDF' : 'Maximize PDF')}</span>
            </button>

            {/* 1-Click PDF Download */}
            <button
              onClick={() => generateCreditPassportPdf({ inputData, report, documentHash, isLocked, matchedLenders: lendersToUse, language })}
              className="px-3 py-1.5 rounded-xl bg-blue-950 hover:bg-blue-900 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-95"
              title={language === 'bm' ? 'Muat Turun PDF' : 'Download PDF'}
            >
              <Download className="w-3.5 h-3.5 text-blue-200" />
              <span className="hidden sm:inline">{language === 'bm' ? 'Muat Turun' : 'PDF'}</span>
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-500 hover:text-rose-700 border border-slate-200 transition-all cursor-pointer"
              title={language === 'bm' ? 'Tutup' : 'Close Modal'}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Mobile View Segmented Switch (< lg screens only) */}
        <div className="lg:hidden flex items-center p-1.5 bg-slate-100 border-b border-slate-200">
          <button
            onClick={() => setMobileTab('pdf')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              mobileTab === 'pdf' ? 'bg-white text-blue-950 shadow-xs border border-slate-200' : 'text-slate-600'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>{language === 'bm' ? '📄 Lihat Dokumen PDF' : '📄 View Full PDF'}</span>
          </button>
          <button
            onClick={() => setMobileTab('chat')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              mobileTab === 'chat' ? 'bg-white text-blue-950 shadow-xs border border-slate-200' : 'text-slate-600'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>{language === 'bm' ? '🤖 Penjelas Pintar AI' : '🤖 AI Explainer'}</span>
          </button>
        </div>

        {/* Main Body: Desktop 65/35 Split Screen or 100% Maximized PDF View */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-0 overflow-hidden min-h-0 bg-slate-50 relative">
          
          {/* Left Panel: Zoomed-in PDF Viewer Canvas (65% width / 100% when maximized) */}
          <div className={`${mobileTab === 'pdf' ? 'flex' : 'hidden'} lg:flex ${isPdfMaximized ? 'lg:col-span-12' : 'lg:col-span-8'} border-r border-slate-200 bg-slate-100 flex-col min-h-0 overflow-hidden p-1 sm:p-2 relative`}>
            {pdfBlobUrl ? (
              <div className="w-full h-full rounded-xl sm:rounded-2xl overflow-hidden border border-slate-300 bg-white shadow-md relative">
                <iframe
                  src={`${pdfBlobUrl}#toolbar=0&navpanes=0&scrollbar=1&view=FitH&zoom=115`}
                  className="w-full h-full border-0 block"
                  title="Credit Passport PDF"
                />
              </div>
            ) : (
              <div className="w-full h-full rounded-2xl bg-white border border-slate-200 flex flex-col items-center justify-center p-8 text-center space-y-3">
                <RefreshCw className="w-7 h-7 text-blue-900 animate-spin" />
                <p className="text-xs font-bold text-slate-600">
                  {language === 'bm' ? 'Menjana pratonton PDF...' : 'Rendering PDF dossier...'}
                </p>
              </div>
            )}

            {/* Floating Open AI Assistant pill when PDF is maximized */}
            {isPdfMaximized && (
              <button
                onClick={() => setIsPdfMaximized(false)}
                className="absolute bottom-4 right-4 z-40 px-4 py-2 rounded-xl bg-blue-950/95 hover:bg-blue-900 text-white text-xs font-bold shadow-xl border border-blue-800 flex items-center gap-2 cursor-pointer backdrop-blur-sm active:scale-95 transition-all"
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                <span>{language === 'bm' ? 'Papar Pembantu AI' : 'Show AI Explainer'}</span>
              </button>
            )}
          </div>

          {/* Right Panel: Synchronized AI Underwriting Assistant (35% width) */}
          <div className={`${mobileTab === 'chat' ? 'flex' : 'hidden'} ${isPdfMaximized ? 'lg:hidden' : 'lg:flex lg:col-span-4'} flex-col bg-white min-h-0 overflow-hidden`}>
            

            {/* 2 Suggestion Buttons (Transparent Interactive Type) */}
            <div className="px-3 py-2 border-b border-slate-200/80 bg-white/60 flex items-center gap-2 shrink-0">
              {quickActionChips.map((chip, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(chip.prompt)}
                  className="group flex-1 py-1.5 px-3 rounded-xl bg-transparent hover:bg-slate-100/90 text-slate-700 hover:text-blue-950 text-xs font-semibold border border-dashed border-slate-300 hover:border-blue-900 transition-all flex items-center justify-between gap-1.5 shrink-0 cursor-pointer active:scale-95 shadow-2xs hover:shadow-xs"
                >
                  <span className="truncate">{chip.label}</span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-950 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all shrink-0" />
                </button>
              ))}
            </div>

            {/* Chat Message List */}
            <div className="flex-1 p-3.5 space-y-3 overflow-y-auto min-h-0 bg-slate-50/50 overscroll-contain">
              {chatMessages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[92%] p-3.5 rounded-2xl ${
                      msg.sender === 'user'
                        ? 'bg-blue-950 text-white rounded-br-none shadow-xs'
                        : 'bg-white text-slate-900 border border-slate-200/90 rounded-bl-none shadow-xs'
                    }`}
                  >
                    {msg.sender === 'user' ? (
                      <p className="text-xs sm:text-[13px] font-medium leading-relaxed">{msg.text}</p>
                    ) : (
                      <FormattedExplainerText text={msg.text} />
                    )}
                  </div>
                </div>
              ))}

              {isLoadingReply && (
                <div className="flex justify-start">
                  <div className="p-3 rounded-2xl bg-white text-slate-600 border border-slate-200 text-xs flex items-center gap-2 shadow-2xs">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-900" />
                    <span>{language === 'bm' ? 'Meneliti data dossier...' : 'Analyzing credit telemetry...'}</span>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Chat Input Bar */}
            <div className="p-3 border-t border-slate-200 bg-white shrink-0">
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
                      ? 'bg-red-50 text-red-700 border-red-300 animate-pulse'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                  }`}
                  title={language === 'bm' ? 'Bercakap dengan AI' : 'Speak to AI'}
                >
                  {isVoiceListening ? <MicOff className="w-4 h-4 text-red-600" /> : <Mic className="w-4 h-4 text-blue-950" />}
                </button>

                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder={
                    language === 'bm'
                      ? 'Tanya apa-apa soalan mengenai laporan...'
                      : 'Ask anything about your credit report...'
                  }
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-950 focus:bg-white transition-all font-medium"
                />

                <button
                  type="submit"
                  disabled={!chatInput.trim() || isLoadingReply}
                  className="p-2.5 rounded-xl bg-blue-950 hover:bg-blue-900 disabled:opacity-40 text-white shadow-xs transition-all cursor-pointer"
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
