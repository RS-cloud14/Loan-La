'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Language = 'en' | 'bm';

export interface Translations {
  // Brand & Nav
  appName: string;
  appTagline: string;
  navHome: string;
  navCalculator: string;
  navDirectory: string;
  navTracker: string;
  navMyLoans: string;
  signIn: string;
  signOut: string;
  switchLang: string;

  // Hero Headlines
  headline1Title: string;
  headline1Sub: string;
  headline2Title: string;
  headline2Sub: string;
  headline3Title: string;
  headline3Sub: string;
  headline4Title: string;
  headline4Sub: string;

  // Hero Disclaimers & Cards
  heroSubtitle: string;
  startAssessmentBtn: string;
  viewLendersBtn: string;
  partnershipNotice: string;
  quickCheckTitle: string;
  quickCheckSubtitle: string;
  situation1Title: string;
  situation1Desc: string;
  situation1Btn: string;
  situation2Title: string;
  situation2Desc: string;
  situation2Btn: string;
  situation3Title: string;
  situation3Desc: string;
  situation3Btn: string;

  // Calculator
  calculatorTitle: string;
  calculatorSubtitle: string;
  loanAmountLabel: string;
  loanTenureLabel: string;
  interestRateLabel: string;
  monthlyRepaymentLabel: string;
  totalInterestLabel: string;
  totalRepaymentLabel: string;

  // Steps
  step1Title: string;
  step1Subtitle: string;
  step2Title: string;
  step2Subtitle: string;
  step3Title: string;
  step3Subtitle: string;
  step4Title: string;
  step4Subtitle: string;
  loanPurposeLabel: string;
  targetAmountLabel: string;
  downpaymentLabel: string;
  nextStepBtn: string;
  backStepBtn: string;

  // Loan Purposes
  purposePersonal: string;
  purposeWorkingCapital: string;
  purposeEquipment: string;
  purposeVehicle: string;
  purposeInvoice: string;
  purposeEducation: string;

  // Upload & Privacy
  uploadTitle: string;
  uploadSubtitle: string;
  bankStatementUpload: string;
  platformEarningsUpload: string;
  privacyNoticeTitle: string;
  privacyNoticeDesc: string;
  analyzeBtn: string;
  orSimulationProfiles: string;
  simulationDesc: string;

  // Results & FRI Score
  friScoreTitle: string;
  friGrade: string;
  incomeAssessed: string;
  netCashflow: string;
  dsrCalculated: string;
  matchedLendersTitle: string;
  applyNowBtn: string;
  detailsBtn: string;
  hideDetailsBtn: string;
  demoSimulationPill: string;
  demoNoticeTitle: string;
  demoNoticeDesc: string;
  uploadRealStatementBtn: string;
  downloadPdfBtn: string;
  viewReportBtn: string;

  // Tracker & History
  myAppsTitle: string;
  myAppsSubtitle: string;
  tabBankApps: string;
  tabHistory: string;
  noAppsYet: string;
  noHistoryYet: string;
  validity30Days: string;
  expired30Days: string;
  statusSent: string;
  statusReviewing: string;
  statusApproved: string;
  statusFunded: string;
  appProgress: string;
  milestone1: string;
  milestone2: string;
  milestone3: string;
}

