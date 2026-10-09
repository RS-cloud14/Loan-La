'use client';

import React, { useState, useEffect } from 'react';
import {
  FileText, CheckCircle2, ChevronRight, ChevronLeft,
  Sparkles, Save, Upload, AlertCircle, HelpCircle,
  X, Check, Paperclip, Clock, ShieldCheck, ArrowRight
} from 'lucide-react';

export interface LoanProposalData {
  purposeDetail: string;
  repaymentPlan: string;
  riskMitigation: string;
  characterTrackRecord: string;
  supportingEvidence: {
    hasQuotation: boolean;
    hasEquipmentPhoto: boolean;
    hasGuarantorLetter: boolean;
    hasOtherDoc: boolean;
    quotationNotes?: string;
    filesUploaded?: string[];
    noEvidenceExplanation?: string;
  };
  completedAt?: string;
}

interface LoanProposalWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveProposal: (data: LoanProposalData) => void;
  initialData?: Partial<LoanProposalData>;
  borrowerContext?: {
    name?: string;
    platform?: string;
    monthlyIncome?: number;
    targetLoanAmount?: number;
    lenderName?: string;
  };
  language?: 'en' | 'bm';
}

const STORAGE_KEY = 'loan_la_borrower_proposal_draft';

export default function LoanProposalWizardModal({
  isOpen,
  onClose,
  onSaveProposal,
  initialData,
  borrowerContext,
  language = 'en'
}: LoanProposalWizardModalProps) {
  const isBm = language === 'bm';
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [savedToast, setSavedToast] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Form states
  const [purposeDetail, setPurposeDetail] = useState('');
  const [repaymentPlan, setRepaymentPlan] = useState('');
  const [riskMitigation, setRiskMitigation] = useState('');
  const [characterTrackRecord, setCharacterTrackRecord] = useState('');
  const [hasQuotation, setHasQuotation] = useState(false);
  const [hasEquipmentPhoto, setHasEquipmentPhoto] = useState(false);
  const [hasGuarantorLetter, setHasGuarantorLetter] = useState(false);
  const [hasOtherDoc, setHasOtherDoc] = useState(false);
  const [quotationNotes, setQuotationNotes] = useState('');
  const [noEvidenceExplanation, setNoEvidenceExplanation] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([
    'Motorcycle_Dealer_Quotation_RM5000.pdf',
    'Foodpanda_Platform_Rating_Screenshot.jpg'
  ]);

  // Load from props or local storage
  useEffect(() => {
    if (isOpen) {
      setSubmitted(false);
      try {
        const cached = localStorage.getItem(STORAGE_KEY);
        if (cached) {
          const parsed: LoanProposalData = JSON.parse(cached);
          setPurposeDetail(parsed.purposeDetail || '');
          setRepaymentPlan(parsed.repaymentPlan || '');
          setRiskMitigation(parsed.riskMitigation || '');
          setCharacterTrackRecord(parsed.characterTrackRecord || '');
          if (parsed.supportingEvidence) {
            setHasQuotation(parsed.supportingEvidence.hasQuotation || false);
            setHasEquipmentPhoto(parsed.supportingEvidence.hasEquipmentPhoto || false);
            setHasGuarantorLetter(parsed.supportingEvidence.hasGuarantorLetter || false);
            setHasOtherDoc(parsed.supportingEvidence.hasOtherDoc || false);
            setQuotationNotes(parsed.supportingEvidence.quotationNotes || '');
            setNoEvidenceExplanation(parsed.supportingEvidence.noEvidenceExplanation || '');
            if (parsed.supportingEvidence.filesUploaded?.length) {
              setUploadedFiles(parsed.supportingEvidence.filesUploaded);
            }
          }
        } else if (initialData) {
          if (initialData.purposeDetail) setPurposeDetail(initialData.purposeDetail);
          if (initialData.repaymentPlan) setRepaymentPlan(initialData.repaymentPlan);
          if (initialData.riskMitigation) setRiskMitigation(initialData.riskMitigation);
          if (initialData.characterTrackRecord) setCharacterTrackRecord(initialData.characterTrackRecord);
        }
      } catch (e) {}
    }
  }, [isOpen, initialData]);

  // Auto-Save every 10 seconds
  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      saveToLocalStorage();
    }, 10000);
    return () => clearInterval(interval);
  }, [isOpen, purposeDetail, repaymentPlan, riskMitigation, characterTrackRecord, hasQuotation, hasEquipmentPhoto, hasGuarantorLetter, hasOtherDoc, quotationNotes, noEvidenceExplanation, uploadedFiles]);

  const saveToLocalStorage = (showIndicator = false) => {
    const payload: LoanProposalData = {
      purposeDetail,
      repaymentPlan,
      riskMitigation,
      characterTrackRecord,
      supportingEvidence: {
        hasQuotation,
        hasEquipmentPhoto,
        hasGuarantorLetter,
        hasOtherDoc,
        quotationNotes,
        filesUploaded: uploadedFiles,
        noEvidenceExplanation
      }
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
      if (showIndicator) {
        setSavedToast(true);
        setTimeout(() => setSavedToast(false), 2000);
      }
    } catch (e) {}
  };

  if (!isOpen) return null;

  // Validation rules
  const isStep1Valid = purposeDetail.trim().length >= 50;
  const isStep2Valid = repaymentPlan.trim().length >= 50;
  const isStep3Valid = riskMitigation.trim().length >= 30;
  const isStep4Valid = characterTrackRecord.trim().length >= 30;
  const isStep5Valid = hasQuotation || hasEquipmentPhoto || hasGuarantorLetter || hasOtherDoc || noEvidenceExplanation.trim().length > 10;

  // Smart AI Auto-Draft Helpers
  const handleAutoDraft = (step: number) => {
    const platform = borrowerContext?.platform || 'Foodpanda';
    const amount = borrowerContext?.targetLoanAmount ? `RM ${borrowerContext.targetLoanAmount.toLocaleString()}` : 'RM 10,000';
    const income = borrowerContext?.monthlyIncome ? `RM ${borrowerContext.monthlyIncome.toLocaleString()}` : 'RM 3,500';

    if (step === 1) {
      setPurposeDetail(
        isBm
          ? `Saya memerlukan ${amount} sebagai modal kerja segera untuk menaik taraf motosikal penghantaran dan membeli inventori beg terma baru bagi meneruskan operasi ${platform}. Tanpa kenderaan yang diselenggara, saya berisiko kehilangan pendapatan harian. Sebut harga bengkel berdaftar telah disediakan.`
          : `I need ${amount} for working capital to upgrade my delivery transport and acquire heavy-duty thermal bags to maintain my active ${platform} run rate. Without this maintenance, I risk delivery downtime and loss of main daily income. Replacement parts from a certified dealer have been quoted.`
      );
    } else if (step === 2) {
      setRepaymentPlan(
        isBm
          ? `Saya akan membayar ansuran bulanan kira-kira RM 350 terus daripada pendapatan purata mingguan ${platform} (${income}/bulan). Sekiranya pesanan berkurangan pada musim tertentu, saya mempunyai simpanan penampan sebanyak RM 1,500 dan ahli keluarga sedia bertindak sebagai sandaran kewangan.`
          : `I will repay approx RM 350 monthly directly from my verified ${platform} weekly payouts (${income}/mo). If income fluctuates, I maintain RM 1,500 emergency buffer savings, and my brother has agreed to stand by as backup financial support.`
      );
    } else if (step === 3) {
      setRiskMitigation(
        isBm
          ? `Saya mempunyai rekod penarafan 4.9 bintang dan sifar aduan pelanggan selama 2 tahun aktif di platform. Nilai aset motosikal dan baki simpanan kecemasan bertindak sebagai pengurangan risiko kepada pihak institusi pembiaya.`
          : `I maintain a 4.9-star rating with zero customer complaints over 2 consecutive years of active platform deliveries. The equipment value and my emergency cash reserves serve as secondary security for the bank.`
      );
    } else if (step === 4) {
      setCharacterTrackRecord(
        isBm
          ? `Saya telah berkhidmat sebagai penghantar aktif ${platform} selama lebih 24 bulan dengan purata 26 hari bekerja sebulan. Tiada sebarang rekod muflis, sifar saman tertunggak, dan bil utiliti bulanan sentiasa dijelaskan tepat pada masanya.`
          : `I have been an active delivery partner on ${platform} for over 24 consecutive months, clocking an average of 26 active working days per month. I have zero bankruptcy flags, zero overdue utility bills, and consistent weekly banking deposits.`
      );
    }
  };

  const handleFinalSubmit = () => {
    const finalData: LoanProposalData = {
      purposeDetail,
      repaymentPlan,
      riskMitigation,
      characterTrackRecord,
      supportingEvidence: {
        hasQuotation,
        hasEquipmentPhoto,
        hasGuarantorLetter,
        hasOtherDoc,
        quotationNotes,
        filesUploaded: uploadedFiles,
        noEvidenceExplanation
      },
      completedAt: new Date().toISOString()
    };
    saveToLocalStorage();
    onSaveProposal(finalData);
    setSubmitted(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-white border border-slate-200 rounded-3xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-200/80 bg-slate-50 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-emerald-600/10 text-emerald-700">
                <FileText className="w-5 h-5 text-emerald-600" />
              </span>
              <h2 className="text-lg font-bold text-slate-950">
                {isBm ? 'Lengkapkan Cadangan Pinjaman Anda' : 'Complete Your Loan Proposal'}
              </h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-100 text-blue-900 border border-blue-200">
                {currentStep <= 5 ? `Step ${currentStep} of 5` : 'Review & Submit'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {isBm 
                ? 'Kami telah mengisi data peribadi dan kewangan anda daripada dokumen. Hanya perlu 5 perkara ringkas (kira-kira 5 minit) untuk menyokong permohonan anda.'
                : 'We already have your personal data, income, and bank figures from your documents. We only need 5 short things from you. This will take about 5 minutes.'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => saveToLocalStorage(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 text-slate-600 hover:text-slate-950 text-xs font-semibold rounded-xl transition cursor-pointer"
              title="Save & Continue Later"
            >
              <Save className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{isBm ? 'Simpan & Teruskan Nanti' : 'Save Draft'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Saved feedback toast */}
        {savedToast && (
          <div className="bg-emerald-50 border-b border-emerald-200 px-6 py-2 text-xs font-bold text-emerald-800 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            {isBm ? 'Draf cadangan anda disimpan secara automatik.' : 'Proposal draft auto-saved to your device.'}
          </div>
        )}

        {/* Progress Bar */}
        <div className="w-full bg-slate-100 h-1.5">
          <div 
            className="bg-emerald-600 h-1.5 transition-all duration-300"
            style={{ width: `${(Math.min(currentStep, 5) / 5) * 100}%` }}
          />
        </div>

        {/* Body content based on step */}
        <div className="p-5 sm:p-7 overflow-y-auto flex-1">
          {submitted ? (
            /* Success confirmation */
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-10 h-10 text-emerald-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-950">
                {isBm ? 'Cadangan Pinjaman Disahkan & Dilampirkan!' : 'Loan Proposal Attached to Your Application!'}
              </h3>
              <p className="text-xs text-slate-600 max-w-md mx-auto mt-2 leading-relaxed">
                {isBm
                  ? 'Cadangan 5 langkah anda telah disatukan ke dalam pakej permohonan rasmi institusi. Pegawai pengunderait kini mempunyai justifikasi lengkap untuk mempercepatkan kelulusan.'
                  : 'Your 5-step borrower proposal has been consolidated into your institutional dossier. Loan officers now have the full context required to fast-track your approval odds.'}
              </p>
              <div className="mt-6 flex justify-center gap-3">
                <button
                  onClick={onClose}
                  className="px-6 py-2.5 bg-blue-950 hover:bg-blue-900 text-white text-xs font-bold rounded-xl transition cursor-pointer shadow-md"
                >
                  {isBm ? 'Kembali ke Permohonan' : 'Return to Application'}
                </button>
              </div>
            </div>
          ) : currentStep === 1 ? (
            /* STEP 1: Purpose Detail */
            <div>
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
                    {isBm ? 'Langkah 1 daripada 5' : 'Step 1 of 5'}
                  </span>
                  <h3 className="text-base font-bold text-slate-950 mt-0.5">
                    {isBm ? 'Tujuan Pembiayaan Terperinci' : 'Purpose Detail: Why do you need this loan, and why now?'}
                  </h3>
                </div>
                <button
                  onClick={() => handleAutoDraft(1)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-bold rounded-xl transition cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  {isBm ? 'Draf AI Automatik' : 'AI Auto-Draft'}
                </button>
              </div>

              <p className="text-xs text-slate-500 mt-2">
                {isBm
                  ? 'Nyatakan secara tepat bagaimana wang ini akan digunakan dan mengapa anda memerlukannya sekarang. Nyatakan apa yang berlaku sekiranya pembiayaan tidak diperoleh.'
                  : 'Tell us exactly what the money will be used for and why you need it now. Be specific. Mention what happens if you do not get the loan.'}
              </p>

              {/* Example box */}
              <div className="mt-3 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600">
                <span className="font-bold text-slate-800 block mb-1">
                  💡 {isBm ? 'Contoh Jawapan Bagus:' : 'Strong Example:'}
                </span>
                "I need RM 5,000 to buy a second-hand delivery motorcycle because my current motorcycle broke down last week. Without it, I cannot continue my Grab deliveries and will lose my main income. I have identified a replacement motorcycle from a trusted dealer."
              </div>

              {/* Text Input */}
              <div className="mt-4">
                <textarea
                  rows={5}
                  maxLength={500}
                  value={purposeDetail}
                  onChange={(e) => setPurposeDetail(e.target.value)}
                  placeholder={isBm ? 'Tulis tujuan pembiayaan anda di sini (minimum 50 aksara)...' : 'Write your loan purpose detail here (minimum 50 characters)...'}
                  className="w-full p-3.5 text-xs text-slate-900 border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 bg-white"
                />
                <div className="flex justify-between items-center text-[11px] mt-1 text-slate-500 font-medium">
                  <span className={purposeDetail.length < 50 ? 'text-amber-800 font-bold' : 'text-emerald-800'}>
                    {purposeDetail.length < 50
                      ? `⚠️ ${50 - purposeDetail.length} ${isBm ? 'aksara lagi diperlukan (min 50)' : 'more characters needed (min 50)'}`
                      : `✓ ${isBm ? 'Panjang mencukupi' : 'Valid length'}`}
                  </span>
                  <span>{purposeDetail.length} / 500 {isBm ? 'aksara' : 'characters'}</span>
                </div>
              </div>
            </div>
          ) : currentStep === 2 ? (
            /* STEP 2: Repayment Plan */
            <div>
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
                    {isBm ? 'Langkah 2 daripada 5' : 'Step 2 of 5'}
                  </span>
                  <h3 className="text-base font-bold text-slate-950 mt-0.5">
                    {isBm ? 'Pelan Pembayaran Balik: Bagaimana anda akan membayarnya?' : 'Repayment Plan: How will you repay this loan?'}
                  </h3>
                </div>
                <button
                  onClick={() => handleAutoDraft(2)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-bold rounded-xl transition cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  {isBm ? 'Draf AI Automatik' : 'AI Auto-Draft'}
                </button>
              </div>

              <p className="text-xs text-slate-500 mt-2">
                {isBm
                  ? 'Terangkan bagaimana anda akan membayar balik setiap bulan atau minggu. Nyatakan punca pendapatan utama dan punca sandaran jika musim perlahan.'
                  : 'Explain how you will pay back the loan each month or week. State your main repayment source and a backup source. If your income is seasonal, explain how you will cover slow months.'}
              </p>

              <div className="mt-3 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600">
                <span className="font-bold text-slate-800 block mb-1">💡 {isBm ? 'Contoh Jawapan Bagus:' : 'Strong Example:'}</span>
                "I will repay RM 450 per month from my Grab earnings. If a month is slow, I have RM 2,000 in savings and my brother has agreed to help as a guarantor. I will set aside RM 120 per week to make sure the monthly payment is ready."
              </div>

              <div className="mt-4">
                <textarea
                  rows={5}
                  maxLength={500}
                  value={repaymentPlan}
                  onChange={(e) => setRepaymentPlan(e.target.value)}
                  placeholder={isBm ? 'Tulis pelan bayaran balik anda (minimum 50 aksara)...' : 'Write your repayment plan here (minimum 50 characters)...'}
                  className="w-full p-3.5 text-xs text-slate-900 border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 bg-white"
                />
                <div className="flex justify-between items-center text-[11px] mt-1 text-slate-500 font-medium">
                  <span className={repaymentPlan.length < 50 ? 'text-amber-800 font-bold' : 'text-emerald-800'}>
                    {repaymentPlan.length < 50
                      ? `⚠️ ${50 - repaymentPlan.length} ${isBm ? 'aksara lagi diperlukan (min 50)' : 'more characters needed (min 50)'}`
                      : `✓ ${isBm ? 'Panjang mencukupi' : 'Valid length'}`}
                  </span>
                  <span>{repaymentPlan.length} / 500 {isBm ? 'aksara' : 'characters'}</span>
                </div>
              </div>
            </div>
          ) : currentStep === 3 ? (
            /* STEP 3: Risk Mitigation */
            <div>
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
                    {isBm ? 'Langkah 3 daripada 5' : 'Step 3 of 5'}
                  </span>
                  <h3 className="text-base font-bold text-slate-950 mt-0.5">
                    {isBm ? 'Mitigasi Risiko: Apakah yang mengurangkan risiko pihak pembiaya?' : 'Risk Mitigation: What reduces the lender\'s risk?'}
                  </h3>
                </div>
                <button
                  onClick={() => handleAutoDraft(3)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-bold rounded-xl transition cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  {isBm ? 'Draf AI Automatik' : 'AI Auto-Draft'}
                </button>
              </div>

              <p className="text-xs text-slate-500 mt-2">
                {isBm
                  ? 'Senaraikan sebarang sandaran, penjamin, insurans, atau pelan kecemasan yang anda miliki. Jika tiada, jelaskan mengapa pinjaman ini tetap selamat.'
                  : 'List any collateral, guarantor, insurance, or fallback plan you have. If you have none, explain why the loan is still safe.'}
              </p>

              <div className="mt-3 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600">
                <span className="font-bold text-slate-800 block mb-1">💡 {isBm ? 'Contoh Jawapan Bagus:' : 'Strong Example:'}</span>
                "I will use the motorcycle as collateral. I also have RM 1,500 in savings as an emergency buffer. I have been with Grab for 3 years and my rating is 4.9. My brother will act as guarantor if needed."
              </div>

              <div className="mt-4">
                <textarea
                  rows={5}
                  maxLength={500}
                  value={riskMitigation}
                  onChange={(e) => setRiskMitigation(e.target.value)}
                  placeholder={isBm ? 'Tulis faktor pengurangan risiko anda (minimum 30 aksara)...' : 'Write your risk mitigation factors here (minimum 30 characters)...'}
                  className="w-full p-3.5 text-xs text-slate-900 border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 bg-white"
                />
                <div className="flex justify-between items-center text-[11px] mt-1 text-slate-500 font-medium">
                  <span className={riskMitigation.length < 30 ? 'text-amber-800 font-bold' : 'text-emerald-800'}>
                    {riskMitigation.length < 30
                      ? `⚠️ ${30 - riskMitigation.length} ${isBm ? 'aksara lagi diperlukan (min 30)' : 'more characters needed (min 30)'}`
                      : `✓ ${isBm ? 'Panjang mencukupi' : 'Valid length'}`}
                  </span>
                  <span>{riskMitigation.length} / 500 {isBm ? 'aksara' : 'characters'}</span>
                </div>
              </div>
            </div>
          ) : currentStep === 4 ? (
            /* STEP 4: Character / Track Record */
            <div>
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
                    {isBm ? 'Langkah 4 daripada 5' : 'Step 4 of 5'}
                  </span>
                  <h3 className="text-base font-bold text-slate-950 mt-0.5">
                    {isBm ? 'Karakter & Rekod Prestasi Anda' : 'Character & Track Record'}
                  </h3>
                </div>
                <button
                  onClick={() => handleAutoDraft(4)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-bold rounded-xl transition cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  {isBm ? 'Draf AI Automatik' : 'AI Auto-Draft'}
                </button>
              </div>

              <p className="text-xs text-slate-500 mt-2">
                {isBm
                  ? 'Beritahu kami berapa lama anda telah bekerja atau berniaga dalam bidang ini. Sebutkan pinjaman lalu yang telah dijelaskan tepat pada masanya.'
                  : 'Tell us how long you have been in this work or business. Mention any past loans you repaid on time. If you had past credit issues, explain what happened.'}
              </p>

              <div className="mt-3 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600">
                <span className="font-bold text-slate-800 block mb-1">💡 {isBm ? 'Contoh Jawapan Bagus:' : 'Strong Example:'}</span>
                "I have been a Grab driver for 3 years. I previously took a RM 3,000 loan from a cooperative and repaid it fully on time. My credit score is low because of a medical bill in 2022, which I have since settled."
              </div>

              <div className="mt-4">
                <textarea
                  rows={5}
                  maxLength={500}
                  value={characterTrackRecord}
                  onChange={(e) => setCharacterTrackRecord(e.target.value)}
                  placeholder={isBm ? 'Tulis rekod prestasi dan kebolehpercayaan anda (minimum 30 aksara)...' : 'Write your track record here (minimum 30 characters)...'}
                  className="w-full p-3.5 text-xs text-slate-900 border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 bg-white"
                />
                <div className="flex justify-between items-center text-[11px] mt-1 text-slate-500 font-medium">
                  <span className={characterTrackRecord.length < 30 ? 'text-amber-800 font-bold' : 'text-emerald-800'}>
                    {characterTrackRecord.length < 30
                      ? `⚠️ ${30 - characterTrackRecord.length} ${isBm ? 'aksara lagi diperlukan (min 30)' : 'more characters needed (min 30)'}`
                      : `✓ ${isBm ? 'Panjang mencukupi' : 'Valid length'}`}
                  </span>
                  <span>{characterTrackRecord.length} / 500 {isBm ? 'aksara' : 'characters'}</span>
                </div>
              </div>
            </div>
          ) : currentStep === 5 ? (
            /* STEP 5: Supporting Evidence */
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
                {isBm ? 'Langkah 5 daripada 5' : 'Step 5 of 5'}
              </span>
              <h3 className="text-base font-bold text-slate-950 mt-0.5">
                {isBm ? 'Bukti Sokongan: Apakah bukti yang boleh anda lampirkan?' : 'Supporting Evidence: What proof can you attach?'}
              </h3>
              <p className="text-xs text-slate-500 mt-2">
                {isBm
                  ? 'Tandakan dan lampirkan dokumen sokongan bagi mengukuhkan permohonan pembiayaan anda.'
                  : 'Check and attach any documents that support your proposal (quotations, equipment photos, guarantor letters).'}
              </p>

              {/* Checklist */}
              <div className="mt-4 space-y-2.5">
                <label className="flex items-center gap-3 p-3 border border-slate-200 rounded-xl hover:bg-slate-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasQuotation}
                    onChange={(e) => setHasQuotation(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 rounded"
                  />
                  <div className="text-xs">
                    <span className="font-bold text-slate-900 block">{isBm ? 'Sebut Harga / Invois Peralatan (Quotation / Invoice)' : 'Quotation / Invoice for asset/stock purchase'}</span>
                    <span className="text-slate-500">{isBm ? 'Contoh: Sebut harga motosikal / alat ganti daripada bengkel' : 'Example: Quotation from supplier or dealer'}</span>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3 border border-slate-200 rounded-xl hover:bg-slate-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasEquipmentPhoto}
                    onChange={(e) => setHasEquipmentPhoto(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 rounded"
                  />
                  <div className="text-xs">
                    <span className="font-bold text-slate-900 block">{isBm ? 'Foto Premis / Kenderaan / Peralatan Semasa' : 'Photo of equipment, current vehicle or stall premise'}</span>
                    <span className="text-slate-500">{isBm ? 'Menunjukkan keabsahan operasi perniagaan anda' : 'Proves physical legitimacy of your trade'}</span>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3 border border-slate-200 rounded-xl hover:bg-slate-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasGuarantorLetter}
                    onChange={(e) => setHasGuarantorLetter(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 rounded"
                  />
                  <div className="text-xs">
                    <span className="font-bold text-slate-900 block">{isBm ? 'Surat Sokongan Penjamin (Guarantor Letter)' : 'Guarantor Letter / Co-signer consent'}</span>
                    <span className="text-slate-500">{isBm ? 'Surat akuan daripada ahli keluarga atau rakan kongsi' : 'Optional secondary assurance to lower bank risk'}</span>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3 border border-slate-200 rounded-xl hover:bg-slate-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasOtherDoc}
                    onChange={(e) => setHasOtherDoc(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 rounded"
                  />
                  <div className="text-xs">
                    <span className="font-bold text-slate-900 block">{isBm ? 'Dokumen Sokongan Lain' : 'Other supporting document (Permits, Awards, Ratings)'}</span>
                    <span className="text-slate-500">{isBm ? 'Tangkapan skrin rating pelanggan 5-bintang / surat persatuan' : 'Customer 5-star ratings or trade associations'}</span>
                  </div>
                </label>
              </div>

              {/* Uploaded files simulation */}
              <div className="mt-4 p-3.5 bg-slate-50 border border-dashed border-slate-300 rounded-xl">
                <span className="text-[11px] font-bold text-slate-700 block mb-2">
                  📎 {isBm ? 'Fail Disahkan Terlampir (Maks 5 fail):' : 'Attached Evidence Files (Max 5 files):'}
                </span>
                <div className="flex flex-wrap gap-2">
                  {uploadedFiles.map((file, idx) => (
                    <span key={idx} className="flex items-center gap-1.5 px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700">
                      <Paperclip className="w-3 h-3 text-slate-400" />
                      {file}
                    </span>
                  ))}
                </div>
              </div>

              {/* Fallback "I don't have this" */}
              <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                <span className="text-xs font-bold text-amber-900 block">
                  {isBm ? 'Tiada sebut harga fizikal pada masa ini?' : 'Don\'t have physical quotation right now?'}
                </span>
                <p className="text-[11px] text-amber-700 mt-0.5">
                  {isBm ? 'Nyatakan penjelasan ringkas mengapa anda tidak memerlukannya atau bila anda akan menyediakannya:' : 'State a brief note explaining why you don\'t need this or when it will be ready:'}
                </p>
                <input
                  type="text"
                  value={noEvidenceExplanation}
                  onChange={(e) => setNoEvidenceExplanation(e.target.value)}
                  placeholder={isBm ? 'Contoh: Saya membeli bahan mentah tunai harian di pasar borong.' : 'Example: Working capital is for cash inventory directly at wholesale market.'}
                  className="w-full mt-2 p-2 bg-white text-xs border border-amber-300 rounded-lg text-slate-800"
                />
              </div>
            </div>
          ) : (
            /* FINAL REVIEW SCREEN */
            <div>
              <div className="flex items-center gap-2 mb-3">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-bold text-slate-950">
                  {isBm ? 'Semak & Sahkan Cadangan Pinjaman Anda' : 'Review & Submit Your Loan Proposal'}
                </h3>
              </div>
              <p className="text-xs text-slate-500 mb-4">
                {isBm
                  ? 'Sila semak semula maklumat cadangan di bawah sebelum dimeterai ke dalam dossier bank.'
                  : 'Review your 5 proposal responses below before attaching them directly to your bank intake pack.'}
              </p>

              <div className="space-y-3">
                {/* Step 1 review */}
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[11px] font-bold text-slate-500 uppercase">{isBm ? '1. Tujuan Pembiayaan' : '1. Purpose Detail'}</span>
                    <button onClick={() => setCurrentStep(1)} className="text-xs font-bold text-blue-900 hover:underline">{isBm ? 'Sunting' : 'Edit'}</button>
                  </div>
                  <p className="text-xs text-slate-800 leading-relaxed">{purposeDetail || '—'}</p>
                </div>

                {/* Step 2 review */}
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[11px] font-bold text-slate-500 uppercase">{isBm ? '2. Pelan Bayaran Balik' : '2. Repayment Plan'}</span>
                    <button onClick={() => setCurrentStep(2)} className="text-xs font-bold text-blue-900 hover:underline">{isBm ? 'Sunting' : 'Edit'}</button>
                  </div>
                  <p className="text-xs text-slate-800 leading-relaxed">{repaymentPlan || '—'}</p>
                </div>

                {/* Step 3 review */}
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[11px] font-bold text-slate-500 uppercase">{isBm ? '3. Mitigasi Risiko' : '3. Risk Mitigation'}</span>
                    <button onClick={() => setCurrentStep(3)} className="text-xs font-bold text-blue-900 hover:underline">{isBm ? 'Sunting' : 'Edit'}</button>
                  </div>
                  <p className="text-xs text-slate-800 leading-relaxed">{riskMitigation || '—'}</p>
                </div>

                {/* Step 4 review */}
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[11px] font-bold text-slate-500 uppercase">{isBm ? '4. Karakter & Rekod Prestasi' : '4. Character / Track Record'}</span>
                    <button onClick={() => setCurrentStep(4)} className="text-xs font-bold text-blue-900 hover:underline">{isBm ? 'Sunting' : 'Edit'}</button>
                  </div>
                  <p className="text-xs text-slate-800 leading-relaxed">{characterTrackRecord || '—'}</p>
                </div>

                {/* Step 5 review */}
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[11px] font-bold text-slate-500 uppercase">{isBm ? '5. Bukti Sokongan' : '5. Supporting Evidence'}</span>
                    <button onClick={() => setCurrentStep(5)} className="text-xs font-bold text-blue-900 hover:underline">{isBm ? 'Sunting' : 'Edit'}</button>
                  </div>
                  <div className="text-xs text-slate-800">
                    <div className="flex flex-wrap gap-1.5 mb-1.5">
                      {hasQuotation && <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded text-[10px] font-bold">✓ Quotation Attached</span>}
                      {hasEquipmentPhoto && <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded text-[10px] font-bold">✓ Equipment Photo</span>}
                      {hasGuarantorLetter && <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded text-[10px] font-bold">✓ Guarantor Letter</span>}
                      {hasOtherDoc && <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded text-[10px] font-bold">✓ Other Evidence</span>}
                    </div>
                    {noEvidenceExplanation && (
                      <span className="text-[11px] text-slate-600 block italic">Note: {noEvidenceExplanation}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation Bar */}
        {!submitted && (
          <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
            {currentStep > 1 ? (
              <button
                onClick={() => setCurrentStep(prev => prev - 1)}
                className="flex items-center gap-1.5 px-4 py-2 border border-slate-300 text-slate-700 hover:bg-white text-xs font-bold rounded-xl transition cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                {isBm ? 'Sebelumnya' : 'Back'}
              </button>
            ) : (
              <button
                onClick={onClose}
                className="text-xs font-bold text-slate-500 hover:text-slate-800 px-3 py-2 cursor-pointer"
              >
                {isBm ? 'Tutup' : 'Cancel'}
              </button>
            )}

            <div className="flex items-center gap-2">
              {currentStep < 6 ? (
                <button
                  onClick={() => {
                    saveToLocalStorage();
                    setCurrentStep(prev => prev + 1);
                  }}
                  disabled={
                    (currentStep === 1 && !isStep1Valid) ||
                    (currentStep === 2 && !isStep2Valid) ||
                    (currentStep === 3 && !isStep3Valid) ||
                    (currentStep === 4 && !isStep4Valid) ||
                    (currentStep === 5 && !isStep5Valid)
                  }
                  className={`flex items-center gap-1.5 px-5 py-2.5 text-xs font-bold rounded-xl transition cursor-pointer shadow-md ${
                    ((currentStep === 1 && isStep1Valid) ||
                     (currentStep === 2 && isStep2Valid) ||
                     (currentStep === 3 && isStep3Valid) ||
                     (currentStep === 4 && isStep4Valid) ||
                     (currentStep === 5 && isStep5Valid))
                      ? 'bg-blue-950 hover:bg-blue-900 text-white'
                      : 'bg-slate-300 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  <span>{currentStep === 5 ? (isBm ? 'Semak Cadangan' : 'Review Proposal') : (isBm ? 'Seterusnya' : 'Continue')}</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={handleFinalSubmit}
                  className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition cursor-pointer shadow-md"
                >
                  <Check className="w-4 h-4" />
                  <span>{isBm ? 'Hantar & Meterai Cadangan' : 'Submit & Seal Proposal'}</span>
                </button>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
