'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  MessageSquare, Send, X, Paperclip, Sparkles, Volume2, 
  VolumeX, ArrowRight, RefreshCw, CheckCircle2, FileText, 
  UploadCloud, Compass, ChevronDown, Landmark, ExternalLink,
  Mic, MicOff, Calculator, Layers, Clock, Target, Settings,
  Phone, PhoneOff, PhoneCall, Radio, Activity, User, Check,
  Languages, FileBarChart, Globe, Bot, Trash2, Pause, Square,
  Headphones, ShieldCheck
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { UserProfileData } from './UserSettingsModal';
import { saveSupportTicket, getSupportTickets, SupportTicket } from '@/lib/supportTickets';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  suggestions?: string[];
  action?: {
    type: 'NAVIGATE_LOAN_NEED' | 'NAVIGATE_UPLOAD' | 'SET_CALCULATOR' | 'NAVIGATE_CALCULATOR' | 'NAVIGATE_DIRECTORY' | 'NAVIGATE_TRACKER' | 'NAVIGATE_SETTINGS' | 'NAVIGATE_REPORT' | 'DOWNLOAD_REPORT' | 'CHANGE_LANGUAGE' | 'START_ASSESSMENT' | 'PROMPT_CREATE_TICKET' | 'DISPATCH_TICKET' | 'NAVIGATE_SUPPORT';
    payload?: any;
  };
  attachedFile?: {
    name: string;
    size: string;
    type: string;
  };
}

interface AICoPilotChatProps {
  userSession: UserProfileData | null;
  assessedInflow?: number;
  latestScore?: number;
  latestGrade?: string;
  currentDsr?: number;
  emergencyRunway?: number;
  maxSafeLoan?: number;
  maxSafeMonthlyPay?: number;
  targetLoanAmount?: number;
  targetLoanPurpose?: string;
  activeStep?: number;
  hasUploadedFiles?: boolean;
  onNavigateToLoanNeed: () => void;
  onNavigateToUpload: () => void;
  onNavigateToReport?: () => void;
  onDownloadReportPdf?: () => void;
  onNavigateToCalculator: (params?: { loanAmount?: number; tenureYears?: number; interestRate?: number }) => void;
  onNavigateToDirectory: () => void;
  onNavigateToTracker: () => void;
  onOpenSettings: () => void;
  onOpenSupportModal?: (initialTicketId?: string) => void;
  onChangeLanguage?: (lang: 'en' | 'bm') => void;
  onStartAssessmentWithFile: (fileData: { fileName: string; fileType: string; fileSize: string; fileBase64: string; category: 'bank_statement' | 'platform_dashboard' | 'tax_epf' | 'mykad_id' | 'pay_slip' }) => void;
}

function cleanSpeechDuplicates(raw: string): string {
  if (!raw) return '';
  let text = raw.replace(/\s+/g, ' ').trim();
  if (!text) return '';

  // 1. Detect and resolve progressive accumulation echoes (Android mobile speech recognition buffer bug)
  const words = text.split(' ').filter(Boolean);
  if (words.length >= 6) {
    const prefix = words.slice(0, 3).join(' ').toLowerCase();
    const indices: number[] = [];
    for (let i = 0; i <= words.length - 3; i++) {
      if (words.slice(i, i + 3).join(' ').toLowerCase() === prefix) {
        indices.push(i);
      }
    }
    if (indices.length > 1) {
      const lastIndex = indices[indices.length - 1];
      if (words.length - lastIndex >= 4) {
        text = words.slice(lastIndex).join(' ');
      }
    }
  }

  // 2. Remove exact duplicate adjacent sentences / clauses
  const sentences = text.split(/(?<=[.?!])\s+/);
  if (sentences.length > 1) {
    const deduped: string[] = [];
    for (let i = 0; i < sentences.length; i++) {
      if (i === 0 || sentences[i].toLowerCase() !== sentences[i - 1].toLowerCase()) {
        deduped.push(sentences[i]);
      }
    }
    text = deduped.join(' ');
  }

  // 3. Remove repeating multi-word phrases
  let w = text.split(' ').filter(Boolean);
  if (w.length > 3) {
    let modified = true;
    let passes = 0;
    while (modified && passes < 4) {
      modified = false;
      passes++;
      for (let len = Math.min(Math.floor(w.length / 2), 20); len >= 2; len--) {
        for (let i = 0; i <= w.length - 2 * len; i++) {
          const chunk1 = w.slice(i, i + len).join(' ').toLowerCase();
          const chunk2 = w.slice(i + len, i + 2 * len).join(' ').toLowerCase();
          if (chunk1 === chunk2 && chunk1.length > 2) {
            w.splice(i + len, len);
            modified = true;
            i--;
          }
        }
      }
    }
    text = w.join(' ');
  }

  // 4. Remove single repeating adjacent words (e.g. "okay okay okay" -> "okay")
  const singleWords = text.split(' ').filter(Boolean);
  const dedupedSingle: string[] = [];
  for (let i = 0; i < singleWords.length; i++) {
    if (i === 0 || singleWords[i].toLowerCase() !== singleWords[i - 1].toLowerCase()) {
      dedupedSingle.push(singleWords[i]);
    }
  }
  text = dedupedSingle.join(' ');

  // 5. Malaysian Manglish & Bahasa Rojak Phonetic Normalization
  text = text
    .replace(/\b(?:i\s*bought|i\s*boat|i\s*board|i\s*bot)\s*(?:personal\s*loan|loan|pinjaman)\b/gi, 'nak buat personal loan')
    .replace(/\b(?:upper\s*step|a\s*part\s*step|up\s*step)\b/gi, 'apa step')
    .replace(/\b(?:step|langkah)\s*(?:tumble|part\s*timer|tamba|tamana|per\s*tamam)\b/gi, '$1 pertama')
    .replace(/\b(?:so\s*you\s*bought|so\s*you\s*boat|sir\s*you\s*bought|so\s*your\s*part)\b/gi, 'saya patut buat')
    .replace(/\bnak\s*(?:play|supply|ape|plei)\b/gi, 'nak apply')
    .replace(/\b(?:mau|mohon|buat)\s*(?:lon|luen)\b/gi, 'nak apply loan')
    .replace(/\b(?:interes|interset|inte\s*rest)\s*rate\b/gi, 'interest rate')
    .replace(/\b(?:kalkulat|kalkulate)\b/gi, 'calculate')
    .replace(/\b(?:the\s*sr|d\s*s\s*r|ds\s*are|d\s*s\s*are)\b/gi, 'DSR')
    .replace(/\b(?:c\s*cris|see\s*cris|c\s*crisp|sekris)\b/gi, 'CCRIS')
    .replace(/\b(?:c\s*tos|see\s*tos|c\s*toss)\b/gi, 'CTOS');

  return text.trim();
}

function parseSpeechRecognitionResults(results: any): string {
  if (!results || results.length === 0) return '';
  
  // If only 1 result, return its transcript
  if (results.length === 1) {
    return cleanSpeechDuplicates(results[0][0]?.transcript || '');
  }

  // Check if mobile Android speech engine emitted cumulative/progressive results where each result starts with result[0]
  const firstPrefix = results[0][0]?.transcript?.trim().toLowerCase().slice(0, 12) || '';
  let isCumulative = false;
  if (firstPrefix.length >= 3) {
    let matchCount = 0;
    for (let i = 1; i < results.length; i++) {
      const t = results[i][0]?.transcript?.trim().toLowerCase() || '';
      if (t.startsWith(firstPrefix)) {
        matchCount++;
      }
    }
    if (matchCount >= Math.floor(results.length / 2)) {
      isCumulative = true;
    }
  }

  if (isCumulative) {
    // In Android cumulative mode, the last result entry is the complete cumulative transcription!
    const last = results[results.length - 1][0]?.transcript || '';
    return cleanSpeechDuplicates(last);
  }

  // Desktop / standard disjoint chunks: concatenate distinct pieces
  let finalTranscript = '';
  let interimTranscript = '';
  for (let i = 0; i < results.length; ++i) {
    const item = results[i];
    if (item.isFinal) {
      finalTranscript += (item[0]?.transcript || '') + ' ';
    } else {
      interimTranscript += (item[0]?.transcript || '') + ' ';
    }
  }

  const combined = (finalTranscript + ' ' + interimTranscript).trim();
  return cleanSpeechDuplicates(combined);
}

function AILogoIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg" 
      className={className}
    >
      <defs>
        {/* Purple/Indigo Star Gradient */}
        <linearGradient id="userAILogoStarGrad" x1="10%" y1="0%" x2="90%" y2="100%">
          <stop offset="0%" stopColor="#9333ea" />
          <stop offset="50%" stopColor="#7c3aed" />
          <stop offset="100%" stopColor="#6366f1" />
        </linearGradient>
        {/* Frame Gradient (Purple to Sky Cyan) */}
        <linearGradient id="userAILogoFrameGrad" x1="100%" y1="20%" x2="20%" y2="100%">
          <stop offset="0%" stopColor="#6366f1" />
          <stop offset="40%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#06b6d4" />
        </linearGradient>
        {/* AI Text Gradient */}
        <linearGradient id="userAILogoTextGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#06b6d4" />
        </linearGradient>
      </defs>

      {/* Main Large Sparkle Star */}
      <path 
        d="M32 4 C32 17 22 28 4 33 C22 38 32 49 32 62 C32 49 42 38 60 33 C42 28 32 17 32 4 Z" 
        fill="url(#userAILogoStarGrad)" 
      />

      {/* Top Small Sparkle Star */}
      <path 
        d="M55 2 C55 8 50 12.5 43 14.5 C50 16.5 55 21 55 27 C55 21 60 16.5 67 14.5 C60 12.5 55 8 55 2 Z" 
        fill="url(#userAILogoStarGrad)" 
      />

      {/* Bottom-Left Mini Sparkle Star */}
      <path 
        d="M14 43 C14 47.5 10.5 51 4 52.5 C10.5 54 14 57.5 14 62 C14 57.5 17.5 54 24 52.5 C17.5 51 14 47.5 14 43 Z" 
        fill="url(#userAILogoStarGrad)" 
      />

      {/* Open Rounded Square Frame */}
      <path 
        d="M66 27 H82 C88.6 27 94 32.4 94 39 V79 C94 85.6 88.6 91 82 91 H41 C34.4 91 29 85.6 29 79 V66" 
        stroke="url(#userAILogoFrameGrad)" 
        strokeWidth="6" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
      />

      {/* Letter 'A' */}
      <path 
        d="M39 80 L52.5 44 H60.5 L74 80 H65.5 L63.2 73.2 H49.8 L47.5 80 H39 Z M52.2 66.2 H60.8 L56.5 53.2 Z" 
        fill="url(#userAILogoTextGrad)" 
      />
      {/* Letter 'I' */}
      <path 
        d="M78 44 H86.5 V80 H78 Z" 
        fill="url(#userAILogoTextGrad)" 
      />
    </svg>
  );
}