const translations: Record<Language, Translations> = {
  en: {
    // Brand & Nav
    appName: 'Loan - La',
    appTagline: 'Smart Loan Matcher',
    navHome: 'Home',
    navCalculator: 'Loan Calculator',
    navDirectory: 'Lender Directory',
    navTracker: 'My Applications',
    navMyLoans: 'My Loans',
    signIn: 'Sign In',
    signOut: 'Sign Out',
    switchLang: 'BM',

    // Hero Headlines
    headline1Title: 'No Payslip? Pre-Check Your Bank Match.',
    headline1Sub: 'Upload 3-month bank statement • We pre-check which licensed banks accept your gig or business income.',
    headline2Title: 'Grab, Shopee or Freelance? Instant Eligibility Pre-Check.',
    headline2Sub: 'Turn gig app earnings into a verified cashflow assessment in under 60 seconds.',
    headline3Title: 'No Time to Visit Banks? Get Guided Pre-Check.',
    headline3Sub: 'We don\'t just analyze your cashflow — we actively guide and assist you in applying to licensed banks and micro-lenders.',
    headline4Title: "Don't Know Where to Apply? Compare Bank Eligibility.",
    headline4Sub: 'Compare Maybank, BSN, TEKUN, SME Bank and licensed lenders in one place before applying.',

    // Hero Disclaimers & Cards
    heroSubtitle: 'Pre-check your real loan readiness before applying. We analyze your bank statements, calculate your safe DSR limit, and match you with licensed digital banks and micro-lenders.',
    startAssessmentBtn: 'Check Loan Eligibility Report',
    viewLendersBtn: 'Browse 10+ Bank Options',
    partnershipNotice: '💡 How it works: Loan - La acts as your online financial agent and personalized matcher. We analyze your real cashflow and income profile to pre-screen and help you apply directly to suitable Bank Negara Malaysia licensed digital banks and regulated lenders.',
    quickCheckTitle: 'Find Your Situation',
    quickCheckSubtitle: 'Select what best describes your goal today:',
    situation1Title: "Where Should I Apply?",
    situation1Desc: 'Compare licensed bank requirements and see which lenders accept your income.',
    situation1Btn: 'Compare Bank Options →',
    situation2Title: 'I Have No Payslip (Gaji)',
    situation2Desc: 'Turn Grab, Shopee, or bank statement into a verified proof of income for banks.',
    situation2Btn: 'Check My Eligibility →',
    situation3Title: 'Don’t Understand Loan Process?',
    situation3Desc: 'We guide you step-by-step and analyze your eligibility — saving you time queuing at bank branches.',
    situation3Btn: 'Get Step-by-Step Guidance →',

    // Calculator
    calculatorTitle: 'Loan Repayment Calculator',
    calculatorSubtitle: 'Estimate your monthly installment, total interest, and check your Debt Service Ratio (DSR).',
    loanAmountLabel: 'Loan Amount (RM)',
    loanTenureLabel: 'Tenure (Months / Years)',
    interestRateLabel: 'Interest Rate (% p.a.)',
    monthlyRepaymentLabel: 'Estimated Monthly Repayment',
    totalInterestLabel: 'Total Interest Payable',
    totalRepaymentLabel: 'Total Repayment Amount',

    // Steps
    step1Title: 'Select Target Loan',
    step1Subtitle: 'Step 1: Choose loan purpose & amount',
    step2Title: 'Self-Assessment',
    step2Subtitle: 'Step 2: Check baseline readiness questions',
    step3Title: 'Upload Documents',
    step3Subtitle: 'Step 3: Upload bank statements & app earnings',
    step4Title: 'Financial Readiness Result',
    step4Subtitle: 'Step 4: Your verified score & matched banks',
    loanPurposeLabel: 'What is this loan for?',
    targetAmountLabel: 'Target Loan Amount (RM)',
    downpaymentLabel: 'Cash Downpayment Saved (RM)',
    nextStepBtn: 'Continue →',
    backStepBtn: '← Back',

    // Loan Purposes
    purposePersonal: 'Personal Cash Loan',
    purposeWorkingCapital: 'Business Working Capital',
    purposeEquipment: 'Equipment Financing',
    purposeVehicle: 'Vehicle Hire Purchase (Car / Bike)',
    purposeInvoice: 'Invoice Financing',
    purposeEducation: 'Education Financing',

    // Upload & Privacy
    uploadTitle: 'Document Evidence Gateway',
    uploadSubtitle: 'Upload your bank statement and platform screenshot for instant AI analysis',
    bankStatementUpload: 'Bank Statement (PDF)',
    platformEarningsUpload: 'Gig / Shopee Dashboard (Screenshot)',
    privacyNoticeTitle: 'Your privacy is 100% protected (PDPA 2010)',
    privacyNoticeDesc: 'Your documents are parsed in-memory and immediately deleted. We never store or sell your bank statements. Sensitive details (IC number, address) are masked locally.',
    analyzeBtn: 'Run AI Income Assessment',
    orSimulationProfiles: 'Or Use Sample Simulation Profiles',
    simulationDesc: "If you don't have statement PDFs ready right now, test a sample gig worker profile:",

    // Results & FRI Score
    friScoreTitle: 'Financial Readiness Index (FRI)',
    friGrade: 'Grade',
    incomeAssessed: 'Assessed Inflow',
    netCashflow: 'Net Cash Flow',
    dsrCalculated: 'Calculated DSR',
    matchedLendersTitle: 'Matched Licensed Lenders',
    applyNowBtn: 'Apply Now',
    detailsBtn: 'Details',
    hideDetailsBtn: 'Hide Details',
    demoSimulationPill: 'Demo Simulation Profile',
    demoNoticeTitle: 'Demo Account Simulation Only',
    demoNoticeDesc: 'This report was generated using sample demo data. Demo accounts cannot be used to submit real loan applications to licensed banks.',
    uploadRealStatementBtn: 'Upload My Statement to Apply →',
    downloadPdfBtn: 'Download PDF',
    viewReportBtn: 'View Matched Banks →',

    // Tracker & History
    myAppsTitle: 'My Loan Applications & History',
    myAppsSubtitle: 'Track your submitted bank applications and view your past income assessment reports (valid for 30 days).',
    tabBankApps: 'Bank Applications',
    tabHistory: 'Assessment History',
    noAppsYet: 'No Submitted Bank Applications Yet',
    noHistoryYet: 'No Assessment History Recorded',
    validity30Days: '30-Day Validity',
    expired30Days: 'Expired (>30 Days)',
    statusSent: 'APPLICATION SENT',
    statusReviewing: 'BANK REVIEWING',
    statusApproved: 'PRE-APPROVED',
    statusFunded: 'APPROVED & FUNDED',
    appProgress: 'Application Progress',
    milestone1: '1. Application Sent',
    milestone2: '2. Income Verified',
    milestone3: '3. Bank Review',
  },
  bm: {
    // Brand & Nav
    appName: 'Loan - La',
    appTagline: 'Padanan Pinjaman Pintar',
    navHome: 'Laman Utama',
    navCalculator: 'Kalkulator Pinjaman',
    navDirectory: 'Direktori Bank',
    navTracker: 'Permohonan Saya',
    navMyLoans: 'Pinjaman Saya',
    signIn: 'Log Masuk',
    signOut: 'Log Keluar',
    switchLang: 'EN',

    // Hero Headlines
    headline1Title: 'Tiada Slip Gaji? Pra-Semak Padanan Bank Anda.',
    headline1Sub: 'Muat naik penyata bank 3 bulan • Kami pra-semak bank berlesen mana yang menerima pendapatan anda.',
    headline2Title: 'Pemandu Grab, Shopee atau Freelance? Pra-Semakan Segera.',
    headline2Sub: 'Tukarkan rekod pendapatan aplikasi anda kepada penilaian aliran tunai sah dalam masa 60 saat.',
    headline3Title: 'Tiada Masa Ke Bank? Dapatkan Bimbingan Dalam Talian.',
    headline3Sub: 'Bukan sekadar analisis aliran tunai — kami membimbing dan membantu anda memohon terus kepada bank berlesen dan pembiaya mikro.',
    headline4Title: 'Tidak Tahu Di Mana Nak Mohon? Bandingkan Kelayakan Bank.',
    headline4Sub: 'Bandingkan Maybank, BSN, TEKUN, SME Bank dan pembiaya berlesen di satu tempat sebelum memohon.',

    // Hero Disclaimers & Cards
    heroSubtitle: 'Pra-semak kelayakan pinjaman sebenar anda sebelum memohon. Kami menganalisis penyata bank, mengira had DSR selamat, dan memadankan anda dengan bank digital & pembiaya berlesen.',
    startAssessmentBtn: 'Semak Laporan Kelayakan Pinjaman',
    viewLendersBtn: 'Lihat 10+ Pilihan Bank',
    partnershipNotice: '💡 Cara berfungsi: Loan - La bertindak sebagai ejen kewangan dalam talian dan pemadan peribadi anda. Kami menganalisis aliran tunai sebenar anda untuk membuat pra-saringan dan membantu anda memohon terus kepada bank digital berlesen Bank Negara Malaysia dan institusi terkawal.',
    quickCheckTitle: 'Pilih Situasi Anda',
    quickCheckSubtitle: 'Pilih situasi yang paling sesuai dengan matlamat anda hari ini:',
    situation1Title: 'Di Mana Saya Patut Mohon?',
    situation1Desc: 'Bandingkan syarat bank berlesen dan lihat bank mana yang menerima pendapatan anda.',
    situation1Btn: 'Bandingkan Pilihan Bank →',
    situation2Title: 'Saya Tiada Slip Gaji',
    situation2Desc: 'Tukarkan pendapatan Grab, Shopee, atau penyata bank kepada bukti pendapatan yang diiktiraf bank.',
    situation2Btn: 'Semak Kelayakan Saya →',
    situation3Title: 'Tidak Faham Proses Pinjaman?',
    situation3Desc: 'Kami membimbing langkah demi langkah dan analisis kelayakan — jimat masa beratur di kaunter bank.',
    situation3Btn: 'Dapatkan Bimbingan Langkah Demi Langkah →',

    // Calculator
    calculatorTitle: 'Kalkulator Bayaran Pinjaman',
    calculatorSubtitle: 'Anggarkan ansuran bulanan, jumlah faedah, dan semak Nisbah Khidmat Hutang (DSR) anda.',
    loanAmountLabel: 'Jumlah Pinjaman (RM)',
    loanTenureLabel: 'Tempoh Pinjaman (Bulan / Tahun)',
    interestRateLabel: 'Kadar Faedah (% setahun)',
    monthlyRepaymentLabel: 'Anggaran Ansuran Bulanan',
    totalInterestLabel: 'Jumlah Faedah Dikenakan',
    totalRepaymentLabel: 'Jumlah Keseluruhan Bayaran Balik',

    // Steps
    step1Title: 'Pilih Sasaran Pinjaman',
    step1Subtitle: 'Langkah 1: Pilih tujuan pinjaman & jumlah',
    step2Title: 'Penilaian Kendiri',
    step2Subtitle: 'Langkah 2: Semak soalan asas kelayakan',
    step3Title: 'Muat Naik Dokumen',
    step3Subtitle: 'Langkah 3: Muat naik penyata bank & bukti pendapatan',
    step4Title: 'Keputusan Kesediaan Kewangan',
    step4Subtitle: 'Langkah 4: Skor pengesahan & bank yang sepadan',
    loanPurposeLabel: 'Apakah tujuan pinjaman ini?',
    targetAmountLabel: 'Jumlah Pinjaman Sasaran (RM)',
    downpaymentLabel: 'Wang Pendahuluan Tersedia (RM)',
    nextStepBtn: 'Teruskan →',
    backStepBtn: '← Kembali',

    // Loan Purposes
    purposePersonal: 'Pinjaman Tunai Peribadi',
    purposeWorkingCapital: 'Modal Pusingan / Perniagaan',
    purposeEquipment: 'Pembiayaan Peralatan & Mesin',
    purposeVehicle: 'Sewa Beli Kenderaan (Kereta / Motor)',
    purposeInvoice: 'Pembiayaan Invois',
    purposeEducation: 'Pinjaman Pendidikan',

    // Upload & Privacy
    uploadTitle: 'Pintu Masuk Bukti Dokumen',
    uploadSubtitle: 'Muat naik penyata bank dan tangkap layar aplikasi untuk analisis AI segera',
    bankStatementUpload: 'Penyata Bank (PDF)',
    platformEarningsUpload: 'Papan Pemuka Gig / Shopee (Tangkap Layar)',
    privacyNoticeTitle: 'Privasi data anda dilindungi 100% (PDPA 2010)',
    privacyNoticeDesc: 'Dokumen anda dianalisis secara sementara dan dipadamkan serta-merta. Kami tidak menyimpan atau menjual penyata anda. Maklumat sensitif (No. IC, alamat) dikaburkan secara automatik.',
    analyzeBtn: 'Jalankan Analisis Pendapatan AI',
    orSimulationProfiles: 'Atau Gunakan Profil Simulasi Contoh',
    simulationDesc: 'Jika anda belum mempunyai PDF penyata sekarang, uji profil contoh pekerja gig ini:',

    // Results & FRI Score
    friScoreTitle: 'Indeks Kesediaan Kewangan (FRI)',
    friGrade: 'Gred',
    incomeAssessed: 'Aliran Masuk Disahkan',
    netCashflow: 'Aliran Tunai Bersih',
    dsrCalculated: 'DSR Dikira',
    matchedLendersTitle: 'Bank & Pembiaya Berlesen Yang Sepadan',
    applyNowBtn: 'Mohon Sekarang',
    detailsBtn: 'Maklumat Lanjut',
    hideDetailsBtn: 'Tutup Maklumat',
    demoSimulationPill: 'Profil Simulasi Demo',
    demoNoticeTitle: 'Simulasi Akaun Demo Sahaja',
    demoNoticeDesc: 'Laporan ini dijana menggunakan data sampel demo. Akaun demo tidak boleh digunakan untuk menghantar permohonan pinjaman sebenar kepada bank.',
    uploadRealStatementBtn: 'Muat Naik Penyata Sebenar Untuk Memohon →',
    downloadPdfBtn: 'Muat Turun PDF',
    viewReportBtn: 'Lihat Bank Yang Sepadan →',

    // Tracker & History
    myAppsTitle: 'Permohonan Pinjaman & Sejarah Saya',
    myAppsSubtitle: 'Pantau status permohonan bank anda dan lihat laporan penilaian pendapatan terdahulu (sah selama 30 hari).',
    tabBankApps: 'Permohonan Bank',
    tabHistory: 'Sejarah Penilaian',
    noAppsYet: 'Tiada Permohonan Bank Dihantar Lagi',
    noHistoryYet: 'Tiada Rekod Sejarah Penilaian',
    validity30Days: 'Sah 30 Hari',
    expired30Days: 'Tamat Tempoh (>30 Hari)',
    statusSent: 'PERMOHONAN DIHANTAR',
    statusReviewing: 'SEMAKAN BANK',
    statusApproved: 'PRA-LULUS',
    statusFunded: 'DILULUSKAN & DIBAYAR',
    appProgress: 'Kemajuan Permohonan',
    milestone1: '1. Permohonan Dihantar',
    milestone2: '2. Pendapatan Disahkan',
    milestone3: '3. Semakan Bank',
  }
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: Translations;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en');

  useEffect(() => {
    try {
      const saved = localStorage.getItem('crediflow_language') as Language;
      if (saved === 'en' || saved === 'bm') {
        setLanguageState(saved);
      }
    } catch (e) {}
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem('crediflow_language', lang);
    } catch (e) {}
  };

  const toggleLanguage = () => {
    const nextLang = language === 'en' ? 'bm' : 'en';
    setLanguage(nextLang);
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        toggleLanguage,
        t: translations[language]
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