function FormattedMessage({ text, isUser, isDark }: { text: string; isUser?: boolean; isDark?: boolean }) {
  const clean = text
    .replace(/\[ACTION:[^\]]+\]/g, '')
    .trim();

  if (isUser) {
    return (
      <div className="text-xs leading-relaxed text-white font-medium whitespace-pre-wrap break-words">
        {clean}
      </div>
    );
  }

  const rawLines = clean.split('\n');

  return (
    <div className={`flex flex-col gap-1 text-xs leading-relaxed ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>
      {rawLines.map((line, idx) => {
        let trimmed = line.trim();
        if (!trimmed) return <div key={idx} className="h-0.5" />;

        // Filter out solitary bullets or dashes like "•--", "•", "--", "---", "___"
        if (/^([•\-\*\_]\s*)+$/.test(trimmed) || trimmed === '•--' || trimmed === '--' || trimmed === '---' || trimmed === '***') {
          return <div key={idx} className={`my-1 border-t ${isDark ? 'border-slate-700/60' : 'border-slate-200/60'}`} />;
        }

        // Clean markdown headers (#, ##, ###, ####)
        const isMarkdownHeader = /^#{1,6}\s+/.test(trimmed);
        if (isMarkdownHeader) {
          trimmed = trimmed.replace(/^#{1,6}\s+/, '');
        }

        // Clean bold/italic asterisks
        const contentWithoutAsterisks = trimmed.replace(/\*\*/g, '').replace(/\*/g, '').trim();
        if (!contentWithoutAsterisks) return null;

        // Bullet list item: starts with •, -, *, or numbered like "1."
        const isBullet = trimmed.startsWith('•') || trimmed.startsWith('- ') || trimmed.startsWith('* ') || (trimmed.startsWith('-') && !trimmed.startsWith('--')) || (trimmed.startsWith('*') && !trimmed.startsWith('**'));
        const isNumbered = /^\d+\.\s+/.test(trimmed);

        if (isBullet) {
          const bulletText = trimmed.replace(/^[•\-\*]\s*/, '').replace(/\*\*/g, '').replace(/\*/g, '').trim();
          if (!bulletText || bulletText === '--') return null;
          return (
            <div key={idx} className={`flex items-start gap-1.5 pl-1 ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
              <span className={`${isDark ? 'text-emerald-400' : 'text-blue-900'} font-black shrink-0 mt-0.5`}>•</span>
              <span className="flex-1 font-medium">{bulletText}</span>
            </div>
          );
        }

        if (isNumbered) {
          const match = trimmed.match(/^(\d+\.)\s*(.*)/);
          const num = match ? match[1] : '';
          const rest = match ? match[2].replace(/\*\*/g, '').replace(/\*/g, '').trim() : contentWithoutAsterisks;
          return (
            <div key={idx} className={`flex items-start gap-1.5 pl-0.5 ${isDark ? 'text-white' : 'text-slate-900'} font-bold mt-1`}>
              <span className={`${isDark ? 'text-blue-300' : 'text-blue-950'} font-black shrink-0`}>{num}</span>
              <span className="flex-1">{rest}</span>
            </div>
          );
        }

        const isHeader = isMarkdownHeader || trimmed.endsWith(':');

        return (
          <p key={idx} className={isHeader 
            ? `${isDark ? 'font-black text-blue-200 text-xs mt-1 border-b border-blue-900/40 pb-0.5' : 'font-bold text-blue-950 mt-1'}` 
            : `${isDark ? 'text-slate-100 font-medium' : 'text-slate-700 font-normal'}`}>
            {contentWithoutAsterisks}
          </p>
        );
      })}
    </div>
  );
}

export default function AICoPilotChat({
  userSession,
  assessedInflow,
  latestScore,
  latestGrade,
  currentDsr,
  emergencyRunway,
  maxSafeLoan,
  maxSafeMonthlyPay,
  targetLoanAmount = 5000,
  targetLoanPurpose = 'personal_cash',
  activeStep = 1,
  hasUploadedFiles = false,
  onNavigateToLoanNeed,
  onNavigateToUpload,
  onNavigateToReport,
  onDownloadReportPdf,
  onNavigateToCalculator,
  onNavigateToDirectory,
  onNavigateToTracker,
  onOpenSettings,
  onOpenSupportModal,
  onChangeLanguage,
  onStartAssessmentWithFile
}: AICoPilotChatProps) {
  const { language, setLanguage } = useLanguage();
  const isMalay = language === 'bm';

  const [isOpen, setIsOpen] = useState(false);
  const [isCallActive, setIsCallActive] = useState(false);
  const [callStatus, setCallStatus] = useState<'listening' | 'thinking' | 'speaking'>('listening');
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState('');
  const [lastAgentReply, setLastAgentReply] = useState('');
  const [lastCallAction, setLastCallAction] = useState<any>(null);
  const [lastUserSpeech, setLastUserSpeech] = useState<string>('');
  const [spokenCharIndex, setSpokenCharIndex] = useState<number>(0);

  const [inputMessage, setInputMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isDictating, setIsDictating] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const callSubtitleScrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const callRecognitionRef = useRef<any>(null);
  const dictationRecognitionRef = useRef<any>(null);
  const silenceTimerRef = useRef<any>(null);
  const callTimerRef = useRef<any>(null);
  const speechIntervalRef = useRef<any>(null);
  const hasInitializedRef = useRef(false);
  const isCallActiveRef = useRef(isCallActive);
  isCallActiveRef.current = isCallActive;
  const isMutedRef = useRef(isMuted);
  isMutedRef.current = isMuted;
  const isAgentSpeakingRef = useRef(false);
  const isRecognitionRunningRef = useRef(false);
  const isProcessingRef = useRef(false);
  const currentAccumulatedSpeechRef = useRef('');
  const persistedTurnSpeechRef = useRef('');
  const lastSpeechActivityTimestampRef = useRef<number>(0);
  const isUserScrollingSubtitlesRef = useRef(false);
  const userScrollResumeTimerRef = useRef<any>(null);
  const cachedVoiceRef = useRef<SpeechSynthesisVoice | null>(null);
  const isMalayRef = useRef(isMalay);
  isMalayRef.current = isMalay;

  // Consistent High-Clarity Voice Selection: Malay (ms-MY/id-ID) vs US English
  const getConsistentVoice = useCallback((langMalay: boolean) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null;
    const voices = window.speechSynthesis.getVoices();
    if (!voices || voices.length === 0) return null;

    if (langMalay) {
      // 1. Highest priority: Native Malay voice
      const msVoice = voices.find(v => (v.lang.toLowerCase().startsWith('ms') || v.lang.toLowerCase().includes('my')) && (v.name.toLowerCase().includes('female') || v.name.toLowerCase().includes('siti') || v.name.toLowerCase().includes('yasmin') || v.name.toLowerCase().includes('malay')));
      if (msVoice) return msVoice;
      const anyMs = voices.find(v => v.lang.toLowerCase().startsWith('ms'));
      if (anyMs) return anyMs;

      // 2. High priority fallback: Indonesian voice (very natural & clear for Malay speech)
      const idVoice = voices.find(v => (v.lang.toLowerCase().startsWith('id') || v.lang.toLowerCase().includes('id')) && (v.name.toLowerCase().includes('female') || v.name.toLowerCase().includes('gadis') || v.name.toLowerCase().includes('damayanti') || v.name.toLowerCase().includes('indonesia')));
      if (idVoice) return idVoice;
      const anyId = voices.find(v => v.lang.toLowerCase().startsWith('id'));
      if (anyId) return anyId;
    }

    // High clarity Natural US English voices
    const preferredVoices = ['microsoft aria', 'microsoft jenny', 'google us english', 'samantha', 'victoria', 'zira', 'karen'];
    for (const pref of preferredVoices) {
      const found = voices.find(v => v.name.toLowerCase().includes(pref) && !v.lang.toLowerCase().includes('en-in') && !v.name.toLowerCase().includes('india'));
      if (found) return found;
    }

    const anyUS = voices.find(v => (v.lang.toLowerCase() === 'en-us' || v.lang.toLowerCase() === 'en_us') && !v.name.toLowerCase().includes('india'));
    return anyUS || voices.find(v => v.lang.startsWith('en')) || voices[0] || null;
  }, []);

  // Initialize and persist chat history
  useEffect(() => {
    if (hasInitializedRef.current) return;
    hasInitializedRef.current = true;

    const greetingText = isMalay 
      ? "Hai, saya Ejen & Pembantu AI anda, bagaimana saya boleh bantu anda?" 
      : "Hi, I'm your AI Agent & Assistant, how can I help you?";

    try {
      const savedHistory = localStorage.getItem('loanla_ai_chat_history');
      if (savedHistory) {
        const parsed = JSON.parse(savedHistory);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // If previous history was just the old generic greeting, update to new greeting
          if (parsed.length === 1 && (parsed[0].content === "Hello, how can I help you?" || parsed[0].content === "Hai, bagaimana saya boleh bantu?")) {
            parsed[0].content = greetingText;
          }
          setMessages(parsed);
          return;
        }
      }
    } catch (e) {}

    setMessages([
      {
        id: 'msg-welcome',
        role: 'assistant',
        content: greetingText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggestions: isMalay 
          ? ["Semak Status Permohonan", "Tetapkan Keperluan Pinjaman", "Kalkulator"]
          : ["Check Application Status", "Set Loan Purpose", "Loan Calculator"]
      }
    ]);
  }, [isMalay]);

  const handleClearChat = () => {
    const greetingText = isMalay 
      ? "Hai, saya Ejen & Pembantu AI anda, bagaimana saya boleh bantu anda?" 
      : "Hi, I'm your AI Agent & Assistant, how can I help you?";
    const freshWelcome: ChatMessage[] = [
      {
        id: `welcome-${Date.now()}`,
        role: 'assistant',
        content: greetingText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggestions: isMalay 
          ? ["Semak Status Permohonan", "Tetapkan Keperluan Pinjaman", "Kalkulator"]
          : ["Check Application Status", "Set Loan Purpose", "Loan Calculator"]
      }
    ];
    setMessages(freshWelcome);
    try {
      localStorage.removeItem('loanla_ai_chat_history');
    } catch (e) {}
  };

  // Persist messages
  useEffect(() => {
    if (messages.length > 0) {
      try {
        localStorage.setItem('loanla_ai_chat_history', JSON.stringify(messages));
      } catch (e) {}
    }
  }, [messages]);

  // Scroll to bottom
  useEffect(() => {
    if (isOpen && !isCallActive) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isSending, isCallActive]);

  // Call duration timer
  useEffect(() => {
    if (isCallActive) {
      setCallDuration(0);
      callTimerRef.current = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    } else {
      if (callTimerRef.current) clearInterval(callTimerRef.current);
    }
    return () => {
      if (callTimerRef.current) clearInterval(callTimerRef.current);
    };
  }, [isCallActive]);

  const formatCallTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Auto-scroll Call Subtitle Box smoothly as the AI speaks (Resumes after 4s if user manually scrolls)
  useEffect(() => {
    if (isCallActive && callStatus === 'speaking' && callSubtitleScrollRef.current) {
      if (!isUserScrollingSubtitlesRef.current) {
        const el = callSubtitleScrollRef.current;
        const totalLen = Math.max(1, (lastAgentReply || '').length);
        const ratio = Math.min(1, spokenCharIndex / totalLen);
        const maxScroll = el.scrollHeight - el.clientHeight;
        if (maxScroll > 0) {
          el.scrollTop = maxScroll * ratio;
        }
      }
    }
  }, [spokenCharIndex, isCallActive, callStatus, lastAgentReply]);

  // Text-to-speech engine
  const speakText = useCallback((text: string, onFinish?: () => void) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      if (onFinish) onFinish();
      return;
    }

    isAgentSpeakingRef.current = true;
    isUserScrollingSubtitlesRef.current = false;
    if (callRecognitionRef.current) {
      try { callRecognitionRef.current.stop(); } catch(e){}
    }
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    if (speechIntervalRef.current) clearInterval(speechIntervalRef.current);

    window.speechSynthesis.cancel();
    setSpokenCharIndex(0);

    const cleanText = text
      .replace(/[#*_`~[\]()]/g, '')
      .replace(/https?:\/\/\S+/g, '')
      .replace(/[-•]/g, '')
      .trim();

    if (!cleanText) {
      isAgentSpeakingRef.current = false;
      if (onFinish) onFinish();
      return;
    }

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = isMalay ? 'ms-MY' : 'en-US';
    utterance.rate = 1.0;
    utterance.pitch = 1.05;

    const lockedVoice = getConsistentVoice(isMalay);
    if (lockedVoice) {
      utterance.voice = lockedVoice;
    }

    utterance.onstart = () => {
      setCallStatus('speaking');
      isAgentSpeakingRef.current = true;
      setSpokenCharIndex(0);

      // Smooth progress fallback timer across word count
      const totalEstimatedSeconds = Math.max(2, cleanText.split(/\s+/).length / 2.6);
      const startTime = Date.now();
      speechIntervalRef.current = setInterval(() => {
        const elapsed = (Date.now() - startTime) / 1000;
        const progress = Math.min(1, elapsed / totalEstimatedSeconds);
        setSpokenCharIndex(Math.floor(cleanText.length * progress));
      }, 150);
    };

    utterance.onboundary = (event: any) => {
      if (event.name === 'word' || typeof event.charIndex === 'number') {
        setSpokenCharIndex(event.charIndex);
      }
    };

    const handleSpeechEnd = () => {
      if (speechIntervalRef.current) clearInterval(speechIntervalRef.current);
      setSpokenCharIndex(cleanText.length);
      setTimeout(() => {
        isAgentSpeakingRef.current = false;
        if (onFinish) onFinish();
      }, 400);
    };

    utterance.onend = handleSpeechEnd;
    utterance.onerror = handleSpeechEnd;

    window.speechSynthesis.speak(utterance);
  }, [isMalay, getConsistentVoice]);

  const stopSpeaking = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      isAgentSpeakingRef.current = false;
      if (speechIntervalRef.current) clearInterval(speechIntervalRef.current);
    }
  };

  // Instant Interrupt: stop AI voice and immediately open mic for next question
  const handleInterruptAndSpeak = () => {
    stopSpeaking();
    isAgentSpeakingRef.current = false;
    setCallStatus('listening');
    setLiveTranscript('');
    currentAccumulatedSpeechRef.current = '';
    persistedTurnSpeechRef.current = '';
    startCallListening();
  };

  // Execute Agentic Action & Auto-Close Window when navigating!
  const executeAgentAction = (action: { type: string; payload?: any }, shouldCloseChat = true) => {
    if (action.type === 'CHANGE_LANGUAGE') {
      const target = action.payload?.language || (isMalay ? 'en' : 'bm');
      setLanguage(target);
      isMalayRef.current = target === 'bm';
      if (typeof onChangeLanguage === 'function') onChangeLanguage(target);
      return;
    }

    // Stop speaking and close call/chat window so user can see target page
    stopSpeaking();
    if (shouldCloseChat) {
      if (callRecognitionRef.current) {
        try { callRecognitionRef.current.stop(); } catch(e){}
      }
      setIsCallActive(false);
      setIsOpen(false);
    }

    if (action.type === 'DOWNLOAD_REPORT') {
      if (typeof onDownloadReportPdf === 'function') {
        onDownloadReportPdf();
      } else if (typeof onNavigateToReport === 'function') {
        onNavigateToReport();
      }
      return;
    }

    if (action.type === 'NAVIGATE_TRACKER') {
      if (typeof onNavigateToTracker === 'function') onNavigateToTracker();
    } else if (action.type === 'NAVIGATE_LOAN_NEED') {
      if (typeof onNavigateToLoanNeed === 'function') onNavigateToLoanNeed();
    } else if (action.type === 'NAVIGATE_UPLOAD') {
      if (typeof onNavigateToUpload === 'function') onNavigateToUpload();
    } else if (action.type === 'NAVIGATE_REPORT') {
      if (typeof onNavigateToReport === 'function') onNavigateToReport();
    } else if (action.type === 'SET_CALCULATOR' || action.type === 'NAVIGATE_CALCULATOR') {
      if (typeof onNavigateToCalculator === 'function') onNavigateToCalculator(action.payload);
    } else if (action.type === 'NAVIGATE_DIRECTORY') {
      if (typeof onNavigateToDirectory === 'function') onNavigateToDirectory();
    } else if (action.type === 'NAVIGATE_SETTINGS') {
      if (typeof onOpenSettings === 'function') onOpenSettings();
    } else if (action.type === 'NAVIGATE_SUPPORT') {
      if (typeof onOpenSupportModal === 'function') onOpenSupportModal(action.payload?.id);
    } else if (action.type === 'DISPATCH_TICKET' && action.payload) {
      saveSupportTicket(action.payload);
      if (typeof onOpenSupportModal === 'function') {
        onOpenSupportModal(action.payload.id);
      }
    }
  };

  // Process message for both Call Mode and Chat Mode
  const processQuery = async (queryText: string, isFromVoiceCall = false) => {
    const textToSend = queryText.trim();
    if (!textToSend || textToSend.length < 2) {
      if (isFromVoiceCall && isCallActiveRef.current) {
        startCallListening();
      }
      return;
    }

    if (isFromVoiceCall || isCallActiveRef.current) {
      setCallStatus('thinking');
      isProcessingRef.current = true;
      if (callRecognitionRef.current) {
        try { callRecognitionRef.current.stop(); } catch(e){}
      }
      isRecognitionRunningRef.current = false;
    }

    const lower = textToSend.toLowerCase();

    // Instant local triggers (avoid intercepting report inquiries)
    const isReportInquiry = lower.includes('report') || lower.includes('laporan') || lower.includes('score') || lower.includes('skor') || lower.includes('explain') || lower.includes('terangkan');
    
    if (!isReportInquiry && lower.includes('check') && (lower.includes('application') || lower.includes('status'))) {
      executeAgentAction({ type: 'NAVIGATE_TRACKER' }, true);
      return;
    } else if (lower.includes('support center') || lower.includes('pusat bantuan') || lower.includes('pusat sokongan') || lower.includes('my tickets') || lower.includes('tiket saya') || lower.includes('open support')) {
      executeAgentAction({ type: 'NAVIGATE_SUPPORT' }, true);
      return;
    } else if (lower.includes('setting') || lower.includes('tetapan') || lower.includes('profile')) {
      executeAgentAction({ type: 'NAVIGATE_SETTINGS' }, true);
      return;
    } else if (lower.includes('keperluan pinjaman') || lower.includes('loan need') || lower.includes('step 1')) {
      executeAgentAction({ type: 'NAVIGATE_LOAN_NEED' }, true);
      return;
    } else if (lower.includes('direktori') || lower.includes('directory') || (lower.includes('bank') && (lower.includes('list') || lower.includes('senarai')))) {
      executeAgentAction({ type: 'NAVIGATE_DIRECTORY' }, true);
      return;
    }

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const updated = [...messages, userMsg];
    setMessages(updated);
    setInputMessage('');
    setIsSending(true);

    const isLoggedIn = Boolean(userSession && (userSession.profileId || userSession.email || userSession.name));
    const liveTickets = typeof window !== 'undefined' ? getSupportTickets() : [];
    const userContext = {
      isLoggedIn,
      name: isLoggedIn ? (userSession?.name || 'Tham Ren Sheng') : 'Guest',
      platform: isLoggedIn ? (userSession?.platformName || userSession?.workCategory || 'Gig / MSME') : 'Guest',
      phone: userSession?.phone,
      email: userSession?.email,
      assessedInflow: isLoggedIn ? (assessedInflow || userSession?.estimatedMonthlyIncome || 5000) : 0,
      latestScore: isLoggedIn ? (latestScore || 710) : 0,
      latestGrade: isLoggedIn ? (latestGrade || 'A') : 'N/A',
      currentDsr: isLoggedIn ? (currentDsr !== undefined ? currentDsr : 0.0) : 0,
      emergencyRunway: isLoggedIn ? (emergencyRunway || 1.9) : 0,
      maxSafeLoan: isLoggedIn ? (maxSafeLoan || 53550) : 0,
      maxSafeMonthlyPay: isLoggedIn ? (maxSafeMonthlyPay || 1750) : 0,
      targetLoanAmount: targetLoanAmount,
      targetLoanPurpose: targetLoanPurpose,
      activeTickets: liveTickets
    };

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updated.map(m => ({ role: m.role, content: m.content })),
          language: isMalay ? 'bm' : 'en',
          userContext
        })
      });

      const data = await res.json();
      const replyContent = data.reply || (isMalay ? "Bagaimana saya boleh bantu?" : "How can I help you?");
      const replySuggestions = data.suggestions || [
        isMalay ? "Semak Status" : "Check Status",
        isMalay ? "Direktori Bank" : "Bank Directory"
      ];

      const assistantMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: replyContent,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggestions: replySuggestions,
        action: data.action
      };

      setMessages(prev => [...prev, assistantMsg]);
      setLastAgentReply(replyContent);

      if (isFromVoiceCall) {
        setLastUserSpeech(textToSend);
        setLastCallAction(data.action || null);
      }

      // Execute actions: In call mode, execute immediately in background and provide visual HUD card
      if (data.action && data.action.type !== 'CHANGE_LANGUAGE') {
        if (isCallActiveRef.current) {
          // Pre-configure background state / target page instantly
          executeAgentAction(data.action, false);

          let speechToRead = replyContent;
          if (data.action.type === 'SET_CALCULATOR' && data.action.payload) {
            const p = data.action.payload;
            const estMth = Math.round((p.loanAmount * (1 + (p.interestRate / 100) * p.tenureYears)) / (p.tenureYears * 12) * 100) / 100;
            speechToRead = isMalay
              ? `Untuk pembiayaan RM ${p.loanAmount.toLocaleString()} selama ${p.tenureYears} tahun pada kadar faedah ${p.interestRate}%, anggaran ansuran bulanan anda ialah RM ${estMth.toFixed(2)}. Kalkulator telah sedia dikonfigurasikan pada skrin anda.`
              : `For a loan of RM ${p.loanAmount.toLocaleString()} over ${p.tenureYears} years at ${p.interestRate}%, your estimated monthly installment is RM ${estMth.toFixed(2)}. I've configured the calculator for you on your screen.`;
          } else if (data.action.type === 'NAVIGATE_DIRECTORY') {
            speechToRead = isMalay
              ? "Membuka senarai direktori 11 institusi kewangan dan bank digital untuk anda."
              : "Opening the directory of verified digital banks and lenders for you.";
          } else if (data.action.type === 'NAVIGATE_LOAN_NEED') {
            speechToRead = isMalay
              ? "Membuka Langkah 1 untuk menetapkan tujuan dan keperluan pinjaman anda."
              : "Opening Step 1 to set your loan purpose and amount.";
          } else if (data.action.type === 'NAVIGATE_TRACKER') {
            speechToRead = isMalay
              ? "Membuka penjejak status permohonan pembiayaan anda."
              : "Opening your loan application tracker.";
          }

          speakText(speechToRead, () => {
            if (isCallActiveRef.current) startCallListening();
          });
        } else {
          // In text mode, sync background state without forcibly navigating away so user can read explanation
          executeAgentAction(data.action, false);
        }
      } else if (data.action && data.action.type === 'CHANGE_LANGUAGE') {
        executeAgentAction(data.action, false);
        if (isCallActiveRef.current) {
          speakText(replyContent, () => {
            if (isCallActiveRef.current) startCallListening();
          });
        }
      } else if (isCallActiveRef.current) {
        speakText(replyContent, () => {
          if (isCallActiveRef.current) startCallListening();
        });
      }
    } catch (err) {
      const errorMsg: ChatMessage = {
        id: `assistant-err-${Date.now()}`,
        role: 'assistant',
        content: isMalay ? "Ralat sambungan. Sila cuba lagi." : "Connection error. Please try again.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorMsg]);
      if (isCallActiveRef.current) {
        speakText(errorMsg.content, () => {
          if (isCallActiveRef.current) startCallListening();
        });
      }
    } finally {
      setIsSending(false);
      isProcessingRef.current = false;
    }
  };

  // Continuous, robust speech recognition for Live Voice Call
  const startCallListening = useCallback(() => {
    if (!isCallActiveRef.current || isMutedRef.current || isAgentSpeakingRef.current || isProcessingRef.current) return;
    
    setCallStatus('listening');

    if (typeof window === 'undefined') return;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    // Safely stop previous instance before creating a clean fresh one
    if (callRecognitionRef.current) {
      try {
        callRecognitionRef.current.onresult = null;
        callRecognitionRef.current.onend = null;
        callRecognitionRef.current.onerror = null;
        callRecognitionRef.current.stop();
      } catch(e){}
      callRecognitionRef.current = null;
    }

    try {
      const recog = new SpeechRecognition();
      recog.continuous = true;
      recog.interimResults = true;
      recog.maxAlternatives = 1;
      recog.lang = isMalay ? 'ms-MY' : 'en-US';

      recog.onstart = () => {
        isRecognitionRunningRef.current = true;
        setCallStatus('listening');
      };

      const scheduleAutoSubmit = (delayMs: number = 3500) => {
        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = setTimeout(() => {
          const speechToSubmit = cleanSpeechDuplicates(currentAccumulatedSpeechRef.current || persistedTurnSpeechRef.current);
          if (speechToSubmit && isCallActiveRef.current && !isAgentSpeakingRef.current) {
            currentAccumulatedSpeechRef.current = '';
            persistedTurnSpeechRef.current = '';
            try { recog.stop(); } catch(e){}
            processQuery(speechToSubmit, true);
          }
        }, delayMs);
      };

      recog.onspeechend = () => {
        // User stopped vocalizing -> start the 3.5s countdown to auto-submit
        if (currentAccumulatedSpeechRef.current || persistedTurnSpeechRef.current) {
          scheduleAutoSubmit(3500);
        }
      };

      recog.onresult = (event: any) => {
        if (isAgentSpeakingRef.current) return;

        const currentSegment = parseSpeechRecognitionResults(event.results);
        if (!currentSegment) return;

        // Merge with previously persisted speech from earlier in this user turn so pausing doesn't wipe previous words
        let fullText = currentSegment;
        if (persistedTurnSpeechRef.current) {
          const prevLower = persistedTurnSpeechRef.current.toLowerCase();
          const currLower = currentSegment.toLowerCase();
          if (!currLower.startsWith(prevLower.slice(0, Math.min(prevLower.length, 12)))) {
            fullText = `${persistedTurnSpeechRef.current} ${currentSegment}`;
          }
        }

        fullText = cleanSpeechDuplicates(fullText);
        lastSpeechActivityTimestampRef.current = Date.now();
        currentAccumulatedSpeechRef.current = fullText;
        setLiveTranscript(fullText);

        const words = fullText.split(/\s+/).filter(Boolean);
        if (words.length >= 1) {
          const lastWord = words[words.length - 1].toLowerCase().replace(/[^a-z0-9%]/g, '');

          // Thinking / Filler sounds & trailing conjunctions where user is contemplating or formulating
          const thinkingSounds = [
            'ur', 'uh', 'um', 'ah', 'er', 'erm', 'hmm', 'err', 'arr', 'ha', 'aaa', 'eee', 'emm', 'uhh', 'umm', 'ahh', 'em', 'aa', 'ee'
          ];
          const trailingConnectives = [
            'and', 'dan', 'then', 'kemudian', 'so', 'jadi', 'like', 'macam', 'about', 'dalam', 'around', 'kira-kira', 'for', 'untuk', 'rate', 'kadar', 'interest', 'faedah', 'in', 'at', 'with', 'dengan', 'to', 'ke', 'year', 'years', 'tahun'
          ];

          const isThinkingOrConnecting = thinkingSounds.includes(lastWord) || trailingConnectives.includes(lastWord);

          // Standard silence timer: 3.5s (3500ms) if finished; 5.5s (5500ms) if thinking/hesitating with "ur", "ah", etc.
          const waitTimeout = isThinkingOrConnecting ? 5500 : 3500;
          scheduleAutoSubmit(waitTimeout);
        }
      };

      recog.onerror = (e: any) => {
        console.warn("Call speech recog notice:", e.error);
        if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
          isRecognitionRunningRef.current = false;
        }
      };

      recog.onend = () => {
        isRecognitionRunningRef.current = false;
        // Save current speech so user pausing doesn't wipe previous words when new utterance begins
        if (currentAccumulatedSpeechRef.current) {
          persistedTurnSpeechRef.current = currentAccumulatedSpeechRef.current;
          // Ensure auto-submit is scheduled if user is quiet
          if (!silenceTimerRef.current && isCallActiveRef.current && !isAgentSpeakingRef.current) {
            scheduleAutoSubmit(3000);
          }
        }
        // Graceful auto-restart if call is still active and agent is not speaking
        if (isCallActiveRef.current && !isMutedRef.current && !isAgentSpeakingRef.current && !isProcessingRef.current) {
          setTimeout(() => {
            if (isCallActiveRef.current && !isMutedRef.current && !isAgentSpeakingRef.current && !isRecognitionRunningRef.current && !isProcessingRef.current) {
              startCallListening();
            }
          }, 250);
        }
      };

      callRecognitionRef.current = recog;
      recog.start();
    } catch (e) {
      console.warn("Call recog start error:", e);
      isRecognitionRunningRef.current = false;
    }
  }, [isMalay]);

  // Synchronize Speech Recognition language dynamically whenever language changes
  useEffect(() => {
    isMalayRef.current = isMalay;
    if (isCallActiveRef.current && !isAgentSpeakingRef.current && !isProcessingRef.current) {
      if (callRecognitionRef.current) {
        try {
          callRecognitionRef.current.onresult = null;
          callRecognitionRef.current.onend = null;
          callRecognitionRef.current.onerror = null;
          callRecognitionRef.current.stop();
        } catch (e) {}
        callRecognitionRef.current = null;
        isRecognitionRunningRef.current = false;
      }
      const timer = setTimeout(() => {
        if (isCallActiveRef.current && !isAgentSpeakingRef.current && !isProcessingRef.current) {
          startCallListening();
        }
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [isMalay, startCallListening]);

  // Tab Visibility & Focus Auto-Healer: Re-engage microphone when switching back to tab
  useEffect(() => {
    const handleReviveOnFocus = () => {
      if (document.visibilityState === 'visible' && isCallActiveRef.current && !isAgentSpeakingRef.current && !isMutedRef.current && !isProcessingRef.current) {
        if (!isRecognitionRunningRef.current) {
          startCallListening();
        }
      }
    };

    document.addEventListener('visibilitychange', handleReviveOnFocus);
    window.addEventListener('focus', handleReviveOnFocus);

    // Keep-alive Heartbeat Watchdog every 2.5 seconds
    const heartbeatInterval = setInterval(() => {
      if (isCallActiveRef.current && !isAgentSpeakingRef.current && !isMutedRef.current && !isProcessingRef.current) {
        if (!isRecognitionRunningRef.current) {
          startCallListening();
        }
      }
    }, 2500);

    return () => {
      document.removeEventListener('visibilitychange', handleReviveOnFocus);
      window.removeEventListener('focus', handleReviveOnFocus);
      clearInterval(heartbeatInterval);
    };
  }, [startCallListening]);

  // Submit speech immediately
  const handleCommitCurrentSpeech = () => {
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    const speech = cleanSpeechDuplicates(currentAccumulatedSpeechRef.current || liveTranscript);
    if (speech && speech.trim()) {
      currentAccumulatedSpeechRef.current = '';
      persistedTurnSpeechRef.current = '';
      if (callRecognitionRef.current) {
        try { callRecognitionRef.current.stop(); } catch(e){}
      }
      processQuery(speech, true);
    }
  };

  // Start Live AI Voice Call
  const handleStartCall = () => {
    setIsOpen(true);
    setIsCallActive(true);
    setCallStatus('speaking');
    setLiveTranscript('');
    currentAccumulatedSpeechRef.current = '';
    persistedTurnSpeechRef.current = '';
    setLastCallAction(null);
    setLastUserSpeech('');

    const welcomeGreeting = isMalay
      ? "Hai, saya Ejen & Pembantu AI anda, bagaimana saya boleh bantu anda?"
      : "Hi, I'm your AI Agent & Assistant, how can I help you?";

    setLastAgentReply(welcomeGreeting);

    speakText(welcomeGreeting, () => {
      if (isCallActiveRef.current) {
        startCallListening();
      }
    });
  };

  // End Live Voice Call
  const handleEndCall = () => {
    stopSpeaking();
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    if (callRecognitionRef.current) {
      try { 
        callRecognitionRef.current.onresult = null;
        callRecognitionRef.current.onend = null;
        callRecognitionRef.current.onerror = null;
        callRecognitionRef.current.stop(); 
      } catch(e){}
      callRecognitionRef.current = null;
    }
    isRecognitionRunningRef.current = false;
    setIsCallActive(false);
    setCallStatus('listening');
    setLiveTranscript('');
    currentAccumulatedSpeechRef.current = '';
    persistedTurnSpeechRef.current = '';
    setLastCallAction(null);
    setLastUserSpeech('');
  };

  // Voice-to-Text Speech Dictation (Patient & continuous)
  const toggleVoiceToText = () => {
    if (isDictating) {
      if (dictationRecognitionRef.current) {
        try { dictationRecognitionRef.current.stop(); } catch(e){}
      }
      setIsDictating(false);
      return;
    }

    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        try {
          const recog = new SpeechRecognition();
          recog.continuous = true;
          recog.interimResults = true;
          recog.lang = isMalay ? 'ms-MY' : 'en-US';

          let dictationSilenceTimer: any = null;

          recog.onstart = () => {
            setIsDictating(true);
          };

          recog.onresult = (event: any) => {
            const transcript = parseSpeechRecognitionResults(event.results);
            if (transcript) {
              setInputMessage(transcript);
            }

            if (dictationSilenceTimer) clearTimeout(dictationSilenceTimer);
            dictationSilenceTimer = setTimeout(() => {
              if (dictationRecognitionRef.current) {
                try { dictationRecognitionRef.current.stop(); } catch(e){}
              }
              setIsDictating(false);
            }, 4000);
          };

          recog.onerror = (e: any) => {
            console.warn("Dictation recog notice:", e.error);
            setIsDictating(false);
          };

          recog.onend = () => {
            setIsDictating(false);
          };

          dictationRecognitionRef.current = recog;
          recog.start();
        } catch (e) {
          console.warn("Dictation start error:", e);
          setIsDictating(false);
        }
      }
    }
  };

  const handleSendMessage = (customPrompt?: string) => {
    const text = cleanSpeechDuplicates(customPrompt || inputMessage);
    if (text.toLowerCase().includes('panggilan') || text.toLowerCase().includes('voice call')) {
      handleStartCall();
      return;
    }
    processQuery(text, false);
  };

  // File upload handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = (event.target?.result as string) || '';
      const fileSizeFormatted = `${(file.size / 1024).toFixed(1)} KB`;

      let category: 'bank_statement' | 'platform_dashboard' | 'tax_epf' | 'mykad_id' | 'pay_slip' = 'bank_statement';
      const lowerName = file.name.toLowerCase();
      if (lowerName.includes('grab') || lowerName.includes('shopee') || lowerName.includes('panda') || lowerName.includes('lalamove')) {
        category = 'platform_dashboard';
      } else if (lowerName.includes('epf') || lowerName.includes('kwsp') || lowerName.includes('lhdn') || lowerName.includes('tax')) {
        category = 'tax_epf';
      } else if (lowerName.includes('ic') || lowerName.includes('mykad') || lowerName.includes('kad')) {
        category = 'mykad_id';
      }

      if (typeof onStartAssessmentWithFile === 'function') {
        onStartAssessmentWithFile({
          fileName: file.name,
          fileType: file.type || 'application/pdf',
          fileSize: fileSizeFormatted,
          fileBase64: base64,
          category
        });
      }

      const userFileMsg: ChatMessage = {
        id: `user-file-${Date.now()}`,
        role: 'user',
        content: isMalay ? `Lampirkan fail: ${file.name} (${fileSizeFormatted})` : `Uploaded: ${file.name} (${fileSizeFormatted})`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        attachedFile: { name: file.name, size: fileSizeFormatted, type: file.type }
      };

      const isAlreadyOnUpload = activeStep >= 2 || hasUploadedFiles;
      const assistantFileMsg: ChatMessage = {
        id: `assistant-file-${Date.now()}`,
        role: 'assistant',
        content: isAlreadyOnUpload
          ? (isMalay
              ? `Fail ${file.name} dimuat naik. Membuka Ruang Kerja Dokumen (Langkah 2).`
              : `Document ${file.name} attached. Proceeding to Document Upload Workplace (Step 2).`)
          : (isMalay
              ? `Fail ${file.name} diterima. Sila pilih tujuan pembiayaan di Langkah 1.`
              : `Document ${file.name} attached. Please confirm your loan purpose in Step 1.`),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        action: { type: isAlreadyOnUpload ? 'NAVIGATE_UPLOAD' : 'NAVIGATE_LOAN_NEED' },
        suggestions: isMalay ? ["Ruang Dokumen", "Direktori Bank"] : ["Upload Workplace", "Bank Directory"]
      };

      setMessages(prev => [...prev, userFileMsg, assistantFileMsg]);
    };

    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.png,.jpg,.jpeg,.csv"
        className="hidden"
        onChange={handleFileUpload}
      />

      <div className="fixed bottom-20 right-4 sm:bottom-6 sm:right-6 z-50 flex flex-col items-end pointer-events-auto">
        
        {/* Single Clean Trigger: "Ask AI" */}
        {!isOpen ? (
          <button
            onClick={() => setIsOpen(true)}
            className="flex items-center gap-2.5 px-4 py-3 sm:py-3.5 bg-blue-950 hover:bg-blue-900 text-white rounded-full shadow-2xl border border-blue-800 shrink-0 transition-all hover:scale-105 active:scale-95 group cursor-pointer"
            title={isMalay ? "Tanya Ejen AI" : "Ask AI Agent"}
          >
            <div className="relative flex items-center justify-center">
              <AILogoIcon className="w-4 h-4" />
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
            </div>
            <span className="text-xs font-black tracking-wide text-white">
              Ask AI
            </span>
          </button>
        ) : (
          /* Open Chat / Voice Call Window */
          <div className="w-[calc(100vw-2rem)] sm:w-[390px] h-[75vh] sm:h-[530px] max-h-[560px] bg-white border border-slate-200 shadow-2xl flex flex-col overflow-hidden rounded-3xl animate-fade-in fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-50">
            
            {/* Header (Clean & Sleek) */}
            {/* Header */}
            <div className="bg-blue-950 text-white px-4 py-3 flex justify-between items-center border-b border-blue-900/80">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-white/95 border border-blue-400/40 flex items-center justify-center shadow-xs p-1">
                  <AILogoIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-white tracking-wide">
                    {isCallActive ? (isMalay ? 'Panggilan Suara AI' : 'Live Voice Call') : (isMalay ? 'Ejen & Pembantu AI' : 'AI Agent & Assistant')}
                  </h3>
                  {isCallActive && (
                    <span className="text-[10px] text-blue-300 flex items-center gap-1 font-mono font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                      {formatCallTime(callDuration)}
                    </span>
                  )}
                </div>
              </div>

              {/* Controls: Clean Header */}
              <div className="flex items-center gap-1.5">
                {!isCallActive && (
                  <button
                    type="button"
                    onClick={handleClearChat}
                    className="p-1.5 bg-blue-900/60 hover:bg-slate-800 text-blue-200 hover:text-white rounded-lg text-[10px] border border-blue-800/80 transition-all cursor-pointer"
                    title={isMalay ? "Kosongkan Sembang" : "Clear Chat"}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    const nextLang = isMalay ? 'en' : 'bm';
                    setLanguage(nextLang);
                    if (typeof onChangeLanguage === 'function') onChangeLanguage(nextLang);
                  }}
                  className="px-2 py-1 bg-blue-900/60 hover:bg-blue-800 text-white rounded-lg text-[10px] font-bold border border-blue-800/80 transition-all cursor-pointer"
                  title="Switch Language"
                >
                  {isMalay ? 'BM' : 'EN'}
                </button>

                {!isCallActive && (
                  <button
                    type="button"
                    onClick={handleStartCall}
                    className="flex items-center gap-1 px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-[11px] font-bold transition-all shadow-xs cursor-pointer active:scale-95"
                  >
                    <PhoneCall className="w-3 h-3" />
                    <span>{isMalay ? 'Panggil' : 'Call'}</span>
                  </button>
                )}

                <button 
                  onClick={() => {
                    if (isCallActive) handleEndCall();
                    setIsOpen(false);
                  }}
                  className="p-1 hover:bg-blue-900 text-blue-300 hover:text-white rounded-lg transition-all cursor-pointer"
                  title={isMalay ? "Tutup" : "Close"}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* ========================================================================= */}
            {/* VIEW A: MINIMALIST & PROFESSIONAL VOICE CALL SCREEN                       */}
            {/* ========================================================================= */}
            {isCallActive ? (
              <div className="flex-1 bg-gradient-to-b from-blue-950 via-slate-900 to-slate-950 p-4.5 flex flex-col justify-between text-white animate-fade-in relative overflow-hidden">
                
                {/* Subtle Ambient background */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

                {/* Center Sleek Voice Orb & Equalizer */}
                <div className="flex flex-col items-center justify-center gap-2.5 z-10 my-2">
                  <div className="relative flex items-center justify-center">
                    <div className={`absolute w-24 h-24 rounded-full border border-blue-500/20 ${callStatus === 'speaking' ? 'animate-ping' : ''}`} />
                    <div className={`absolute w-20 h-20 rounded-full bg-blue-600/20 blur-md ${callStatus === 'speaking' ? 'animate-pulse' : ''}`} />
                    
                    <button
                      type="button"
                      onClick={() => {
                        if (callStatus === 'speaking') handleInterruptAndSpeak();
                        else if (liveTranscript) handleCommitCurrentSpeech();
                      }}
                      className={`w-16 h-16 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 cursor-pointer ${
                        callStatus === 'speaking' 
                          ? 'bg-blue-600 hover:bg-blue-500 scale-105 shadow-blue-500/30 ring-4 ring-blue-500/20' 
                          : callStatus === 'thinking'
                          ? 'bg-blue-800 animate-pulse shadow-cyan-500/30 ring-4 ring-cyan-500/30'
                          : 'bg-blue-600 hover:bg-blue-500 shadow-blue-500/30 ring-4 ring-blue-500/20'
                      }`}
                      title={callStatus === 'speaking' ? (isMalay ? "Sentuh untuk Sampuk & Cakap" : "Tap to Interrupt & Speak") : undefined}
                    >
                      {callStatus === 'speaking' ? (
                        <Activity className="w-7 h-7 text-white animate-pulse" />
                      ) : callStatus === 'thinking' ? (
                        <Sparkles className="w-7 h-7 text-cyan-300 animate-spin" />
                      ) : (
                        <Mic className="w-7 h-7 text-white" />
                      )}
                    </button>
                  </div>

                  {/* Equalizer Sound Wave Bars */}
                  <div className="flex items-center gap-1 h-3.5">
                    <span className={`w-1 bg-blue-400 rounded-full transition-all duration-200 ${callStatus === 'speaking' ? 'h-3 animate-pulse' : callStatus === 'listening' ? 'h-1.5' : 'h-1 opacity-40'}`}></span>
                    <span className={`w-1 bg-blue-300 rounded-full transition-all duration-200 ${callStatus === 'speaking' ? 'h-3.5 animate-pulse [animation-duration:0.4s]' : callStatus === 'listening' ? 'h-2' : 'h-1 opacity-40'}`}></span>
                    <span className={`w-1 bg-blue-400 rounded-full transition-all duration-200 ${callStatus === 'speaking' ? 'h-4 animate-pulse [animation-duration:0.6s]' : callStatus === 'listening' ? 'h-3' : 'h-1 opacity-40'}`}></span>
                    <span className={`w-1 bg-blue-300 rounded-full transition-all duration-200 ${callStatus === 'speaking' ? 'h-3 animate-pulse [animation-duration:0.5s]' : callStatus === 'listening' ? 'h-2' : 'h-1 opacity-40'}`}></span>
                    <span className={`w-1 bg-blue-400 rounded-full transition-all duration-200 ${callStatus === 'speaking' ? 'h-1.5 animate-pulse [animation-duration:0.7s]' : callStatus === 'listening' ? 'h-1' : 'h-1 opacity-40'}`}></span>
                  </div>

                  <span className="text-[11px] font-semibold text-slate-300 tracking-wide">
                    {callStatus === 'speaking' && (isMalay ? "Ejen Sedang Menjawab..." : "AI Speaking...")}
                    {callStatus === 'thinking' && (isMalay ? "AI Sedang Memproses & Mengira..." : "AI Processing & Calculating...")}
                    {callStatus === 'listening' && (isMalay ? "Mendengar suara anda..." : "Listening...")}
                  </span>

                  {/* Interrupt & Speak Button while AI is speaking */}
                  {callStatus === 'speaking' && (
                    <button
                      type="button"
                      onClick={handleInterruptAndSpeak}
                      className="px-3.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-full text-[11px] font-bold flex items-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer animate-fade-in"
                    >
                      <Pause className="w-3.5 h-3.5 text-amber-400" />
                      <span>{isMalay ? "Sampuk & Tanya Seterusnya ↵" : "Interrupt & Ask Next Question ↵"}</span>
                    </button>
                  )}
                </div>

                {/* Live Visual Stream & HUD Card Container */}
                <div className="w-full flex-1 max-h-[220px] overflow-y-auto flex flex-col gap-2 my-1 z-10 custom-scrollbar pr-0.5">
                  {/* Glowing Live AI Processing Demo Card while waiting for response */}
                  {callStatus === 'thinking' && (
                    <div className="p-3.5 bg-blue-950/80 border border-cyan-500/40 rounded-2xl flex items-center gap-3 shadow-xl animate-pulse">
                      <div className="w-8 h-8 rounded-xl bg-cyan-600/30 border border-cyan-400/40 flex items-center justify-center shrink-0">
                        <Sparkles className="w-4.5 h-4.5 text-cyan-300 animate-spin" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-xs font-bold text-cyan-200 block">
                          {isMalay ? "AI Sedang Menganalisis & Mengira..." : "AI Analyzing & Calculating..."}
                        </span>
                        <span className="text-[10px] text-slate-300 block truncate">
                          {isMalay ? "Menilai kelayakan pembiayaan & pengiraan anda..." : "Assessing loan eligibility & calculation..."}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Live transcript while user is speaking */}
                  {liveTranscript ? (
                    <div className="p-3 bg-slate-900/95 border border-blue-500/40 rounded-2xl flex items-center justify-between gap-2.5 shadow-lg animate-fade-in ring-1 ring-blue-500/20">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <Mic className="w-4 h-4 text-cyan-400 shrink-0 animate-pulse" />
                        <p className="text-xs text-white font-medium italic truncate">
                          &quot;{liveTranscript}&quot;
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleCommitCurrentSpeech}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-bold rounded-xl shrink-0 cursor-pointer shadow-md active:scale-95 flex items-center gap-1"
                        title={isMalay ? "Hantar Sekarang" : "Send Now"}
                      >
                        <span>{isMalay ? 'Selesai' : 'Send'}</span>
                        <ArrowRight className="w-3 h-3 text-blue-200" />
                      </button>
                    </div>
                  ) : callStatus === 'listening' && (
                    <div className="px-3 py-2 bg-slate-900/40 border border-slate-800/80 rounded-xl text-center">
                      <span className="text-[10px] text-slate-400">
                        {isMalay 
                          ? "Sebut keperluan anda (cth: 'Saya nak pinjam 5000, 5 tahun, 4% faedah')" 
                          : "Speak naturally (e.g., 'I want a loan of RM 5,000 for 5 years at 4%')"}
                      </span>
                    </div>
                  )}

                  {/* Previous User Speech pill */}
                  {!liveTranscript && lastUserSpeech && (
                    <div className="px-2.5 py-1 bg-slate-900/70 border border-slate-800 rounded-lg text-[10px] text-slate-300 flex items-center gap-1.5">
                      <User className="w-3 h-3 text-slate-400 shrink-0" />
                      <span className="truncate italic">&quot;{lastUserSpeech}&quot;</span>
                    </div>
                  )}

                  {/* Clean Monochromatic Calculation Card */}
                  {lastCallAction?.type === 'SET_CALCULATOR' && lastCallAction.payload ? (
                    <div className="p-3 bg-slate-900/95 border border-slate-800 rounded-2xl shadow-xl flex flex-col gap-2 animate-fade-in">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                        <div className="flex items-center gap-1.5">
                          <Calculator className="w-3.5 h-3.5 text-blue-400" />
                          <span className="text-xs font-bold text-white tracking-wide">{isMalay ? 'Hasil Pengiraan Pinjaman' : 'Loan Calculation Result'}</span>
                        </div>
                        <span className="text-[10px] font-bold bg-slate-800 text-slate-300 px-2 py-0.5 rounded-md border border-slate-700">
                          {lastCallAction.payload.interestRate}% flat p.a.
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-left">
                        <div className="bg-slate-950/80 p-2 rounded-xl border border-slate-800/80">
                          <span className="text-[9px] font-bold text-slate-400 uppercase block">{isMalay ? 'Jumlah Pinjaman' : 'Loan Amount'}</span>
                          <span className="text-sm font-black text-white block mt-0.5">RM {lastCallAction.payload.loanAmount.toLocaleString()}</span>
                          <span className="text-[9px] text-slate-400 block">{lastCallAction.payload.tenureYears} {lastCallAction.payload.tenureYears === 1 ? 'Year' : 'Years'} ({lastCallAction.payload.tenureYears * 12} Mo)</span>
                        </div>
                        <div className="bg-slate-950/80 p-2 rounded-xl border border-slate-800/80 text-right">
                          <span className="text-[9px] font-bold text-slate-400 uppercase block">{isMalay ? 'Anggaran Ansuran' : 'Est. Installment'}</span>
                          <span className="text-sm font-black text-blue-400 block mt-0.5">
                            RM {(Math.round((lastCallAction.payload.loanAmount * (1 + (lastCallAction.payload.interestRate / 100) * lastCallAction.payload.tenureYears)) / (lastCallAction.payload.tenureYears * 12) * 100) / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                          <span className="text-[9px] text-slate-400 block">/ {isMalay ? 'bulan' : 'month'}</span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => executeAgentAction(lastCallAction, true)}
                        className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md transition-all cursor-pointer active:scale-98"
                      >
                        <ArrowRight className="w-3.5 h-3.5 text-white" />
                        <span>{isMalay ? 'Buka Kalkulator Penuh →' : 'Open in Calculator Page →'}</span>
                      </button>
                    </div>
                  ) : lastCallAction?.type === 'NAVIGATE_DIRECTORY' ? (
                    <div className="p-3 bg-slate-900/95 border border-slate-800 rounded-2xl flex flex-col gap-2">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                        <Landmark className="w-3.5 h-3.5 text-blue-400" />
                        <span>{isMalay ? 'Direktori Bank & Pemberi Pinjaman' : 'Licensed Bank Directory'}</span>
                      </div>
                      <p className="text-[11px] text-slate-300">{isMalay ? 'Semak 11 institusi kewangan yang dipadankan.' : 'Explore 11 matched financial institutions.'}</p>
                      <button
                        type="button"
                        onClick={() => executeAgentAction(lastCallAction, true)}
                        className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <span>{isMalay ? 'Pergi ke Direktori Bank →' : 'Go to Bank Directory →'}</span>
                      </button>
                    </div>
                  ) : lastCallAction?.type === 'NAVIGATE_LOAN_NEED' ? (
                    <div className="p-3 bg-slate-900/95 border border-slate-800 rounded-2xl flex flex-col gap-2">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                        <Target className="w-3.5 h-3.5 text-blue-400" />
                        <span>{isMalay ? 'Langkah 1: Keperluan Pinjaman' : 'Step 1: Loan Purpose Setup'}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => executeAgentAction(lastCallAction, true)}
                        className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <span>{isMalay ? 'Pergi ke Langkah 1 →' : 'Go to Step 1 →'}</span>
                      </button>
                    </div>
                  ) : (
                    /* Default AI Text Subtitle Box with Auto-scroll */
                    <div className="w-full bg-slate-900/95 border border-slate-800 rounded-2xl p-3 text-left shadow-lg flex items-start gap-2.5">
                      <div className="w-6 h-6 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center shrink-0 mt-0.5">
                        <Bot className="w-3.5 h-3.5 text-blue-400" />
                      </div>
                      <div 
                        ref={callSubtitleScrollRef}
                        onWheel={() => {
                          isUserScrollingSubtitlesRef.current = true;
                          if (userScrollResumeTimerRef.current) clearTimeout(userScrollResumeTimerRef.current);
                          userScrollResumeTimerRef.current = setTimeout(() => {
                            isUserScrollingSubtitlesRef.current = false;
                          }, 4000);
                        }}
                        onTouchMove={() => {
                          isUserScrollingSubtitlesRef.current = true;
                          if (userScrollResumeTimerRef.current) clearTimeout(userScrollResumeTimerRef.current);
                          userScrollResumeTimerRef.current = setTimeout(() => {
                            isUserScrollingSubtitlesRef.current = false;
                          }, 4000);
                        }}
                        onPointerDown={() => {
                          isUserScrollingSubtitlesRef.current = true;
                          if (userScrollResumeTimerRef.current) clearTimeout(userScrollResumeTimerRef.current);
                          userScrollResumeTimerRef.current = setTimeout(() => {
                            isUserScrollingSubtitlesRef.current = false;
                          }, 4000);
                        }}
                        className="flex-1 text-xs text-slate-100 leading-relaxed max-h-[140px] overflow-y-auto pr-1 custom-scrollbar"
                      >
                        <FormattedMessage 
                          text={lastAgentReply || (isMalay ? "Bagaimana saya boleh bantu anda?" : "How can I help you?")} 
                          isDark={true}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Bottom Call Controls */}
                <div className="flex items-center justify-center gap-6 mt-2 z-10 w-full pt-1.5 border-t border-slate-800/80">
                  <button
                    type="button"
                    onClick={() => setIsMuted(prev => !prev)}
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                      isMuted 
                        ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40' 
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                    }`}
                    title={isMuted ? "Unmute" : "Mute"}
                  >
                    {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                  </button>

                  <button
                    type="button"
                    onClick={handleEndCall}
                    className="w-14 h-14 bg-rose-600 hover:bg-rose-500 text-white rounded-full flex items-center justify-center shadow-lg transition-transform active:scale-95 cursor-pointer"
                    title={isMalay ? "Tamatkan Panggilan" : "End Call"}
                  >
                    <PhoneOff className="w-6 h-6" />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      stopSpeaking();
                      setIsCallActive(false);
                    }}
                    className="w-10 h-10 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-full flex items-center justify-center border border-slate-700 transition-all cursor-pointer"
                    title="Switch to Chat"
                  >
                    <MessageSquare className="w-4 h-4" />
                  </button>
                </div>

              </div>
            ) : (
              /* ========================================================================= */
              /* VIEW B: STANDARD RICH TEXT CHAT VIEW                                      */
              /* ========================================================================= */
              <>
                {/* Message Thread */}
                <div className="flex-1 p-3.5 overflow-y-auto flex flex-col gap-2.5 bg-slate-50/70">
                  
                  {messages.map((msg) => (
                    <div 
                      key={msg.id} 
                      className={`flex flex-col gap-1 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                    >
                      <div 
                        className={`p-3 rounded-2xl text-xs leading-relaxed max-w-[88%] shadow-xs ${
                          msg.role === 'user'
                            ? 'bg-blue-950 text-white rounded-tr-xs'
                            : 'bg-white text-slate-800 border border-slate-200/90 rounded-tl-xs'
                        }`}
                      >
                        <FormattedMessage text={msg.content} isUser={msg.role === 'user'} />

                        {msg.attachedFile && (
                          <div className="mt-2 p-2 bg-blue-950/90 rounded-xl border border-blue-800 text-white text-[11px] flex items-center gap-2">
                            <FileText className="w-3.5 h-3.5 text-blue-300 shrink-0" />
                            <span className="truncate font-semibold">{msg.attachedFile.name}</span>
                            <span className="text-[10px] text-blue-200 shrink-0">{msg.attachedFile.size}</span>
                          </div>
                        )}

                        {msg.action && (
                          <div className="mt-2.5 pt-2 border-t border-slate-100 flex flex-col gap-1.5">
                            {msg.action.type === 'DOWNLOAD_REPORT' && (
                              <button
                                type="button"
                                onClick={() => executeAgentAction(msg.action!)}
                                className="w-full py-2 px-3 bg-blue-950 hover:bg-blue-900 text-white text-xs font-bold rounded-lg shadow-xs transition-all flex items-center justify-between cursor-pointer active:scale-98"
                              >
                                <div className="flex items-center gap-1.5">
                                  <FileText className="w-3.5 h-3.5 text-blue-300" />
                                  <span>{isMalay ? 'Muat Turun PDF Pasport Kredit 📥' : 'Download Credit Passport (PDF) 📥'}</span>
                                </div>
                                <ArrowRight className="w-3.5 h-3.5 text-blue-300" />
                              </button>
                            )}
                            {msg.action.type === 'NAVIGATE_TRACKER' && (
                              <button
                                type="button"
                                onClick={() => executeAgentAction(msg.action!)}
                                className="w-full py-2 px-3 bg-blue-950 hover:bg-blue-900 text-white text-xs font-bold rounded-lg shadow-xs transition-all flex items-center justify-between cursor-pointer active:scale-98"
                              >
                                <div className="flex items-center gap-1.5">
                                  <FileBarChart className="w-3.5 h-3.5 text-blue-300" />
                                  <span>{isMalay ? 'Buka Penjejak Permohonan' : 'Open Application Tracker'}</span>
                                </div>
                                <ArrowRight className="w-3.5 h-3.5 text-blue-300" />
                              </button>
                            )}
                            {msg.action.type === 'NAVIGATE_LOAN_NEED' && (
                              <button
                                type="button"
                                onClick={() => executeAgentAction(msg.action!)}
                                className="w-full py-2 px-3 bg-blue-950 hover:bg-blue-900 text-white text-xs font-bold rounded-lg shadow-xs transition-all flex items-center justify-between cursor-pointer active:scale-98"
                              >
                                <div className="flex items-center gap-1.5">
                                  <Target className="w-3.5 h-3.5 text-blue-300" />
                                  <span>{isMalay ? 'Pilih Keperluan Pinjaman' : 'Set Loan Purpose & Amount'}</span>
                                </div>
                                <ArrowRight className="w-3.5 h-3.5 text-blue-300" />
                              </button>
                            )}
                            {msg.action.type === 'SET_CALCULATOR' && (
                              <button
                                type="button"
                                onClick={() => executeAgentAction(msg.action!)}
                                className="w-full py-2.5 px-3 bg-blue-950 hover:bg-blue-900 text-white text-xs font-black rounded-xl shadow-md transition-all flex items-center justify-between cursor-pointer active:scale-98"
                              >
                                <div className="flex items-center gap-2">
                                  <Calculator className="w-4 h-4 text-emerald-400" />
                                  <span>
                                    {isMalay 
                                      ? `Buka Kalkulator (RM ${msg.action.payload?.loanAmount?.toLocaleString() || '5,000'})` 
                                      : `Open Loan Calculator (RM ${msg.action.payload?.loanAmount?.toLocaleString() || '5,000'})`}
                                  </span>
                                </div>
                                <ArrowRight className="w-4 h-4 text-emerald-400" />
                              </button>
                            )}
                            {msg.action.type === 'NAVIGATE_DIRECTORY' && (
                              <button
                                type="button"
                                onClick={() => executeAgentAction(msg.action!)}
                                className="w-full py-2 px-3 bg-blue-950 hover:bg-blue-900 text-white text-xs font-bold rounded-lg shadow-xs transition-all flex items-center justify-between cursor-pointer active:scale-98"
                              >
                                <div className="flex items-center gap-1.5">
                                  <Landmark className="w-3.5 h-3.5 text-blue-300" />
                                  <span>{isMalay ? 'Lihat Direktori Bank' : 'Explore Bank Directory'}</span>
                                </div>
                                <ArrowRight className="w-3.5 h-3.5 text-blue-300" />
                              </button>
                            )}
                            {msg.action.type === 'NAVIGATE_SETTINGS' && (
                              <button
                                type="button"
                                onClick={() => executeAgentAction(msg.action!)}
                                className="w-full py-2 px-3 bg-blue-950 hover:bg-blue-900 text-white text-xs font-bold rounded-lg shadow-xs transition-all flex items-center justify-between cursor-pointer active:scale-98"
                              >
                                <div className="flex items-center gap-1.5">
                                  <Settings className="w-3.5 h-3.5 text-blue-300" />
                                  <span>{isMalay ? 'Tetapan Profil' : 'Open Profile Settings'}</span>
                                </div>
                                <ArrowRight className="w-3.5 h-3.5 text-blue-300" />
                              </button>
                            )}
                            {msg.action.type === 'PROMPT_CREATE_TICKET' && (
                              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl flex flex-col gap-2 shadow-2xs mt-1">
                                <div className="flex items-center justify-between">
                                  <span className="text-[10px] font-bold text-blue-800 uppercase tracking-wider">
                                    {isMalay ? 'Pratonton Tiket Sokongan' : 'Support Ticket Draft'}
                                  </span>
                                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 font-bold">
                                    {msg.action.payload?.priority?.toUpperCase() || 'NORMAL'}
                                  </span>
                                </div>
                                <div className="text-xs font-bold text-slate-900">
                                  {msg.action.payload?.subject || (isMalay ? 'Bantuan Khidmat Pelanggan' : 'Customer Support Request')}
                                </div>
                                <div className="text-[11px] text-slate-600">
                                  {isMalay ? `Jaminan SLA: ${msg.action.payload?.slaMinutes || 30} minit melalui WhatsApp/Emel` : `SLA: ${msg.action.payload?.slaMinutes || 30} mins via WhatsApp/Email`}
                                </div>
                                <div className="flex items-center gap-2 pt-1">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const ticketId = `TKT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
                                      executeAgentAction({
                                        type: 'DISPATCH_TICKET',
                                        payload: {
                                          ...msg.action!.payload,
                                          id: ticketId
                                        }
                                      }, false);
                                    }}
                                    className="flex-1 py-2 px-3 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-98"
                                  >
                                    <Headphones className="w-3.5 h-3.5" />
                                    <span>{isMalay ? 'Sah & Hantar Tiket 🚀' : 'Confirm & Dispatch 🚀'}</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => executeAgentAction({ type: 'NAVIGATE_SUPPORT' })}
                                    className="py-2 px-2.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                                  >
                                    {isMalay ? 'Pusat Bantuan' : 'Support Center'}
                                  </button>
                                </div>
                              </div>
                            )}
                            {msg.action.type === 'DISPATCH_TICKET' && (
                              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex flex-col gap-2 shadow-2xs mt-1">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-1.5">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                    <span className="text-xs font-bold text-emerald-900">
                                      {isMalay ? 'Tiket Didaftarkan' : 'Ticket Dispatched'}
                                    </span>
                                  </div>
                                  <span className="text-xs font-mono font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md">
                                    {msg.action.payload?.id || 'TKT-2026-LIVE'}
                                  </span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => executeAgentAction({ type: 'NAVIGATE_SUPPORT', payload: { id: msg.action!.payload?.id } })}
                                  className="w-full py-2 px-3 bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold rounded-lg shadow-xs transition-all flex items-center justify-between cursor-pointer active:scale-98"
                                >
                                  <div className="flex items-center gap-1.5">
                                    <FileText className="w-3.5 h-3.5 text-emerald-200" />
                                    <span>{isMalay ? 'Jejak Status Tiket Ini 🔍' : 'Track This Ticket 🔍'}</span>
                                  </div>
                                  <ArrowRight className="w-3.5 h-3.5 text-emerald-200" />
                                </button>
                              </div>
                            )}
                            {msg.action.type === 'NAVIGATE_SUPPORT' && (
                              <button
                                type="button"
                                onClick={() => executeAgentAction(msg.action!)}
                                className="w-full py-2 px-3 bg-blue-950 hover:bg-blue-900 text-white text-xs font-bold rounded-lg shadow-xs transition-all flex items-center justify-between cursor-pointer active:scale-98"
                              >
                                <div className="flex items-center gap-1.5">
                                  <Headphones className="w-3.5 h-3.5 text-blue-300" />
                                  <span>{isMalay ? 'Buka Pusat Khidmat Pelanggan' : 'Open Support Center'}</span>
                                </div>
                                <ArrowRight className="w-3.5 h-3.5 text-blue-300" />
                              </button>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Suggestion Pills */}
                      {msg.role === 'assistant' && msg.suggestions && msg.suggestions.length > 0 && (
                        <div className="flex flex-wrap gap-1 pt-0.5 max-w-[95%]">
                          {msg.suggestions.map((sug, si) => (
                            <button
                              key={si}
                              type="button"
                              onClick={() => {
                                const lower = sug.toLowerCase();
                                if (lower.includes('status') || lower.includes('permohonan') || lower.includes('tracker')) {
                                  executeAgentAction({ type: 'NAVIGATE_TRACKER' });
                                } else if (lower.includes('tiket') || lower.includes('support') || lower.includes('bantuan') || lower.includes('pusat')) {
                                  executeAgentAction({ type: 'NAVIGATE_SUPPORT' });
                                } else if (lower.includes('keperluan') || lower.includes('purpose')) {
                                  executeAgentAction({ type: 'NAVIGATE_LOAN_NEED' });
                                } else if (lower.includes('direktori') || lower.includes('directory') || lower.includes('bank')) {
                                  executeAgentAction({ type: 'NAVIGATE_DIRECTORY' });
                                } else if (lower.includes('kalkulator') || lower.includes('calculator')) {
                                  executeAgentAction({ type: 'NAVIGATE_CALCULATOR' });
                                } else {
                                  handleSendMessage(sug);
                                }
                              }}
                              className="px-2 py-0.5 bg-white hover:bg-slate-100 hover:border-blue-300 text-slate-700 border border-slate-200 rounded-md text-[10px] font-bold transition-all shadow-2xs cursor-pointer active:scale-95"
                            >
                              <span>{sug}</span>
                            </button>
                          ))}
                        </div>
                      )}

                      <span className="text-[9px] text-slate-400 px-1">
                        {msg.timestamp}
                      </span>
                    </div>
                  ))}

                  {isSending && (
                    <div className="flex items-start">
                      <div className="p-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl text-xs flex items-center gap-2 shadow-2xs">
                        <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-900" />
                        <span>{isMalay ? 'Memproses...' : 'Processing...'}</span>
                      </div>
                    </div>
                  )}

                  <div ref={chatEndRef} />
                </div>

                {/* Input Bar */}
                <div className="p-2.5 bg-white border-t border-slate-200">
                  <div className="flex items-center gap-1.5 pb-2 overflow-x-auto no-scrollbar text-xs">
                    <button
                      type="button"
                      onClick={() => handleSendMessage(isMalay ? "Semak status permohonan terkini" : "Check latest application status")}
                      className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[10px] font-bold shrink-0 cursor-pointer"
                    >
                      {isMalay ? 'Status Permohonan' : 'Application Status'}
                    </button>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[10px] font-bold shrink-0 flex items-center gap-1 cursor-pointer"
                    >
                      <Paperclip className="w-3 h-3 text-slate-600" />
                      <span>{isMalay ? 'Lampir Penyata' : 'Attach'}</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg border border-slate-200 flex items-center justify-center shrink-0 cursor-pointer"
                    >
                      <Paperclip className="w-3.5 h-3.5 text-slate-600" />
                    </button>

                    {/* Voice to Text Dictation */}
                    <button
                      type="button"
                      onClick={toggleVoiceToText}
                      className={`p-2 rounded-lg border flex items-center justify-center shrink-0 transition-all cursor-pointer ${
                        isDictating
                          ? 'bg-rose-100 text-rose-700 border-rose-300 animate-pulse'
                          : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
                      }`}
                      title={isDictating ? (isMalay ? "Berhenti Merakam" : "Stop Recording") : (isMalay ? "Rakam Suara ke Teks" : "Voice to Text")}
                    >
                      <Mic className="w-3.5 h-3.5" />
                    </button>

                    <input
                      type="text"
                      placeholder={isMalay ? "Taip atau cakap arahan..." : "Type or speak request..."}
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                      className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 focus:border-blue-900 focus:bg-white rounded-lg text-xs text-slate-800 outline-hidden font-medium"
                    />

                    <button
                      type="button"
                      onClick={() => handleSendMessage()}
                      disabled={isSending || !inputMessage.trim()}
                      className="p-2 bg-blue-950 hover:bg-blue-900 disabled:opacity-40 text-white rounded-lg flex items-center justify-center shrink-0 cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </>
            )}

          </div>
        )}

      </div>
    </>
  );
}
